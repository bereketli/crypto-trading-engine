import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.security import decode_access_token
from app.database import get_db
from app.models import User
from app.models.enums import UserRole
from app.repositories import user_repository

bearer_scheme = HTTPBearer(auto_error=True)

_credentials_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError:
        raise _credentials_error

    if payload.get("type") != "access":
        raise _credentials_error

    try:
        user_id = uuid.UUID(payload.get("sub"))
    except (TypeError, ValueError):
        raise _credentials_error

    user = await user_repository.get_by_id(db, user_id)
    if user is None or not user.is_active:
        raise _credentials_error

    return user


async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user
