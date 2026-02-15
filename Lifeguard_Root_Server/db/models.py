from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from db.database import Base

class AccidentRecord(Base):
    __tablename__ = "accidents"

    id = Column(Integer, primary_key=True, index=True)
    car_id = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    impact_type = Column(String, nullable=False)
    passengers = Column(Integer, nullable=True)
    service_name = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="PROCESSED")