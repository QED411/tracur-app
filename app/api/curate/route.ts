import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 1. Define the "Permission Slip" (CORS Headers)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 2. Handle the "Preflight" Handshake (The Browser asking "Can I talk to you?")
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!text) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400, headers: corsHeaders } // Add headers to errors too
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set" },
        { status: 500, headers: corsHeaders }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Extract specific locations from the text below. 
      For each location, provide:
      - Name (official name)
      - Category (Eat, Stay, Do)
      - Coordinates (latitude, longitude)
      - A short, interesting summary note based *only* on the text provided.
      
      Return ONLY valid JSON in this format:
      {
        "locations": [
          {
            "name": "Trattoria Mario",
            "category": "Eat",
            "coordinates": { "lat": 43.77, "lng": 11.25 },
            "note": "Famous for its ribollita and communal tables."
          }
        ]
      }

      Text to analyze: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonText = response.text();

    // Clean up potential markdown formatting
    jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const data = JSON.parse(jsonText);

    // 3. Return the Success Response WITH the Permission Slip
    return NextResponse.json(data, { headers: corsHeaders });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to curate", details: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}