import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// --- 1. CONFIGURATION ---
const firebaseConfig = {
  // PASTE YOUR KEYS HERE:
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
    if (!apiKey) {
        return NextResponse.json({ error: "Missing API Key" }, { status: 500, headers: corsHeaders });
    }

    // --- 2. TRACER BULLET ---
    await addDoc(collection(db, "debug_test"), { 
        status: "Bare Metal (Gemini Pro)", 
        timestamp: new Date().toISOString() 
    });

    const { text, url, title } = await req.json();

    // --- 3. BARE METAL REQUEST (GEMINI PRO) ---
    // We switched this URL to 'gemini-pro' which is 100% available
    const prompt = `
      Extract locations from this text. Return JSON ONLY.
      Format: { "locations": [ { "name": "...", "category": "...", "coordinates": { "lat": 0, "lng": 0 }, "note": "..." } ] }
      Text: "${text.substring(0, 8000)}"
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API Error:", errText);
        throw new Error(`Gemini API Failed: ${response.status} ${response.statusText}`);
    }

    const geminiData = await response.json();
    const rawText = geminiData.candidates[0].content.parts[0].text;

    // --- 4. SMART JSON FINDER (The Crash Preventer) ---
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return JSON");
    
    const data = JSON.parse(jsonMatch[0]);

    // --- 5. SAVE ---
    const savedIds = [];
    if (data.locations && Array.isArray(data.locations)) {
      for (const loc of data.locations) {
        // Saving to 'pins' because we know that works
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
