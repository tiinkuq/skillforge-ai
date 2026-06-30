const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Get all users endpoint - Coming soon!'
    });
});

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Private
router.get('/:id', protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: `Get user ${req.params.id} - Coming soon!`
    });
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: `Update user ${req.params.id} - Coming soon!`
    });
});

module.exports = router;