const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Get orders endpoint - Coming soon!'
    });
});

// @route   POST /api/orders/create
// @desc    Create an order
// @access  Private
router.post('/create', protect, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Create order endpoint - Coming soon!'
    });
});

module.exports = router;