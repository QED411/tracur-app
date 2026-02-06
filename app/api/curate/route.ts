import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// --- 1. HARDCODED CONFIG (The Fix) ---
const firebaseConfig = {
  apiKey: "AIzaSyAx-xjJTlIDLuIlu9PY9ftZs3eohBgvSdQ",
  authDomain: "tracur-d07a8.firebaseapp.com",
  projectId: "tracur-d07a8",
  storageBucket: "tracur-d07a8.firebasestorage.app",
  messagingSenderId: "305976589302",
  appId: "1:305976589302:web:21244d4924608f428f25d7",
  measurementId: "G-WNLS7YM356"
};

// Initialize DB right here to be safe
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
    // --- 2. TRACER BULLET (Test Write) ---
    try {
      await addDoc(collection(db, "debug_test"), {
        msg: "Connection successful!",
        time: new Date().toISOString()
      });
      console.log("Tracer bullet fired: wrote to 'debug_test'");
    } catch (dbError) {
      console.error("DATABASE FAIL:", dbError);
      return NextResponse.json({ error: "DB Connection Failed", details: String(dbError) }, { status: 500, headers: corsHeaders });
    }

    // --- 3. GEMINI AI ---
    const { text, url, title } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using the working model

    const prompt = `
      Extract locations from the text. Return strictly valid JSON.
      Format: { "locations": [ { "name": "Place Name", "category": "Eat", "coordinates": { "lat": 0, "lng": 0 }, "note": "Summary" } ] }
      Text: "${text}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(jsonText);

    // --- 4. SAVE REAL DATA ---
    const savedIds = [];
    if (data.locations) {
      for (const loc of data.locations) {
        // Saving to "pins" collection
        const docRef = await addDoc(collection(db, "pins"), {
          ...loc,
          source: title || "Extension",
          sourceUrl: url || "",
          createdAt: new Date()
        });
        savedIds.push(docRef.id);
      }
    }

    return NextResponse.json({ success: true, savedIds, data }, { headers: corsHeaders });

  } catch (error) {
    return NextResponse.json({ error: "Server Error", details: String(error) }, { status: 500, headers: corsHeaders });
  }
}

