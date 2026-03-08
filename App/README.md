
# 🛡️ LifeGuard AI: Emergency & Health Ecosystem

LifeGuard AI is an integrated, AI-driven emergency response platform designed to simulate real-world accident reporting and medical assistance.

## 🚀 Quick Start Guide

### 1. Environment Configuration
You must provide the following keys for the system to function:

**Frontend (Client Side):**
- `API_KEY`: Your Google Gemini API Key.

**Backend (.env file):**
- `TWILIO_ACCOUNT_SID`: From your Twilio Console.
- `TWILIO_AUTH_TOKEN`: From your Twilio Console.
- `TWILIO_PHONE_NUMBER`: Your Twilio SMS/Voice number.
- `TWILIO_WHATSAPP_NUMBER`: Your Twilio WhatsApp Sandbox number.
- `DEMO_MODE`: Set to `true` to use test emergency services.
- `PORT`: 3000

### 2. Test Emergency Services (Demo Mode)
The system includes a pre-registered test dataset for demonstration:
- **City Hospital A**: 26.4900, 89.6915 (+917478753070)
- **City Hospital B**: 26.5317, 89.6908 (+919382539043)
- **District Police Station**: 26.5399, 89.6804 (+917908743890)

### 2. Installation
```bash
# Install backend dependencies
npm install

# Start the communication server
npm start
```

### 3. Application Workflow
1. **SOS Trigger**: Click the "SOS" button. The app captures your GPS coordinates.
2. **Dispatch Phase**: The app attempts to contact the Node.js server to send WhatsApp/SMS/Calls.
3. **Tactical Override**: If the server is not running, the app automatically simulates a successful dispatch after 10 seconds to ensure your demo continues.
4. **Responder Portal**: Once help is "en route," the Responder Portal opens. An AI Voice Agent will automatically call and narrate the incident using Gemini TTS.

## 🛠️ Tech Stack
- **UI**: React 19, Tailwind CSS.
- **Maps**: Leaflet.js (OpenStreetMap).
- **AI**: Google Gemini SDK (@google/genai).
- **Backend**: Node.js, Express.
- **Comms**: Twilio API.

## 📂 Project Structure
- `/components`: UI Modules (Emergency, Health, Responder, Maps).
- `/services`: API logic for Gemini and Twilio Bridge.
- `server.js`: The central dispatching engine.
- `types.ts`: TypeScript definitions for system-wide consistency.

---
*Developed for high-stakes emergency simulation.*
