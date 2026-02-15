#include <Wire.h>
#include <MPU6050.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>

// ================= CONFIG =================
#define CAR_ID     "car0xc1"
#define AUTH_KEY   "secure_key_123"
#define SERVER_URL "http://192.168.1.100:5000/api/accident"

// ================= PINS =================
#define BTN_FRONT D5
#define BTN_REAR  D6
#define BUZZER    D7

#define GSM_RX D4   // ESP RX <- GSM TX
#define GSM_TX D3   // ESP TX -> GSM RX

#define GPS_RX D8   // GPS TX -> ESP
#define GPS_TX D0   // Not used

// ================= OBJECTS =================
TinyGPSPlus gps;
MPU6050 mpu;
SoftwareSerial gsm(GSM_RX, GSM_TX);
SoftwareSerial gpsSerial(GPS_RX, GPS_TX);

bool accidentTriggered = false;

// ================= UTIL =================
void sendAT(String cmd, int delayTime = 1000) {
  gsm.println(cmd);
  delay(delayTime);
  while (gsm.available()) {
    Serial.write(gsm.read());
  }
}

void initGSM() {
  Serial.println("[GSM] Initializing...");
  sendAT("AT");
  sendAT("AT+SAPBR=3,1,\"CONTYPE\",\"GPRS\"");
  sendAT("AT+SAPBR=3,1,\"APN\",\"internet\"");  // Change if needed
  sendAT("AT+SAPBR=1,1");
  sendAT("AT+SAPBR=2,1");
}

void sendAccidentToServer(float lat, float lon, String impact) {

  String json = "{";
  json += "\"car_id\":\"" + String(CAR_ID) + "\",";
  json += "\"auth_key\":\"" + String(AUTH_KEY) + "\",";
  json += "\"lat\":" + String(lat, 6) + ",";
  json += "\"lon\":" + String(lon, 6) + ",";
  json += "\"impact\":\"" + impact + "\"";
  json += "}";

  Serial.println("[HTTP] Sending JSON:");
  Serial.println(json);

  sendAT("AT+HTTPINIT");
  sendAT("AT+HTTPPARA=\"CID\",1");
  sendAT("AT+HTTPPARA=\"URL\",\"" + String(SERVER_URL) + "\"");
  sendAT("AT+HTTPPARA=\"CONTENT\",\"application/json\"");

  gsm.print("AT+HTTPDATA=");
  gsm.print(json.length());
  gsm.println(",10000");
  delay(2000);

  gsm.print(json);
  delay(3000);

  sendAT("AT+HTTPACTION=1", 5000);  // POST
  sendAT("AT+HTTPREAD");
  sendAT("AT+HTTPTERM");
}

// ================= SETUP =================
void setup() {
  Serial.begin(9600);
  gsm.begin(9600);
  gpsSerial.begin(9600);

  delay(3000);

  Serial.println("=================================");
  Serial.println(" LIFEGUARD AI BLACK BOX v2");
  Serial.println("=================================");

  Wire.begin(D2, D1);
  mpu.initialize();

  pinMode(BTN_FRONT, INPUT_PULLUP);
  pinMode(BTN_REAR, INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, LOW);

  initGSM();

  Serial.println("[SYSTEM] Ready");
}

// ================= LOOP =================
void loop() {

  // ---- Read GPS ----
  while (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  // ---- Read MPU ----
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

    Serial.println("ACCIDENT DETECTED");

    unsigned long start = millis();
    bool gpsValid = false;

    while (millis() - start < 5000) {
      while (gpsSerial.available()) {
        gps.encode(gpsSerial.read());
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
      Serial.println("[GPS] FIX OK");
    } else {
      Serial.println("[GPS] FIX FAILED");
    }

    String impactType = "ROLLOVER";
    if (frontImpact) impactType = "FRONTAL";
    else if (rearImpact) impactType = "REAR_OR_SIDE";

    sendAccidentToServer(lat, lon, impactType);

    Serial.println("[SYSTEM] Data Sent to Server");
  }

  delay(500);
}