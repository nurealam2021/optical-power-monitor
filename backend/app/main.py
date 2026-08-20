import logging

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.auth.me import router as auth_me_router
from app.auth.routes import router as auth_router
from app.capacity.routes import router as capacity_router
from app.config import settings
from app.database import get_db
from app.inventory.routes import router as router_inventory_router
from app.optical.log_routes import router as optical_logs_router
from app.optical.routes import router as optical_router
from app.routers.routes import router as router_credentials_router
from app.users.routes import router as users_router


logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for checking live RX/TX optical power from Huawei, ZTE, and Cisco routers.",
    version=settings.APP_VERSION,
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

if settings.is_production:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.allowed_hosts,
    )

app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(auth_me_router, prefix=settings.API_PREFIX)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(router_credentials_router, prefix=settings.API_PREFIX)
app.include_router(router_inventory_router, prefix=settings.API_PREFIX)
app.include_router(optical_router, prefix=settings.API_PREFIX)
app.include_router(optical_logs_router, prefix=settings.API_PREFIX)
app.include_router(capacity_router, prefix=settings.API_PREFIX)


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "message": "Backend API is running",
        "version": settings.APP_VERSION,
    }


@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        logger.exception("Database health check failed")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        )

    return {
        "status": "ok",
        "service": "optical-power-monitor-backend",
        "database": "ok",
    }
