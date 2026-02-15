from db.database import car_registry

def authenticate_device(car_id, auth_key):
    car = car_registry.get(car_id)
    if not car:
        return False
    return car["auth_key"] == auth_key