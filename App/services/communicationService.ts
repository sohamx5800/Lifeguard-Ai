/**
 * Emergency Communication Service
 * Responsible for bridging the frontend SOS trigger to the Twilio Dispatch Backend.
 */

 interface EmergencyPayload {
  event_type: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  severity: string;
  source: string;
}

export const triggerAutomatedEmergencyCommunications = async (payload: EmergencyPayload) => {
  console.log("--- INITIATING DISPATCH UPLINK ---");

  const relativePath = '/api/emergency/dispatch';
  const absolutePath = 'http://localhost:3000/api/emergency/dispatch';

  const dispatch = async (url: string) => {
    console.log(`Uplink Attempt: ${url}`);
    
    // Create a controller to timeout the fetch if the server is down
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 second timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  };

  try {
    // Try relative path (standard for proxied deployments)
    return await dispatch(relativePath);
  } catch (relErr) {
    console.warn("Relative uplink failed, trying absolute fallback...");
    try {
      // Try local absolute path (common for dev environments)
      return await dispatch(absolutePath);
    } catch (absErr) {
      console.error("Critical: All dispatch routes unreachable.", absErr);
      throw new Error("Uplink Failure");
    }
  }
};