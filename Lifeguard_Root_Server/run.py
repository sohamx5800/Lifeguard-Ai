import json
import ssl
import paho.mqtt.client as mqtt

from core.config import settings
from services.accident_service import process_accident_event

TOPIC = "lifeguard/accidents"

def on_connect(client, userdata, flags, rc):

    print("MQTT Connected")
    client.subscribe(TOPIC)


def on_message(client, userdata, msg):

    data = json.loads(msg.payload.decode())

    print("Accident received:", data)

    process_accident_event(data)


client = mqtt.Client()

client.username_pw_set(
    settings.MQTT_USERNAME,
    settings.MQTT_PASSWORD
)

client.tls_set(tls_version=ssl.PROTOCOL_TLS)

client.on_connect = on_connect
client.on_message = on_message

client.connect(settings.MQTT_BROKER, settings.MQTT_PORT)

client.loop_forever()