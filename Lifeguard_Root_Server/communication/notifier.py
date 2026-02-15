from twilio.rest import Client
from core.config import settings
import time

client = Client(
    settings.TWILIO_ACCOUNT_SID,
    settings.TWILIO_AUTH_TOKEN
)

def send_alert(service, lat, lon, impact, passengers=None, retries=3):

    passengers_text = str(passengers) if passengers is not None else "Unknown"

    sms_message = f"""
🚨 LIFEGUARD AI ALERT 🚨

Service: {service['name']}
Impact Type: {impact}
Passengers Detected: {passengers_text}

Live Location:
https://maps.google.com/?q={lat},{lon}
"""

    voice_message = f"""
Emergency alert from Lifeguard AI.
A vehicle accident has been detected.
Impact type {impact}.
{passengers_text} passengers detected.
Location details have been sent by message.
Please respond immediately.
"""

    for attempt in range(retries):
        try:
            # Send SMS
            client.messages.create(
                body=sms_message,
                from_=settings.TWILIO_FROM_NUMBER,
                to=service["phone"]
            )

            # Send Voice Call
            client.calls.create(
                to=service["phone"],
                from_=settings.TWILIO_FROM_NUMBER,
                twiml=f"""
                <Response>
                    <Say voice="alice">
                        {voice_message}
                    </Say>
                </Response>
                """
            )

            print(f"Alert sent to {service['name']}")
            return True

        except Exception as e:
            print("Retry attempt:", attempt + 1, "| Error:", e)
            time.sleep(2)

    print("Failed to send alert.")
    return False