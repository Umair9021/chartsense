import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

// IMPORTS FOR BROWSERS
// We import these dynamically inside the function to avoid crashes
import puppeteerCore from 'puppeteer-core';
import chromium from '@sparticuz/chromium';// Compressed for Vercel
import puppeteerCore from 'puppeteer-core'; // Core for Vercel

export const maxDuration = 60; // Allow 60 seconds for scraping
export const dynamic = 'force-dynamic';
// --- HELPER: SAVE TO DATABASE ---
function saveToHistory(record) {
  try {
    // In Vercel, we can't write to files permanently, but we try anyway for the session
    // For a real app, you would use MongoDB here.
    const dbPath = path.join(process.cwd(), 'data', 'history.json');
    // Check if file exists (Vercel might not have it)
    if (fs.existsSync(dbPath)) {
      const fileData = fs.readFileSync(dbPath, 'utf8');
      const history = JSON.parse(fileData);
      history.unshift(record);
      fs.writeFileSync(dbPath, JSON.stringify(history, null, 2));
    }
  } catch (err) {
    console.log("History save skipped (Vercel Read-Only Mode)");
  }
}

// --- HELPER: GET BROWSER INSTANCE ---
async function getBrowser() {
  // 1. REMOTE BROWSER (Production / Vercel)
  const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN;

  if (process.env.VERCEL && BROWSERLESS_TOKEN) {
    console.log("Connecting to Remote Browser...");
    return await puppeteerCore.connect({
      browserWSEndpoint: `wss://chrome.browserless.io?token=${BROWSERLESS_TOKEN}`,
    });
  } 
  
  // 2. FALLBACK / LOCAL (If you are on localhost and want to use local Chrome)
  // You will need to install 'puppeteer' as a dev-dependency for this to work locally
  // npm install puppeteer --save-dev
  try {
    const puppeteer = await import('puppeteer').then(mod => mod.default);
    return await puppeteer.launch({ headless: "new" });
  } catch (err) {
    throw new Error("Local Puppeteer not found. If running locally, install 'puppeteer'. If on Vercel, set BROWSERLESS_TOKEN.");
  }
}
// 1. CHART PHOTOGRAPHER
async function captureChart() {
  let browser = null;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto('https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD', {
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for chart
    try {
      await page.waitForSelector('.chart-gui-wrapper', { visible: true, timeout: 10000 });
    } catch (e) {
      console.log("Chart selector timeout, attempting capture anyway.");
    }

    const imageBuffer = await page.screenshot();
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    
    await browser.close();
    return base64Image;
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

async function getAnalysis() {
  let browser = null;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    
    // Speed Optimization
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'media', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto('https://www.forexfactory.com/news', { waitUntil: 'domcontentloaded' });
    
    const headlines = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.flexposts__story-title'))
        .slice(0, 3)
        .map(h => h.innerText.trim());
    });
    await browser.close();

    // AI Logic
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return { headline: headlines[0] || "Market Data", script: "No API Key provided." };
    
    const openai = new OpenAI({ apiKey: apiKey });
    const completion = await openai.chat.completions.create({
        messages: [{ role: "user", content: `Summarize: ${JSON.stringify(headlines)}` }],
        model: "gpt-3.5-turbo",
    });
    
    return { headline: headlines[0], script: completion.choices[0].message.content };
  } catch (error) {
    if (browser) await browser.close();
    // Return safe data if scraping fails
    return { headline: "Market Update", script: "Unable to fetch live news at this moment." };
  }
}

// --- MAIN API HANDLER ---
export async function POST() {
  try {
    const [imagePath, aiData] = await Promise.all([captureChart(), getAnalysis()]);

    return NextResponse.json({ 
      success: true, 
      data: {
        id: Date.now(),
        date: new Date().toLocaleString(),
        image: imagePath,
        headline: aiData.headline,
        script: aiData.script
      } 
    });

  } catch (error) {
    console.error("Critical Server Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 4. GET HANDLER
export async function GET() {
  // Simple history fetch (Might be empty on Vercel due to file system reset)
  try {
    const dbPath = path.join(process.cwd(), 'data', 'history.json');
    if (fs.existsSync(dbPath)) {
      const fileData = fs.readFileSync(dbPath, 'utf8');
      const history = JSON.parse(fileData);
      return NextResponse.json({ success: true, history });
    }
    return NextResponse.json({ success: true, history: [] });
  } catch (err) {
    return NextResponse.json({ success: false, history: [] });
  }
}