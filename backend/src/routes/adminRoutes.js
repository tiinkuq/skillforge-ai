const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getStats,
    getUsers,
    updateUserRole,
    deleteUser,
    getCourses,
    deleteCourse,
    getOrders,
    getRevenueAnalytics
} = require('../controllers/adminController');

// All routes require admin role
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/courses', getCourses);
router.delete('/courses/:id', deleteCourse);
router.get('/orders', getOrders);
router.get('/revenue', getRevenueAnalytics);

module.exports = router;