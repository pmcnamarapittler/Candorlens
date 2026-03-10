import { GoogleGenAI, Type } from "@google/genai";
import { Finding } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const scannerService = {
  scanUrl: async (url: string): Promise<Finding[]> => {
    try {
      const prompt = `
        Analyze the following URL for dark patterns and compliance violations related to subscription flows, specifically focusing on FTC (Federal Trade Commission) and ROSCA (Restore Online Shoppers' Confidence Act) regulations.
        
        URL: ${url}
        
        Look for:
        1. Forced Continuity: Automatically renewing subscriptions without clear consent or easy cancellation.
        2. False Urgency: Fake countdown timers or scarcity claims.
        3. Hidden Disclosures: Material terms buried in fine print or behind multiple clicks.
        4. Roach Motels: Easy to sign up, hard to cancel.
        5. Deceptive Pricing: Hidden fees or misleading trial terms.
        
        Return a list of findings in JSON format.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ urlContext: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                code: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
                regulation: { type: Type.STRING },
                page: { type: Type.STRING },
                flow: { type: Type.STRING },
                element: { type: Type.STRING },
                status: { type: Type.STRING, enum: ["Open"] },
                confidence: { type: Type.NUMBER },
                whySeverity: { type: Type.STRING },
                explanation: { type: Type.STRING },
                extractedText: { type: Type.STRING },
                regulationSection: { type: Type.STRING },
                legalExcerpt: { type: Type.STRING },
                violationReason: { type: Type.STRING },
              },
              required: ["id", "code", "title", "description", "severity", "regulation", "page", "flow", "element", "status", "confidence"],
            },
          },
        },
      });

      const text = response.text;
      if (!text) return [];
      
      const findings = JSON.parse(text) as Finding[];
      return findings.map(f => ({
        ...f,
        id: `scan-${Date.now()}-${f.id}`, // Ensure unique IDs
        status: 'Open',
        capturedAt: new Date().toISOString(),
      }));
    } catch (error) {
      console.error("Error scanning URL:", error);
      throw error;
    }
  }
};
