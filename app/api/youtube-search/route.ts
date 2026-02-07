import { NextRequest, NextResponse } from "next/server";

/** GET /api/youtube-search?q=Spiaggia+di+Cefalù - Returns 1 travel video about the location */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  if (!q || !q.trim()) return NextResponse.json({ error: "q required" }, { status: 400 });

  const apiKey =
    process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing API key" }, { status: 500 });

  try {
    const searchQuery = `${q.trim()} travel guide`;
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("q", searchQuery);
    url.searchParams.set("type", "video");
    url.searchParams.set("maxResults", "1");
    url.searchParams.set("relevanceLanguage", "en");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.text();
      console.error("YouTube API error:", res.status, err);
      return NextResponse.json({ video: null });
    }
    const data = await res.json();
    const item = data.items?.[0];
    if (!item?.id?.videoId) return NextResponse.json({ video: null });

    return NextResponse.json({
      video: {
        videoId: item.id.videoId,
        title: item.snippet?.title ?? "",
        channelTitle: item.snippet?.channelTitle ?? "",
        thumbnailUrl: item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? "",
      },
    });
  } catch (e) {
    console.error("YouTube search error:", e);
    return NextResponse.json({ video: null });
  }
}
