import serial
import time
import pyttsx3
import speech_recognition as sr
from datetime import datetime
import cv2
import json
import ssl
import paho.mqtt.client as mqtt

# ================= CONFIG =================

SERIAL_PORT = "COM11"
BAUD_RATE = 9600

MQTT_BROKER = "6e1cfa98f4324ed18916b23a701d45d1.s1.eu.hivemq.cloud"
MQTT_PORT = 8883
MQTT_TOPIC = "lifeguard/accidents"

MQTT_USERNAME = "lifeguard"
MQTT_PASSWORD = "Lifeguard123"

CAR_ID = "car0xc1"
AUTH_KEY = "secret_key_123"

CAMERA_INDEX = 1

PASSENGER_LOCK_TIME = 3
MOVEMENT_MONITOR_TIME = 10
MOVEMENT_THRESHOLD = 5000

# ==========================================

# -------- Voice Engine --------
engine = pyttsx3.init()
engine.setProperty('rate', 175)

voices = engine.getProperty('voices')
engine.setProperty('voice', voices[0].id)

recognizer = sr.Recognizer()

# -------- Serial --------
ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
time.sleep(2)
ser.reset_input_buffer()

# -------- Camera --------
cap = cv2.VideoCapture(CAMERA_INDEX)

# -------- Detection Models --------
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

eye_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_eye.xml"
)

body_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_upperbody.xml"
)

# ================= MQTT =================

mqtt_client = mqtt.Client()

mqtt_client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)

mqtt_client.tls_set(tls_version=ssl.PROTOCOL_TLS)

print("Connecting to MQTT broker...")
mqtt_client.connect(MQTT_BROKER, MQTT_PORT)
print("MQTT Connected")

print("\n===================================")
print(" LIFEGUARD AI GATEWAY READY ")
print("===================================\n")

# ================= UTIL =================

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


# ================= SEVERITY =================

def calculate_severity(impact, passengers, movement):

    score = 0

    if impact == "FRONTAL":
        score += 3
    else:
        score += 2

    score += passengers

    if not movement:
        score += 3

    if score >= 7:
        return "CRITICAL"
    elif score >= 5:
        return "HIGH"
    elif score >= 3:
        return "MEDIUM"
    else:
        return "LOW"


# ================= MQTT SEND =================

def send_to_server(data):

    payload = {
        "car_id": CAR_ID,
        "auth_key": AUTH_KEY,
        "timestamp": data["timestamp"],
        "lat": float(data["latitude"]),
        "lon": float(data["longitude"]),
        "impact": data["impact"],
        "passengers": data["passengers"],
        "severity": data["severity"]
    }

    try:

        print("\nPublishing accident event to MQTT broker...")
        print(payload)

        mqtt_client.publish(MQTT_TOPIC, json.dumps(payload))

        print("Event published successfully")

    except Exception as e:

        print("MQTT Error:", e)


# ================= MAIN LOOP =================

while True:

    if ser.in_waiting:

        raw = ser.readline().decode(errors="ignore").strip()

        print("[ESP]:", raw)

        if "ACCIDENT_DETECTED" in raw:

            print(">>> ACCIDENT MODE ACTIVATED <<<")

            accident_data = {
                "timestamp": str(datetime.now()),
                "latitude": "0",
                "longitude": "0",
                "impact": "UNKNOWN",
                "passengers": 0
            }

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

            # ================= PASSENGER DETECTION =================

            passenger_history = []
            eye_activity_detected = False

            camera_start = time.time()

            while time.time() - camera_start < PASSENGER_LOCK_TIME:

                ret, frame = cap.read()

                if not ret:
                    continue

                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

                faces = face_cascade.detectMultiScale(gray,1.3,5)
                bodies = body_cascade.detectMultiScale(gray,1.2,3)

                detected_passengers = max(len(faces), len(bodies))

                passenger_history.append(detected_passengers)

                # BODY BOX
                for (x,y,w,h) in bodies:
                    cv2.rectangle(frame,(x,y),(x+w,y+h),(0,255,0),2)
                    cv2.putText(frame,"BODY",(x,y-10),
                    cv2.FONT_HERSHEY_SIMPLEX,0.6,(0,255,0),2)

                # FACE + EYE DETECTION
                for (x,y,w,h) in faces:

                    cv2.rectangle(frame,(x,y),(x+w,y+h),(255,0,0),2)
                    cv2.putText(frame,"FACE",(x,y-10),
                    cv2.FONT_HERSHEY_SIMPLEX,0.6,(255,0,0),2)

                    roi_gray = gray[y:y+h, x:x+w]
                    roi_color = frame[y:y+h, x:x+w]

                    eyes = eye_cascade.detectMultiScale(roi_gray)

                    if len(eyes) > 0:
                        eye_activity_detected = True

                    for (ex,ey,ew,eh) in eyes:

                        cv2.rectangle(
                            roi_color,
                            (ex,ey),
                            (ex+ew,ey+eh),
                            (0,255,255),
                            2
                        )

                        cv2.putText(
                            roi_color,
                            "EYE OPEN",
                            (ex,ey-5),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.5,
                            (0,255,255),
                            2
                        )

                cv2.putText(
                    frame,
                    "PHASE 1 : PASSENGER DETECTION",
                    (20,30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255,255,255),
                    2
                )

                cv2.imshow("LIFEGUARD AI Monitor", frame)
                cv2.waitKey(1)

            passenger_count_locked = max(passenger_history)

            accident_data["passengers"] = passenger_count_locked

            print("Passengers locked:", passenger_count_locked)

            # ================= MOVEMENT DETECTION =================

            previous_frame = None
            movement_detected = False

            monitor_start = time.time()

            adaptive_threshold = passenger_count_locked * 2000 + MOVEMENT_THRESHOLD

            while time.time() - monitor_start < MOVEMENT_MONITOR_TIME:

                ret, frame = cap.read()

                if not ret:
                    continue

                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                gray = cv2.GaussianBlur(gray,(21,21),0)

                if previous_frame is None:
                    previous_frame = gray
                    continue

                frame_delta = cv2.absdiff(previous_frame, gray)

                thresh = cv2.threshold(frame_delta,25,255,cv2.THRESH_BINARY)[1]

                movement_score = cv2.countNonZero(thresh)

                if movement_score > adaptive_threshold:
                    movement_detected = True

                previous_frame = gray

                cv2.putText(
                    frame,
                    "PHASE 2 : MOVEMENT ANALYSIS",
                    (20,30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (255,255,255),
                    2
                )

                cv2.imshow("LIFEGUARD AI Monitor", frame)
                cv2.waitKey(1)

                if movement_detected:
                    break

            # ================= SEVERITY =================

            severity = calculate_severity(
                accident_data["impact"],
                passenger_count_locked,
                movement_detected
            )

            accident_data["severity"] = severity

            print("Accident Severity:", severity)

            # ================= AI RESPONSE =================

            if passenger_count_locked > 0 and (movement_detected or eye_activity_detected):

                speak(
                    f"{passenger_count_locked} passengers detected. Do you need medical assistance?"
                )

                response = listen_response()

                print("Passenger Response:", response)

                if response is None or "yes" in response or "help" in response:

                    speak("Emergency confirmed. Dispatching help.")

                    send_to_server(accident_data)

                else:

                    speak("Okay. Monitoring continues.")

            else:

                speak(
                    "No passenger movement detected. Emergency services will be notified."
                )

                send_to_server(accident_data)

    time.sleep(0.1)

cap.release()
cv2.destroyAllWindows()