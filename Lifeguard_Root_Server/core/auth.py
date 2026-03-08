from db.database import car_registry

def authenticate_vehicle(car_id, auth_key):

    if car_id not in car_registry:
        raise Exception("Unknown vehicle")

    if car_registry[car_id]["auth_key"] != auth_key:
        raise Exception("Authentication failed")

    return True