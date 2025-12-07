import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

// IMPORTS FOR BROWSERS
// We import these dynamically inside the function to avoid crashes
import puppeteer from 'puppeteer'; // Standard for Local
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
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    try {
      // 1. Configure the path to the Remote Binary
      // This matches the @sparticuz/chromium version 127.0.0
      const executablePath = await chromium.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v127.0.0/chromium-v127.0.0-pack.tar"
      );

      // 2. Launch with specific flags to prevent File Locking (ETXTBSY)
      const browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: executablePath,
        headless: chromium.headless,
      });
      return browser;
    } catch (error) {
      console.error("Vercel Browser Error:", error);
      throw error;
    }
  } else {
    // --- LOCALHOST CONFIG ---
    const puppeteer = await import('puppeteer').then(mod => mod.default); 
    return await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox']
    });
  }
}
// 1. CHART PHOTOGRAPHER
async function captureChart() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  await page.goto('https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD', {
    waitUntil: 'networkidle2',
    timeout: 30000 
  });

  try {
    await page.waitForSelector('.chart-gui-wrapper', { visible: true, timeout: 5000 });
  } catch (e) {
    console.log("Chart selector timeout, attempting capture anyway.");
  }

  // Return Base64 image
  const imageBuffer = await page.screenshot();
  const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
  
  await browser.close();
  return base64Image;
}

// 2. NEWS & AI BRAIN
async function getAnalysis() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  // Speed Optimization: Block images/fonts/css to scrape faster
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
  await page.goto('https://www.forexfactory.com/news', { waitUntil: 'domcontentloaded' });
  
  const headlines = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.flexposts__story-title'))
      .slice(0, 3)
      .map(h => h.innerText.trim());
  });
  await browser.close();

  // AI Logic
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { headline: headlines[0] || "Market Data", script: "No API Key provided." };
  }
  
  const openai = new OpenAI({ apiKey: apiKey });
  const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: `Summarize these headlines into 1 sentence: ${JSON.stringify(headlines)}` }],
      model: "gpt-3.5-turbo",
  });
  
  return {
      headline: headlines[0],
      script: completion.choices[0].message.content
  };
}

// 3. MAIN HANDLER
export async function POST() {
  try {
    // Run concurrently for speed
    const [imagePath, aiData] = await Promise.all([captureChart(), getAnalysis()]);

    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      image: imagePath,
      headline: aiData.headline,
      script: aiData.script
    };

    return NextResponse.json({ success: true, data: newRecord });

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