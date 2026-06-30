const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createCourse,
    getCourses,
    getCourse,
    updateCourse,
    deleteCourse,
    enrollCourse,
    updateProgress,
    getInstructorCourses
} = require('../controllers/courseController');

// Public routes
router.get('/', getCourses);
router.get('/:id', getCourse);
router.get('/instructor/:instructorId', getInstructorCourses);

// Private routes
router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.put('/:id', protect, updateCourse);
router.delete('/:id', protect, deleteCourse);
router.post('/:id/enroll', protect, enrollCourse);
router.put('/:id/progress', protect, updateProgress);

module.exports = router;