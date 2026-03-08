from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.accident_routes import router as accident_router


# =========================================
# FastAPI App
# =========================================

app = FastAPI(
    title="Lifeguard AI Root Server",
    description="Backend server for Lifeguard AI accident monitoring system",
    version="1.0"
)


# =========================================
# Enable CORS (needed for Streamlit dashboard)
# =========================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================
# Register API Routes
# =========================================

app.include_router(accident_router)


# =========================================
# Root Health Endpoint
# =========================================

@app.get("/")
def root():
    return {
        "server": "Lifeguard AI Root Server",
        "status": "running",
        "message": "Accident monitoring system active"
    }