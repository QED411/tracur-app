import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. USE YOUR NEW KEY
    const apiKey = "AIzaSyAShOmvSg4z3jUq274mvy1espdctIsoFdw";

    // 2. ASK GOOGLE: "What models can I see?"
    console.log("DIAGNOSTIC: Ping Google for models...");
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        method: "GET"
    });

    const data = await response.json();
    
    // 3. PRINT THE TRUTH TO THE LOGS
    console.log("=== GOOGLE RESPONSE START ===");
    console.log(JSON.stringify(data, null, 2));
    console.log("=== GOOGLE RESPONSE END ===");

    return NextResponse.json({ 
        message: "Diagnostic ran. Check Vercel Logs.", 
        googleResponse: data 
    });

  } catch (error) {
    console.error("DIAGNOSTIC FAILED:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
