import os

class Settings:

    MQTT_BROKER = "6e1cfa98f4324ed18916b23a701d45d1.s1.eu.hivemq.cloud"
    MQTT_PORT = 8883
    MQTT_USERNAME = "lifeguard"
    MQTT_PASSWORD = "Lifeguard123"

    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_FROM_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

settings = Settings()