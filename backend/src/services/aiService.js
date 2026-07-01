const { GoogleGenAI } = require('@google/genai');

// Initialize Gemini with new SDK
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY 
});

// Generate Course Outline from topic
const generateCourseOutline = async (topic, level = 'beginner') => {
    try {
        const prompt = `Create a detailed course outline for a ${level} level course on "${topic}".
        
        Return ONLY valid JSON with this exact structure (no markdown, no extra text):
        {
            "title": "Course title",
            "subtitle": "Brief subtitle",
            "description": "Detailed course description (100-150 words)",
            "level": "${level}",
            "learningObjectives": ["Objective 1", "Objective 2", "Objective 3", "Objective 4", "Objective 5"],
            "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"],
            "tags": ["tag1", "tag2", "tag3"],
            "modules": [
                {
                    "title": "Module 1 title",
                    "description": "Module description",
                    "lessons": [
                        {
                            "title": "Lesson 1 title",
                            "description": "What will be covered",
                            "duration": 10
                        },
                        {
                            "title": "Lesson 2 title",
                            "description": "What will be covered",
                            "duration": 15
                        }
                    ]
                }
            ]
        }
        
        Include at least 3 modules with 3-4 lessons each.
        Make it comprehensive and educational.
        Lessons should be 10-20 minutes each.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        const text = response.text;
        
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid response format from AI');
        }
        
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('AI Course Generation Error:', error);
        throw new Error('Failed to generate course outline: ' + error.message);
    }
};

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

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text;
    } catch (error) {
        console.error('AI Tutor Error:', error);
        throw new Error('Failed to get AI response: ' + error.message);
    }
};

// Generate Quiz from course content
const generateQuiz = async (courseContent, numQuestions = 5, difficulty = 'medium') => {
    try {
        const prompt = `Based on the following course content, generate ${numQuestions} multiple-choice questions.
        
        Course content:
        ${courseContent}
        
        Difficulty level: ${difficulty}
        
        Return ONLY valid JSON with this exact structure (no markdown, no extra text):
        {
            "questions": [
                {
                    "question": "Question text",
                    "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
                    "correctAnswer": 0,
                    "explanation": "Why this answer is correct"
                }
            ]
        }
        
        Make questions varied and test understanding, not just memorization.
        Include a mix of easy, medium, and hard questions.`;

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
        console.error('AI Quiz Generation Error:', error);
        throw new Error('Failed to generate quiz: ' + error.message);
    }
};

// Summarize content
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
        console.error('AI Summarization Error:', error);
        throw new Error('Failed to summarize content: ' + error.message);
    }
};

// Explain concept simply
const explainConcept = async (concept, level = 'beginner') => {
    try {
        const prompt = `Explain the concept of "${concept}" in simple terms for a ${level} level learner.
        
        Include:
        1. A simple definition
        2. A real-world example
        3. Why it's important
        4. Related concepts they should know
        5. A simple analogy (if applicable)
        
        Keep the explanation clear, engaging, and easy to understand.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text;
    } catch (error) {
        console.error('AI Explain Concept Error:', error);
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
