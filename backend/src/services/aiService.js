const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini with your API key
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

// AI Tutor Chat
const chatWithTutor = async (question, courseContext = '', conversationHistory = []) => {
    try {
        // Build conversation history
        let historyContext = '';
        if (conversationHistory.length > 0) {
            historyContext = conversationHistory.slice(-5).map(msg => {
                return `${msg.role}: ${msg.content}`;
            }).join('\n');
        }

        const prompt = `You are an AI tutor for a course${courseContext ? ` about: ${courseContext}` : ''}.
        
        ${historyContext ? `Previous conversation:\n${historyContext}\n` : ''}
        
        Student's question: ${question}
        
        Provide a clear, helpful, and educational response.
        - Be encouraging and supportive
        - Use examples to explain concepts
        - If you don't know something, say so honestly
        - Keep the tone conversational and friendly
        - Break down complex topics into simple terms
        - Suggest further reading or practice if relevant`;

        console.log('📤 Sending prompt to Gemini:', prompt.substring(0, 100) + '...');

        // Correct syntax for @google/genai v1.0.0
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        console.log('📥 Received response from Gemini');

        // v1.0.0 uses response.text directly
        return response.text;
    } catch (error) {
        console.error('❌ AI Tutor Error:', error);
        throw new Error('Failed to get AI response: ' + error.message);
    }
};

// Generate Course Outline
const generateCourseOutline = async (topic, level = 'beginner') => {
    try {
        const prompt = `Create a detailed course outline for a ${level} level course on "${topic}".
        
        Return ONLY valid JSON with this exact structure:
        {
            "title": "Course title",
            "subtitle": "Brief subtitle",
            "description": "Detailed course description",
            "level": "${level}",
            "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"],
            "requirements": ["Requirement 1", "Requirement 2"],
            "tags": ["tag1", "tag2"],
            "modules": [
                {
                    "title": "Module 1 title",
                    "description": "Module description",
                    "lessons": [
                        {
                            "title": "Lesson 1 title",
                            "description": "What will be covered",
                            "duration": 10
                        }
                    ]
                }
            ]
        }
        
        Include at least 3 modules with 3-4 lessons each.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const text = response.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format from AI');
        }
        
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('❌ AI Course Generation Error:', error);
        throw new Error('Failed to generate course outline: ' + error.message);
    }
};

// Generate Quiz
const generateQuiz = async (courseContent, numQuestions = 5, difficulty = 'medium') => {
    try {
        const prompt = `Based on the following course content, generate ${numQuestions} multiple-choice questions.
        
        Course content:
        ${courseContent}
        
        Difficulty level: ${difficulty}
        
        Return ONLY valid JSON with this structure:
        {
            "questions": [
                {
                    "question": "Question text",
                    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
                    "correctAnswer": 0,
                    "explanation": "Why this answer is correct"
                }
            ]
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const text = response.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format from AI');
        }
        
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('❌ AI Quiz Generation Error:', error);
        throw new Error('Failed to generate quiz: ' + error.message);
    }
};

// Summarize Content
const summarizeContent = async (content, maxLength = 200) => {
    try {
        const prompt = `Summarize the following content in ${maxLength} words or less.
        Make it clear, concise, and capture the key points.
        
        Content to summarize:
        ${content.substring(0, 5000)}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text;
    } catch (error) {
        console.error('❌ AI Summarization Error:', error);
        throw new Error('Failed to summarize content: ' + error.message);
    }
};

// Explain Concept
const explainConcept = async (concept, level = 'beginner') => {
    try {
        const prompt = `Explain the concept of "${concept}" in simple terms for a ${level} level learner.
        
        Include:
        1. A simple definition
        2. A real-world example
        3. Why it's important
        4. Related concepts they should know
        5. A simple analogy (if applicable)`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text;
    } catch (error) {
        console.error('❌ AI Explain Concept Error:', error);
        throw new Error('Failed to explain concept: ' + error.message);
    }
};

module.exports = {
    generateCourseOutline,
    chatWithTutor,
    generateQuiz,
    summarizeContent,
    explainConcept
};
