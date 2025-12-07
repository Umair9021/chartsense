import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai"; // New Free AI
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const parser = new Parser();

// --- 1. NEWS AGGREGATOR (FREE) ---
async function getForexFactory() {
  try {
    const res = await fetch('https://www.forexfactory.com/news', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const news = [];
    $('.flexposts__story-title').slice(0, 3).each((i, el) => news.push(`[ForexFactory] ${$(el).text().trim()}`));
    return news;
  } catch (e) { return []; }
}

async function getInvestingCom() {
  try {
    const res = await fetch('https://www.investing.com/news/forex-news', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const html = await res.text();
    const $ = cheerio.load(html);
    const news = [];
    $('article a.title').slice(0, 3).each((i, el) => news.push(`[Investing.com] ${$(el).text().trim()}`));
    return news;
  } catch (e) { return []; }
}

async function getCNBC() {
  try {
    const feed = await parser.parseURL('https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664');
    return feed.items.slice(0, 3).map(item => `[CNBC] ${item.title}`);
  } catch (e) { return []; }
}

async function getAllNews() {
  const [ff, inv, cnbc] = await Promise.all([getForexFactory(), getInvestingCom(), getCNBC()]);
  return [...ff, ...inv, ...cnbc].slice(0, 5);
}

// --- 2. GOOGLE GEMINI AI (FREE) ---
async function analyzeMarket(headlines) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { headline: "API Key Missing", script: "Please check .env.local" };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest"});

    // NEW PROMPT: Simple words + Market Direction
    const prompt = `
      You are an expert Forex Market Analyst.
      Here are the latest news headlines: ${JSON.stringify(headlines)}

      Step 1: Analyze these headlines to determine if the market sentiment is BULLISH (Positive), BEARISH (Negative), or NEUTRAL.
      Step 2: Summarize the news in very simple, easy-to-understand words that a beginner can understand. Explain *why* the market might move up or down.

      Output Format:
      "Market Sentiment: [BULLISH / BEARISH / NEUTRAL]
      
      Analysis: [Your simple summary here]"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const script = response.text();
    
    // We try to extract the sentiment for the headline
    const sentimentMatch = script.match(/Market Sentiment:\s*(\w+)/i);
    const sentiment = sentimentMatch ? sentimentMatch[1].toUpperCase() : "MARKET UPDATE";

    return { 
      headline: `Outlook: ${sentiment}`, 
      script: script 
    };

  } catch (error) {
    console.error("Gemini Error:", error.message);
    return { 
      headline: "Market Update", 
      script: `Latest updates: ${headlines[0]}. Analysts warn of potential volatility in the upcoming session.` 
    };
  }
}

// --- 3. MAIN HANDLER ---
export async function POST() {
  try {
    const headlines = await getAllNews();
    
    // If no news found (internet issue), return fallback
    if (headlines.length === 0) {
       return NextResponse.json({ 
         success: true, 
         data: { 
           id: Date.now(), 
           date: new Date().toLocaleString(), 
           image: "/chart-gold.png", 
           headline: "Connection Error", 
           script: "Could not fetch live news. Please check your internet connection." 
         }
       });
    }

    const aiData = await analyzeMarket(headlines);

    return NextResponse.json({ 
      success: true, 
      data: {
        id: Date.now(),
        date: new Date().toLocaleString(),
        image: "/chart-gold.png", // Static chart for speed/reliability
        headline: aiData.headline,
        script: aiData.script,
        sources: headlines // Show sources to prove it's real
      } 
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, history: [] });
}