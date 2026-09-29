"""Populate the database with demo data for local development.

Usage (from the project root, with the venv active):

    python -m scripts.seed          # create tables if needed, then seed
    python -m scripts.seed --reset  # delete existing rows first, then seed

Safe to re-run: existing rows are matched by natural key and updated rather
than duplicated. Every password below is "Password123!".
"""

import argparse
import asyncio
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import hash_password
from app.database import AsyncSessionLocal, Base, engine
from app.models import Asset, Order, Trade, TradingPair, Transaction, User, Wallet
from app.models.enums import (
    KycStatus,
    OrderSide,
    OrderStatus,
    OrderType,
    TransactionStatus,
    TransactionType,
    UserRole,
)

DEMO_PASSWORD = "Password123!"

ASSETS = [
    ("USDT", "Tether", 2),
    ("BTC", "Bitcoin", 8),
    ("ETH", "Ethereum", 8),
    ("BNB", "BNB", 8),
    ("SOL", "Solana", 6),
    ("XRP", "XRP", 6),
    ("ADA", "Cardano", 6),
    ("LTC", "Litecoin", 8),
    ("LINK", "Chainlink", 6),
    ("XMR", "Monero", 8),
    ("DEMO", "Demo Coin", 8),
]

PAIRS = [
    ("BTCUSDT", "BTC", "USDT", 2, 6, Decimal("0.00001")),
    ("ETHUSDT", "ETH", "USDT", 2, 5, Decimal("0.0001")),
    ("BNBUSDT", "BNB", "USDT", 2, 4, Decimal("0.001")),
    ("SOLUSDT", "SOL", "USDT", 2, 3, Decimal("0.01")),
    ("XRPUSDT", "XRP", "USDT", 4, 2, Decimal("1")),
    ("ADAUSDT", "ADA", "USDT", 4, 2, Decimal("1")),
    ("LTCUSDT", "LTC", "USDT", 2, 4, Decimal("0.001")),
    ("LINKUSDT", "LINK", "USDT", 3, 2, Decimal("0.1")),
    ("XMRUSDT", "XMR", "USDT", 2, 4, Decimal("0.001")),
]

# symbol -> (starting price, 24h drift %, volatility %) for the generated
# price walk that backs the tickers, sparklines, and charts.
MARKET_PROFILE = {
    "BTCUSDT": (Decimal("67412.55"), Decimal("2.41"), Decimal("0.55")),
    "ETHUSDT": (Decimal("3284.10"), Decimal("1.18"), Decimal("0.70")),
    "BNBUSDT": (Decimal("589.24"), Decimal("-0.63"), Decimal("0.60")),
    "SOLUSDT": (Decimal("198.40"), Decimal("4.12"), Decimal("1.10")),
    "XRPUSDT": (Decimal("1.0421"), Decimal("-1.85"), Decimal("0.80")),
    "ADAUSDT": (Decimal("0.8134"), Decimal("3.05"), Decimal("0.95")),
    "LTCUSDT": (Decimal("72.25"), Decimal("3.40"), Decimal("0.75")),
    "LINKUSDT": (Decimal("14.20"), Decimal("3.80"), Decimal("1.00")),
    "XMRUSDT": (Decimal("165.35"), Decimal("-0.82"), Decimal("0.65")),
}

# (email, username, role, kyc, is_active, is_verified)
USERS = [
    ("admin@cryptoengine.dev", "admin", UserRole.ADMIN, KycStatus.VERIFIED, True, True),
    ("alice@example.com", "alice", UserRole.USER, KycStatus.VERIFIED, True, True),
    ("bob@example.com", "bob", UserRole.USER, KycStatus.VERIFIED, True, True),
    ("carol@example.com", "carol", UserRole.USER, KycStatus.PENDING, True, True),
    ("dave@example.com", "dave", UserRole.USER, KycStatus.UNVERIFIED, True, False),
    ("erin@example.com", "erin", UserRole.USER, KycStatus.REJECTED, True, True),
    ("frank@example.com", "frank", UserRole.USER, KycStatus.UNVERIFIED, False, False),
    ("grace@example.com", "grace", UserRole.USER, KycStatus.VERIFIED, True, True),
]

# username -> {asset: (available, locked)}
BALANCES = {
    "admin": {"USDT": (Decimal("250000"), Decimal("0")), "BTC": (Decimal("5"), Decimal("0"))},
    "alice": {
        "USDT": (Decimal("48250.75"), Decimal("6741.25")),
        "BTC": (Decimal("1.24500000"), Decimal("0.10000000")),
        "ETH": (Decimal("12.5"), Decimal("0")),
    },
    "bob": {
        "USDT": (Decimal("15300.10"), Decimal("0")),
        "BTC": (Decimal("0.38000000"), Decimal("0.05000000")),
        "BNB": (Decimal("45.2"), Decimal("0")),
    },
    "carol": {"USDT": (Decimal("2500"), Decimal("0")), "ETH": (Decimal("3.75"), Decimal("0.25"))},
    "dave": {"USDT": (Decimal("500"), Decimal("0"))},
    "erin": {"USDT": (Decimal("120.50"), Decimal("0")), "DEMO": (Decimal("10000"), Decimal("0"))},
    "frank": {"USDT": (Decimal("0"), Decimal("0"))},
    "grace": {
        "USDT": (Decimal("88000"), Decimal("12000")),
        "BTC": (Decimal("2.1"), Decimal("0")),
        "ETH": (Decimal("40"), Decimal("5")),
    },
}


async def seed_assets(db: AsyncSession) -> None:
    for symbol, name, decimals in ASSETS:
        asset = await db.get(Asset, symbol)
        if asset is None:
            db.add(Asset(symbol=symbol, name=name, decimals=decimals))
        else:
            asset.name, asset.decimals = name, decimals
    await db.flush()


async def seed_pairs(db: AsyncSession) -> dict:
    pairs = {}
    for symbol, base, quote, price_prec, qty_prec, min_qty in PAIRS:
        pair = await db.scalar(select(TradingPair).where(TradingPair.symbol == symbol))
        if pair is None:
            pair = TradingPair(symbol=symbol)
            db.add(pair)
        pair.base_asset, pair.quote_asset = base, quote
        pair.price_precision, pair.quantity_precision = price_prec, qty_prec
        pair.min_quantity, pair.is_active = min_qty, True
        pairs[symbol] = pair
    await db.flush()
    return pairs


async def seed_users(db: AsyncSession) -> dict:
    password_hash = hash_password(DEMO_PASSWORD)  # hashed once; argon2 is deliberately slow
    users = {}
    for email, username, role, kyc, is_active, is_verified in USERS:
        user = await db.scalar(select(User).where(User.email == email))
        if user is None:
            user = User(email=email, username=username, password_hash=password_hash)
            db.add(user)
        user.username, user.role, user.kyc_status = username, role, kyc
        user.is_active, user.is_verified = is_active, is_verified
        users[username] = user
    await db.flush()
    return users


async def seed_wallets(db: AsyncSession, users: dict) -> dict:
    wallets = {}
    for username, balances in BALANCES.items():
        user = users[username]
        for asset, (available, locked) in balances.items():
            wallet = await db.scalar(
                select(Wallet).where(Wallet.user_id == user.id, Wallet.asset == asset)
            )
            if wallet is None:
                wallet = Wallet(user_id=user.id, asset=asset)
                db.add(wallet)
            wallet.available_balance, wallet.locked_balance = available, locked
            wallets[(username, asset)] = wallet
    await db.flush()
    return wallets


async def seed_transactions(db: AsyncSession, wallets: dict) -> None:
    if await db.scalar(select(Transaction.id).limit(1)):
        return  # ledger already populated

    now = datetime.now(timezone.utc)
    entries = [
        ("alice", "USDT", TransactionType.DEPOSIT, Decimal("60000"), TransactionStatus.COMPLETED, 30),
        ("alice", "BTC", TransactionType.DEPOSIT, Decimal("1.5"), TransactionStatus.COMPLETED, 28),
        ("alice", "USDT", TransactionType.WITHDRAWAL, Decimal("5000"), TransactionStatus.COMPLETED, 9),
        ("bob", "USDT", TransactionType.DEPOSIT, Decimal("20000"), TransactionStatus.COMPLETED, 21),
        ("bob", "BNB", TransactionType.DEPOSIT, Decimal("50"), TransactionStatus.COMPLETED, 14),
        ("bob", "USDT", TransactionType.WITHDRAWAL, Decimal("2500"), TransactionStatus.PENDING, 1),
        ("carol", "USDT", TransactionType.DEPOSIT, Decimal("2500"), TransactionStatus.COMPLETED, 7),
        ("carol", "ETH", TransactionType.DEPOSIT, Decimal("4"), TransactionStatus.COMPLETED, 6),
        ("dave", "USDT", TransactionType.DEPOSIT, Decimal("500"), TransactionStatus.COMPLETED, 3),
        ("erin", "USDT", TransactionType.DEPOSIT, Decimal("300"), TransactionStatus.COMPLETED, 12),
        ("erin", "USDT", TransactionType.WITHDRAWAL, Decimal("179.50"), TransactionStatus.FAILED, 2),
        ("grace", "USDT", TransactionType.DEPOSIT, Decimal("100000"), TransactionStatus.COMPLETED, 40),
        ("grace", "ETH", TransactionType.DEPOSIT, Decimal("45"), TransactionStatus.COMPLETED, 35),
    ]

    for username, asset, tx_type, amount, tx_status, days_ago in entries:
        wallet = wallets.get((username, asset))
        if wallet is None:
            continue
        db.add(
            Transaction(
                wallet_id=wallet.id,
                transaction_type=tx_type,
                amount=amount,
                asset=asset,
                status=tx_status,
                created_at=now - timedelta(days=days_ago),
            )
        )
    await db.flush()


async def seed_orders_and_trades(db: AsyncSession, users: dict, pairs: dict) -> None:
    if await db.scalar(select(Order.id).limit(1)):
        return  # book already populated

    now = datetime.now(timezone.utc)
    btc, eth, bnb = pairs["BTCUSDT"], pairs["ETHUSDT"], pairs["BNBUSDT"]

    def order(user, pair, side, otype, qty, price, filled, status, minutes_ago) -> Order:
        row = Order(
            user_id=users[user].id,
            trading_pair_id=pair.id,
            side=side,
            type=otype,
            status=status,
            quantity=qty,
            filled_quantity=filled,
            price=price,
            created_at=now - timedelta(minutes=minutes_ago),
        )
        db.add(row)
        return row

    # Resting bids and asks — an order book a matching engine could walk.
    order("alice", btc, OrderSide.BUY, OrderType.LIMIT, Decimal("0.1"), Decimal("67000"), Decimal("0"), OrderStatus.OPEN, 55)
    order("bob", btc, OrderSide.BUY, OrderType.LIMIT, Decimal("0.25"), Decimal("66850.5"), Decimal("0"), OrderStatus.OPEN, 47)
    order("grace", btc, OrderSide.SELL, OrderType.LIMIT, Decimal("0.4"), Decimal("67550"), Decimal("0"), OrderStatus.OPEN, 33)
    order("carol", eth, OrderSide.BUY, OrderType.LIMIT, Decimal("2"), Decimal("3250"), Decimal("0"), OrderStatus.OPEN, 26)
    order("grace", eth, OrderSide.SELL, OrderType.LIMIT, Decimal("5"), Decimal("3310.75"), Decimal("0"), OrderStatus.OPEN, 18)
    order("bob", bnb, OrderSide.BUY, OrderType.LIMIT, Decimal("10"), Decimal("585"), Decimal("0"), OrderStatus.OPEN, 12)

    # A partial fill, plus a cancelled order.
    partial = order("alice", eth, OrderSide.BUY, OrderType.LIMIT, Decimal("4"), Decimal("3290"), Decimal("1.5"), OrderStatus.PARTIALLY_FILLED, 64)
    order("dave", btc, OrderSide.BUY, OrderType.LIMIT, Decimal("0.02"), Decimal("60000"), Decimal("0"), OrderStatus.CANCELLED, 120)

    # Fully-filled pairs that produced the executed trades below.
    buy_btc = order("alice", btc, OrderSide.BUY, OrderType.LIMIT, Decimal("0.05"), Decimal("67200"), Decimal("0.05"), OrderStatus.FILLED, 95)
    sell_btc = order("grace", btc, OrderSide.SELL, OrderType.LIMIT, Decimal("0.05"), Decimal("67200"), Decimal("0.05"), OrderStatus.FILLED, 96)
    buy_bnb = order("bob", bnb, OrderSide.BUY, OrderType.MARKET, Decimal("12"), None, Decimal("12"), OrderStatus.FILLED, 80)
    sell_bnb = order("grace", bnb, OrderSide.SELL, OrderType.LIMIT, Decimal("12"), Decimal("589.2"), Decimal("12"), OrderStatus.FILLED, 82)
    sell_eth = order("grace", eth, OrderSide.SELL, OrderType.LIMIT, Decimal("1.5"), Decimal("3290"), Decimal("1.5"), OrderStatus.FILLED, 63)

    await db.flush()  # assign order ids before referencing them from trades

    trades = [
        (btc, buy_btc, sell_btc, "alice", "grace", Decimal("67200"), Decimal("0.05"), OrderSide.BUY, 95),
        (bnb, buy_bnb, sell_bnb, "bob", "grace", Decimal("589.2"), Decimal("12"), OrderSide.BUY, 80),
        (eth, partial, sell_eth, "alice", "grace", Decimal("3290"), Decimal("1.5"), OrderSide.SELL, 63),
    ]
    for pair, buy, sell, buyer, seller, price, qty, taker, minutes_ago in trades:
        db.add(
            Trade(
                trading_pair_id=pair.id,
                buy_order_id=buy.id,
                sell_order_id=sell.id,
                buyer_user_id=users[buyer].id,
                seller_user_id=users[seller].id,
                price=price,
                quantity=qty,
                taker_side=taker,
                created_at=now - timedelta(minutes=minutes_ago),
            )
        )
    await db.flush()


async def seed_market_history(db: AsyncSession, users: dict, pairs: dict, *, points: int = 48) -> None:
    """Generate a 24h price walk per market as real order + trade rows.

    Tickers, sparklines, and 24h stats are all computed from these rows by
    the API, so the dashboard reads live data rather than hardcoded numbers.
    """
    if await db.scalar(select(func.count(Trade.id))) > 10:
        return  # history already generated

    rng = random.Random(20260929)  # fixed seed => reproducible demo data
    now = datetime.now(timezone.utc)
    makers = [users["grace"], users["bob"], users["alice"]]
    takers = [users["alice"], users["carol"], users["bob"], users["grace"]]

    for symbol, (start_price, drift_pct, vol_pct) in MARKET_PROFILE.items():
        pair = pairs.get(symbol)
        if pair is None:
            continue

        # Walk backwards from the current price to the price 24h ago.
        end_price = start_price
        open_price = end_price / (Decimal("1") + drift_pct / Decimal("100"))
        step_drift = (end_price - open_price) / Decimal(points)

        price = open_price
        for i in range(points):
            wiggle = Decimal(str(rng.uniform(-float(vol_pct), float(vol_pct)))) / Decimal("100")
            price = price + step_drift + (price * wiggle)
            if price <= 0:
                price = open_price
            # Land exactly on the intended close so the ticker matches the profile.
            if i == points - 1:
                price = end_price

            price = price.quantize(Decimal("0.0001"))
            qty = Decimal(str(round(rng.uniform(0.05, 2.5), 4)))
            created = now - timedelta(minutes=(points - i) * (1440 // points))

            maker, taker = rng.choice(makers), rng.choice(takers)
            if maker.id == taker.id:
                taker = next(u for u in takers if u.id != maker.id)

            taker_side = OrderSide.BUY if rng.random() > 0.45 else OrderSide.SELL

            buy_order = Order(
                user_id=(taker if taker_side is OrderSide.BUY else maker).id,
                trading_pair_id=pair.id,
                side=OrderSide.BUY,
                type=OrderType.LIMIT,
                status=OrderStatus.FILLED,
                quantity=qty,
                filled_quantity=qty,
                price=price,
                created_at=created,
            )
            sell_order = Order(
                user_id=(maker if taker_side is OrderSide.BUY else taker).id,
                trading_pair_id=pair.id,
                side=OrderSide.SELL,
                type=OrderType.LIMIT,
                status=OrderStatus.FILLED,
                quantity=qty,
                filled_quantity=qty,
                price=price,
                created_at=created,
            )
            db.add_all([buy_order, sell_order])
            await db.flush()

            db.add(
                Trade(
                    trading_pair_id=pair.id,
                    buy_order_id=buy_order.id,
                    sell_order_id=sell_order.id,
                    buyer_user_id=buy_order.user_id,
                    seller_user_id=sell_order.user_id,
                    price=price,
                    quantity=qty,
                    taker_side=taker_side,
                    created_at=created,
                )
            )

    await db.flush()


async def reset(db: AsyncSession) -> None:
    # Child-first so foreign keys stay satisfied.
    for model in (Trade, Transaction, Order, Wallet, TradingPair, Asset):
        await db.execute(delete(model))
    await db.execute(delete(User))
    await db.flush()


async def main(do_reset: bool) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        if do_reset:
            await reset(db)
            print("Cleared existing rows.")

        await seed_assets(db)
        pairs = await seed_pairs(db)
        users = await seed_users(db)
        wallets = await seed_wallets(db, users)
        await seed_transactions(db, wallets)
        await seed_orders_and_trades(db, users, pairs)
        await seed_market_history(db, users, pairs)
        await db.commit()

        trade_count = await db.scalar(select(func.count(Trade.id)))

    await engine.dispose()

    print(f"Seeded {len(USERS)} users, {len(ASSETS)} assets, {len(PAIRS)} trading pairs.")
    print(f"Generated {trade_count} trades of 24h market history.")
    print(f"Log in as admin@cryptoengine.dev / {DEMO_PASSWORD}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the exchange database with demo data.")
    parser.add_argument("--reset", action="store_true", help="delete existing rows before seeding")
    args = parser.parse_args()
    asyncio.run(main(args.reset))
