const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use your existing API key
const apiKey = process.env.GEMINI_API_KEY || 'key';

console.log('🔍 Testing Gemini API with key:', apiKey.substring(0, 10) + '...');

const genAI = new GoogleGenerativeAI(apiKey);

// ✅ CORRECT MODEL: gemini-2.0-flash (or gemini-2.5-flash)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function testGemini() {
    try {
        console.log('📤 Sending request to Gemini with model: gemini-2.0-flash...');
        
        const result = await model.generateContent('Hello, are you working? Please respond with a short greeting.');
        const response = await result.response;
        const text = response.text();
        
        console.log('📥 Response:', text);
        console.log('✅ Gemini API is working!');
    } catch (error) {
        console.error('❌ Gemini API Error:', error.message);
        console.error('Full error:', error);
    }
}

testGemini();