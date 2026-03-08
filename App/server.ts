import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '.env');
console.log('--- ENV DEBUG ---');
console.log('Checking .env at:', envPath);
console.log('File exists:', fs.existsSync(envPath));

config({ path: envPath, override: true });

fs.writeFileSync('env_check.txt', `SID: ${process.env.TWILIO_ACCOUNT_SID}\nTOKEN: ${process.env.TWILIO_AUTH_TOKEN ? 'PRESENT' : 'MISSING'}\nPHONE: ${process.env.TWILIO_PHONE_NUMBER}\nPATH: ${envPath}\nEXISTS: ${fs.existsSync(envPath)}`);

console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? `${process.env.TWILIO_ACCOUNT_SID.substring(0, 8)}...` : 'MISSING');
console.log('-----------------');

import express from 'express';
import bodyParser from 'body-parser';
import twilio from 'twilio';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

async function startServer() {
  // Middleware
  app.use(cors());
  app.use(bodyParser.json());

/**
 * =========================================================================
 * GEOSPATIAL DECISION MODULE (Haversine Implementation)
 * =========================================================================
 */

// Predefined database of verified emergency services (Test Dataset)
const EMERGENCY_SERVICES_DB = [
  { id: 'HOSP-A', type: 'Hospital', name: 'City Hospital A', lat: 26.4900390, lng: 89.6915090, contact: '+917478753070' },
  { id: 'HOSP-B', type: 'Hospital', name: 'City Hospital B', lat: 26.5317790, lng: 89.6908540, contact: '+919382539043' },
  { id: 'POL-DIST', type: 'Police', name: 'District Police Station', lat: 26.539948, lng: 89.680488, contact: '+917908743890' }
];

const DEMO_MODE = process.env.DEMO_MODE === 'true' || true; // Default to true for this project

/**
 * Calculates the spherical distance between two points using the Haversine formula.
 * @param {number} lat1 Latitude of point 1
 * @param {number} lon1 Longitude of point 1
 * @param {number} lat2 Latitude of point 2
 * @param {number} lon2 Longitude of point 2
 * @returns {number} Distance in kilometers
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Earth's radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Identifies the nearest valid service for each category.
 * @param {number} userLat Accident latitude
 * @param {number} userLng Accident longitude
 * @returns {Object} Structured data of nearest responders
 */
const identifyNearestResponders = (userLat, userLng) => {
  const servicesWithDistance = EMERGENCY_SERVICES_DB.map(service => ({
    ...service,
    distance: calculateHaversineDistance(userLat, userLng, service.lat, service.lng),
    maps_link: `https://maps.google.com/?q=${service.lat},${service.lng}`
  }));

  // Sort by distance ascending
  servicesWithDistance.sort((a, b) => a.distance - b.distance);

  // Pick nearest per category
  const categories = ['Hospital', 'Police', 'Ambulance'];
  const nearestResponders = {};

  categories.forEach(cat => {
    nearestResponders[cat.toLowerCase()] = servicesWithDistance.find(s => s.type === cat);
  });

  return nearestResponders;
};

/**
 * =========================================================================
 * CORE SYSTEM INITIALIZATION
 * =========================================================================
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const twilioNumber = process.env.TWILIO_PHONE_NUMBER?.trim();
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER?.trim() || '+14155238886';
const geminiKey = process.env.API_KEY;

// Initialize Twilio
let client: any;
if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
    console.log(`✅ Twilio Dispatch Module: ONLINE (SID: ${accountSid.substring(0, 4)}...${accountSid.substring(accountSid.length - 4)}, SID Length: ${accountSid.length}, Token Length: ${authToken.length})`);
  } catch (err: any) {
    console.error("❌ Twilio Initialization Error:", err.message);
  }
} else {
  console.warn("⚠️ Twilio credentials missing - Dispatch will be simulated.");
}

// TARGET EMERGENCY NUMBERS
const DISPATCH_TARGETS = process.env.DISPATCH_TARGETS 
  ? process.env.DISPATCH_TARGETS.split(',').map(n => n.trim()) 
  : ['+917908743890', '+917478753070'];

  // API routes go here
  app.get('/api/debug/twilio', async (req, res) => {
    if (!client) return res.status(500).json({ error: "Twilio client not initialized" });
    try {
      const account = await client.api.v2010.accounts(accountSid).fetch();
      res.json({ status: "success", friendlyName: account.friendlyName, sid: account.sid });
    } catch (err: any) {
      res.status(err.status || 500).json({ 
        status: "error", 
        message: err.message, 
        code: err.code,
        moreInfo: err.moreInfo
      });
    }
  });

  app.post('/api/emergency/dispatch', async (req, res) => {
  const { latitude, longitude, event_type, severity, timestamp, car_id, impact_type, passenger_count } = req.body;
  const incidentId = `LG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  console.log(`[EVENT] Incident ${incidentId} detected for Car ${car_id} at ${latitude}, ${longitude}`);

  // GEOSPATIAL ASSIGNMENT (Haversine)
  const responders = identifyNearestResponders(latitude, longitude);
  
  // Find the absolute nearest service regardless of category
  const allServices = EMERGENCY_SERVICES_DB.map(service => ({
    ...service,
    distance: calculateHaversineDistance(latitude, longitude, service.lat, service.lng)
  })).sort((a, b) => a.distance - b.distance);

  const nearestService = allServices[0];
  
  console.log(`[ASSIGNMENT] Nearest Service: ${nearestService.name} (${nearestService.distance.toFixed(2)} km)`);
  console.log(`[DEBUG] Using Twilio SID: ${accountSid?.substring(0, 8)}...`);

  const responseData = { 
    status: 'success', 
    incidentId, 
    responders,
    nearestService,
    broadcast_count: 0,
    sms_status: 'pending',
    call_status: 'pending'
  };

  if (!client) {
    console.log("[SIMULATION] No Twilio client. Simulation successful.");
    responseData.simulated = true;
    responseData.sms_status = 'simulated';
    responseData.call_status = 'simulated';
    return res.json(responseData);
  }

  const accidentMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const alertMessage = `Lifeguard AI emergency alert. A vehicle accident has been detected. Please respond immediately. Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}. Incident ID: ${incidentId}. Maps: ${accidentMapsLink}`;
  const voiceMessage = `Lifeguard AI emergency alert. A vehicle accident has been detected. Please respond immediately. Location details have been sent by message.`;

  // Target the emergency numbers from environment
  const targets = DISPATCH_TARGETS;
  console.log(`[DISPATCH] Broadcasting to ${targets.length} targets using SID: ${accountSid?.substring(0, 8)}...`);

  try {
    const dispatchPromises = targets.flatMap(targetPhone => [
      // 1. Send SMS
      client.messages.create({
        from: twilioNumber,
        to: targetPhone,
        body: alertMessage
      }),
      // 2. Initiate Voice Call
      client.calls.create({
        from: twilioNumber,
        to: targetPhone,
        twiml: `<Response><Say>${voiceMessage}</Say></Response>`
      })
    ]);

    const results = await Promise.allSettled(dispatchPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    responseData.sms_status = 'sent';
    responseData.call_status = 'initiated';
    responseData.broadcast_count = successCount;

    res.json(responseData);
  } catch (err: any) {
    console.error(`[DISPATCH ERROR] Twilio SID: ${accountSid?.substring(0, 8)}... | Error: ${err.message} | Code: ${err.code}`);
    responseData.status = 'error';
    responseData.error = err.message;
    responseData.code = err.code;
    responseData.moreInfo = err.moreInfo;
    res.status(err.status || 500).json(responseData);
  }
});

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n================================================`);
    console.log(`🚀 LifeGuard AI - CORE SYSTEM v2.1`);
    console.log(`📡 Twilio SID: ${accountSid?.substring(0, 8)}...`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`================================================\n`);
  });
}

startServer();
