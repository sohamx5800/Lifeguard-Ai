#include <Wire.h>
#include <MPU6050.h>
#include <TinyGPS++.h>

// -------- PINS --------
#define BTN_FRONT D5
#define BTN_REAR  D6
#define BUZZER    D7

// -------- OBJECTS --------
TinyGPSPlus gps;
MPU6050 mpu;

bool accidentTriggered = false;

void setup() {
  Serial.begin(9600);
  delay(2000);

  Serial.println("=================================");
  Serial.println(" LIFEGUARD AI - BLACK BOX (ESP8266)");
  Serial.println("=================================");

  // I2C for MPU6050
  Wire.begin(D2, D1);
  mpu.initialize();

  if (mpu.testConnection()) {
    Serial.println("[MPU] MPU6050 connection SUCCESS");
  } else {
    Serial.println("[MPU] MPU6050 connection FAILED");
  }

  pinMode(BTN_FRONT, INPUT_PULLUP);
  pinMode(BTN_REAR, INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, LOW);

  Serial.println("[GPS] Waiting for GPS data...");
  Serial.println("[SYSTEM] Black Box Ready");
  Serial.println("---------------------------------");
}

void loop() {

  // ================= GPS READ (EXACT LOGIC YOU TESTED) =================
  while (Serial.available()) {
    char c = Serial.read();
    gps.encode(c);
  }

  // ================= MPU6050 READ =================
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);

  float accX = ax / 16384.0;
  float accY = ay / 16384.0;
  float accZ = az / 16384.0;
  float accMagnitude = sqrt(accX * accX + accY * accY + accZ * accZ);

  // MPU Debug
  Serial.print("[MPU] AX:");
  Serial.print(accX, 2);
  Serial.print(" AY:");
  Serial.print(accY, 2);
  Serial.print(" AZ:");
  Serial.print(accZ, 2);
  Serial.print(" | MAG:");
  Serial.println(accMagnitude, 2);

  // ================= BUTTONS =================
  bool frontImpact = digitalRead(BTN_FRONT) == LOW;
  bool rearImpact  = digitalRead(BTN_REAR) == LOW;

  // ================= ACCIDENT DETECTION =================
  if ((frontImpact || rearImpact || accMagnitude > 2.2) && !accidentTriggered) {

    accidentTriggered = true;
    digitalWrite(BUZZER, HIGH);

    Serial.println("🚨 ACCIDENT_DETECTED");

    // -------- WAIT FOR GPS FIX (CRITICAL FIX) --------
    unsigned long start = millis();
    bool gpsValid = false;

    Serial.println("[GPS] Acquiring coordinates...");

    while (millis() - start < 5000) {   // wait up to 5 seconds
      while (Serial.available()) {
        char c = Serial.read();
        gps.encode(c);
      }
      if (gps.location.isUpdated()) {
        gpsValid = true;
        break;
      }
    }

    // -------- PRINT GPS DATA --------
    if (gpsValid) {
      Serial.print("LAT:");
      Serial.println(gps.location.lat(), 6);
      Serial.print("LON:");
      Serial.println(gps.location.lng(), 6);
    } else {
      Serial.println("LAT:UNKNOWN");
      Serial.println("LON:UNKNOWN");
    }

    // -------- IMPACT TYPE --------
    Serial.print("IMPACT_TYPE:");
    if (frontImpact) Serial.println("FRONTAL");
    else if (rearImpact) Serial.println("REAR_OR_SIDE");
    else Serial.println("ROLLOVER");

    Serial.println("END_PACKET");
    Serial.println("---------------------------------");
  }

  delay(500);
}