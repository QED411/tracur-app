import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// --- 1. CONFIGURATION ---
const firebaseConfig = {
  // PASTE YOUR REAL KEYS HERE:
  apiKey: "AIzaSyAx-xjJTlIDLuIlu9PY9ftZs3eohBgvSdQ",
  authDomain: "tracur-d07a8.firebaseapp.com",
  projectId: "tracur-d07a8",
  storageBucket: "tracur-d07a8.firebasestorage.app",
  messagingSenderId: "305976589302",
  appId: "1:305976589302:web:21244d4924608f428f25d7",
  measurementId: "G-WNLS7YM356"
};

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

    // --- 2. TRACER BULLET (Keep this!) ---
    await addDoc(collection(db, "debug_test"), { 
        status: "Online", 
        timestamp: new Date().toISOString() 
    });

    // --- 3. GEMINI PRO (The Reliable One) ---
    const { text, url, title } = await req.json();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Extract locations from the text. Return JSON ONLY.
      Format: { "locations": [ { "name": "...", "category": "...", "coordinates": { "lat": 0, "lng": 0 }, "note": "..." } ] }
      Text: "${text.substring(0, 10000)}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();

    // --- 4. THE SMART PARSER (The Fix) ---
    // This finds the JSON object {...} even if the AI adds text before/after
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
        console.error("AI Response was not JSON:", rawText);
        return NextResponse.json({ error: "AI Format Error" }, { status: 500, headers: corsHeaders });
    }

    const data = JSON.parse(jsonMatch[0]);

    // --- 5. SAVE ---
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

    return NextResponse.json({ success: true, savedIds }, { headers: corsHeaders });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500, headers: corsHeaders });
  }
}
