const { OpenAI } = require('openai');

// ⚠️ PASTE YOUR KEY HERE IF YOU HAVE ONE
// If you leave this empty, the code will run in "Simulation Mode" (Free)
const OPENAI_API_KEY = ""; 

async function generateScript(headlines) {
  console.log("🧠  AI Brain: Analyzing headlines...");

  // SIMULATION MODE (For testing without paying)
  if (!OPENAI_API_KEY) {
    console.log("⚠️  No API Key detected. Using SIMULATION MODE.");
    await new Promise(r => setTimeout(r, 2000)); // Fake "thinking" time
    
    // We pretend GPT wrote this based on your real news
    return {
      title: "Gold Rally Stalls",
      script: "Breaking news in the forex markets. The gold rally has officially stalled as investors take profits despite bullish bets on a Fed rate cut. Meanwhile, the US macro outlook for 2026 suggests a return to policy stability. Traders should watch the 2000 support level closely on the XAU/USD pair."
    };
  }

  // REAL MODE (If you have a key)
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const prompt = `
    You are a professional Forex News Anchor. 
    Here are the latest headlines: ${JSON.stringify(headlines)}.
    
    Write a 30-second energetic video script summarizing the most important 2 headlines. 
    Focus on Gold or USD if mentioned.
    The tone should be professional, fast, and exciting (like Bloomberg TV).
    Return ONLY a JSON object: { "title": "Short Title", "script": "The text to speak..." }
  `;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    const content = completion.choices[0].message.content;
    return JSON.parse(content);

  } catch (error) {
    console.error("❌ OpenAI Error:", error.message);
    return null;
  }
}

// --- TEST RUNNER ---
// We manually pass the headlines you just found to test it
const testHeadlines = [
  { headline: 'China Deepens Its Economic Grip on Central Asia' },
  { headline: 'Gold News: Profit-Taking Stalls Gold Rally Despite Bullish Fed Rate Cut Bets' },
  { headline: 'Fed: Disentangled From Latest Data' }
];

(async () => {
  const result = await generateScript(testHeadlines);
  console.log("\n------------------------------------------------");
  console.log("📜  GENERATED SCRIPT:");
  console.log("------------------------------------------------");
  console.log(`TITLE:  ${result.title}`);
  console.log(`SCRIPT: "${result.script}"`);
  console.log("------------------------------------------------");
})();