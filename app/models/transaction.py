from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import BigInteger, CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.enums import TransactionStatus, TransactionType, pg_enum


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    wallet_id: Mapped[int] = mapped_column(ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False)

    transaction_type: Mapped[TransactionType] = mapped_column(
        pg_enum(TransactionType, "transaction_type"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(36, 18), nullable=False)
    asset: Mapped[str] = mapped_column(ForeignKey("assets.symbol"), nullable=False)
    status: Mapped[TransactionStatus] = mapped_column(
        pg_enum(TransactionStatus, "transaction_status"),
        nullable=False,
        server_default=TransactionStatus.PENDING.value,
    )

    # Loose pointer to the order/trade/deposit record that caused this entry.
    # Not a FK: it can reference different tables depending on reference_type.
    reference_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    reference_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    wallet: Mapped["Wallet"] = relationship(back_populates="transactions")

    __table_args__ = (
        CheckConstraint("amount > 0", name="amount_positive"),
        Index("ix_transactions_wallet_id_created_at", "wallet_id", "created_at"),
        Index("ix_transactions_reference", "reference_type", "reference_id"),
    )
