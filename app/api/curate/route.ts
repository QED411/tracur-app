import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. USE THE "TRACUR-CLEAN" KEY
    const apiKey = "AIzaSyC1-PokMlccCRqz9Ct0lFp35H_wLOv-xKI";

    // 2. ASK GOOGLE: "What models do you have FOR THIS PROJECT?"
    console.log("DIAGNOSTIC: Listing models for Tracur-Clean...");
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        method: "GET"
    });

    const data = await response.json();
    
    // 3. PRINT THE LIST TO VERCEL LOGS
    console.log("=== CLEAN PROJECT MODELS START ===");
    console.log(JSON.stringify(data, null, 2));
    console.log("=== CLEAN PROJECT MODELS END ===");

    return NextResponse.json({ 
        message: "Diagnostic ran. Check Vercel Logs.", 
        googleResponse: data 
    });

  } catch (error) {
    console.error("DIAGNOSTIC FAILED:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
