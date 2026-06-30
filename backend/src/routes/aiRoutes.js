const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    generateCourse,
    chat,
    generateQuiz,
    summarize,
    explain
} = require('../controllers/aiController');

// All routes are protected (require login)
router.post('/generate-course', protect, generateCourse);
router.post('/chat', protect, chat);
router.post('/generate-quiz', protect, generateQuiz);
router.post('/summarize', protect, summarize);
router.post('/explain', protect, explain);

module.exports = router;