const puppeteer = require('puppeteer');

(async () => {
  console.log("🕵️  Starting the News Hunter...");

  // 1. Launch Browser
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  // 2. Go to ForexFactory News
  const url = 'https://www.forexfactory.com/news';
  console.log(`Navigating to ${url}...`);
  
  // Set a generic User Agent so we don't look like a robot
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
  
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // 3. Extract Headlines
  // We look for the specific class used by ForexFactory for headlines
  const newsData = await page.evaluate(() => {
    // Get the first 5 stories
    const stories = Array.from(document.querySelectorAll('.flexposts__story-title')).slice(0, 5);
    
    return stories.map(story => {
      return {
        headline: story.innerText.trim(),
        link: story.href
      };
    });
  });

  console.log("------------------------------------------------");
  console.log("📢  LATEST FOREX NEWS FOUND:");
  console.log("------------------------------------------------");
  console.log(newsData);
  console.log("------------------------------------------------");

  await browser.close();
})();