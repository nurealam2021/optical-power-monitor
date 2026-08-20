from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.users.models import User, UserRole, UserStatus
from app.users.service import get_user_by_id


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_PREFIX}/auth/login"
)


def _normalize_role(role) -> str:
    if role is None:
        return ""

    value = getattr(role, "value", role)
    return str(value).lower()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        user_id: str | None = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = get_user_by_id(
        db=db,
        user_id=int(user_id),
    )

    if user is None:
        raise credentials_exception

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled",
        )

    return user


def require_user(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user


def require_admin_or_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    role = _normalize_role(current_user.role)

    if role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Super Admin permission required",
        )

    return current_user


def require_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    role = _normalize_role(current_user.role)

    if role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Admin permission required",
        )

    return current_user