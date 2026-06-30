const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createReview,
    getCourseReviews,
    updateReview,
    deleteReview,
    markHelpful,
    replyToReview
} = require('../controllers/reviewController');

// Course review routes
router.get('/courses/:courseId/reviews', getCourseReviews);
router.post('/courses/:courseId/reviews', protect, createReview);

// Individual review routes
router.put('/reviews/:id', protect, updateReview);
router.delete('/reviews/:id', protect, deleteReview);
router.put('/reviews/:id/helpful', protect, markHelpful);
router.post('/reviews/:id/reply', protect, authorize('instructor', 'admin'), replyToReview);

module.exports = router;