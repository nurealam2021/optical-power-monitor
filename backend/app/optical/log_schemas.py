from datetime import datetime

from pydantic import BaseModel


class OpticalCheckLogResponse(BaseModel):
    id: int
    user_id: int
    router_ip: str
    vendor: str
    interface_name: str
    rx_power: str | None
    tx_power: str | None
    status: str
    error_message: str | None
    checked_at: datetime

    model_config = {
        "from_attributes": True
    }