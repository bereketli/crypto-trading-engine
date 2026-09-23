import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Numeric, String, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from app.database.base import Base


class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    asset: Mapped[str] = mapped_column(ForeignKey("assets.symbol"), nullable=False)

    available_balance: Mapped[Decimal] = mapped_column(
        Numeric(36, 18), nullable=False, server_default=text("0")
    )
    locked_balance: Mapped[Decimal] = mapped_column(
        Numeric(36, 18), nullable=False, server_default=text("0")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="wallets")
    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="wallet", cascade="all, delete-orphan"
    )

    __table_args__ = (
        # One wallet row per (user, asset) — balances are accumulated in place.
        UniqueConstraint("user_id", "asset", name="uq_wallets_user_id_asset"),
        CheckConstraint("available_balance >= 0", name="available_balance_non_negative"),
        CheckConstraint("locked_balance >= 0", name="locked_balance_non_negative"),
    )
