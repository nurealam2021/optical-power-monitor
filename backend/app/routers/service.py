from sqlalchemy.orm import Session

from app.routers.encryption import encrypt_password
from app.routers.models import (
    RouterCredential,
    RouterCredentialStatus,
    RouterVendor,
)
from app.routers.schemas import RouterCredentialCreate, RouterCredentialUpdate


def list_router_credentials(db: Session) -> list[RouterCredential]:
    return (
        db.query(RouterCredential)
        .order_by(RouterCredential.id.desc())
        .all()
    )


def get_router_credential_by_id(
    db: Session,
    credential_id: int,
) -> RouterCredential | None:
    return (
        db.query(RouterCredential)
        .filter(RouterCredential.id == credential_id)
        .first()
    )


def get_active_router_credential_by_vendor(
    db: Session,
    vendor: RouterVendor,
) -> RouterCredential | None:
    return (
        db.query(RouterCredential)
        .filter(RouterCredential.vendor == vendor)
        .filter(RouterCredential.status == RouterCredentialStatus.ACTIVE)
        .order_by(RouterCredential.id.desc())
        .first()
    )


def create_router_credential(
    db: Session,
    credential_data: RouterCredentialCreate,
) -> RouterCredential:
    credential = RouterCredential(
        name=credential_data.name,
        vendor=credential_data.vendor,
        username=credential_data.username,
        password_encrypted=encrypt_password(credential_data.password),
        ssh_port=credential_data.ssh_port,
        connection_type=credential_data.connection_type,
        enable_required=credential_data.enable_required,
    )

    db.add(credential)
    db.commit()
    db.refresh(credential)

    return credential


def update_router_credential(
    db: Session,
    credential: RouterCredential,
    credential_data: RouterCredentialUpdate,
) -> RouterCredential:
    update_data = credential_data.model_dump(exclude_unset=True)

    if "password" in update_data:
        password = update_data.pop("password")

        if password:
            credential.password_encrypted = encrypt_password(password)

    for field, value in update_data.items():
        setattr(credential, field, value)

    db.commit()
    db.refresh(credential)

    return credential


def delete_router_credential(
    db: Session,
    credential: RouterCredential,
) -> None:
    db.delete(credential)
    db.commit()