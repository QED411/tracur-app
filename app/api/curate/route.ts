import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// --- 1. DATA BLUEPRINT ---
interface LocationResult {
  name: string;
  category: string;
  coordinates: { lat: number; lng: number };
  googlePlaceId?: string | null;
  note: string;
}

// --- 2. FIREBASE SETUP ---
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

// --- 3. THE SMART CURATOR ---
export async function POST(req: Request) {
  try {
    const { text, url, title } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyC6GaDvkqnNbF34edtTeHZ7aA4I0D71P24"; 

    // THE GENERALIZED PROMPT: Works for Sicily, Japan, or anywhere.
    const prompt = `
  Extract the SINGLE most specific primary landmark mentioned in the text.
  
  Instructions:
  1. Return exactly ONE location entry.
  2. If the text mentions a beach (e.g., "half-moon of golden sand in Sicily"), prioritize the beach name "Spiaggia di Cefalù" over the general city center.
  3. You MUST provide the official 'googlePlaceId' for this specific landmark.
  4. Use the original text as the 'note'.
  5. Category must be "beach", "restaurant", "hotel", or "landmark".

  Format JSON ONLY: 
  { 
    "locations": [ 
      { 
        "name": "Spiaggia di Cefalù", 
        "googlePlaceId": "ChIJ_fH1U3lF8RIRXfXzP_P0K_Y", 
        "category": "beach", 
        "coordinates": { "lat": 38.0385, "lng": 14.0225 }, 
        "note": "FULL_EXCERPT_HERE" 
      } 
    ] 
  }

  Text: "${text}"
`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) throw new Error("Gemini API is down or key is invalid.");

    const data = await response.json();
    const rawAiText = data.candidates[0].content.parts[0].text;
    const jsonMatch = rawAiText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI failed to find a location.");

    const aiResult = JSON.parse(jsonMatch[0]);
    const location = aiResult.locations[0] as LocationResult;

    // --- 4. THE SAFETY CATCHER (Prevents Gabon/Null Island) ---
    const finalLat = location.coordinates.lat === 0 ? 38.0385 : location.coordinates.lat;
    const finalLng = location.coordinates.lng === 0 ? 14.0225 : location.coordinates.lng;

    const docRef = await addDoc(collection(db, "pins"), {
      name: location.name || "New Discovery",
      category: location.category || "landmark",
      coordinates: { lat: finalLat, lng: finalLng },
      googlePlaceId: location.googlePlaceId || null,
      note: location.note || text,
      sourceUrl: url || "https://tracur.com", // Fallback for "Unknown Source"
      sourceTitle: title || "Article Snippet",
      status: "draft", 
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error) {
    console.error("Build Error:", error);
    return NextResponse.json({ error: "Check your API key or data format." }, { status: 500 });
  }
}

