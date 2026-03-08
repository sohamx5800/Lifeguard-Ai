# Requirements Document: Lifeguard AI

## Introduction

Lifeguard AI is an intelligent accident detection and emergency response platform designed to reduce the delay between vehicle crashes and emergency medical assistance. The system combines IoT hardware, artificial intelligence, computer vision, and cloud infrastructure to automatically detect accidents, analyze passenger conditions, capture precise location data, and notify the nearest emergency services in real time.

The platform operates as a distributed edge–cloud system, where accident detection and passenger monitoring occur inside the vehicle while emergency dispatch and responder coordination occur on a centralized cloud-based root server.

By eliminating dependency on manual reporting or smartphone availability, Lifeguard AI addresses the Golden Hour problem, where rapid medical intervention during the first hour after a crash significantly increases survival rates.

Studies indicate that 30–40% of accident fatalities could be prevented with faster emergency response, and Lifeguard AI aims to solve this problem through automated accident detection and intelligent emergency dispatch.

---

## Glossary

**Black_Box**  
The embedded hardware unit installed inside the vehicle containing sensors and the ESP8266 microcontroller.

**Accident_Detector**  
The subsystem that identifies crash events using accelerometer data, gyroscope readings, and impact sensors.

**Passenger_Monitor**  
The AI-based computer vision system that detects passengers, analyzes movement, and evaluates responsiveness.

**AI_Gateway**  
The Python-based processing system that communicates with the hardware, performs passenger monitoring, and publishes accident data to the MQTT server.

**MQTT_Bridge_Server**  
The cloud messaging infrastructure (HiveMQ) that connects vehicle devices with the central root server.

**Root_Server**  
The centralized processing system responsible for computing emergency response decisions and dispatching alerts.

**Location_Tracker**  
The GPS module responsible for capturing vehicle coordinates.

**Alert_System**  
The communication system that sends emergency notifications via SMS and voice calls.

**Emergency_Services**  
Hospitals, ambulance services, and police stations responsible for emergency response.

**Family_Contacts**  
Pre-configured contacts who receive accident alerts.

**Impact_Event**  
A detected accident event based on sensor readings exceeding predefined thresholds.

**Responsiveness**  
The condition of passengers determined by body movement, eye activity, or voice response.

**Emergency_Level**  
A severity classification determined by accident type and passenger condition.

**Golden_Hour**  
The first 60 minutes after a traumatic accident when medical treatment is most critical.

---

## System Requirements

### Requirement 1: Automatic Accident Detection

**User Story**  
As a vehicle occupant, I want the system to automatically detect when an accident occurs so that emergency help can be summoned even if I am unconscious or unable to use a phone.

**Acceptance Criteria**

1.1. WHEN the MPU6050 sensor detects sudden acceleration exceeding 2.2G, THE Accident_Detector SHALL classify the event as a crash.

1.2. WHEN the gyroscope detects vehicle tilt exceeding 45 degrees, THE Accident_Detector SHALL classify the event as a rollover accident.

1.3. WHEN the frontal impact sensor is triggered, THE Accident_Detector SHALL classify the event as a frontal collision.

1.4. WHEN the rear impact sensor is triggered, THE Accident_Detector SHALL classify the event as a rear collision.

1.5. WHEN an Impact_Event is detected, THE Accident_Detector SHALL timestamp the event within 100 milliseconds.

1.6. WHEN multiple sensors detect an Impact_Event simultaneously, THE Accident_Detector SHALL prioritize the highest severity classification.

---

### Requirement 2: Passenger Condition Monitoring

**User Story**  
As an emergency responder, I want to know how many passengers are inside the vehicle and their condition so that appropriate medical resources can be dispatched.

**Acceptance Criteria**

2.1. WHEN the onboard camera activates after an Impact_Event, THE Passenger_Monitor SHALL detect faces using computer vision.

2.2. WHEN analyzing post-accident frames, THE Passenger_Monitor SHALL determine passenger responsiveness using movement detection.

2.3. WHEN passengers show body movement or eye activity, THE Passenger_Monitor SHALL classify them as responsive.

2.4. WHEN passengers show no movement for 10 seconds, THE Passenger_Monitor SHALL classify them as potentially unconscious.

2.5. WHEN the Passenger_Monitor completes analysis, THE System SHALL include passenger count and responsiveness status in the accident event data.

---

### Requirement 3: Real-Time Location Tracking

**User Story**  
As an emergency dispatcher, I want to receive precise accident location information so that responders can reach the accident site quickly.

**Acceptance Criteria**

3.1. WHEN an Impact_Event occurs, THE Location_Tracker SHALL capture GPS coordinates within 2 seconds.

3.2. WHEN GPS coordinates are captured, THE Location_Tracker SHALL format them with at least 6 decimal places of precision.

3.3. WHEN GPS signal is unavailable, THE Location_Tracker SHALL use the last known valid coordinates and mark them as stale.

3.4. WHEN location data is prepared, THE System SHALL generate a Google Maps link.

3.5. THE Location_Tracker SHALL update GPS coordinates every 5 seconds during normal operation.

---

### Requirement 4: Emergency Alert Dispatch

**User Story**  
As a family member, I want to receive immediate notification when my loved one is involved in an accident.

**Acceptance Criteria**

4.1. WHEN an accident is confirmed, THE Root_Server SHALL dispatch emergency alerts within 10 seconds.

4.2. WHEN composing an alert message, THE System SHALL include:
   - accident type
   - passenger count
   - passenger condition
   - timestamp
   - GPS coordinates
   - Google Maps location link

4.3. WHEN SMS delivery fails, THE Alert_System SHALL attempt voice call delivery.

4.4. WHEN making a voice call, THE Alert_System SHALL use text-to-speech to communicate accident details.

4.5. WHEN all alert attempts fail, THE System SHALL log the failure and continue notifying remaining contacts.

---

### Requirement 5: MQTT Bridge Communication

**User Story**  
As a system architect, I want accident data to be transmitted through a scalable messaging system so that multiple vehicles can communicate with the root server reliably.

**Acceptance Criteria**

5.1. THE AI_Gateway SHALL publish accident events using the MQTT protocol.

5.2. THE MQTT_Bridge_Server SHALL receive accident events on the topic:
```
lifeguard/accidents
```

5.3. THE Root_Server SHALL subscribe to the MQTT topic and process incoming accident data.

5.4. WHEN the MQTT broker receives an accident event, THE Root_Server SHALL process it within 2 seconds.

5.5. THE MQTT infrastructure SHALL support communication from multiple vehicles simultaneously.

---

### Requirement 6: Emergency Service Selection

**User Story**  
As an emergency dispatcher, I want the system to automatically identify the nearest responders.

**Acceptance Criteria**

6.1. WHEN accident coordinates are received, THE Root_Server SHALL calculate distances using the Haversine algorithm.

6.2. THE Root_Server SHALL search for emergency services within a 15 km radius.

6.3. WHEN multiple services are available, THE Root_Server SHALL select the nearest responder.

6.4. THE System SHALL trigger emergency calls and SMS alerts to selected responders.

6.5. WHEN no services are found within 15 km, THE System SHALL escalate the search radius to 30 km.

---

### Requirement 7: Monitoring Dashboard

**User Story**  
As a system administrator, I want to monitor accident events in real time.

**Acceptance Criteria**

7.1. THE System SHALL provide a web-based dashboard.

7.2. THE Dashboard SHALL display:
   - accident ID
   - vehicle ID
   - accident location
   - passenger count
   - dispatch status

7.3. THE Dashboard SHALL update automatically when new accident events occur.

7.4. THE Dashboard SHALL display accident locations on an interactive map.

7.5. THE Dashboard SHALL show daily accident statistics and metrics.

---

### Requirement 8: Mobile Application Integration

**User Story**  
As a vehicle user, I want a mobile application that allows manual emergency requests and medical assistance.

**Acceptance Criteria**

8.1. THE Mobile_App SHALL provide an SOS emergency button.

8.2. WHEN the SOS button is pressed, THE System SHALL send location data to the root server.

8.3. THE Mobile_App SHALL include an AI medical assistant.

8.4. WHEN health severity is high, THE App SHALL recommend contacting a doctor.

8.5. THE App SHALL allow users to order medicines from nearby pharmacies.

8.6. THE App SHALL provide symptom-based health chat functionality.

8.7. THE App SHALL locate and display nearest pharmacies on a map.

---

### Requirement 9: System Reliability

**User Story**  
As a vehicle owner, I want the system to remain operational during an accident.

**Acceptance Criteria**

9.1. THE System SHALL operate continuously during vehicle operation.

9.2. WHEN network connectivity fails, THE System SHALL retry message transmission.

9.3. THE System SHALL log all accident events and system activities.

9.4. WHEN storage exceeds 90% capacity, THE System SHALL archive older logs.

9.5. WHEN sensor failures occur, THE System SHALL log errors and continue operation with remaining sensors.

9.6. THE System SHALL buffer up to 10 accident events locally when MQTT connection is unavailable.

---

### Requirement 10: Data Privacy and Security

**User Story**  
As a vehicle owner, I want my personal data to remain secure.

**Acceptance Criteria**

10.1. THE System SHALL transmit accident data using encrypted connections (HTTPS/TLS).

10.2. THE System SHALL store configuration data securely with encrypted auth keys.

10.3. THE System SHALL only transmit location data when an accident event occurs.

10.4. THE System SHALL not transmit personally identifiable information beyond vehicle ID.

10.5. THE System SHALL authenticate all vehicle requests using vehicle ID and auth key.

10.6. THE System SHALL implement rate limiting to prevent abuse (10 requests per minute per vehicle).

---

### Requirement 11: Voice Interaction Interface

**User Story**  
As a conscious accident victim, I want to interact with the system through voice commands.

**Acceptance Criteria**

11.1. WHEN an Impact_Event occurs, THE System SHALL activate voice interaction.

11.2. THE System SHALL ask:
```
"Are you okay? Do you need medical assistance?"
```

11.3. WHEN the user responds "Yes" or "I'm fine", THE System SHALL cancel the emergency alert.

11.4. WHEN the user responds "Help" or "Emergency", THE System SHALL immediately dispatch alerts.

11.5. WHEN no response is detected within 15 seconds, THE System SHALL automatically send emergency alerts.

11.6. THE System SHALL provide audio feedback confirming recognized voice commands.

---

### Requirement 12: Sensor Calibration and Accuracy

**User Story**  
As a system operator, I want sensors to be calibrated to distinguish between normal driving events and accidents.

**Acceptance Criteria**

12.1. WHEN the system initializes, THE Accident_Detector SHALL calibrate sensors using baseline readings.

12.2. THE System SHALL filter events below 2.2G to avoid false positives from speed bumps.

12.3. WHEN the vehicle remains stationary for 5 minutes, THE System SHALL recalibrate sensors.

12.4. WHEN sensor readings are inconsistent, THE System SHALL log a sensor error.

12.5. THE calibration process SHALL complete within 3 seconds of system startup.

---

### Requirement 13: System Scalability

**User Story**  
As a platform provider, I want the system to support multiple vehicles simultaneously.

**Acceptance Criteria**

13.1. THE MQTT infrastructure SHALL support multiple connected devices (minimum 1000 concurrent vehicles).

13.2. THE Root_Server SHALL process accident events from multiple vehicles concurrently.

13.3. THE Dashboard SHALL display accidents from multiple vehicle IDs simultaneously.

13.4. THE System SHALL maintain sub-10-second response time even with 100 concurrent accidents.

13.5. THE Database SHALL use spatial indexing for efficient emergency service queries.

---

### Requirement 14: Notification Retry Mechanism

**User Story**  
As an emergency responder, I want to ensure that alerts are delivered even if initial attempts fail.

**Acceptance Criteria**

14.1. WHEN SMS delivery fails, THE System SHALL retry after 2 seconds.

14.2. THE System SHALL attempt a maximum of 3 retries per contact.

14.3. WHEN SMS fails after all retries, THE System SHALL attempt voice call delivery.

14.4. THE System SHALL log all delivery attempts with timestamps and status.

14.5. THE System SHALL continue attempting to notify remaining contacts even if one contact fails.

---

### Requirement 15: Vehicle Authentication

**User Story**  
As a system administrator, I want to ensure only authorized vehicles can use the system.

**Acceptance Criteria**

15.1. WHEN an accident event is received, THE Root_Server SHALL validate the vehicle ID.

15.2. THE Root_Server SHALL verify the auth key matches the stored hash.

15.3. WHEN authentication fails, THE System SHALL reject the request and log the attempt.

15.4. THE System SHALL check that the vehicle is active (not deactivated).

15.5. THE System SHALL validate request timestamps are within 5 minutes of server time.

---

### Requirement 16: Haversine Distance Calculation

**User Story**  
As a system architect, I want accurate distance calculations on Earth's spherical surface.

**Acceptance Criteria**

16.1. THE Root_Server SHALL use the Haversine formula for distance calculations.

16.2. THE formula SHALL use Earth's mean radius of 6371 km.

16.3. THE System SHALL convert coordinates to radians before calculation.

16.4. THE calculated distance SHALL be accurate within 0.5% error margin.

16.5. THE System SHALL complete distance calculations within 100 milliseconds.

---

### Requirement 17: Emergency Service Database

**User Story**  
As a system administrator, I want to maintain a database of verified emergency services.

**Acceptance Criteria**

17.1. THE Database SHALL store emergency service information including:
   - name
   - phone number
   - service type (AMBULANCE, POLICE, FIRE)
   - latitude
   - longitude
   - verified status
   - active status

17.2. THE Database SHALL use spatial indexing for location-based queries.

17.3. THE System SHALL only select services marked as verified and active.

17.4. THE Database SHALL support CRUD operations for emergency service management.

---

### Requirement 18: Accident Event Logging

**User Story**  
As a system administrator, I want comprehensive logging of all accident events for audit and analysis.

**Acceptance Criteria**

18.1. THE System SHALL log every accident event to the database.

18.2. THE log SHALL include:
   - vehicle ID
   - timestamp
   - location coordinates
   - impact type
   - passenger count
   - responsive passenger count
   - severity level
   - dispatch status

18.3. THE System SHALL log all notification attempts with delivery status.

18.4. THE logs SHALL be retained for at least 90 days.

18.5. THE System SHALL support querying logs by vehicle ID, date range, and accident type.

---

### Requirement 19: System Health Monitoring

**User Story**  
As a system administrator, I want to monitor the health of all system components.

**Acceptance Criteria**

19.1. THE System SHALL provide health check endpoints for all services.

19.2. THE System SHALL monitor MQTT broker connectivity.

19.3. THE System SHALL monitor database connection status.

19.4. THE System SHALL alert administrators when critical components fail.

19.5. THE Dashboard SHALL display system health metrics.

---

### Requirement 20: Performance Requirements

**User Story**  
As a system architect, I want the system to meet strict performance requirements for life-critical operations.

**Acceptance Criteria**

20.1. THE System SHALL detect accidents within 100 milliseconds of impact.

20.2. THE System SHALL complete passenger monitoring within 3 seconds.

20.3. THE System SHALL transmit accident data via MQTT within 1 second.

20.4. THE Root_Server SHALL process events within 2 seconds of receipt.

20.5. THE System SHALL dispatch emergency alerts within 10 seconds of accident detection.

20.6. THE total end-to-end response time SHALL be less than 15 seconds.

---

## Non-Functional Requirements

### Availability

- The system SHALL maintain 99.9% uptime for cloud services.
- The system SHALL support automatic failover for critical components.
- The MQTT broker SHALL support high availability clustering.

### Reliability

- The system SHALL handle sensor failures gracefully without complete system failure.
- The system SHALL buffer events during network outages.
- The system SHALL implement retry mechanisms for all external communications.

### Maintainability

- The system SHALL use modular architecture for independent component updates.
- The system SHALL provide comprehensive logging for troubleshooting.
- The system SHALL support remote configuration updates.

### Usability

- The dashboard SHALL be accessible via web browser without installation.
- The mobile app SHALL support both iOS and Android platforms.
- The voice interaction SHALL support natural language responses.

### Portability

- The black box hardware SHALL be installable in any vehicle type.
- The system SHALL support multiple GPS module types.
- The AI Gateway SHALL run on both Raspberry Pi and laptop systems.

---

## Summary

This document defines the functional and non-functional requirements of the Lifeguard AI platform, describing the expected behavior of each subsystem including:

- Hardware devices (Black Box, sensors, GPS)
- AI monitoring modules (Passenger Monitor, Voice Interaction)
- Cloud infrastructure (MQTT Bridge, Root Server)
- Emergency dispatch systems (Alert System, Haversine Engine)
- Monitoring interfaces (Dashboard, Mobile Application)

The requirements ensure that Lifeguard AI delivers on its core mission: reducing the time between accident occurrence and emergency response to save lives during the critical Golden Hour.
