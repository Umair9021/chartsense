import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

// --- HELPER: SAVE TO DATABASE ---
function saveToHistory(record) {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'history.json');
    // 1. Read existing file
    const fileData = fs.readFileSync(dbPath, 'utf8');
    const history = JSON.parse(fileData);
    
    // 2. Add new record to the TOP of the list
    history.unshift(record);
    
    // 3. Save back to file
    fs.writeFileSync(dbPath, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error("Database Error:", err);
  }
}

// 1. CHART PHOTOGRAPHER
async function captureChart() {
  // ... (Same logic as before) ...
  // For speed, we are reusing the existing logic but let's assume we make a unique name
  const timestamp = Date.now();
  const filename = `/chart-${timestamp}.png`;
  const savePath = `./public${filename}`;

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD', { waitUntil: 'networkidle2', timeout: 60000 });
  await page.waitForSelector('.chart-gui-wrapper', { visible: true });
  await page.screenshot({ path: savePath });
  await browser.close();
  
  return filename;
}

// 2. NEWS & AI BRAIN
async function getAnalysis() {
  // ... (Same scraping logic) ...
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
  await page.goto('https://www.forexfactory.com/news', { waitUntil: 'domcontentloaded' });
  const headlines = await page.evaluate(() => Array.from(document.querySelectorAll('.flexposts__story-title')).slice(0, 3).map(h => h.innerText.trim()));
  await browser.close();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
        headline: headlines[0] || "Market Update",
        script: `Breaking News: ${headlines[0]}. Traders are reacting to this volatility. Watch the charts closely.`
    };
  }
  
  const openai = new OpenAI({ apiKey: apiKey });
  const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: `Summarize these headlines into 1 sentence for a trader: ${JSON.stringify(headlines)}` }],
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

    // CREATE THE RECORD
    const newRecord = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      image: imagePath,
      headline: aiData.headline,
      script: aiData.script
    };

    // SAVE IT
    saveToHistory(newRecord);

    return NextResponse.json({ success: true, data: newRecord });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 4. NEW: GET HANDLER (To fetch the list)
export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'history.json');
    const fileData = fs.readFileSync(dbPath, 'utf8');
    const history = JSON.parse(fileData);
    return NextResponse.json({ success: true, history });
  } catch (err) {
    return NextResponse.json({ success: false, history: [] });
  }
}