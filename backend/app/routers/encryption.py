from base64 import urlsafe_b64encode
from hashlib import sha256

from cryptography.fernet import Fernet

from app.config import settings


def _get_fernet() -> Fernet:
    key = sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    fernet_key = urlsafe_b64encode(key)
    return Fernet(fernet_key)


def encrypt_password(password: str) -> str:
    fernet = _get_fernet()
    encrypted = fernet.encrypt(password.encode("utf-8"))
    return encrypted.decode("utf-8")


def decrypt_password(encrypted_password: str) -> str:
    fernet = _get_fernet()
    decrypted = fernet.decrypt(encrypted_password.encode("utf-8"))
    return decrypted.decode("utf-8")