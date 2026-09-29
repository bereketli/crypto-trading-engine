import uuid
from typing import Optional, Sequence, Tuple

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.models.enums import KycStatus, UserRole


async def get_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    return await db.get(User, user_id)


async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(select(User).where(func.lower(User.email) == email.lower()))
    return result.scalar_one_or_none()


async def get_by_username(db: AsyncSession, username: str) -> Optional[User]:
    result = await db.execute(select(User).where(func.lower(User.username) == username.lower()))
    return result.scalar_one_or_none()


async def create(db: AsyncSession, *, email: str, username: str, password_hash: str) -> User:
    user = User(email=email, username=username, password_hash=password_hash)
    db.add(user)
    await db.flush()
    return user


def _apply_filters(
    statement: Select,
    *,
    search: Optional[str],
    role: Optional[UserRole],
    kyc_status: Optional[KycStatus],
    is_active: Optional[bool],
) -> Select:
    if search:
        pattern = f"%{search.lower()}%"
        statement = statement.where(
            or_(func.lower(User.email).like(pattern), func.lower(User.username).like(pattern))
        )
    if role is not None:
        statement = statement.where(User.role == role)
    if kyc_status is not None:
        statement = statement.where(User.kyc_status == kyc_status)
    if is_active is not None:
        statement = statement.where(User.is_active == is_active)
    return statement


async def list_users(
    db: AsyncSession,
    *,
    limit: int = 25,
    offset: int = 0,
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    kyc_status: Optional[KycStatus] = None,
    is_active: Optional[bool] = None,
) -> Tuple[Sequence[User], int]:
    """Return one page of users plus the total row count for that filter set."""
    filters = dict(search=search, role=role, kyc_status=kyc_status, is_active=is_active)

    total = await db.scalar(_apply_filters(select(func.count(User.id)), **filters))

    rows = await db.execute(
        _apply_filters(select(User), **filters)
        .order_by(User.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return rows.scalars().all(), int(total or 0)


async def count_admins(db: AsyncSession, *, active_only: bool = True) -> int:
    statement = select(func.count(User.id)).where(User.role == UserRole.ADMIN)
    if active_only:
        statement = statement.where(User.is_active.is_(True))
    return int(await db.scalar(statement) or 0)
