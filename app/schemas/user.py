import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import KycStatus, UserRole


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    username: str
    role: UserRole
    kyc_status: KycStatus
    is_active: bool
    is_verified: bool
    created_at: datetime


class UserUpdateRequest(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=50)


class UserListResponse(BaseModel):
    """One page of users, plus enough metadata for the client to paginate."""

    items: List[UserResponse]
    total: int
    limit: int
    offset: int


class AdminUserUpdateRequest(BaseModel):
    """Fields an admin may change on another account. All optional (partial update)."""

    role: Optional[UserRole] = None
    kyc_status: Optional[KycStatus] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
