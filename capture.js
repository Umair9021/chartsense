const puppeteer = require('puppeteer');

(async () => {
  console.log("Starting the Chart Photographer...");

  // 1. Launch the hidden browser
  const browser = await puppeteer.launch({
    headless: "new", // Run in background (change to false if you want to see it open)
    defaultViewport: { width: 1920, height: 1080 } // Full HD Quality
  });

  const page = await browser.newPage();

  // 2. Go to the TradingView Chart (XAUUSD)
  // We use the "Advanced Chart" mode to get a clean look
  const chartUrl = 'https://www.tradingview.com/chart/?symbol=OANDA:XAUUSD';
  console.log(`Navigating to ${chartUrl}...`);
  
  await page.goto(chartUrl, {
    waitUntil: 'networkidle2', // Wait until loading finishes
    timeout: 60000 // Wait up to 60 seconds
  });

  // 3. Wait specifically for the Chart Canvas to appear
  console.log("Waiting for chart to load...");
  await page.waitForSelector('.chart-gui-wrapper', { visible: true });
  
  // Optional: Wait 3 extra seconds just to be safe
  await new Promise(r => setTimeout(r, 3000));

  // 4. Take the Screenshot
  console.log("Cheese! 📸 Taking screenshot...");
  await page.screenshot({ path: 'chart-gold.png' });

  await browser.close();
  console.log("✅ Done! Check your folder for 'chart-gold.png'");
})();