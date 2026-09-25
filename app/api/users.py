from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import User
from app.repositories import user_repository
from app.schemas.user import UserResponse, UserUpdateRequest

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    if payload.username is not None and payload.username != current_user.username:
        existing = await user_repository.get_by_username(db, payload.username)
        if existing is not None:
            raise HTTPException(status.HTTP_409_CONFLICT, "Username is already taken")
        current_user.username = payload.username

    await db.commit()
    await db.refresh(current_user)
    return current_user
