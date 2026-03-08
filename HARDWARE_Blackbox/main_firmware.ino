#include <Wire.h>
#include <MPU6050.h>
#include <TinyGPS++.h>

// ================= CONFIG =================
#define CAR_ID "car0xc1"

#define BTN_FRONT D5
#define BTN_REAR  D6
#define BUZZER    D7

TinyGPSPlus gps;
MPU6050 mpu;

bool accidentTriggered = false;

void setup() {

  Serial.begin(9600);   

  delay(2000);

  Serial.println("=================================");
  Serial.println(" LIFEGUARD AI BLACK BOX ");
  Serial.println("=================================");

  Wire.begin(D2, D1);
  mpu.initialize();

  if (mpu.testConnection()) {
    Serial.println("[MPU] Connection OK");
  } else {
    Serial.println("[MPU] Connection FAILED");
  }

  pinMode(BTN_FRONT, INPUT_PULLUP);
  pinMode(BTN_REAR, INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT);

  digitalWrite(BUZZER, LOW);

  Serial.println("[SYSTEM] Ready");
}

void loop() {

  //GPS READ
  while (Serial.available()) {
    gps.encode(Serial.read());
  }

  //MPU READ
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);

  float accX = ax / 16384.0;
  float accY = ay / 16384.0;
  float accZ = az / 16384.0;

  float magnitude = sqrt(accX*accX + accY*accY + accZ*accZ);

  bool frontImpact = digitalRead(BTN_FRONT) == LOW;
  bool rearImpact  = digitalRead(BTN_REAR) == LOW;

  if ((frontImpact || rearImpact || magnitude > 2.2) && !accidentTriggered) {

    accidentTriggered = true;

    digitalWrite(BUZZER, HIGH);

    Serial.println("ACCIDENT_DETECTED");

    //Wait GPS Fix
    unsigned long start = millis();
    bool gpsValid = false;

    while (millis() - start < 5000) {

      while (Serial.available()) {
        gps.encode(Serial.read());
      }

      if (gps.location.isUpdated()) {
        gpsValid = true;
        break;
      }
    }

    float lat = 0.0;
    float lon = 0.0;

    if (gpsValid) {

      lat = gps.location.lat();
      lon = gps.location.lng();

      Serial.println("GPS_OK");

    } else {

      Serial.println("GPS_FAILED");

    }

    String impactType = "ROLLOVER";

    if (frontImpact) impactType = "FRONTAL";
    else if (rearImpact) impactType = "REAR_OR_SIDE";

    // SEND DATA TO PYTHON 

    Serial.print("CAR_ID:");
    Serial.println(CAR_ID);

    Serial.print("LAT:");
    Serial.println(lat, 6);

    Serial.print("LON:");
    Serial.println(lon, 6);

    Serial.print("IMPACT_TYPE:");
    Serial.println(impactType);

    Serial.println("END_PACKET");

    Serial.println("---------------------------------");
  }

  delay(500);
}