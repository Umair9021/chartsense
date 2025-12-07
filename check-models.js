// check-models.js
require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function check() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log("❌ No API Key found in .env.local");
    return;
  }
  
  console.log("🔑 Using Key:", key.substring(0, 10) + "...");
  const genAI = new GoogleGenerativeAI(key);
  
  try {
    // This asks Google: "What models can I use?"
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); 
    // (We use a dummy model just to get access to the list method if needed, 
    // but better to use the specific listModels method if available, 
    // or just try a basic generation to see the error details).
    
    // There isn't a direct "listModels" helper in the simple SDK sometimes, 
    // so we will use a raw fetch to be 100% sure.
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    
    if (data.error) {
        console.error("❌ API Error:", data.error.message);
    } else {
        console.log("✅ AVAILABLE MODELS FOR YOU:");
        data.models.forEach(m => {
            if (m.supportedGenerationMethods.includes("generateContent")) {
                console.log(`   - ${m.name.replace("models/", "")}`);
            }
        });
    }
  } catch (error) {
    console.error("❌ Script failed:", error);
  }
}

check();