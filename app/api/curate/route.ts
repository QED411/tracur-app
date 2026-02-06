import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// --- 1. YOUR CONFIG (Fully Integrated) ---
const firebaseConfig = {
  apiKey: "AIzaSyAx-xjJTlIDLuIlu9PY9ftZs3eohBgvSdQ",
  authDomain: "tracur-d07a8.firebaseapp.com",
  projectId: "tracur-d07a8",
  storageBucket: "tracur-d07a8.firebasestorage.app",
  messagingSenderId: "305976589302",
  appId: "1:305976589302:web:21244d4924608f428f25d7",
  measurementId: "G-WNLS7YM356"
};

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    // --- 2. VERIFY API KEY ---
    // This fixes the build error by ensuring apiKey is not undefined
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing.");
      return NextResponse.json({ error: "Missing API Key" }, { status: 500, headers: corsHeaders });
    }

    // --- 3. TEST DATABASE (TRACER BULLET) ---
    try {
      await addDoc(collection(db, "debug_test"), {
        status: "Online",
        timestamp: new Date().toISOString()
      });
      console.log("Database connection successful.");
    } catch (dbError) {
      console.error("Database Connection Failed:", dbError);
      return NextResponse.json({ error: "Database Error", details: String(dbError) }, { status: 500, headers: corsHeaders });
    }

    // --- 4. GEMINI AI (1.5 Flash) ---
    const { text, url, title } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // We take a substring to ensure we don't hit token limits unexpectedly
    const cleanText = text ? text.substring(0, 10000) : "";

    const prompt = `
      You are a travel assistant. Extract specific locations from the text below.
      Return ONLY valid JSON in this exact format:
      {
        "locations": [
          { 
            "name": "Exact Name of Place",
            "category": "Restaurant/Hotel/Activity", 
            "coordinates": { "lat": 0.0, "lng": 0.0 }, 
            "note": "One sentence summary" 
          }
        ]
      }
      Text to analyze: "${cleanText}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (parseError) {
      return NextResponse.json({ error: "AI Format Error", raw: jsonText }, { status: 500, headers: corsHeaders });
    }

    // --- 5. SAVE TO FIREBASE ---
    const savedIds = [];
    if (data.locations && Array.isArray(data.locations)) {
      for (const loc of data.locations) {
        const docRef = await addDoc(collection(db, "pins"), {
          ...loc,
          sourceTitle: title || "Extension",
          sourceUrl: url || "",
          createdAt: new Date()
        });
        savedIds.push(docRef.id);
      }
    }

    return NextResponse.json({ success: true, count: savedIds.length, savedIds }, { headers: corsHeaders });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: "Server Error", details: String(error) }, { status: 500, headers: corsHeaders });
  }
}
