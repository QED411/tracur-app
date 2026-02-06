import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

interface LocationResult {
  name: string;
  category: string;
  coordinates: { lat: number; lng: number };
  googlePlaceId?: string | null;
  note: string;
}
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

// --- 2. MAIN POST HANDLER ---
export async function POST(req: Request) {
  try {
    const { text, url, title, userProfile } = await req.json();
    const apiKey = "AIzaSyC6GaDvkqnNbF34edtTeHZ7aA4I0D71P24"; // Your Gemini Key

    const prompt = `
      Extract the SINGLE most specific location from the text.
      Identify the 'googlePlaceId' if possible. 
      Use the original text as the 'note' (Special Reasons).
      
      Since the user is a Lacto-Ovo Vegetarian, if it's a restaurant, highlight vegetarian highlights.

      Format JSON: { "locations": [{ "name": "Name", "googlePlaceId": "ID", "category": "beach|restaurant|hotel|landmark", "coordinates": { "lat": 0, "lng": 0 }, "note": "Full excerpt" }] }
      Text: "${text}"
    `;

    // 2026 Stable Model
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
const rawText = data.candidates[0].content.parts[0].text;
const jsonMatch = rawText.match(/\{[\s\S]*\}/);

if (!jsonMatch) throw new Error("AI did not return valid JSON");

const aiResult = JSON.parse(jsonMatch[0]);

// TELL TYPESCRIPT WHAT THIS IS:
const location = aiResult.locations[0] as LocationResult;

const aiResult = JSON.parse(jsonMatch[0]);
    
// Now TypeScript will recognize .category and .googlePlaceId
await addDoc(collection(db, "pins"), {
  ...location,
  sourceUrl: url || null, 
  sourceTitle: title || "New Discovery",
  status: "draft", 
  createdAt: new Date(),
  category: location.category || "landmark",
  googlePlaceId: location.googlePlaceId || null 
});
 // --- 3. SAVE AS DRAFT (With Safety Fallbacks) ---
const docRef = await addDoc(collection(db, "pins"), {
  ...location,
  // Using "|| null" ensures Firebase never sees "undefined"
  sourceUrl: url || "Unknown Source", 
  sourceTitle: title || "New Discovery",
  status: "draft", 
  createdAt: new Date(),
  // Add these for extra safety if Gemini misses a field
  category: location.category || "landmark",
  googlePlaceId: location.googlePlaceId || null 
});

    return NextResponse.json({ success: true, id: docRef.id });

  } catch (error) {
    console.error("Critical Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}


