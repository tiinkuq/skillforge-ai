const Wishlist = require('../models/Wishlist');
const Course = require('../models/Course');

// @desc    Get wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.find({ user: req.user.id })
            .populate('course', 'title description thumbnail price rating instructor')
            .populate('course.instructor', 'name');

        res.status(200).json({
            success: true,
            wishlist
        });
    } catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = async (req, res) => {
    try {
        const { courseId } = req.body;

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const existing = await Wishlist.findOne({ user: req.user.id, course: courseId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Already in wishlist'
            });
        }

        const wishlist = await Wishlist.create({
            user: req.user.id,
            course: courseId
        });

        res.status(201).json({
            success: true,
            wishlist
        });
    } catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/:courseId
// @access  Private
const removeFromWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOneAndDelete({
            user: req.user.id,
            course: req.params.courseId
        });

        if (!wishlist) {
            return res.status(404).json({
                success: false,
                message: 'Not in wishlist'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Removed from wishlist'
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Check if in wishlist
// @route   GET /api/wishlist/check/:courseId
// @access  Private
const checkWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({
            user: req.user.id,
            course: req.params.courseId
        });

        res.status(200).json({
            success: true,
            isWishlisted: !!wishlist
        });
    } catch (error) {
        console.error('Check wishlist error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlist
};