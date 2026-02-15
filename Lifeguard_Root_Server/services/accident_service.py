from db.database import services
from algorithms.haversine import haversine
from communication.notifier import send_alert

def find_nearest_service(lat, lon):
    nearest = None
    min_distance = float("inf")

    for service in services:
        distance = haversine(lat, lon, service["lat"], service["lon"])
        if distance < min_distance:
            min_distance = distance
            nearest = service

    return nearest

def process_accident(data):
    nearest = find_nearest_service(data.lat, data.lon)

    if nearest:
        send_alert(
            nearest,
            data.lat,
            data.lon,
            data.impact,
            data.passengers
        )

    return nearest