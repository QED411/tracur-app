require("dotenv").config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY not found in .env.local");
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`;

const delays = [2000, 4000, 8000];

async function fetchWithRetry(attempt = 0) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Reply with exactly: OK" }] }],
    }),
  });

  if (res.status === 429 && attempt < 3) {
    const waitMs = delays[attempt];
    await new Promise((r) => setTimeout(r, waitMs));
    return fetchWithRetry(attempt + 1);
  }

  return res;
}

fetchWithRetry()
  .then(async (res) => {
    const data = await res.json();
    if (res.ok) {
      console.log("✅ ONLINE");
    } else {
      const is429 = res.status === 429;
      const msg = is429
        ? "Google Billing Sync in progress. Please wait a moment."
        : data.error?.message || data.error?.status || res.statusText || JSON.stringify(data);
      console.error("❌", msg);
    }
    const code = res.ok ? 0 : 1;
    setImmediate(() => process.exit(code));
  })
  .catch((err) => {
    console.error("❌", err.message);
    setImmediate(() => process.exit(1));
  });
