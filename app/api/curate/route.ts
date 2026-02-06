import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "../../lib/firebase"; // Import your DB connection
import { collection, addDoc } from "firebase/firestore";

// 1. Define CORS Headers (The Permission Slip)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { text, url, title } = await req.json(); // We can also grab URL/Title now!
    const apiKey = process.env.GEMINI_API_KEY;

    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400, headers: corsHeaders });
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is not set" }, { status: 500, headers: corsHeaders });

    // 2. ASK GEMINI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Extract specific locations from the text below. 
      For each location, provide:
      - Name (official name)
      - Category (Eat, Stay, Beach, Culture, Adventure, Do)
      - Coordinates (latitude, longitude)
      - A short, interesting summary note.
      
      Return ONLY valid JSON:
      {
        "locations": [
          { "name": "Place Name", "category": "Eat", "coordinates": { "lat": 0, "lng": 0 }, "note": "Summary" }
        ]
      }
      Text: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonText);

    // 3. SAVE TO FIREBASE (The Missing Step!)
    // We loop through the locations and save them one by one
    const savedIds = [];
    if (data.locations && Array.isArray(data.locations)) {
      for (const loc of data.locations) {
        // Add extra metadata (Source URL, etc.)
        const docRef = await addDoc(collection(db, "pins"), {
          ...loc,
          createdAt: new Date(),
          source: title || "Chrome Extension", // Use the page title as source
          sourceUrl: url || "",
          importBatch: "Extension Capture"
        });
        savedIds.push(docRef.id);
      }
    }

    // 4. Return Success
    return NextResponse.json({ success: true, savedIds, data }, { headers: corsHeaders });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Failed to curate", details: String(error) },
      { status: 500, headers: corsHeaders }
    );
  }
}