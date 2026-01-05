
/**
 * Emergency Communication Service
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
    console.log("--- INITIATING REMOTE CLOUD DISPATCH ---");
  
    // Use the proxied path
    const apiUrl = '/api/emergency/dispatch';
  
    try {
      console.log(`Attempting dispatch to: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Cloud Dispatch System Failure:", error);
      throw error;
    }
  };
  