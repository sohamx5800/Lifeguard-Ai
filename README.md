# 🚨 Lifeguard AI
## Intelligent Accident Detection & Autonomous Emergency Response Platform

Lifeguard AI is a full-stack intelligent accident response ecosystem that integrates embedded vehicle hardware, computer vision, AI-driven passenger monitoring, cloud communication infrastructure, and emergency service automation.
The system is designed to detect accidents automatically, analyze passenger conditions in real time, and immediately dispatch emergency responders without requiring any manual action from the passengers.
The primary objective is to reduce emergency response time during the Golden Hour, potentially saving thousands of lives.

---

## 🌍 The Problem

Every year millions of road accidents occur worldwide.
A significant percentage of fatalities happen not because injuries are immediately fatal, but because:
Victims lose consciousness
Nobody nearby reports the accident
Emergency services are delayed
Victims cannot call for help
Accidents occur in remote areas
Medical research shows that 30–40% of accident deaths could be prevented if medical assistance arrived faster.
This critical time window is known as the Golden Hour.
Lifeguard AI directly addresses this challenge.


## 💡 The Lifeguard AI Solution
Lifeguard AI introduces an autonomous accident response system that:
Detects vehicle crashes automatically
Monitors passenger condition using AI
Captures exact GPS coordinates
Transmits accident data to cloud infrastructure
Finds the nearest emergency services
Automatically sends SMS alerts and AI voice calls
Provides real-time tracking through a dashboard and mobile application
The entire process happens within seconds after an accident occurs.

## ⚙️ Complete System Workflow
    Vehicle Crash Occurs
            │
            ▼
    Black Box Detects Impact
            │
            ▼
    GPS Coordinates Captured
            │
            ▼
    AI Passenger Monitoring
    (Face + Motion + Eye Detection)
            │
            ▼
    Accident Data Packaged as JSON
            │
            ▼
    MQTT Cloud Broker (Bridge Server)
            │
            ▼
    Root Server Processes Event
            │
            ▼
    Haversine Algorithm Calculates
    Nearest Emergency Services
            │
            ▼
    Twilio API Triggers
    SMS + Voice Call Alerts
            │
            ▼
    Emergency Response Dispatched



All without requiring manual intervention.

---

## 🏗 System Architecture
        Lifeguard AI uses a distributed multi-layer architecture.
    ┌─────────────────────────────────────────────┐
    │           VEHICLE BLACK BOX (EDGE AI)       │
    │                                             │
    │  MPU6050  GPS  Camera  Impact Sensors      │
    │        │        │         │                │
    │        └────────┼─────────┘                │
    │                 ▼                          │
    │         Passenger AI Monitoring            │
    │        (Face + Motion + Eye Detection)     │
    │                 ▼                          │
    │        Accident Data JSON Packet           │
    └─────────────────────────────────────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────────────┐
    │            MQTT CLOUD BROKER                │
    │          (HiveMQ Communication Bridge)      │
    └─────────────────────────────────────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────────────┐
    │            ROOT SERVER (FASTAPI)            │
    │                                             │
    │  Authentication                             │
    │  Accident Processing                        │
    │  Haversine Distance Engine                  │
    │  Emergency Service Database                 │
    │  Twilio Alert Dispatcher                    │
    └─────────────────────────────────────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────────────┐
    │            STREAMLIT COMMAND DASHBOARD      │
    │                                             │
    │  Accident Monitoring                        │
    │  Live Event Visualization                   │
    │  Emergency Dispatch Status                  │
    │  Analytics & Statistics                     │
    └─────────────────────────────────────────────┘
                         │
                         ▼
    ┌─────────────────────────────────────────────┐
    │             MOBILE APPLICATION              │
    │                                             │
    │  Emergency Dashboard                        │
    │  Live Accident Map                          │
    │  Medical AI Assistant                       │
    │  Prescription Generator                     │
    │  Pharmacy Ordering                          │
    │  Responder Portal                           │
    └─────────────────────────────────────────────┘

Lifeguard AI consists of three primary layers: 
--- ![3 layer ](https://github.com/user-attachments/assets/4cbd2b75-3dcd-4aff-99d6-5e6db61d9a42)


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

    The system detects accidents using sensor fusion techniques.
    
    An accident is triggered if:
    
    Front impact sensor is activated
    
    Rear impact sensor is activated
    
    Acceleration magnitude exceeds threshold (2.2G)
    
    Rollover detected using MPU6050 gyroscope
    
    Acceleration magnitude formula:
    
    |a| = √(ax² + ay² + az²)
    
## 🤖 AI Passenger Monitoring
    
    Once a crash is detected, the onboard AI performs passenger condition analysis.
    
    Face Detection
    
    Counts the number of passengers inside the vehicle.
    
    Motion Detection
    
    Determines whether passengers are moving.
    
    Eye Activity Detection
    
    Detects whether passengers are conscious.
    
    Voice Interaction
    
    The AI assistant asks:
    
    "Do you need medical assistance?"
    
    Decision scenarios:
    
    Condition
    
    System Action
    
    Movement + response
    
    Emergency triggered
    
    Movement + no response
    
    Emergency triggered
    
    No movement
    
    Immediate emergency dispatch
    
## 📡 MQTT Communication Bridge

    Lifeguard AI uses the MQTT protocol as a communication bridge.
    
    Advantages:
    
    Lightweight communication
    
    Real-time event streaming
    
    Secure device connectivity
    
    Scalable IoT architecture
    
    Accident events are published to:
    
    MQTT Topic:
    lifeguard/accidents
    
    Example payload:
    
        {
          "car_id": "car0xc1",
          "auth_key": "secure_key",
          "timestamp": "2026-03-08T02:06:46",
          "lat": 26.123456,
          "lon": 89.456789,
          "impact": "FRONTAL",
          "passengers": 2
        }


## App Features:
    1.Emergency dashboard
    2.Live tracking
    3.Medical chatbot
    4.Digital prescription generation
    5.Direct medicine ordering
    6.Responder portal


## 🧮 Emergency Service Detection (Haversine Algorithm)

    The system finds the nearest responders using the Haversine distance formula.
    
    a = sin²(Δφ/2) + cos(φ1) ⋅ cos(φ2) ⋅ sin²(Δλ/2)
    c = 2 ⋅ atan2(√a, √(1−a))
    d = R ⋅ c
    
    Where:
    
    φ = latitude
    
    λ = longitude
    
    R = Earth radius (6371 km)
    
    The system searches for responders within a 15 km emergency radius.

  
<img width="1600" height="646" alt="image" src="https://github.com/user-attachments/assets/183bac56-90f4-46d7-819c-935500bc0994" />
<img width="1600" height="781" alt="image" src="https://github.com/user-attachments/assets/5909bf91-5589-431d-8f74-17adf9a8953a" />
<img width="1600" height="609" alt="image" src="https://github.com/user-attachments/assets/a651affb-05b3-4ba2-9366-c833a687e79f" />

    a = sin²(Δφ/2) + cos(φ1) ⋅ cos(φ2) ⋅ sin²(Δλ/2)
    c = 2 ⋅ atan2(√a, √(1−a))
    d = R ⋅ c



## Upload Firmware TO BLACKBOX :
    1.Open Arduino IDE
    2.Select ESP8266 board
    3.Upload firmware.ino


## Run AI Edge Layer: 
    cd HARDWARE_Blackbox
    pip install -r requirements.txt
    python gateway.py


## ⚙️ Installation & Setup
    1️⃣ Upload Firmware
        Open Arduino IDE
        Select ESP8266 board
        Upload firmware
    2️⃣ Run Edge AI System
        cd HARDWARE_Blackbox
        pip install -r requirements.txt
        python gateway.py
    3️⃣ Run Root Server
        cd Lifeguard_Root_Server
        pip install -r requirements.txt
        python run.py
    4️⃣ Run API Server
        uvicorn api_server:app --reload
    5️⃣ Run Dashboard
        streamlit run dashboard/dashboard.py

## Set Environment Variables.. Open cmd on windows and paste these with your actual credentials:
    set TWILIO_ACCOUNT_SID=your_sid
    set TWILIO_AUTH_TOKEN=your_token
    set TWILIO_FROM_NUMBER=your_number
    
