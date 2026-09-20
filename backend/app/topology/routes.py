from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_admin_or_super_admin
from app.database import get_db
from app.topology.schemas import (
    TopologyDiscoverRequest,
    TopologyDiscoverResponse,
    TopologyResponse,
)
from app.topology.service import discover_topology, get_topology


router = APIRouter(
    prefix="/topology",
    tags=["Network Topology"],
)


@router.get("", response_model=TopologyResponse)
def read_topology(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_topology(db)


@router.post(
    "/discover",
    response_model=TopologyDiscoverResponse,
)
def discover_network_topology(
    request: TopologyDiscoverRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin_or_super_admin),
):
    try:
        return discover_topology(
            db=db,
            seed_router_id=request.router_id,
            depth=request.depth,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
