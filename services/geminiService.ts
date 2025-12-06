import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, RiskAnalysisResult, AuthorityDetails } from '../types';

const getVisionPrompt = (location: string) => `
You are an expert infrastructure safety auditor and spatial reasoning assistant. Your task is to analyze the provided image of a road.

**1. Infrastructure Defects (Primary Task):**
Detect *only one* of the following defects:
- Potholes / Cracks in pavement
- Broken or malfunctioning streetlights
- Waterlogging / Drainage issues
- Traffic sign obstruction

If a hazard is detected, assign a severity score ('Low', 'Medium', 'High').
**IMPORTANT**: If the image contains a drawn CYAN/GREEN rectangular box, focus your analysis PRIMARILY on that area.

**2. Geographic Clues (Secondary Task):**
The user has provided the location: "${location || 'Unknown/Not Provided'}".
Analyze the image for visual geographic clues to verify or identify the location. Look for:
- Visible street signs or shop names (transcribe text if visible).
- Distinctive landmarks (parks, statues, famous buildings).
- Language on signs (to infer region/state).
- Architectural style.

You MUST respond with a clean JSON object based on the provided schema.
`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    hazard_detected: { 
      type: Type.STRING,
      description: "Name of the detected hazard, e.g., 'Potholes / Cracks in pavement' or 'None'"
    },
    description: { 
      type: Type.STRING,
      description: "Detailed text description of the location and nature of the defect" 
    },
    severity_score: { 
      type: Type.STRING, 
      enum: ["Low", "Medium", "High", "N/A"],
      description: "Low, Medium, or High. Use 'N/A' if no hazard is detected"
    },
    location: {
      type: Type.STRING,
      description: "The location string provided by the user (echoed back)."
    },
    inferred_location: {
      type: Type.OBJECT,
      description: "AI's guess of the location based on visual cues",
      properties: {
        city_or_landmark: {
          type: Type.STRING,
          description: "If a city or major landmark is visible, list it here. E.g., 'Near Gandhi Park, Chennai'. If none, say 'N/A'."
        },
        street_name_or_clue: {
          type: Type.STRING,
          description: "If a street name or specific address number is visible, transcribe it here. If none, say 'N/A'."
        },
        confidence_level: {
          type: Type.STRING,
          enum: ["Low", "Medium", "High"],
          description: "Confidence in the inferred location."
        }
      },
      required: ["city_or_landmark", "street_name_or_clue", "confidence_level"]
    }
  },
  required: ["hazard_detected", "description", "severity_score", "location"]
};

// Module 2 Prompt Logic - Integrated Data Analytics Lead Guide
const getRiskAnalysisPrompt = (location: string) => `
You are an expert data analyst (Data Lead) acting as the "Brain" of the RoadGuard system. 
Your task is to analyze historical road accident data for the location: "${location}".

Using your internal knowledge base (simulating the MoRTH 'Road Accidents in India' Annual Reports and local municipal data), derive the following insights:

1. **Risk Breakdown**: Categorize accident severity into CRITICAL, HIGH, MEDIUM, LOW. Sum must be 100%.
2. **Hotspots**: Identify top 3 specific nearby locations/intersections known for high accident frequency.
3. **Most Common Cause**: The single most frequent cause of accidents in this area (e.g., "Speeding", "Poor Road Surface", "Low Visibility").
4. **Time-of-Day Analysis**: Estimate the percentage split of accidents occurring during Day vs Night.
5. **Analytics Summary**: A concise, data-driven paragraph summarizing these findings for a formal complaint letter.

You MUST respond ONLY with a clean JSON object based on the provided schema.
`;

const riskSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    location: { type: Type.STRING },
    risk_breakdown: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          risk_level: { type: Type.STRING, enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
          percentage: { type: Type.NUMBER }
        }
      }
    },
    top_hotspots: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of top 3 high-risk locations nearby"
    },
    most_common_cause: {
      type: Type.STRING,
      description: "The single most frequent cause of accidents"
    },
    time_analysis: {
      type: Type.OBJECT,
      properties: {
        day_percentage: { type: Type.NUMBER },
        night_percentage: { type: Type.NUMBER }
      }
    },
    analytics_summary: {
      type: Type.STRING,
      description: "A concise summary paragraph of the risk data for reporting purposes."
    }
  },
  required: ["location", "risk_breakdown", "top_hotspots", "most_common_cause", "time_analysis", "analytics_summary"]
};

// Backend Simulation Prompt - Authority Finder
const getAuthorityPrompt = (location: string) => `
You are a government administrative backend system. Your task is to identify the CORRECT jurisdiction authority responsible for road infrastructure maintenance at this specific location: "${location}".

Rules:
1. If the location is within a city, identify the Municipal Corporation (e.g., "BBMP", "GHMC", "BMC") or the local Ward Office.
2. If it is on a Highway, identify the NHAI Project Unit or relevant PWD division.
3. If it is a traffic/accident hazard, identify the nearest Traffic Police Station.
4. Provide a plausible official email address (e.g., commissioner@ghmc.gov.in) and office address.

You MUST respond with a JSON object.
`;

const authoritySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Official name of the authority, e.g., 'Vijayawada Municipal Corporation - Zone II' or 'Suryaraopeta Police Station'" },
    type: { type: Type.STRING, enum: ['Police Station', 'Municipal Corporation', 'Public Works Department', 'Traffic Police'] },
    email: { type: Type.STRING, description: "Official contact email. If unknown, generate a plausible placeholder ending in .gov.in or .org" },
    address: { type: Type.STRING, description: "Full address of the office including pincode" },
    phone: { type: Type.STRING, description: "Landline contact number" },
    distance_km: { type: Type.STRING, description: "Estimated distance from the hazard location (e.g., '2.5 km')" }
  },
  required: ["name", "type", "email", "address", "phone", "distance_km"]
};


export const analyzeRoadImage = async (base64Image: string, mimeType: string, location: string): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: getVisionPrompt(location) },
          { inlineData: { mimeType: mimeType, data: base64Image } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text received from Gemini");

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini API Error (Vision):", error);
    throw error;
  }
};

export const analyzeRiskProfile = async (location: string): Promise<RiskAnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ text: getRiskAnalysisPrompt(location) }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: riskSchema,
        temperature: 0.4, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No risk analysis received");

    return JSON.parse(text) as RiskAnalysisResult;
  } catch (error) {
    console.error("Gemini API Error (Risk):", error);
    // Fallback if API fails
    return {
      location: location,
      risk_breakdown: [
        { risk_level: "CRITICAL", percentage: 15 },
        { risk_level: "HIGH", percentage: 25 },
        { risk_level: "MEDIUM", percentage: 30 },
        { risk_level: "LOW", percentage: 30 }
      ],
      top_hotspots: ["Main Junction", "Market Road Entry", "Highway Exit 4"],
      most_common_cause: "Data Unavailable",
      time_analysis: { day_percentage: 50, night_percentage: 50 },
      analytics_summary: "Data connection failed. Showing estimated fallback statistics."
    };
  }
};

export const findRelevantAuthority = async (location: string): Promise<AuthorityDetails> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ text: getAuthorityPrompt(location) }]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: authoritySchema,
        temperature: 0.1, 
      }
    });

    const text = response.text;
    if (!text) throw new Error("No authority data received");

    return JSON.parse(text) as AuthorityDetails;
  } catch (error) {
    console.error("Gemini API Error (Authority):", error);
    return {
      name: "Local Municipal Authority",
      type: "Municipal Corporation",
      email: "complaints@municipal.gov.in",
      address: "City Administrative Building, Civic Center",
      phone: "1800-11-2233",
      distance_km: "Unknown"
    };
  }
};

export const generateComplaintLetter = async (hazardData: AnalysisResult, analyticsSummary: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
You are an AI reporting tool (Vision & Reporting Lead). Your task is to draft a formal, urgent, and respectful complaint letter on behalf of a concerned citizen to the Municipal Commissioner.

Use the following information:
1. Visual Hazard Details: ${JSON.stringify(hazardData)}
2. Location of Incident: ${hazardData.location}
   ${hazardData.inferred_location ? `(AI Visual Location Check: ${hazardData.inferred_location.city_or_landmark}, ${hazardData.inferred_location.street_name_or_clue})` : ''}
3. Data & Analytics Context (Module 2 Output): ${analyticsSummary}
4. Target Recipient: The Municipal Commissioner.

Letter Requirements:
- Subject Line: Must be Clear and Urgent (e.g., "URGENT REPAIR REQUIRED: [Hazard Type] at [Location]").
- Body:
    - **Introduction**: Briefly state the immediate infrastructure issue observed at the specified location.
    - **Data Context**: Use the provided Analytics Context to explain WHY this is a high-priority risk (mention hotspots, causes, or severity trends).
    - **Call to Action**: Request immediate scheduling of repair work.
- Output: The full text of the letter, starting with the Subject Line. Do not include any salutations (Dear Commissioner) or sign-offs (Sincerely) to make it cleaner for a digital email format.

Draft the letter now.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Failed to generate letter.";
  } catch (error) {
    console.error("Gemini API Error (Letter):", error);
    throw error;
  }
};