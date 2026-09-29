import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_admin, get_current_user
from app.database import get_db
from app.models import User
from app.models.enums import KycStatus, UserRole
from app.schemas.user import (
    AdminUserUpdateRequest,
    UserListResponse,
    UserResponse,
    UserUpdateRequest,
)
from app.services import user_service
from app.services.exceptions import (
    CannotDemoteLastAdminError,
    CannotModifySelfError,
    UsernameAlreadyTakenError,
    UserNotFoundError,
)

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
    try:
        return await user_service.update_own_profile(db, user=current_user, username=payload.username)
    except UsernameAlreadyTakenError:
        raise HTTPException(status.HTTP_409_CONFLICT, "Username is already taken")


@router.post("/me/kyc", response_model=UserResponse)
async def submit_kyc(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    if current_user.kyc_status in (KycStatus.PENDING, KycStatus.VERIFIED):
        raise HTTPException(status.HTTP_409_CONFLICT, f"KYC is already {current_user.kyc_status.value}")
    return await user_service.submit_kyc(db, user=current_user)


# --- Admin-only user management -------------------------------------------------


@router.get("", response_model=UserListResponse)
async def list_users(
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None, max_length=100, description="Matches email or username"),
    role: Optional[UserRole] = None,
    kyc_status: Optional[KycStatus] = None,
    is_active: Optional[bool] = None,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> UserListResponse:
    items, total = await user_service.list_users(
        db, limit=limit, offset=offset, search=search, role=role, kyc_status=kyc_status, is_active=is_active
    )
    return UserListResponse(
        items=[UserResponse.model_validate(user) for user in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: uuid.UUID,
    _admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        return await user_service.get_user(db, user_id)
    except UserNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")


@router.patch("/{user_id}", response_model=UserResponse)
async def admin_update_user(
    user_id: uuid.UUID,
    payload: AdminUserUpdateRequest,
    admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        return await user_service.admin_update_user(
            db,
            actor=admin,
            user_id=user_id,
            role=payload.role,
            kyc_status=payload.kyc_status,
            is_active=payload.is_active,
            is_verified=payload.is_verified,
        )
    except UserNotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    except CannotModifySelfError:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You cannot change your own role or account status")
    except CannotDemoteLastAdminError:
        raise HTTPException(status.HTTP_409_CONFLICT, "The last active admin cannot be demoted or disabled")
