import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Parser from 'rss-parser';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const parser = new Parser();

// --- 1. FETCH RAW OHLC DATA (High Resolution) ---
async function getRawMarketData(mode) {
  try {
    const days = mode === 'daily' ? '7' : '30'; // 7 days for Daily, 30 for Weekly
    console.log(`🔍 Fetching Raw OHLC Data for ${mode}...`);

    // Fetch Candle Data (Open, High, Low, Close)
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/pax-gold/ohlc?vs_currency=usd&days=${days}`);
    const data = await response.json();

    if (!Array.isArray(data)) throw new Error("CoinGecko API Error");

    // Format for ApexCharts
    // CoinGecko returns: [timestamp, open, high, low, close]
    // We send this EXACT raw data to the frontend
    return {
      seriesData: data.map(item => ({
        x: item[0], // Time
        y: [item[1], item[2], item[3], item[4]] // [Open, High, Low, Close]
      })),
      isBullish: data[data.length-1][4] > data[0][1] // Compare Last Close vs First Open
    };

  } catch (error) {
    console.error("Data Error:", error.message);
    return null;
  }
}

// --- 2. NEWS AGGREGATOR ---
function isToday(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth();
}
function cleanText(text) { return text ? text.replace(/<[^>]*>?/gm, '').trim().substring(0, 300) : ""; }

async function getAllNews(mode) {
  try {
    const [cnbc, inv] = await Promise.all([
      parser.parseURL('https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664').catch(()=>({items:[]})),
      parser.parseURL('https://www.investing.com/rss/news_1.rss').catch(()=>({items:[]}))
    ]);

    const filterFn = mode === 'daily' ? (item => isToday(item.pubDate)) : (() => true);
    const allItems = [...cnbc.items, ...inv.items].filter(filterFn).slice(0, 5);
    
    return allItems.map(item => ({
      source: 'News',
      title: item.title,
      summary: cleanText(item.contentSnippet || item.content)
    }));
  } catch(e) { return []; }
}

// --- 3. AI ANALYSIS ---
async function analyzeMarket(newsItems, mode) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { headline: "API Key Missing", script: "Check .env.local" };
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const MODELS = ["gemini-flash-lite-latest", "gemini-1.5-flash", "gemini-pro"];
  const newsContext = newsItems.map(n => `- ${n.title}: ${n.summary}`).join("\n");

  const prompt = `
    Role: Financial Analyst. 
    Task: Write a 3-sentence market script for ${mode} based on:
    ${newsContext}
    
    Output Format:
    "Market Sentiment: [BULLISH/BEARISH/NEUTRAL]
    Probability: [0-100]%
    Analysis: [Script]"
  `;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const script = result.response.text();
      
      const sentiment = (script.match(/Market Sentiment:\s*(\w+)/i) || [,"NEUTRAL"])[1].toUpperCase();
      const probability = (script.match(/Probability:\s*(\d+)%/i) || [,"50"])[1];
      const cleanScript = script.replace(/Market Sentiment:.*\n?/, '').replace(/Probability:.*\n?/, '').replace(/Analysis:\s*/, '').trim();

      return { headline: `Outlook: ${sentiment} (${probability}%)`, sentiment, probability, script: cleanScript };
    } catch (e) { continue; }
  }
  return { headline: "Market Update", sentiment: "NEUTRAL", probability: "50", script: `Breaking: ${newsItems[0]?.title}` };
}

// --- MAIN HANDLER ---
export async function POST(req) {
  try {
    const body = await req.json(); 
    const mode = body.timeRange || 'daily'; 
    
    const [chartData, newsItems] = await Promise.all([
      getRawMarketData(mode),
      getAllNews(mode)
    ]);

    const aiData = await analyzeMarket(newsItems, mode);

    return NextResponse.json({ 
      success: true, 
      data: {
        id: Date.now(),
        type: mode,
        date: new Date().toLocaleString(),
        chartData: chartData, // Sending RAW OHLC data
        headline: aiData.headline,
        script: aiData.script,
        sentiment: aiData.sentiment,
        probability: aiData.probability
      } 
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json({ success: true, history: [] }); }