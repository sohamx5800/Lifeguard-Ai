import { GoogleGenerativeAI } from "@google/generative-ai";

// Ensure we use the injected environment variable from Vite's define
const apiKey = (typeof process !== "undefined" ? process.env.GEMINI_API_KEY : "") || (import.meta as any).env?.VITE_GEMINI_API_KEY;
const ai = new GoogleGenerativeAI(apiKey || "");

export const generateHealthResponse = async (
  message: string,
  history: any[],
) => {
  try {
    if (!apiKey) {
      console.error("Gemini API Key is missing");
      return "I'm sorry, my AI core is not initialized. Please check the system configuration.";
    }

    const model = ai.getGenerativeModel(
      {
        model: "gemini-1.5-flash",
      }
    );

    // Ensure we have a valid history and map it correctly for the Gemini SDK
    const formattedHistory = (history || []).map((h) => {
        // h.parts can be a string, or an array of parts
        const parts = Array.isArray(h.parts) ? h.parts : [{ text: String(h.parts || "") }];
        return {
            role: h.role === "user" ? "user" : "model",
            parts: parts.map((p: any) => typeof p === 'string' ? { text: p } : p)
        };
    });

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      }
    });

    // We pass the personality as a prefix in the message itself to avoid configuration errors
    const systemInstruction = "System Instruction: You are a helpful healthcare assistant for the LifeGuard AI system. Your goals are: 1. Discuss symptoms with the user. 2. Provide a preliminary assessment. 3. Classify severity. 4. Recommend medical professional consultation if necessary. 5. Generate conceptual digital advice. Keep responses concise and supportive. Always include a disclaimer that you are an AI.\n\n";

    const result = await chat.sendMessage(systemInstruction + "User: " + message);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Health AI failed:", JSON.stringify(error, null, 2));
    if (error?.message?.includes("API_KEY_INVALID")) {
      return "I'm sorry, the AI service key is invalid. Please contact support.";
    }
    return "I'm sorry, I'm having trouble connecting to my medical database. Please seek professional help if this is an emergency.";
  }
};

export const generateEmergencySpeech = async (event: {
  type: string;
  location: string;
  severity: string;
}) => {
  try {
    if (!apiKey) return null;
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Emergency Alert. Accident type: ${event.type}. Location: ${event.location}. Severity: ${event.severity}.`;
    await model.generateContent(prompt);
    return "AUDIO_GENERATED_MOCK";
  } catch (error) {
    console.error("Speech generation failed:", error);
    return null;
  }
};