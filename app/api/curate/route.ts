import { NextResponse } from "next/server";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

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

export async function POST(req: Request) {
  try {
    const apiKey = "AIzaSyC6GaDvkqnNbF34edtTeHZ7aA4I0D71P24"; 
    const { text, url, title } = await req.json();

    const prompt = `
      Extract locations from this text. Return JSON ONLY.
      Format: { "locations": [ { "name": "Place Name", "category": "Type", "coordinates": { "lat": 0, "lng": 0 }, "note": "Summary" } ] }
      Text: "${text.substring(0, 10000)}"
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API Error Detail:", errText); // This will show in Vercel logs
        throw new Error(`Status: ${response.status} - ${errText}`);
    }

    const geminiData = await response.json();
    const rawText = geminiData.candidates[0].content.parts[0].text;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI failed to provide valid JSON.");
    const data = JSON.parse(jsonMatch[0]);

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

    return NextResponse.json({ success: true, savedIds });

  } catch (error) {
    console.error("Final Debug Log:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
