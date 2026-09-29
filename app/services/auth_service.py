from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.config import get_settings
from app.models import User
from app.repositories import refresh_token_repository, user_repository
from app.services.exceptions import (
    EmailAlreadyRegisteredError,
    InactiveUserError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    UsernameAlreadyTakenError,
)

settings = get_settings()


@dataclass
class TokenPair:
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "bearer"


async def register(db: AsyncSession, *, email: str, username: str, password: str) -> User:
    if await user_repository.get_by_email(db, email) is not None:
        raise EmailAlreadyRegisteredError(email)
    if await user_repository.get_by_username(db, username) is not None:
        raise UsernameAlreadyTakenError(username)

    user = await user_repository.create(
        db, email=email, username=username, password_hash=hash_password(password)
    )
    await db.commit()
    await db.refresh(user)
    return user


async def _issue_token_pair(
    db: AsyncSession, user: User, *, user_agent: Optional[str], ip_address: Optional[str]
) -> TokenPair:
    access_token, _ = create_access_token(user.id, user.role.value)

    raw_refresh_token = generate_refresh_token()
    refresh_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    await refresh_token_repository.create(
        db,
        user_id=user.id,
        token_hash=hash_refresh_token(raw_refresh_token),
        expires_at=refresh_expires_at,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    await db.commit()

    return TokenPair(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        expires_in=settings.access_token_expire_minutes * 60,
    )


async def login(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> TokenPair:
    user = await user_repository.get_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        raise InvalidCredentialsError()
    if not user.is_active:
        raise InactiveUserError()

    return await _issue_token_pair(db, user, user_agent=user_agent, ip_address=ip_address)


async def refresh(
    db: AsyncSession,
    *,
    raw_refresh_token: str,
    user_agent: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> TokenPair:
    stored = await refresh_token_repository.get_by_hash(db, hash_refresh_token(raw_refresh_token))

    now = datetime.now(timezone.utc)
    if stored is None or stored.revoked_at is not None or stored.expires_at < now:
        raise InvalidRefreshTokenError()

    user = await user_repository.get_by_id(db, stored.user_id)
    if user is None or not user.is_active:
        raise InvalidRefreshTokenError()

    # Rotate on every use: the presented token is single-use, which limits
    # the blast radius if a refresh token is ever stolen.
    await refresh_token_repository.revoke(db, stored)
    return await _issue_token_pair(db, user, user_agent=user_agent, ip_address=ip_address)


async def logout(db: AsyncSession, *, raw_refresh_token: str) -> None:
    stored = await refresh_token_repository.get_by_hash(db, hash_refresh_token(raw_refresh_token))
    if stored is not None and stored.revoked_at is None:
        await refresh_token_repository.revoke(db, stored)
        await db.commit()


async def change_password(
    db: AsyncSession, *, user: User, current_password: str, new_password: str
) -> None:
    if not verify_password(current_password, user.password_hash):
        raise InvalidCredentialsError()

    user.password_hash = hash_password(new_password)
    # Force re-authentication on every other device/session.
    await refresh_token_repository.revoke_all_for_user(db, user.id)
    await db.commit()
