import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

// IMPORTS FOR BROWSERS
// We import these dynamically inside the function to avoid crashes
import puppeteer from 'puppeteer'; // Standard for Local
import chromium from '@sparticuz/chromium'; // Compressed for Vercel
import puppeteerCore from 'puppeteer-core'; // Core for Vercel

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
  // CHECK: Are we on Vercel?
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    return await puppeteerCore.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      // UPDATE THIS LINE:
      executablePath: await chromium.executablePath(), 
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
} else {
    // CONFIG FOR LOCALHOST (Windows/Mac)
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
  
  // Go to TradingView
  await page.goto('https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD', {
    waitUntil: 'networkidle2',
    timeout: 30000 // Reduced timeout for Vercel speed
  });

  try {
    await page.waitForSelector('.chart-gui-wrapper', { visible: true, timeout: 10000 });
  } catch (e) {
    console.log("Selector timeout, taking screenshot anyway...");
  }

  // VERCEL TRICK: We cannot save to disk! We must return the image as "Base64" data
  // This allows the frontend to show it without needing a file saved
  const imageBuffer = await page.screenshot();
  const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
  
  await browser.close();
  return base64Image;
}

// 2. NEWS & AI BRAIN
async function getAnalysis() {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  // Optimized for speed
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
      req.abort(); // Don't load images/fonts to make scraping fast
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
    return {
        headline: headlines[0] || "Market Update",
        script: `Breaking News: ${headlines[0]}. Traders are reacting.`
    };
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
    const [imagePath, aiData] = await Promise.all([captureChart(), getAnalysis()]);

    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      image: imagePath, // Now storing Base64 string instead of file path
      headline: aiData.headline,
      script: aiData.script
    };

    saveToHistory(newRecord);

    return NextResponse.json({ success: true, data: newRecord });

  } catch (error) {
    console.error("Server Error:", error);
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