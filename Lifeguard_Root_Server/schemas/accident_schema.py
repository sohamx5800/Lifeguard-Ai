from pydantic import BaseModel
from datetime import datetime


class AccidentEvent(BaseModel):

    car_id: str
    auth_key: str

    lat: float
    lon: float

    impact: str
    passengers: int

    timestamp: datetime

    severity: str = "MEDIUM"