from db.database import services
from db.models import log_accident
from core.auth import authenticate_vehicle
from algorithms.haversine import haversine
from communication.notifier import send_alert


# -----------------------------------------------------
# Find Nearest Emergency Service
# -----------------------------------------------------
def find_nearest_service(lat, lon):

    nearest = None
    min_distance = 999999

    for service in services:

        distance = haversine(
            lat,
            lon,
            service["lat"],
            service["lon"]
        )

        if distance < min_distance:
            min_distance = distance
            nearest = service

    return nearest


# -----------------------------------------------------
# Main Accident Processing Logic
# -----------------------------------------------------
def process_accident_event(data):

    try:

        print("\n🚨 Processing accident event...")

        # -------------------------------------------------
        # Authenticate vehicle
        # -------------------------------------------------
        authenticate_vehicle(
            data["car_id"],
            data["auth_key"]
        )

        # -------------------------------------------------
        # Handle GPS fallback if location missing
        # -------------------------------------------------
        lat = data.get("lat", 0.0)
        lon = data.get("lon", 0.0)

        if lat == 0.0 and lon == 0.0:
            print("⚠ GPS fix unavailable. Using fallback location.")
            lat = 26.324
            lon = 89.448

        # -------------------------------------------------
        # Find nearest service
        # -------------------------------------------------
        nearest_service = find_nearest_service(lat, lon)

        print("Nearest Service:", nearest_service["name"])

        # -------------------------------------------------
        # Determine severity
        # -------------------------------------------------
        severity = "MEDIUM"

        if data["impact"] == "ROLLOVER":
            severity = "HIGH"

        if data["passengers"] == 0:
            severity = "CRITICAL"

        data["severity"] = severity

        # -------------------------------------------------
        # SAVE ACCIDENT TO DATABASE FIRST
        # -------------------------------------------------
        log_accident(data)

        print("✅ Accident stored in database")

        # -------------------------------------------------
        # Send emergency alert
        # -------------------------------------------------
        try:

            send_alert(
                nearest_service,
                lat,
                lon,
                data["impact"],
                data["passengers"]
            )

            print("📡 Alert dispatched successfully")

        except Exception as alert_error:

            print("⚠ Alert dispatch failed:", alert_error)

    except Exception as e:

        print("❌ Accident processing error:", e)