import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RefreshToken


async def create(
    db: AsyncSession,
    *,
    user_id: uuid.UUID,
    token_hash: str,
    expires_at: datetime,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> RefreshToken:
    token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(token)
    await db.flush()
    return token


async def get_by_hash(db: AsyncSession, token_hash: str) -> Optional[RefreshToken]:
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    return result.scalar_one_or_none()


async def revoke(db: AsyncSession, token: RefreshToken) -> None:
    token.revoked_at = datetime.now(timezone.utc)
    await db.flush()


async def revoke_all_for_user(db: AsyncSession, user_id: uuid.UUID) -> None:
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(timezone.utc))
    )
