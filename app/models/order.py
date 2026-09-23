import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.database.base import Base
from app.models.enums import OrderSide, OrderStatus, OrderType, TimeInForce, pg_enum


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    trading_pair_id: Mapped[int] = mapped_column(ForeignKey("trading_pairs.id"), nullable=False)

    side: Mapped[OrderSide] = mapped_column(pg_enum(OrderSide, "order_side"), nullable=False)
    type: Mapped[OrderType] = mapped_column(pg_enum(OrderType, "order_type"), nullable=False)
    status: Mapped[OrderStatus] = mapped_column(
        pg_enum(OrderStatus, "order_status"),
        nullable=False,
        server_default=OrderStatus.PENDING.value,
    )
    time_in_force: Mapped[TimeInForce] = mapped_column(
        pg_enum(TimeInForce, "order_time_in_force"),
        nullable=False,
        server_default=TimeInForce.GTC.value,
    )

    # Null for market orders; required for limit/stop-limit orders.
    price: Mapped[Optional[Decimal]] = mapped_column(Numeric(36, 18), nullable=True)
    # Trigger price for stop_limit / stop_market orders only.
    stop_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(36, 18), nullable=True)

    quantity: Mapped[Decimal] = mapped_column(Numeric(36, 18), nullable=False)
    filled_quantity: Mapped[Decimal] = mapped_column(
        Numeric(36, 18), nullable=False, server_default=text("0")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="orders")
    trading_pair: Mapped["TradingPair"] = relationship(back_populates="orders")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="quantity_positive"),
        CheckConstraint("filled_quantity >= 0", name="filled_quantity_non_negative"),
        CheckConstraint("filled_quantity <= quantity", name="filled_quantity_lte_quantity"),
        CheckConstraint(
            "(type IN ('market', 'stop_market')) OR (price IS NOT NULL)",
            name="price_required_for_limit_orders",
        ),
        CheckConstraint(
            "(type NOT IN ('stop_limit', 'stop_market')) OR (stop_price IS NOT NULL)",
            name="stop_price_required_for_stop_orders",
        ),
        # Order-book scan: active orders for a pair, by side, best price first.
        Index("ix_orders_book_lookup", "trading_pair_id", "side", "status", "price"),
        Index("ix_orders_user_id_status", "user_id", "status"),
    )
