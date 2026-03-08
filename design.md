# Design Document: Lifeguard AI

## Overview

Lifeguard AI is an intelligent distributed accident detection and emergency response platform designed to reduce the delay between a vehicle crash and emergency service dispatch. The system integrates embedded hardware sensors, artificial intelligence, computer vision, real-time communication infrastructure, and cloud-based computation to automatically detect accidents, evaluate passenger conditions, and notify the nearest emergency responders.

The platform follows a hybrid edge–cloud architecture, where time-critical accident detection and passenger monitoring occur at the vehicle edge while computational tasks such as emergency service selection, dispatch coordination, and monitoring are handled by a centralized cloud-based root server.

The core objective of Lifeguard AI is to reduce the time between accident occurrence and emergency response, which is one of the most critical factors in saving lives after road accidents.

---

## System Architecture

The architecture is divided into several logical layers:

- **Sensor Layer** – Hardware modules including MPU6050, GPS, and collision sensors
- **Edge Processing Layer** – Embedded accident detection and AI passenger monitoring
- **Gateway Layer** – Python-based data aggregation and communication module
- **Communication Layer** – MQTT messaging infrastructure
- **Cloud Processing Layer** – Root server performing emergency dispatch logic
- **Monitoring Layer** – Real-time dashboard and mobile application

The system is designed with redundancy and fault tolerance in mind, ensuring reliable operation even under sensor errors, network disruptions, or partial system failures.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       VEHICLE LAYER                         │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                 Lifeguard AI Black Box                │ │
│  │                                                       │ │
│  │  Impact Sensors  MPU6050  GPS  Camera  Buzzer        │ │
│  │         │           │      │      │       │          │ │
│  │         └──────┬────┴──────┴──────┴───────┘          │ │
│  │                │                                      │ │
│  │           ESP8266 Controller                          │ │
│  │                │                                      │ │
│  └────────────────┼──────────────────────────────────────┘ │
│                   │ Serial Communication                   │
└───────────────────┼────────────────────────────────────────┘
                    │
                    ▼
         ┌─────────────────────────────┐
         │     AI Gateway System       │
         │                             │
         │  Passenger Detection        │
         │  Movement Analysis          │
         │  Eye Activity Detection     │
         │  Voice Interaction          │
         │  JSON Data Packaging        │
         └──────────────┬──────────────┘
                        │
                        ▼
              ┌──────────────────────────┐
              │       MQTT Broker        │
              │      (HiveMQ Cloud)      │
              │  Global Communication    │
              └──────────────┬───────────┘
                             │
                             ▼
         ┌────────────────────────────────┐
         │      Lifeguard Root Server     │
         │                                │
         │  Event Processing              │
         │  Haversine Distance Engine     │
         │  Emergency Dispatch System     │
         │  Database Logging              │
         │  Twilio Communication          │
         └───────────────┬────────────────┘
                         │
                         ▼
              ┌─────────────────────────┐
              │   Emergency Responders  │
              │                         │
              │  Hospitals              │
              │  Police Stations        │
              │  Ambulance Services     │
              └─────────────────────────┘
```

---

## 1. Vehicle Hardware Layer (Black Box)

The Lifeguard AI black box is installed inside the vehicle and acts as the primary accident detection device. The hardware system continuously monitors physical conditions inside the vehicle using sensors.

### Hardware Components

| Component | Purpose |
|-----------|---------|
| ESP8266 Microcontroller | Embedded system controller |
| MPU6050 Sensor | Detects acceleration and rollovers |
| GPS Module (Neo-6M) | Provides vehicle location |
| Frontal Impact Sensor | Detects front collisions |
| Rear Impact Sensor | Detects rear collisions |
| Camera System | Detects passengers |
| Buzzer | Alerts when accident is detected |

### Hardware Sensor Connections

**MPU6050 Accelerometer:**
```
SDA → D2
SCL → D1
VCC → 3.3V
GND → GND
```

This sensor measures acceleration across three axes and helps detect sudden force changes associated with crashes.

**GPS Module:**
```
TX → D8
RX → D0
VCC → 3.3V
GND → GND
```

The GPS module continuously sends location coordinates used for emergency response.

**Impact Sensors:**
```
Front Sensor → D5
Rear Sensor  → D6
```

These sensors detect physical collision forces.

**Buzzer:**
```
Buzzer → D7
```

The buzzer activates immediately when an accident is detected.

### ESP8266 Microcontroller

The ESP8266 acts as the primary embedded controller for the black box system.

**Responsibilities:**
- Reading sensor data
- Detecting accident events
- Communicating with the AI gateway through serial communication
- Activating buzzer on crash detection

**Communication Interface:**
- I2C Protocol for MPU6050
- UART Protocol for GPS
- GPIO for impact sensors and buzzer
- Serial communication with AI Gateway

---

## 2. Accident Detection System

The accident detection engine continuously analyzes sensor readings using multi-sensor fusion to reduce false positives.

### Detection Sources

| Sensor | Detection Capability |
|--------|---------------------|
| Front Impact Sensor | Frontal collision |
| Rear Impact Sensor | Rear collision |
| MPU6050 Accelerometer | Sudden force change |
| MPU6050 Gyroscope | Rollover detection |

### Crash Detection Algorithm

**Acceleration Magnitude Calculation:**
```
|a| = √(ax² + ay² + az²)
```

**Crash threshold:**
```
|a| > 2.2G
```

If this threshold is exceeded, the system detects a crash.

### Rollover Detection

Rollover is detected when vehicle tilt exceeds:
```
Tilt > 45°
```

The gyroscope continuously monitors vehicle orientation to detect rollover accidents, which are among the most dangerous types of crashes.

### Impact Classification

- **Frontal Collision**: Front impact sensor triggered OR negative X-axis acceleration > 2.2G
- **Rear Impact**: Rear impact sensor triggered OR positive X-axis acceleration > 2.2G
- **Side Impact**: Y-axis acceleration > 2.2G
- **Rollover**: Gyroscope tilt angle > 45°

---

## 3. AI Passenger Monitoring System

Once a crash is detected, the system activates AI monitoring using the camera system. The goal is to determine the condition of passengers inside the vehicle.

### Passenger Monitoring Workflow

```
Crash Detected
│
▼
Camera Activation
│
▼
Face Detection
│
▼
Passenger Count Lock
│
▼
Movement Detection
│
▼
Eye Activity Detection
│
▼
Voice Interaction
```

### Face Detection

The system uses OpenCV Haar Cascade classifiers to detect faces inside the vehicle and estimate passenger count.

**Configuration:**
```
Scale Factor = 1.3
Min Neighbors = 5
Min Face Size = 30×30 pixels
```

**Detection Window:** 3 seconds after impact

The system records the maximum detected passenger count during the monitoring window.

### Passenger Movement Detection

Movement detection uses frame difference algorithms.

**Algorithm:**
```python
frame_delta = abs(previous_frame - current_frame)
movement_score = count_non_zero_pixels(frame_delta)
```

**Analysis Window:** 10 seconds

**Classification:**
- If `movement_score > threshold` → Passengers considered responsive
- If `movement_score ≤ threshold` → Passengers possibly unconscious

If significant movement is detected, passengers are considered conscious.

### Eye Activity Monitoring

Eye detection helps identify whether passengers are responsive or unconscious.

**Purpose:**
- Determine consciousness level
- Detect eye movement indicating awareness
- Improve passenger condition estimation

Eye movement can indicate consciousness even if body movement is minimal.

---

## 4. Voice Interaction System

If the system detects that passengers are alive or conscious, it activates voice interaction.

**Example prompt:**
```
"Are you okay? Do you need medical assistance?"
```

### Voice Response Handling

| Response | System Action |
|----------|--------------|
| Yes / I'm fine | Cancel alert |
| Help / Emergency | Send emergency alert |
| No response | Automatic emergency dispatch |

**Timeout:** 15 seconds

If no response is detected within 15 seconds, the system proceeds with automatic emergency alert dispatch.

---

## 5. AI Gateway Layer

The AI Gateway is the Python-based system that connects the hardware layer with the cloud infrastructure.

### Responsibilities

- Serial communication with ESP8266
- AI passenger monitoring
- Voice recognition
- Data processing
- JSON accident event generation
- MQTT communication

### Accident Event JSON Format

Example data packet:
```json
{
  "car_id": "car0xc1",
  "auth_key": "secret_key_123",
  "timestamp": "2026-03-08 14:22:10",
  "lat": 26.324512,
  "lon": 89.447231,
  "impact": "FRONTAL",
  "passengers": 3,
  "responsive_passengers": 2,
  "severity": "MEDIUM"
}
```

This structured data is sent to the cloud infrastructure via MQTT.

### Gateway Architecture

```
AI Gateway System
│
├── Serial Communication Module
├── Camera Processing Module
├── Face Detection Engine
├── Movement Analysis Engine
├── Eye Detection Module
├── Voice Interaction Module
├── JSON Event Generator
└── MQTT Publisher
```

---

## 6. MQTT Bridge Server

The MQTT broker acts as a communication bridge between vehicles and the root server.

### MQTT Configuration

**Broker:** HiveMQ Cloud MQTT Cluster

**Topic:**
```
lifeguard/accidents
```

**Protocol:** MQTT 3.1.1 / 5.0

**QoS Level:** 1 (At least once delivery)

### MQTT Advantages

- Low latency communication
- Lightweight messaging
- High scalability
- Global connectivity
- Publish-subscribe pattern
- Support for thousands of concurrent connections

### Message Flow

```
Vehicle Gateway → MQTT Publish → HiveMQ Broker → MQTT Subscribe → Root Server
```

The MQTT bridge enables:
- Real-time communication
- Global connectivity
- Multiple vehicle integration
- Scalable infrastructure

---

## 7. Root Server (Central Emergency Processing System)

The Lifeguard Root Server processes accident events received from MQTT.

### Core Responsibilities

1. Validate accident data
2. Authenticate vehicle ID
3. Calculate nearest emergency services
4. Trigger calls and SMS
5. Log accident events

### Root Server Components

```
Root Server
│
├── Event Processor
├── Vehicle Authentication
├── Haversine Distance Engine
├── Emergency Dispatch Engine
├── Database Manager
└── Twilio Communication Service
```

### Vehicle Authentication

Each vehicle must provide:
- `car_id`: Unique identifier registered in database
- `auth_key`: Secret key associated with vehicle

**Validation Process:**
1. Extract `car_id` and `auth_key` from MQTT message
2. Query database for matching vehicle record
3. Verify auth key matches stored hash
4. Check vehicle is active (not deactivated)
5. Validate request timestamp (prevent replay attacks)

**Security Measures:**
- Auth keys stored as bcrypt hashes
- Rate limiting: 10 requests per minute per vehicle
- Request timestamp must be within 5 minutes of server time
- Invalid requests logged and rejected immediately

---

## 8. Emergency Service Selection

The root server uses the Haversine distance algorithm to find the nearest responders.

### Haversine Distance Formula

```
distance = 2R × asin(√(sin²((lat2-lat1)/2) + 
           cos(lat1) × cos(lat2) × sin²((lon2-lon1)/2)))
```

Where:
```
R = 6371 km (Earth's mean radius)
```

**Search radius:**
```
15 km
```

### Selection Process

1. Retrieve all emergency services from database
2. Compute Haversine distance for each service
3. Filter services within 15 km radius
4. Sort by minimum distance (ascending)
5. Select nearest verified service
6. If no service within 15 km, escalate radius to 30 km

### Service Database Schema

```sql
CREATE TABLE emergency_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    service_type VARCHAR(50) NOT NULL,  -- AMBULANCE, POLICE, FIRE
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_emergency_services_location 
ON emergency_services USING GIST (
    ST_MakePoint(longitude, latitude)
);
```

---

## 9. Emergency Alert System

After identifying the nearest responders, the server automatically sends alerts.

### Alert Methods

| Method | Purpose |
|--------|---------|
| SMS | Send accident information |
| Voice Call | Immediate emergency alert |

### Alert Information

Emergency alerts include:
- Accident type
- Passenger count
- Passenger condition
- Accident location
- Google Maps link
- Timestamp

### SMS Alert Format

```
EMERGENCY: Vehicle Accident Detected

Vehicle ID: car0xc1
Impact Type: FRONTAL COLLISION
Passengers: 3 detected, 2 responsive
Time: 2026-03-08 14:22:10
Location: https://maps.google.com/?q=26.324512,89.447231

Immediate response required.
```

### Voice Call Script

```
"Emergency alert from Lifeguard AI.
A vehicle accident has been detected.
Impact type: FRONTAL COLLISION.
3 passengers detected, 2 responsive.
Location details have been sent by message.
Please respond immediately."
```

### Retry Logic

- Initial attempt: SMS
- Fallback (if SMS fails): Voice call
- Retry interval: 2 seconds between attempts
- Maximum retries: 3 attempts per contact
- All attempts logged in database

### Twilio Integration

The system uses Twilio API for SMS and voice call dispatch.

**Configuration:**
- Twilio Account SID
- Twilio Auth Token
- Twilio Phone Number

**API Endpoints:**
- SMS: `/2010-04-01/Accounts/{AccountSid}/Messages.json`
- Voice: `/2010-04-01/Accounts/{AccountSid}/Calls.json`

---

## 10. Monitoring Dashboard

A monitoring dashboard built using Streamlit allows real-time observation of accident events.

### Dashboard Features

- **Real-time accident feed**: Live stream of accident events
- **Accident location display**: Interactive map showing accident locations
- **Responder dispatch status**: Track emergency service notifications
- **Daily accident statistics**: Charts and metrics
- **Vehicle identification**: Track which vehicles reported accidents

### Dashboard Architecture

```
Streamlit Dashboard
│
├── Real-time Event Feed
├── Interactive Map (Folium/Plotly)
├── Dispatch Status Monitor
├── Statistics Panel
└── Vehicle Tracker
```

### Data Sources

- PostgreSQL database for historical data
- MQTT subscription for real-time events
- Redis cache for performance

### Dashboard Metrics

- Total accidents today
- Average response time
- Successful dispatch rate
- Active vehicles
- Emergency services contacted

---

## 11. Mobile Application

The Lifeguard AI mobile app enhances emergency response capabilities.

### Features

1. **SOS Emergency Trigger**: Manual emergency button
2. **AI Medical Assistant**: Health chat analysis
3. **Symptom-based Health Chat**: Analyze symptoms
4. **Prescription Generation**: AI-generated prescriptions
5. **Medicine Ordering**: Order medications
6. **Nearest Pharmacy Detection**: Find nearby pharmacies

### Mobile App Architecture

```
Mobile Application
│
├── SOS Trigger Module
├── AI Medical Chatbot
├── Symptom Analyzer
├── Prescription Generator
├── Pharmacy Locator
└── Order Management
```

### SOS Emergency Trigger

**Functionality:**
- One-tap emergency alert
- Sends current GPS location
- Notifies emergency contacts
- Triggers same dispatch flow as vehicle accidents

**Use Cases:**
- Medical emergencies
- Personal safety situations
- Manual accident reporting

### AI Medical Assistant

**Capabilities:**
- Natural language health queries
- Symptom analysis
- First aid guidance
- Medical information

**Technology:**
- Natural Language Processing (NLP)
- Medical knowledge base
- Conversational AI

---

## Complete System Workflow

```
Vehicle Crash Occurs
│
▼
Black Box Detects Impact
│
▼
AI Passenger Monitoring
│
▼
Gateway Creates JSON Event
│
▼
Publish Event to MQTT Broker
│
▼
Root Server Receives Event
│
▼
Distance Calculation (Haversine)
│
▼
Nearest Emergency Services
│
▼
Automatic Call + SMS Alert
│
▼
Emergency Responders Dispatched
```

### Timing Requirements

- Impact detection: < 100 ms
- GPS capture: < 2 seconds
- Passenger detection: 3 seconds
- MQTT transmission: < 1 second
- Emergency service selection: < 1 second
- Notification dispatch: < 3 seconds
- **Total end-to-end: < 10 seconds**

---

## Data Models

### Accident Event Model

```python
@dataclass
class AccidentEvent:
    car_id: str
    auth_key: str
    timestamp: datetime
    latitude: float
    longitude: float
    impact_type: str  # FRONTAL, REAR, SIDE, ROLLOVER
    passengers: int
    responsive_passengers: int
    severity: str  # LOW, MEDIUM, HIGH
```

### Emergency Service Model

```python
@dataclass
class EmergencyService:
    id: int
    name: str
    phone_number: str
    service_type: str  # AMBULANCE, POLICE, FIRE
    latitude: float
    longitude: float
    verified: bool
    active: bool
```

### Notification Log Model

```python
@dataclass
class NotificationLog:
    id: int
    accident_id: int
    contact_phone: str
    method: str  # SMS or VOICE
    attempt_number: int
    success: bool
    error_message: Optional[str]
    timestamp: datetime
```

---

## Reliability and Fault Tolerance

The system includes multiple reliability mechanisms.

### Redundancy

- Multi-sensor crash detection
- Backup impact triggers
- AI passenger verification
- Multiple communication channels

### Fault Handling

**GPS Fallback:**
- Use last known coordinates if GPS unavailable
- Mark location as "stale" in alert

**Network Disruption:**
- Queue events locally
- Retry transmission when connection restored
- Maximum queue size: 10 events

**Sensor Failures:**
- Log sensor errors
- Continue operation with remaining sensors
- Notify system administrator

**MQTT Broker Failure:**
- Automatic reconnection with exponential backoff
- Local event buffering
- Fallback to direct HTTP communication

### Persistent Event Logging

All accident events are logged to database before notification dispatch to ensure no data loss.

---

## Security Design

### Transport Security

- **HTTPS enforced** for all HTTP communication
- **TLS 1.2 minimum** with strong cipher suites
- **MQTT over TLS** for secure messaging

### Authentication Security

- **Vehicle auth_key** required for all requests
- **Auth keys hashed** with bcrypt (cost factor 12)
- **Request timestamps** validated (5-minute window)
- **Rate limiting** prevents brute force attacks

### Data Privacy

- **No passenger identity stored** (only count and responsiveness)
- **Location transmitted only during accidents** (not continuous tracking)
- **Logs contain no PII** beyond vehicle ID
- **Database encrypted at rest** (AES-256)

### Audit Trail

- **All requests logged** with timestamp, vehicle ID, and outcome
- **Failed authentication attempts** flagged for review
- **Notification delivery status** tracked for accountability
- **Logs retained for 90 days** for forensic analysis

---

## Scalability Considerations

### Horizontal Scaling

- **Stateless API design**: No session state on servers
- **Load balancing**: Round-robin distribution
- **Auto-scaling**: Based on CPU/memory thresholds
- **Geographic distribution**: Multiple data centers

### Database Optimization

- **Spatial indexing** (PostGIS) for emergency service coordinates
- **Connection pooling** (PgBouncer) for high concurrency
- **Read replicas** for query distribution
- **Partitioning** of accident logs by date

### Caching Strategy

- **Emergency service locations** cached in Redis (TTL: 1 hour)
- **Vehicle authentication** cached after first validation (TTL: 5 minutes)
- **Haversine results** cached for repeated queries

### MQTT Scalability

- **HiveMQ Cloud** supports millions of concurrent connections
- **Topic-based routing** for efficient message delivery
- **Persistent sessions** for reliable message delivery
- **Cluster deployment** for high availability

---

## Key Innovations

### 1. AI-Based Passenger Condition Detection

Computer vision analyzes passenger movement and eye activity to estimate injuries, providing critical information to emergency responders.

### 2. Automated Emergency Dispatch

The system automatically contacts emergency responders without requiring human intervention, reducing response time.

### 3. Distributed IoT Architecture

Vehicles communicate with cloud servers using MQTT, enabling global scalability and real-time monitoring.

### 4. Real-Time Monitoring Infrastructure

Accident events can be monitored in real time through the dashboard, providing visibility into system operations.

### 5. Hybrid Edge-Cloud Processing

Time-critical detection happens at the edge while complex orchestration occurs in the cloud, optimizing for both speed and intelligence.

---

## Future Enhancements

Potential future improvements include:

1. **Vehicle CAN Bus Integration**: Direct integration with vehicle's internal systems
2. **Automatic Ambulance Routing**: Optimize ambulance routes using real-time traffic data
3. **Predictive Crash Severity Models**: Machine learning models to predict injury severity
4. **Smart City Infrastructure Integration**: Connect with traffic management systems
5. **Fleet-Wide Accident Analytics**: Analyze patterns across multiple vehicles
6. **Advanced Biometric Monitoring**: Heart rate, blood pressure monitoring
7. **Multi-Vehicle Accident Coordination**: Handle accidents involving multiple vehicles
8. **Insurance Integration**: Automatic claim filing and documentation

---

## Testing Strategy

### Unit Tests

- **Authentication**: Valid/invalid credentials, rate limiting
- **Haversine**: Distance calculations with known coordinates
- **Service Selection**: Nearest service within radius
- **Notification**: SMS/voice dispatch with mocked APIs

### Integration Tests

- **End-to-end flow**: Accident report → Service selection → Notification
- **MQTT communication**: Publish/subscribe message flow
- **Database operations**: CRUD operations, spatial queries
- **External APIs**: Twilio integration (test mode)

### Property-Based Tests

- **Haversine correctness**: Distance always non-negative, symmetric
- **Authentication**: Valid credentials always succeed
- **Service selection**: Nearest service always within specified radius

### Load Tests

- **Concurrent accidents**: 100 simultaneous requests
- **MQTT throughput**: 1,000 messages/second
- **Notification throughput**: 1,000 messages/minute
- **Database performance**: Query response time < 100ms

---

## Summary

This document describes the complete architectural design of the Lifeguard AI system, covering:

- **Embedded hardware** for accident detection
- **AI monitoring systems** for passenger condition assessment
- **MQTT communication infrastructure** for real-time messaging
- **Cloud-based emergency response coordination** using Haversine algorithm
- **Monitoring dashboard** for system visibility
- **Mobile application** for enhanced emergency capabilities

Lifeguard AI is a comprehensive intelligent emergency response ecosystem that combines embedded systems, AI monitoring, cloud computing, and communication infrastructure to reduce accident response time and improve passenger safety.
