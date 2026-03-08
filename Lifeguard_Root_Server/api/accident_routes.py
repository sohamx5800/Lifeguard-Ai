from fastapi import APIRouter
from db.models import get_all_accidents

router = APIRouter(
    prefix="/api",
    tags=["Accidents"]
)


# ---------------------------------------------------
# Get All Accident Events
# ---------------------------------------------------
@router.get("/accidents")
def get_accidents():

    rows = get_all_accidents()

    accidents = []

    for r in rows:

        accidents.append({
            "id": r[0],
            "car_id": r[1],
            "latitude": r[2],
            "longitude": r[3],
            "impact": r[4],
            "passengers": r[5],
            "severity": r[6],
            "timestamp": r[7],
            "status": r[8],
            "map_link": f"https://maps.google.com/?q={r[2]},{r[3]}"
        })

    return {
        "total_accidents": len(accidents),
        "data": accidents
    }


# ---------------------------------------------------
# Health Check API
# ---------------------------------------------------
@router.get("/health")
def health():

    return {
        "server": "Lifeguard Root Server",
        "status": "running"
    }