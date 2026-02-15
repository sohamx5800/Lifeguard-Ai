from pydantic import BaseModel

class AccidentSchema(BaseModel):
    car_id: str
    auth_key: str
    lat: float
    lon: float
    impact: str
    passengers: int | None = None