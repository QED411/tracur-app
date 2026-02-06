import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// --- 1. FIREBASE CONFIG ---
const firebaseConfig = {
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
    // --- 2. YOUR MANUAL CLEAN KEY ---
    // PASTE THE KEY FROM 'Tracur-Clean' HERE
    const apiKey = "AIzaSyC1-PokMlccCRqz9Ct0lFp35H_wLOv-xKI"; 

    // --- 3. TRACER BULLET ---
    await addDoc(collection(db, "debug_test"), { 
        status: "Final Attempt: Flash Latest", 
        timestamp: new Date().toISOString() 
    });

    const { text, url, title } = await req.json();

    // --- 4. THE FREE TIER MODEL ---
    // We are downgrading from 2.0 to 'gemini-flash-latest' to avoid the 429 billing block.
    // This model name WAS in your logs, so it definitely exists.
    const prompt = `
      Extract locations from this text. Return JSON ONLY.
      Format: { "locations": [ { "name": "Exact Name of Place", "category": "Restaurant/Hotel/Activity", "coordinates": { "lat": 0, "lng": 0 }, "note": "One sentence summary" } ] }
      Text: "${text.substring(0, 10000)}"
    `;

    // URL FOR FLASH LATEST
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;
    
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

    // --- 5. SMART PARSER ---
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return JSON");
    
    const data = JSON.parse(jsonMatch[0]);

    // --- 6. SAVE TO FIREBASE ---
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
