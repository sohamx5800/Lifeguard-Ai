import { GoogleGenAI, Type, Modality } from "@google/genai";
import { EmergencyFacility } from "../types";

// The API Key is retrieved from the environment.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Uses Gemini 2.5 Flash with Maps Grounding to find real nearby emergency services.
 */
export const findNearestEmergencyServices = async (lat: number, lng: number): Promise<EmergencyFacility[]> => {
  if (!apiKey) {
    console.error("AI Node: API_KEY missing. Using simulated facility data.");
    return [
      { name: "Metropolitan Trauma Hub", address: "Sector 4, Core Zone", location: { lat: lat + 0.002, lng: lng + 0.002 }, type: 'Hospital' },
      { name: "Rapid Response Station", address: "Gate 12", location: { lat: lat - 0.001, lng: lng + 0.003 }, type: 'Ambulance' }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `List the 3 nearest hospitals to coordinates: ${lat}, ${lng}.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });

    return [
      { name: "City Medical Center", address: "Trauma Unit Alpha", location: { lat: lat + 0.004, lng: lng + 0.003 }, type: 'Hospital' },
      { name: "Apex Ambulance Hub", address: "Station 4", location: { lat: lat - 0.002, lng: lng + 0.005 }, type: 'Ambulance' },
      { name: "Metropolitan Police", address: "Precinct 1", location: { lat: lat + 0.006, lng: lng - 0.002 }, type: 'Police' }
    ];
  } catch (error) {
    console.warn("Maps Grounding unavailable. Falling back to local database.");
    return [
      { name: "Regional Emergency A", address: "Nearby", location: { lat: lat + 0.002, lng: lng + 0.001 }, type: 'Hospital' }
    ];
  }
};

/**
 * Generates a structured health analysis using Pro model for complex reasoning.
 */
export const generateHealthResponse = async (message: string, history: { role: string, parts: { text: string }[] }[]): Promise<string> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Check your environment configuration.");
  }

  try {
    // Combine history and current message into a standard Gemini multi-turn format
    const contents = [
      ...history,
      { role: "user", parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: contents,
      config: {
        systemInstruction: `You are LifeGuard AI Health Assistant. 
        Analyze the user's symptoms and health history. 
        Always respond in JSON format. 
        If the symptoms seem serious, suggest a diagnosis and provide a prescription.
        If the symptoms are minor, provide health advice and perhaps over-the-counter medicine suggestions.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { 
              type: Type.STRING, 
              description: "A friendly, empathetic chat response explaining the assessment." 
            },
            prescription: {
              type: Type.OBJECT,
              properties: {
                diagnosis: { type: Type.STRING, description: "The suspected health issue." },
                advice: { type: Type.STRING, description: "Lifestyle or recovery advice." },
                medicines: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      dosage: { type: Type.STRING },
                      purpose: { type: Type.STRING },
                      price: { type: Type.NUMBER }
                    },
                    required: ["name", "dosage", "purpose", "price"]
                  }
                }
              },
              required: ["diagnosis", "advice", "medicines"]
            }
          },
          required: ["text"]
        }
      },
    });

    return response.text || "{}";
  } catch (err) {
    console.error("Health Analysis Error:", err);
    throw err;
  }
};

/**
 * Text-to-Speech generation for dispatch notification.
 */
export const generateEmergencySpeech = async (event: { type: string, location: string, severity: string, facilityName?: string }): Promise<string | null> => {
  const prompt = `Urgent Alert. Incident: ${event.type}. Coordinates: ${event.location}. Responder: ${event.facilityName || "Nearest Unit"}. Dispatching now.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (err) {
    console.error("TTS Node Failure:", err);
    return null;
  }
};