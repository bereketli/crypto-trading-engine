import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.database.base import Base
from app.models.enums import OrderSide, pg_enum


class Trade(Base):
    __tablename__ = "trades"

    id: Mapped[int] = mapped_column(primary_key=True)
    trading_pair_id: Mapped[int] = mapped_column(ForeignKey("trading_pairs.id"), nullable=False)

    buy_order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    sell_order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)

    # Denormalized so trade history can be queried per-user without joining orders.
    buyer_user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    seller_user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Which side crossed the book and triggered this trade.
    # Reuses the order_side enum type already defined on orders.side.
    taker_side: Mapped[OrderSide] = mapped_column(
        pg_enum(OrderSide, "order_side", create_type=False), nullable=False
    )

    price: Mapped[Decimal] = mapped_column(Numeric(36, 18), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(36, 18), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    trading_pair: Mapped["TradingPair"] = relationship(back_populates="trades")

    __table_args__ = (
        CheckConstraint("price > 0", name="price_positive"),
        CheckConstraint("quantity > 0", name="quantity_positive"),
        Index("ix_trades_trading_pair_id_created_at", "trading_pair_id", "created_at"),
        Index("ix_trades_buyer_user_id", "buyer_user_id"),
        Index("ix_trades_seller_user_id", "seller_user_id"),
    )
