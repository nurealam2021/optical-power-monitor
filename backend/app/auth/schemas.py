from pydantic import BaseModel, EmailStr, Field

from app.users.models import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    name: str
    email: EmailStr
    role: UserRole