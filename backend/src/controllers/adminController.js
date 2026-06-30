const User = require('../models/User');
const Course = require('../models/Course');
const Review = require('../models/Review');
const Order = require('../models/Order');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
    try {
        const [totalUsers, totalCourses, totalReviews, totalOrders, totalRevenue] = await Promise.all([
            User.countDocuments(),
            Course.countDocuments({ isPublished: true }),
            Review.countDocuments(),
            Order.countDocuments({ paymentStatus: 'completed' }),
            Order.aggregate([
                { $match: { paymentStatus: 'completed' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        // Get recent users
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email role createdAt avatar');

        // Get recent courses
        const recentCourses = await Course.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('instructor', 'name')
            .select('title price isPublished createdAt');

        // Get user growth (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dayOfMonth: '$createdAt' },
                    count: { $sum: 1 },
                    date: { $first: '$createdAt' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get course categories distribution
        const categoryDistribution = await Course.aggregate([
            { $match: { isPublished: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 6 }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalCourses,
                totalReviews,
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                userGrowth,
                categoryDistribution,
                recentUsers,
                recentCourses
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all users (with filters)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const { role, search, page = 1, limit = 10 } = req.query;
        
        const filter = {};
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            User.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .select('-password'),
            User.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const userId = req.params.id;

        if (!['student', 'instructor', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent changing own role
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot change your own role'
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all courses (admin view)
// @route   GET /api/admin/courses
// @access  Private/Admin
const getCourses = async (req, res) => {
    try {
        const { search, status, page = 1, limit = 10 } = req.query;
        
        const filter = {};
        if (status === 'published') filter.isPublished = true;
        if (status === 'draft') filter.isPublished = false;
        if (status === 'all' || !status) {
            // Don't filter by published status
        }
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const [courses, total] = await Promise.all([
            Course.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('instructor', 'name email'),
            Course.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            courses,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete course (admin)
// @route   DELETE /api/admin/courses/:id
// @access  Private/Admin
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        await course.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all orders (admin view)
// @route   GET /api/admin/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        const filter = {};
        if (status) filter.paymentStatus = status;

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('student', 'name email')
                .populate('instructor', 'name email')
                .populate('course', 'title'),
            Order.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            orders,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get revenue analytics
// @route   GET /api/admin/revenue
// @access  Private/Admin
const getRevenueAnalytics = async (req, res) => {
    try {
        const { period = 'month' } = req.query;

        let dateFilter = {};
        const now = new Date();
        
        if (period === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = { createdAt: { $gte: start } };
        } else if (period === 'year') {
            const start = new Date(now.getFullYear(), 0, 1);
            dateFilter = { createdAt: { $gte: start } };
        }

        const revenueByPeriod = await Order.aggregate([
            { $match: { paymentStatus: 'completed', ...dateFilter } },
            {
                $group: {
                    _id: period === 'month' 
                        ? { day: { $dayOfMonth: '$createdAt' } }
                        : { month: { $month: '$createdAt' } },
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        const totalRevenue = await Order.aggregate([
            { $match: { paymentStatus: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.status(200).json({
            success: true,
            revenueByPeriod,
            totalRevenue: totalRevenue[0]?.total || 0
        });
    } catch (error) {
        console.error('Get revenue analytics error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getStats,
    getUsers,
    updateUserRole,
    deleteUser,
    getCourses,
    deleteCourse,
    getOrders,
    getRevenueAnalytics
};