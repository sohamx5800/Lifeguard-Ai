require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const cors = require('cors');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

/**
 * =========================================================================
 * GEOSPATIAL DECISION MODULE (Haversine Implementation)
 * =========================================================================
 */

// Predefined database of verified emergency services
const EMERGENCY_SERVICES_DB = [
  // Hospitals
  { id: 'HOSP-001', type: 'Hospital', name: 'City General Trauma Center', lat: 37.7749, lng: -122.4194, contact: '+15550101' },
  { id: 'HOSP-002', type: 'Hospital', name: 'St. Jude Medical Hub', lat: 37.7858, lng: -122.4008, contact: '+15550102' },
  { id: 'HOSP-003', type: 'Hospital', name: 'Metropolitan Surgical Wing', lat: 37.7510, lng: -122.4476, contact: '+15550103' },
  
  // Police Stations
  { id: 'POL-001', type: 'Police', name: 'Central Precinct Alpha', lat: 37.7739, lng: -122.4312, contact: '+15550201' },
  { id: 'POL-002', type: 'Police', name: 'South District Command', lat: 37.7214, lng: -122.4725, contact: '+15550202' },
  
  // Ambulance Hubs
  { id: 'AMB-001', type: 'Ambulance', name: 'Rapid Response Hub East', lat: 37.7946, lng: -122.3999, contact: '+15550301' },
  { id: 'AMB-002', type: 'Ambulance', name: 'Emergency Transit West', lat: 37.7694, lng: -122.4862, contact: '+15550302' }
];

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

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';
const geminiKey = process.env.API_KEY;

// Initialize Twilio
let client;
if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
    console.log("✅ Twilio Dispatch Module: ONLINE");
  } catch (err) {
    console.error("❌ Twilio Error:", err.message);
  }
} else {
  console.warn("⚠️ Twilio credentials missing - Dispatch will be simulated.");
}

// TARGET EMERGENCY NUMBERS
const DISPATCH_TARGETS = ['+917908743890', '+917478753070'];

app.post('/api/emergency/dispatch', async (req, res) => {
  const { latitude, longitude, event_type, severity, timestamp } = req.body;
  const incidentId = `LG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  console.log(`[EVENT] Incident ${incidentId} detected at ${latitude}, ${longitude}`);

  // GEOSPATIAL ASSIGNMENT
  const responders = identifyNearestResponders(latitude, longitude);
  const primaryHospital = responders.hospital;
  
  console.log(`[ASSIGNMENT] Assigned Responder: ${primaryHospital.name} (${primaryHospital.distance.toFixed(2)} km)`);

  if (!client) {
    console.log("[SIMULATION] No Twilio client. Simulation successful.");
    return res.json({ 
      status: 'success', 
      incidentId, 
      responders,
      broadcast_count: DISPATCH_TARGETS.length, 
      simulated: true 
    });
  }

  const accidentMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const hospitalMapsLink = primaryHospital.maps_link;

  const tasks = DISPATCH_TARGETS.flatMap(num => [
    // WhatsApp Alert
    client.messages.create({
      from: `whatsapp:${twilioWhatsAppNumber}`,
      to: `whatsapp:${num}`,
      body: `🚨 *LIFEGUARD SOS*\nID: ${incidentId}\nType: ${event_type}\nSite: ${accidentMapsLink}\n\n*ASSIGNED RESPONDER*\nHospital: ${primaryHospital.name}\nDist: ${primaryHospital.distance.toFixed(2)}km\nRoute: ${hospitalMapsLink}`
    }),
    // SMS Alert
    client.messages.create({
      from: twilioNumber,
      to: num,
      body: `LIFEGUARD SOS [${incidentId}]: ${event_type} at ${latitude.toFixed(4)},${longitude.toFixed(4)}. Assigned: ${primaryHospital.name}.`
    }),
    // Voice Dispatch
    client.calls.create({
      from: twilioNumber,
      to: num,
      twiml: `<Response><Say>Attention. Life Guard A.I. Emergency detected. Primary responder assigned: ${primaryHospital.name}. Distance is ${primaryHospital.distance.toFixed(1)} kilometers. Check your terminal.</Say></Response>`
    })
  ]);

  try {
    const results = await Promise.allSettled(tasks);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    res.json({ 
      status: 'success', 
      incidentId, 
      responders, 
      broadcast_count: successCount 
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n LifeGuard AI Production Core running at http://localhost:${PORT}\n`);
});
