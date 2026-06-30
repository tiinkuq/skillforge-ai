const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model configurations
const models = {
    courseGenerator: 'gemini-1.5-pro',
    tutor: 'gemini-1.5-pro',
    quizGenerator: 'gemini-1.5-pro',
    summarizer: 'gemini-1.5-flash'
};

// Generate Course Outline from topic
const generateCourseOutline = async (topic, level = 'beginner') => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: models.courseGenerator 
        });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
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
        const model = genAI.getGenerativeModel({ 
            model: models.tutor 
        });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('AI Tutor Error:', error);
        throw new Error('Failed to get AI response: ' + error.message);
    }
};

// Generate Quiz from course content
const generateQuiz = async (courseContent, numQuestions = 5, difficulty = 'medium') => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: models.quizGenerator 
        });

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

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
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
        const model = genAI.getGenerativeModel({ 
            model: models.summarizer 
        });

        const prompt = `Summarize the following content in ${maxLength} words or less.
        Make it clear, concise, and capture the key points.
        
        Content to summarize:
        ${content.substring(0, 5000)}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('AI Summarization Error:', error);
        throw new Error('Failed to summarize content: ' + error.message);
    }
};

// Explain concept simply
const explainConcept = async (concept, level = 'beginner') => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: models.tutor 
        });

        const prompt = `Explain the concept of "${concept}" in simple terms for a ${level} level learner.
        
        Include:
        1. A simple definition
        2. A real-world example
        3. Why it's important
        4. Related concepts they should know
        5. A simple analogy (if applicable)
        
        Keep the explanation clear, engaging, and easy to understand.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
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