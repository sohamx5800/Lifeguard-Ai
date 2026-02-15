# 🚨 Lifeguard AI
## Intelligent Accident Detection & Autonomous Emergency Response Platform

Lifeguard AI is a full-stack, production-ready accident detection and emergency automation system that combines vehicle-embedded hardware, AI-based passenger monitoring, GSM communication, and a scalable backend microservice architecture.

It is designed to eliminate emergency response delays during the critical first minutes after a road accident.

---

# 🌍 The Problem

In road accidents, the most critical factor is **time**.

Victims often:
- Lose consciousness
- Cannot reach their phone
- Cannot manually call emergency services
- Are in remote locations

Even a few minutes of delay can determine life or death.

---

# 💡 The Solution — Lifeguard AI

Lifeguard AI automatically:

1. Detects vehicle impact
2. Captures live GPS location
3. Detects passengers & movement
4. Makes intelligent emergency decisions
5. Finds nearest hospital using Haversine algorithm
6. Sends SMS + AI voice call automatically

All without requiring manual intervention.

---

# 🏗 System Architecture

Lifeguard AI consists of three primary layers: 
---

# 🚗 1️⃣ Vehicle Black Box (Hardware Layer)

## Components

- ESP8266 Microcontroller
- MPU6050 (Impact + Rollover Detection)
- GPS Module (Live Coordinates)
- GSM Module (SIM-based Communication)
- Emergency Push Buttons (Front & Rear)
- Buzzer Alert System

---

## 🚦 Accident Detection Logic

Accident is triggered if:

- Front impact button pressed
- Rear impact button pressed
- Acceleration magnitude > threshold (2.2g)

Acceleration magnitude:
---

## 📍 GPS Acquisition

After impact detection:

- Wait up to 5 seconds for valid GPS fix
- Capture:
  - Latitude
  - Longitude
  - Impact type

---

## 📡 GSM Data Transmission

The black box does NOT use WiFi.

Instead:
- GSM module with SIM card
- Sends JSON data over mobile data network
- Posts to company server API endpoint

Example payload:

```json
{
  "car_id": "car0xc1",
  "api_key": "secure_auth_key",
  "latitude": 26.1234,
  "longitude": 89.4567,
  "impact": "FRONTAL",
  "passengers": 2
}
