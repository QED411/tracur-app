/**
 * URL Scraper - fetches a page and extracts main article content.
 * User-driven only (one URL at a time). Uses Mozilla Readability for extraction.
 */

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const FETCH_TIMEOUT_MS = 15000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface ScrapeResult {
  title: string;
  text: string;
  url: string;
}

/** Fetch HTML from URL with timeout and browser-like headers */
async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const res = await fetch(url, {
    signal: controller.signal,
    headers: {
      "User-Agent": USER_AGENT,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    redirect: "follow",
  });
  clearTimeout(timeout);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const html = await res.text();
  return html;
}

/** Extract main article content from HTML using Readability */
export async function scrapeArticle(url: string): Promise<ScrapeResult> {
  const trimmed = url.trim();
  if (!trimmed) throw new Error("URL is required");

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are allowed");
  }

  const html = await fetchHtml(trimmed);
  const dom = new JSDOM(html, { url: trimmed });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) {
    throw new Error("Could not extract article content from this page");
  }

  const text = article.textContent?.trim() ?? "";
  if (!text || text.length < 50) {
    throw new Error(
      "Extracted content too short. The page may be behind a paywall or block scrapers."
    );
  }

  return {
    title: article.title ?? "Untitled",
    text,
    url: trimmed,
  };
}
