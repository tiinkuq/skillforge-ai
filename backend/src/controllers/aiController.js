const {
    generateCourseOutline,
    chatWithTutor,
    generateQuiz: generateQuizFromAI,  // Renamed import to avoid conflict
    summarizeContent,
    explainConcept
} = require('../services/aiService');
const Course = require('../models/Course');

// @desc    Generate course outline using AI
// @route   POST /api/ai/generate-course
// @access  Private (Instructor)
const generateCourse = async (req, res) => {
    try {
        const { topic, level } = req.body;

        if (!topic) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a topic for the course'
            });
        }

        const courseOutline = await generateCourseOutline(topic, level || 'beginner');

        // Save as draft course
        const course = await Course.create({
            title: courseOutline.title,
            subtitle: courseOutline.subtitle || '',
            description: courseOutline.description,
            level: courseOutline.level || 'Beginner',
            category: 'Other',
            instructor: req.user.id,
            learningObjectives: courseOutline.learningObjectives || [],
            requirements: courseOutline.requirements || [],
            tags: courseOutline.tags || [],
            modules: courseOutline.modules || [],
            isPublished: false
        });

        res.status(201).json({
            success: true,
            course,
            message: 'Course outline generated successfully'
        });
    } catch (error) {
        console.error('❌ Generate Course Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate course'
        });
    }
};

// @desc    Chat with AI tutor
// @route   POST /api/ai/chat
// @access  Private
const chat = async (req, res) => {
    try {
        console.log('📩 /api/ai/chat called');
        
        const { question, courseId, conversationHistory } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a question'
            });
        }

        // Get course context if courseId provided
        let courseContext = '';
        if (courseId) {
            const course = await Course.findById(courseId).select('title description');
            if (course) {
                courseContext = `${course.title}: ${course.description}`;
            }
        }

        console.log('📤 Calling AI service...');
        const reply = await chatWithTutor(question, courseContext, conversationHistory || []);
        console.log('📥 Reply received');

        res.status(200).json({
            success: true,
            reply
        });
    } catch (error) {
        console.error('❌ Chat Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get AI response'
        });
    }
};

// @desc    Generate quiz (Controller function)
// @route   POST /api/ai/generate-quiz
// @access  Private
const generateQuiz = async (req, res) => {
    try {
        const { content, numQuestions, difficulty } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Please provide content for quiz generation'
            });
        }

        // Use the renamed imported function
        const quiz = await generateQuizFromAI(content, numQuestions || 5, difficulty || 'medium');

        res.status(200).json({
            success: true,
            quiz
        });
    } catch (error) {
        console.error('❌ Generate Quiz Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate quiz'
        });
    }
};

// @desc    Summarize content
// @route   POST /api/ai/summarize
// @access  Private
const summarize = async (req, res) => {
    try {
        const { content, maxLength } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Please provide content to summarize'
            });
        }

        const summary = await summarizeContent(content, maxLength || 200);

        res.status(200).json({
            success: true,
            summary
        });
    } catch (error) {
        console.error('❌ Summarize Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to summarize content'
        });
    }
};

// @desc    Explain concept
// @route   POST /api/ai/explain
// @access  Private
const explain = async (req, res) => {
    try {
        const { concept, level } = req.body;

        if (!concept) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a concept to explain'
            });
        }

        const explanation = await explainConcept(concept, level || 'beginner');

        res.status(200).json({
            success: true,
            explanation
        });
    } catch (error) {
        console.error('❌ Explain Error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to explain concept'
        });
    }
};

module.exports = {
    generateCourse,
    chat,
    generateQuiz,
    summarize,
    explain
};
