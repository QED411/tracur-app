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
   export async function POST(req: Request) {
  try {
    const { text, url, title, userProfile } = await req.json();

    // FUTURE-PROOFING: This object will eventually be pulled from your DB
    const userContext = {
      dietary: "Lacto-Ovo Vegetarian",
      interests: ["Skiing", "Squash", "History"],
      disabilityReq: "None specified",
      ...userProfile // Allows the frontend to override/add preferences
    };

    const prompt = `
      Extract the SINGLE most specific location from the text.
      
      USER CONTEXT (Apply these lenses to the extraction):
      - Diet: ${userContext.dietary}. If a restaurant, highlight vegetarian options.
      - Interests: ${userContext.interests.join(", ")}.
      
      EXTRACTION RULES:
      1. Find the 'googlePlaceId'. If not found, use null.
      2. Category must be: "beach", "restaurant", "hotel", "museum", "park", "landmark".
      3. The 'note' MUST be the original text provided. These are the 'Special Reasons' for saving.
      
      OUTPUT FORMAT (JSON ONLY):
      {
        "locations": [{
          "name": "Official Name",
          "googlePlaceId": "ID_OR_NULL",
          "category": "standard_category",
          "coordinates": { "lat": 0, "lng": 0 },
          "note": "Original article excerpt goes here",
          "personalizedInsight": "Why this matches user preferences"
        }]
      }

      TEXT: "${text}"
    `;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    // ... fetch logic follows
    async function onLocationSaved(locationData) {
  if (locationData.googlePlaceId) {
    // 1. Fetch Stars & Reviews from Google Places API
    const service = new google.maps.places.PlacesService(map);
    service.getDetails({ placeId: locationData.googlePlaceId }, (place) => {
      displayRichUI({
        rating: place.rating,
        reviews: place.reviews,
        photos: place.photos,
        // 2. Link to YouTube 360 search
        youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(place.name)}+360+view`
      });
    });
  } else {
    // FALLBACK: Use the Article Excerpt
    displayBasicUI({
      title: locationData.name,
      specialReasons: locationData.note
    });
  }
}
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API Error Detail:", errText);
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


