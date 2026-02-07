// test-db.js - Raw Firestore connection test (bypasses Next.js/Vercel)
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

// YOUR EXACT CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDo4xBzXFu0OjVg9sJxL6LYn9c5re-10Gk",
  authDomain: "travelcurated.firebaseapp.com",
  projectId: "travelcurated",
  storageBucket: "travelcurated.firebasestorage.app",
  messagingSenderId: "699148636320",
  appId: "1:699148636320:web:9edfd04b3396577fa5f9c5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testConnection() {
  console.log("Testing Firestore Connection...");
  try {
    const docRef = await addDoc(collection(db, "pins"), {
      test: "connection_verified",
      timestamp: new Date()
    });
    console.log("✅ SUCCESS! Written to ID:", docRef.id);
  } catch (e) {
    console.error("❌ FAILED:", e.message);
  }
}

testConnection();
