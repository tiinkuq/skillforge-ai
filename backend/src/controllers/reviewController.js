const Review = require('../models/Review');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Create a review
// @route   POST /api/courses/:courseId/reviews
// @access  Private
const createReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const courseId = req.params.courseId;

        // Validate
        if (!rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'Please provide rating and comment'
            });
        }

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if user is enrolled
        const user = await User.findById(req.user.id);
        const isEnrolled = user.enrolledCourses.some(
            e => e.course.toString() === courseId
        );

        if (!isEnrolled) {
            return res.status(403).json({
                success: false,
                message: 'You must be enrolled to review this course'
            });
        }

        // Check if user already reviewed
        const existingReview = await Review.findOne({
            user: req.user.id,
            course: courseId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this course'
            });
        }

        // Create review
        const review = await Review.create({
            user: req.user.id,
            course: courseId,
            rating,
            comment,
            isVerifiedPurchase: true
        });

        // Populate user info
        await review.populate('user', 'name avatar');

        // Update course rating
        const ratingStats = await Review.getAverageRating(courseId);
        course.rating = ratingStats.averageRating;
        course.numberOfReviews = ratingStats.numberOfReviews;
        await course.save();

        res.status(201).json({
            success: true,
            review,
            ratingStats
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get reviews for a course
// @route   GET /api/courses/:courseId/reviews
// @access  Public
const getCourseReviews = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const { page = 1, limit = 10 } = req.query;

        // Check if course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const skip = (page - 1) * limit;

        const [reviews, total, ratingStats] = await Promise.all([
            Review.find({ course: courseId })
                .populate('user', 'name avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            Review.countDocuments({ course: courseId }),
            Review.getAverageRating(courseId)
        ]);

        res.status(200).json({
            success: true,
            reviews,
            ratingStats,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const reviewId = req.params.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check ownership
        if (review.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this review'
            });
        }

        // Update fields
        if (rating) review.rating = rating;
        if (comment) {
            review.comment = comment;
            review.edited = true;
            review.editedAt = new Date();
        }

        await review.save();
        await review.populate('user', 'name avatar');

        // Update course rating
        const ratingStats = await Review.getAverageRating(review.course);
        await Course.findByIdAndUpdate(review.course, {
            rating: ratingStats.averageRating,
            numberOfReviews: ratingStats.numberOfReviews
        });

        res.status(200).json({
            success: true,
            review,
            ratingStats
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
const deleteReview = async (req, res) => {
    try {
        const reviewId = req.params.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check ownership
        if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this review'
            });
        }

        const courseId = review.course;
        await review.deleteOne();

        // Update course rating
        const ratingStats = await Review.getAverageRating(courseId);
        await Course.findByIdAndUpdate(courseId, {
            rating: ratingStats.averageRating,
            numberOfReviews: ratingStats.numberOfReviews
        });

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully',
            ratingStats
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
const markHelpful = async (req, res) => {
    try {
        const reviewId = req.params.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user already marked helpful
        const alreadyHelpful = review.helpfulUsers.includes(req.user.id);
        
        if (alreadyHelpful) {
            // Remove helpful
            review.helpfulUsers = review.helpfulUsers.filter(
                id => id.toString() !== req.user.id
            );
            review.helpfulCount -= 1;
        } else {
            // Add helpful
            review.helpfulUsers.push(req.user.id);
            review.helpfulCount += 1;
        }

        await review.save();

        res.status(200).json({
            success: true,
            helpfulCount: review.helpfulCount,
            isHelpful: !alreadyHelpful
        });
    } catch (error) {
        console.error('Mark helpful error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Instructor reply to review
// @route   POST /api/reviews/:id/reply
// @access  Private (Instructor only)
const replyToReview = async (req, res) => {
    try {
        const { comment } = req.body;
        const reviewId = req.params.id;

        if (!comment || comment.length < 5) {
            return res.status(400).json({
                success: false,
                message: 'Reply must be at least 5 characters'
            });
        }

        const review = await Review.findById(reviewId)
            .populate('user', 'name avatar')
            .populate('course', 'instructor');

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        // Check if user is the course instructor
        if (review.course.instructor.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the course instructor can reply to reviews'
            });
        }

        review.instructorReply = {
            comment,
            createdAt: new Date()
        };

        await review.save();

        res.status(200).json({
            success: true,
            review
        });
    } catch (error) {
        console.error('Reply to review error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createReview,
    getCourseReviews,
    updateReview,
    deleteReview,
    markHelpful,
    replyToReview
};