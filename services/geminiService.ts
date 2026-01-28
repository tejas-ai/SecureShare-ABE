import { GoogleGenAI } from "@google/genai";
import { PAPER_CONTEXT } from "../constants";

let client: GoogleGenAI | null = null;

const getClient = () => {
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

export const analyzeSecurityContext = async (query: string): Promise<string> => {
  const ai = getClient();
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          role: 'user',
          parts: [
            { text: `System Context: You are a security expert explaining a file sharing system based on Attribute-Based Encryption (ABE) and pyAesCrypt as described in this research abstract: "${PAPER_CONTEXT}".` },
            { text: `User Query: ${query}` },
            { text: "Provide a concise, technical, yet accessible answer. Focus on how ABE, pyAesCrypt, and Secret Keys work in this context." }
          ]
        }
      ]
    });
    return response.text || "Analysis unavailable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to connect to the security analysis AI. Please check your API key.";
  }
};
