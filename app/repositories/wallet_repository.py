import uuid
from typing import Optional, Sequence, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Transaction, Wallet


async def list_for_user(db: AsyncSession, user_id: uuid.UUID) -> Sequence[Wallet]:
    result = await db.execute(
        select(Wallet).where(Wallet.user_id == user_id).order_by(Wallet.asset)
    )
    return result.scalars().all()


async def get_for_user(db: AsyncSession, user_id: uuid.UUID, asset: str) -> Optional[Wallet]:
    return await db.scalar(
        select(Wallet).where(Wallet.user_id == user_id, Wallet.asset == asset.upper())
    )


async def list_transactions(
    db: AsyncSession,
    user_id: uuid.UUID,
    *,
    limit: int = 25,
    offset: int = 0,
    asset: Optional[str] = None,
) -> Tuple[Sequence[Transaction], int]:
    """Transactions across every wallet the user owns, newest first."""
    wallet_ids = select(Wallet.id).where(Wallet.user_id == user_id)

    conditions = [Transaction.wallet_id.in_(wallet_ids)]
    if asset:
        conditions.append(Transaction.asset == asset.upper())

    total = await db.scalar(select(func.count(Transaction.id)).where(*conditions))

    result = await db.execute(
        select(Transaction)
        .where(*conditions)
        .order_by(Transaction.created_at.desc(), Transaction.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all(), int(total or 0)
