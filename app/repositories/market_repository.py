from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Dict, List, Optional, Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Asset, Trade, TradingPair


async def list_assets(db: AsyncSession, *, active_only: bool = True) -> Sequence[Asset]:
    statement = select(Asset).order_by(Asset.symbol)
    if active_only:
        statement = statement.where(Asset.is_active.is_(True))
    return (await db.execute(statement)).scalars().all()


async def list_pairs(db: AsyncSession, *, active_only: bool = True) -> Sequence[TradingPair]:
    statement = select(TradingPair).order_by(TradingPair.symbol)
    if active_only:
        statement = statement.where(TradingPair.is_active.is_(True))
    return (await db.execute(statement)).scalars().all()


async def get_pair_by_symbol(db: AsyncSession, symbol: str) -> Optional[TradingPair]:
    return await db.scalar(select(TradingPair).where(TradingPair.symbol == symbol.upper()))


async def recent_trades(
    db: AsyncSession, *, pair_id: int, limit: int = 50
) -> Sequence[Trade]:
    result = await db.execute(
        select(Trade)
        .where(Trade.trading_pair_id == pair_id)
        .order_by(Trade.created_at.desc(), Trade.id.desc())
        .limit(limit)
    )
    return result.scalars().all()


async def window_trades(db: AsyncSession, *, hours: int = 24) -> Dict[int, List[Trade]]:
    """All trades in the rolling window, grouped by pair, oldest first."""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    result = await db.execute(
        select(Trade).where(Trade.created_at >= since).order_by(Trade.created_at.asc(), Trade.id.asc())
    )

    grouped: Dict[int, List[Trade]] = {}
    for trade in result.scalars().all():
        grouped.setdefault(trade.trading_pair_id, []).append(trade)
    return grouped


async def last_trade_prices(db: AsyncSession) -> Dict[int, Decimal]:
    """Most recent traded price per pair, regardless of age."""
    newest = (
        select(Trade.trading_pair_id, func.max(Trade.id).label("last_id"))
        .group_by(Trade.trading_pair_id)
        .subquery()
    )
    result = await db.execute(
        select(Trade.trading_pair_id, Trade.price).join(newest, Trade.id == newest.c.last_id)
    )
    return {pair_id: price for pair_id, price in result.all()}
