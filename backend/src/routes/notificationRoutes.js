const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Get notifications endpoint - Coming soon!'
    });
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: `Mark notification ${req.params.id} as read - Coming soon!`
    });
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Mark all notifications as read - Coming soon!'
    });
});

module.exports = router;