from pathlib import Path

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_DIR / ".env"


class Settings(BaseSettings):
    APP_NAME: str = "BAHON Optical Power Monitor"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    API_PREFIX: str = "/api"

    # SQLite is the development default. Production explicitly rejects SQLite.
    DATABASE_URL: str = "sqlite:///./bahon_optical.db"

    SECRET_KEY: str = "change-this-secret-key-before-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    ROUTER_SSH_TIMEOUT: int = 20

    # Kept for backward compatibility with the existing deployment settings.
    FRONTEND_URL: str = "http://localhost:3000"
    HOST_FRONTEND_URL: str | None = None

    # Comma-separated values keep .env files easy to read and edit.
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"

    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() == "production"

    @property
    def database_url(self) -> str:
        """Return a stable DB URL regardless of the process working directory."""
        url = self.DATABASE_URL.strip()

        if url.startswith("sqlite:///./"):
            relative_path = url.removeprefix("sqlite:///./")
            sqlite_path = (BACKEND_DIR / relative_path).resolve()
            return f"sqlite:///{sqlite_path.as_posix()}"

        return url

    @property
    def cors_origins(self) -> list[str]:
        origins = {
            origin.strip().rstrip("/")
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        }

        for origin in (self.FRONTEND_URL, self.HOST_FRONTEND_URL):
            if origin:
                origins.add(origin.strip().rstrip("/"))

        return sorted(origins)

    @property
    def allowed_hosts(self) -> list[str]:
        return [
            host.strip()
            for host in self.ALLOWED_HOSTS.split(",")
            if host.strip()
        ]

    @model_validator(mode="after")
    def validate_production_settings(self):
        if not self.is_production:
            return self

        if self.DATABASE_URL.strip().lower().startswith("sqlite"):
            raise ValueError(
                "Production requires PostgreSQL. Set DATABASE_URL to a "
                "postgresql+psycopg:// URL."
            )

        insecure_secrets = {
            "",
            "change-this-secret-key-before-production",
            "replace-with-a-long-random-secret",
        }
        if self.SECRET_KEY in insecure_secrets or len(self.SECRET_KEY) < 32:
            raise ValueError(
                "Production SECRET_KEY must be a unique random value of at least 32 characters."
            )

        if not self.ALLOWED_HOSTS.strip() or "*" in self.allowed_hosts:
            raise ValueError(
                "Production ALLOWED_HOSTS must list the real host/domain and must not use '*'."
            )

        return self


settings = Settings()
