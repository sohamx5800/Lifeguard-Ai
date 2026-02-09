import serial
import time
import pyttsx3
import speech_recognition as sr
from datetime import datetime
import os
import cv2
from twilio.rest import Client

# ================= CONFIG =================
SERIAL_PORT = "COM7"
BAUD_RATE = 9600

CAMERA_INDEX = 0
PASSENGER_LOCK_TIME = 3        # seconds to lock passenger count
MOVEMENT_MONITOR_TIME = 10     # seconds to monitor movement
MOVEMENT_THRESHOLD = 5000      # pixel change threshold

TWILIO_ENABLED = True

EMERGENCY_CONTACTS = [
    "+918741849945",  # Police
    "+918101072176",  # Ambulance
    "+917478753070"   # Hospital
]
# =========================================

# -------- ENV VARIABLES (Twilio) --------
ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
FROM_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

twilio_client = Client(ACCOUNT_SID, AUTH_TOKEN) if TWILIO_ENABLED else None

# -------- Voice Engine --------
engine = pyttsx3.init()
engine.setProperty('rate', 175)

recognizer = sr.Recognizer()

# -------- Serial --------
ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
time.sleep(2)
ser.reset_input_buffer()

# -------- Camera & Vision --------
cap = cv2.VideoCapture(CAMERA_INDEX)
face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')

print("\n===================================")
print(" LIFEGUARD AI BACKEND READY ")
print("===================================\n")

# ================= UTILITIES =================
def speak(text):
    print("[AI]:", text)
    engine.say(text)
    engine.runAndWait()

def listen_response(timeout=10):
    with sr.Microphone() as source:
        recognizer.adjust_for_ambient_noise(source, duration=1)
        try:
            audio = recognizer.listen(source, timeout=timeout)
            return recognizer.recognize_google(audio).lower()
        except:
            return None

def send_alerts(data):
    msg = f"""
🚨 LIFEGUARD AI ALERT 🚨

Impact: {data['impact']}
Passengers Detected: {data['passengers']}
Time: {data['timestamp']}

Live Location:
https://maps.google.com/?q={data['latitude']},{data['longitude']}
"""

    if TWILIO_ENABLED:
        for number in EMERGENCY_CONTACTS:
            # SMS
            twilio_client.messages.create(
                body=msg,
                from_=FROM_NUMBER,
                to=number
            )

            # Voice Call
            twilio_client.calls.create(
                to=number,
                from_=FROM_NUMBER,
                twiml=f"""
                <Response>
                    <Say voice="alice">
                        Emergency alert from Lifeguard AI.
                        A vehicle accident has been detected.
                        Impact type {data['impact']}.
                        {data['passengers']} passengers detected.
                        Location details have been sent by message.
                        Please respond immediately.
                    </Say>
                </Response>
                """
            )

# ================= MAIN LOOP =================
while True:

    if ser.in_waiting:
        raw = ser.readline().decode(errors="ignore").strip()
        print("[ESP]:", raw)

        if "ACCIDENT_DETECTED" in raw:
            print(">>> ACCIDENT MODE ACTIVATED <<<")

            accident_data = {
                "timestamp": str(datetime.now()),
                "latitude": "UNKNOWN",
                "longitude": "UNKNOWN",
                "impact": "UNKNOWN",
                "passengers": 0
            }

            # ---------- READ ESP DATA ----------
            start = time.time()
            while time.time() - start < 6:
                if ser.in_waiting:
                    msg = ser.readline().decode(errors="ignore").strip()
                    print("[ESP DATA]:", msg)

                    if msg.startswith("LAT:"):
                        accident_data["latitude"] = msg.split(":")[1]
                    elif msg.startswith("LON:"):
                        accident_data["longitude"] = msg.split(":")[1]
                    elif msg.startswith("IMPACT_TYPE:"):
                        accident_data["impact"] = msg.split(":")[1]
                    elif msg == "END_PACKET":
                        break

            speak("Accident detected. Checking passenger condition.")

            # ==================================================
            # PHASE 1: PASSENGER COUNT LOCK
            # ==================================================
            passenger_count_locked = 0
            camera_start = time.time()

            while time.time() - camera_start < PASSENGER_LOCK_TIME:
                ret, frame = cap.read()
                if not ret:
                    continue

                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)
                passenger_count_locked = max(passenger_count_locked, len(faces))

                for (x, y, w, h) in faces:
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)

                cv2.putText(
                    frame,
                    f"Locking Passengers: {passenger_count_locked}",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (255, 0, 0),
                    2
                )

                cv2.imshow("LIFEGUARD AI – Passenger Monitor", frame)
                cv2.waitKey(1)

            accident_data["passengers"] = passenger_count_locked

            # ==================================================
            # PHASE 2: MOVEMENT DETECTION
            # ==================================================
            previous_frame = None
            movement_detected = False
            monitor_start = time.time()

            while time.time() - monitor_start < MOVEMENT_MONITOR_TIME:
                ret, frame = cap.read()
                if not ret:
                    continue

                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                gray = cv2.GaussianBlur(gray, (21, 21), 0)

                if previous_frame is None:
                    previous_frame = gray
                    continue

                frame_delta = cv2.absdiff(previous_frame, gray)
                thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)[1]
                movement_score = cv2.countNonZero(thresh)

                if movement_score > MOVEMENT_THRESHOLD:
                    movement_detected = True

                previous_frame = gray

                cv2.putText(
                    frame,
                    f"Passengers (Locked): {passenger_count_locked}",
                    (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 0),
                    2
                )

                cv2.putText(
                    frame,
                    f"Movement Score: {movement_score}",
                    (20, 80),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 255, 255),
                    2
                )

                cv2.imshow("LIFEGUARD AI – Passenger Monitor", frame)
                cv2.waitKey(1)

                if movement_detected:
                    break

            # ==================================================
            # FINAL DECISION
            # ==================================================
            if passenger_count_locked > 0 and movement_detected:
                speak(f"{passenger_count_locked} passengers detected. Do you need medical assistance?")
                response = listen_response(timeout=10)
                print("Passenger Response:", response)

                if response is None or "yes" in response or "help" in response:
                    speak("Emergency confirmed. Sending help now.")
                    send_alerts(accident_data)
                else:
                    speak("Okay. Monitoring continues. Stay safe.")

            else:
                speak("No passenger movement detected. Auto emergency activated.")
                send_alerts(accident_data)

    time.sleep(0.1)

cap.release()
cv2.destroyAllWindows()