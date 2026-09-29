import uuid
from typing import Optional, Sequence, Tuple

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.models.enums import KycStatus, UserRole
from app.repositories import refresh_token_repository, user_repository
from app.services.exceptions import (
    CannotDemoteLastAdminError,
    CannotModifySelfError,
    UsernameAlreadyTakenError,
    UserNotFoundError,
)


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
    return await user_repository.list_users(
        db, limit=limit, offset=offset, search=search, role=role, kyc_status=kyc_status, is_active=is_active
    )


async def get_user(db: AsyncSession, user_id: uuid.UUID) -> User:
    user = await user_repository.get_by_id(db, user_id)
    if user is None:
        raise UserNotFoundError(str(user_id))
    return user


async def update_own_profile(db: AsyncSession, *, user: User, username: Optional[str]) -> User:
    if username is not None and username != user.username:
        if await user_repository.get_by_username(db, username) is not None:
            raise UsernameAlreadyTakenError(username)
        user.username = username

    await db.commit()
    await db.refresh(user)
    return user


async def submit_kyc(db: AsyncSession, *, user: User) -> User:
    """Simulated KYC submission: moves the account into review."""
    user.kyc_status = KycStatus.PENDING
    await db.commit()
    await db.refresh(user)
    return user


async def admin_update_user(
    db: AsyncSession,
    *,
    actor: User,
    user_id: uuid.UUID,
    role: Optional[UserRole] = None,
    kyc_status: Optional[KycStatus] = None,
    is_active: Optional[bool] = None,
    is_verified: Optional[bool] = None,
) -> User:
    target = await get_user(db, user_id)

    # An admin editing their own role or active flag can lock themselves out
    # of the admin panel with no way back in. Block it at the service layer.
    if target.id == actor.id and (role is not None or is_active is not None):
        raise CannotModifySelfError()

    demoting = role is not None and role != UserRole.ADMIN and target.role == UserRole.ADMIN
    deactivating = is_active is False and target.role == UserRole.ADMIN

    if demoting or deactivating:
        if await user_repository.count_admins(db) <= 1:
            raise CannotDemoteLastAdminError()

    if role is not None:
        target.role = role
    if kyc_status is not None:
        target.kyc_status = kyc_status
    if is_verified is not None:
        target.is_verified = is_verified

    if is_active is not None and is_active != target.is_active:
        target.is_active = is_active
        # A disabled account must not keep a usable session alive.
        if not is_active:
            await refresh_token_repository.revoke_all_for_user(db, target.id)

    await db.commit()
    await db.refresh(target)
    return target
