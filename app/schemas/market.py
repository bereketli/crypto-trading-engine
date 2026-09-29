from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class AssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    symbol: str
    name: str
    decimals: int
    is_active: bool


class TickerResponse(BaseModel):
    """24h rolling stats for one market, derived from the trades table."""

    symbol: str
    base_asset: str
    quote_asset: str
    last_price: Optional[Decimal] = None
    open_price: Optional[Decimal] = None
    high_price: Optional[Decimal] = None
    low_price: Optional[Decimal] = None
    price_change: Optional[Decimal] = None
    price_change_percent: Optional[float] = None
    volume: Decimal = Decimal("0")
    quote_volume: Decimal = Decimal("0")
    trade_count: int = 0
    # Oldest-to-newest closing prices, for sparklines.
    sparkline: List[Decimal] = []


class TradeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    price: Decimal
    quantity: Decimal
    taker_side: str
    created_at: datetime
