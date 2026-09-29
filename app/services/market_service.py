from decimal import Decimal
from typing import Dict, List, Optional, Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import TradingPair
from app.repositories import market_repository
from app.schemas.market import TickerResponse

SPARKLINE_POINTS = 16


def _sparkline(prices: List[Decimal]) -> List[Decimal]:
    """Downsample a price series to at most SPARKLINE_POINTS evenly spaced points."""
    if len(prices) <= SPARKLINE_POINTS:
        return prices
    step = len(prices) / SPARKLINE_POINTS
    return [prices[min(int(i * step), len(prices) - 1)] for i in range(SPARKLINE_POINTS)]


def _build_ticker(pair: TradingPair, trades: Sequence, last_price: Optional[Decimal]) -> TickerResponse:
    ticker = TickerResponse(
        symbol=pair.symbol,
        base_asset=pair.base_asset,
        quote_asset=pair.quote_asset,
        last_price=last_price,
    )

    if not trades:
        return ticker

    prices = [t.price for t in trades]
    ticker.open_price = prices[0]
    ticker.high_price = max(prices)
    ticker.low_price = min(prices)
    ticker.last_price = prices[-1]
    ticker.trade_count = len(trades)
    ticker.volume = sum((t.quantity for t in trades), Decimal("0"))
    ticker.quote_volume = sum((t.price * t.quantity for t in trades), Decimal("0"))
    ticker.sparkline = _sparkline(prices)

    if ticker.open_price and ticker.open_price != 0:
        ticker.price_change = ticker.last_price - ticker.open_price
        ticker.price_change_percent = float(
            (ticker.price_change / ticker.open_price) * Decimal("100")
        )

    return ticker


async def list_tickers(db: AsyncSession, *, hours: int = 24) -> List[TickerResponse]:
    pairs = await market_repository.list_pairs(db)
    windowed = await market_repository.window_trades(db, hours=hours)
    last_prices = await market_repository.last_trade_prices(db)

    return [
        _build_ticker(pair, windowed.get(pair.id, []), last_prices.get(pair.id))
        for pair in pairs
    ]


async def get_ticker(db: AsyncSession, symbol: str) -> Optional[TickerResponse]:
    pair = await market_repository.get_pair_by_symbol(db, symbol)
    if pair is None:
        return None

    windowed = await market_repository.window_trades(db)
    last_prices = await market_repository.last_trade_prices(db)
    return _build_ticker(pair, windowed.get(pair.id, []), last_prices.get(pair.id))


async def price_map(db: AsyncSession, *, quote_asset: str = "USDT") -> Dict[str, Decimal]:
    """base asset -> last price, for valuing wallets in the quote currency."""
    pairs = await market_repository.list_pairs(db)
    last_prices = await market_repository.last_trade_prices(db)

    prices: Dict[str, Decimal] = {quote_asset: Decimal("1")}
    for pair in pairs:
        if pair.quote_asset != quote_asset:
            continue
        price = last_prices.get(pair.id)
        if price is not None:
            prices[pair.base_asset] = price
    return prices
