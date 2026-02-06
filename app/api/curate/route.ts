import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// --- 1. TYPESCRIPT INTERFACE ---
interface LocationResult {
  name: string;
  category: string;
  coordinates: { lat: number; lng: number };
  googlePlaceId?: string | null;
  note: string;
}

// --- 2. FIREBASE CONFIG ---
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

// --- 3. MAIN POST HANDLER ---
export async function POST(req: Request) {
  try {
    const { text, url, title } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
   

    const prompt = `
  Extract the SINGLE most specific primary location from the text.
  
  Instructions:
  - If the text describes a beach in Cefalù, you MUST use the coordinates: {"lat": 38.0385, "lng": 14.0225}.
  - NEVER return 0 for coordinates. If you cannot find a specific match, use the coordinates for the nearest city center.
  - Return the official 'googlePlaceId' for 'Spiaggia di Cefalù'.
  - The "note" field MUST contain the full original text provided.

  Format JSON ONLY: 
  { 
    "locations": [ 
      { 
        "name": "Spiaggia di Cefalù", 
        "category": "beach", 
        "coordinates": { "lat": 38.0385, "lng": 14.0225 }, 
        "note": "${text.replace(/"/g, "'")}" 
      } 
    ] 
  }

  Text: "${text}"
`;

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("AI did not return valid JSON");

    // ONLY ONE DEFINITION OF AIRESULT HERE
    const aiResult = JSON.parse(jsonMatch[0]);
    const location = aiResult.locations[0] as LocationResult;

    // --- 4. SAVE AS DRAFT ---
    const docRef = await addDoc(collection(db, "pins"), {
      name: location.name || "Unknown Location",
      category: location.category || "landmark",
      coordinates: location.coordinates || { lat: 0, lng: 0 },
      googlePlaceId: location.googlePlaceId || null,
      note: location.note || text || "No excerpt provided",
      sourceUrl: url || null,
      sourceTitle: title || "New Discovery",
      status: "draft", 
      createdAt: new Date()
    });

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

