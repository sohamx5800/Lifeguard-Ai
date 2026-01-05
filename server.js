
/**
 * LIFEGUARD AI - RESILIENT EMERGENCY DISPATCH BACKEND
 */

 require('dotenv').config();
 const express = require('express');
 const bodyParser = require('body-parser');
 const twilio = require('twilio');
 const cors = require('cors');
 
 const app = express();
 const PORT = process.env.PORT || 3005;
 
 app.use(cors());
 app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({ extended: false }));
 
 const accountSid = process.env.TWILIO_ACCOUNT_SID;
 const authToken = process.env.TWILIO_AUTH_TOKEN;
 const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
 const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
 
 if (!accountSid || !authToken || !twilioNumber || !twilioWhatsAppNumber) {
   console.error("FATAL ERROR: Twilio environment variables are missing.");
   process.exit(1);
 }
 
 const client = twilio(accountSid, authToken);
 
 const EMERGENCY_RECIPIENTS = [
   { name: 'Ambulance Service', number: '+917478753070' },
   { name: 'Police Department', number: '+919382539043' },
   { name: 'General Hospital', number: '+917908743890' }
 ];
 
 app.post('/api/emergency/dispatch', async (req, res) => {
   const { latitude, longitude, timestamp, event_type, severity, id } = req.body;
 
   if (!latitude || !longitude) {
     return res.status(400).json({ status: 'error', message: 'Location data missing.' });
   }
 
   const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
   const incidentId = id || `LG-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
 
   console.log(`\n[DISPATCH] Incident Detected: ${latitude}, ${longitude} [ID: ${incidentId}]`);
 
   const report = { whatsapp: [], sms: [], voiceCall: [] };
 
   const dispatchActions = EMERGENCY_RECIPIENTS.flatMap(contact => {
     const target = contact.number;
 
     const whatsapp = client.messages.create({
       from: `whatsapp:${twilioWhatsAppNumber}`,
       to: `whatsapp:${target}`,
       body: `🚨 *LIFEGUARD EMERGENCY* 🚨\n\n*ID:* ${incidentId}\n*Type:* ${event_type || 'Accident'}\n*Severity:* ${severity || 'CRITICAL'}\n*Lat:* ${latitude}\n*Lng:* ${longitude}\n\n📍 *LIVE TRACKING:* ${mapsLink}`
     }).then(m => ({ channel: 'whatsapp', target, status: m.status, sid: m.sid }))
       .catch(e => ({ channel: 'whatsapp', target, status: 'failed', error: e.message }));
 
     const sms = client.messages.create({
       from: twilioNumber,
       to: target,
       body: `LIFEGUARD SOS [${incidentId}]: ${severity || 'CRITICAL'} ${event_type || 'Accident'} at ${latitude}, ${longitude}. TRACK: ${mapsLink}`
     }).then(m => ({ channel: 'sms', target, status: m.status, sid: m.sid }))
       .catch(e => ({ channel: 'sms', target, status: 'failed', error: e.message }));
 
     const voice = client.calls.create({
       from: twilioNumber,
       to: target,
       twiml: `<Response><Say voice="alice">Emergency Alert. Incident ID ${incidentId.split('').join(' ')}. ${event_type || 'Accident'} detected at latitude ${latitude.toFixed(3)} and longitude ${longitude.toFixed(3)}. Dispatching help immediately.</Say></Response>`
     }).then(m => ({ channel: 'voice', target, status: m.status, sid: m.sid }))
       .catch(e => ({ channel: 'voice', target, status: 'failed', error: e.message }));
 
     return [whatsapp, sms, voice];
   });
 
   try {
     const settleResults = await Promise.allSettled(dispatchActions);
     
     settleResults.forEach(res => {
       const data = res.status === 'fulfilled' ? res.value : { status: 'failed', error: res.reason?.message || 'Internal logic error' };
       console.log(`[DISPATCH RESULT] Channel: ${data.channel}, Target: ${data.target}, Status: ${data.status}, Error: ${data.error || 'None'}`);
       if (data.channel === 'whatsapp') report.whatsapp.push(data);
       if (data.channel === 'sms') report.sms.push(data);
       if (data.channel === 'voice') report.voiceCall.push(data);
     });
 
     const successCount = settleResults.filter(r => r.status === 'fulfilled' && r.value.status !== 'failed').length;
 
     res.json({
       status: successCount > 0 ? (successCount === dispatchActions.length ? 'success' : 'partial_failure') : 'failed',
       message: `${successCount} of ${dispatchActions.length} notifications successfully initiated.`,
       initial_delivery_report: report
     });
   } catch (err) {
     console.error("[CRITICAL]", err);
     res.status(500).json({ status: 'error', message: err.message });
   }
 });
 
 app.listen(PORT, () => console.log(`\n==========================================\nLIFEGUARD DISPATCH NODE: ${PORT}\n==========================================\n`));
 