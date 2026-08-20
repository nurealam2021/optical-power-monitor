from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.users.models import UserRole, UserStatus


class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=30)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=128)
    role: UserRole = UserRole.USER


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=30)
    role: UserRole | None = None
    status: UserStatus | None = None


class UserPasswordUpdate(BaseModel):
    password: str = Field(..., min_length=6, max_length=128)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str | None
    role: UserRole
    status: UserStatus
    created_by: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }