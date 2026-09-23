from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Numeric, SmallInteger, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Asset(Base):
    """Reference table for supported currencies (BTC, ETH, USDT, BNB, demo coins)."""

    __tablename__ = "assets"

    symbol: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    decimals: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default=text("8"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))


class TradingPair(Base):
    """Reference table for tradable markets, e.g. BTC/USDT."""

    __tablename__ = "trading_pairs"

    id: Mapped[int] = mapped_column(primary_key=True)
    symbol: Mapped[str] = mapped_column(String(20), nullable=False, unique=True)

    base_asset: Mapped[str] = mapped_column(ForeignKey("assets.symbol"), nullable=False)
    quote_asset: Mapped[str] = mapped_column(ForeignKey("assets.symbol"), nullable=False)

    price_precision: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default=text("2"))
    quantity_precision: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default=text("8"))
    min_quantity: Mapped[Decimal] = mapped_column(Numeric(36, 18), nullable=False, server_default=text("0"))

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))

    orders: Mapped[list["Order"]] = relationship(back_populates="trading_pair")
    trades: Mapped[list["Trade"]] = relationship(back_populates="trading_pair")
