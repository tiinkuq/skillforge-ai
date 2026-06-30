const Course = require('../models/Course');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Instructor/Admin)
const createCourse = async (req, res) => {
    try {
        const { 
            title, 
            subtitle, 
            description, 
            category, 
            level, 
            price, 
            language,
            requirements,
            learningObjectives,
            tags
        } = req.body;

        // Validate required fields
        if (!title || !description || !category) {
            return res.status(400).json({
                success: false,
                message: 'Please provide title, description, and category'
            });
        }

        // Create course
        const course = await Course.create({
            title,
            subtitle,
            description,
            category,
            level: level || 'Beginner',
            price: price || 0,
            language: language || 'English',
            requirements: requirements || [],
            learningObjectives: learningObjectives || [],
            tags: tags || [],
            instructor: req.user.id
        });

        res.status(201).json({
            success: true,
            course
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all courses with filters
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res) => {
    try {
        const {
            category,
            level,
            priceMin,
            priceMax,
            rating,
            search,
            sort = 'newest',
            page = 1,
            limit = 12,
            instructor,
            isPublished = true
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (isPublished === 'true') {
            filter.isPublished = true;
        }
        
        if (category) filter.category = category;
        if (level) filter.level = level;
        if (instructor) filter.instructor = instructor;
        
        // Price range
        if (priceMin || priceMax) {
            filter.price = {};
            if (priceMin) filter.price.$gte = Number(priceMin);
            if (priceMax) filter.price.$lte = Number(priceMax);
        }
        
        // Rating filter
        if (rating) {
            filter.rating = { $gte: Number(rating) };
        }
        
        // Search
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Sorting
        let sortOption = {};
        switch(sort) {
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            case 'oldest':
                sortOption = { createdAt: 1 };
                break;
            case 'price-low':
                sortOption = { price: 1 };
                break;
            case 'price-high':
                sortOption = { price: -1 };
                break;
            case 'rating':
                sortOption = { rating: -1 };
                break;
            case 'popular':
                sortOption = { numberOfEnrollments: -1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }

        // Pagination
        const skip = (page - 1) * limit;
        const limitNum = Number(limit);

        // Execute query
        const [courses, total] = await Promise.all([
            Course.find(filter)
                .sort(sortOption)
                .skip(skip)
                .limit(limitNum)
                .populate('instructor', 'name avatar bio')
                .lean(),
            Course.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            courses,
            pagination: {
                page: Number(page),
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            },
            filters: {
                category,
                level,
                priceRange: { min: priceMin, max: priceMax },
                rating
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

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
const getCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('instructor', 'name avatar bio email')
            .populate('enrolledStudents', 'name avatar');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check if user is enrolled (if authenticated)
        let isEnrolled = false;
        let progress = 0;
        if (req.user) {
            const user = await User.findById(req.user.id);
            const enrollment = user.enrolledCourses.find(
                e => e.course.toString() === course._id.toString()
            );
            if (enrollment) {
                isEnrolled = true;
                progress = enrollment.progress || 0;
            }
        }

        res.status(200).json({
            success: true,
            course,
            isEnrolled,
            progress
        });
    } catch (error) {
        console.error('Get course error:', error);
        if (error instanceof mongoose.CastError) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Instructor/Admin)
const updateCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check ownership
        if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this course'
            });
        }

        // Update fields
        const allowedUpdates = [
            'title', 'subtitle', 'description', 'category', 'level',
            'price', 'language', 'requirements', 'learningObjectives',
            'tags', 'modules', 'thumbnail', 'isPublished'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                course[field] = req.body[field];
            }
        });

        await course.save();

        res.status(200).json({
            success: true,
            course
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor/Admin)
const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Check ownership
        if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this course'
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

// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private
// @desc    Enroll in a course
// @route   POST /api/courses/:id/enroll
// @access  Private
const enrollCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const user = await User.findById(req.user.id);

        // Check if already enrolled
        const alreadyEnrolled = user.enrolledCourses.some(
            e => e.course.toString() === course._id.toString()
        );

        if (alreadyEnrolled) {
            return res.status(400).json({
                success: false,
                message: 'Already enrolled in this course'
            });
        }

        // Check if course is published
        if (!course.isPublished) {
            return res.status(400).json({
                success: false,
                message: 'Course is not published yet'
            });
        }

        // Add enrollment
        user.enrolledCourses.push({
            course: course._id,
            enrolledAt: new Date()
        });

        await user.save();

        // Add student to course
        course.enrolledStudents.push(user._id);
        course.numberOfEnrollments = course.enrolledStudents.length;
        await course.save();

        // Return success with enrollment data
        res.status(200).json({
            success: true,
            message: 'Successfully enrolled in course',
            enrollment: user.enrolledCourses[user.enrolledCourses.length - 1],
            isEnrolled: true
        });
    } catch (error) {
        console.error('Enroll course error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update course progress
// @route   PUT /api/courses/:id/progress
// @access  Private
const updateProgress = async (req, res) => {
    try {
        const { progress } = req.body;
        const courseId = req.params.id;

        if (progress === undefined || progress < 0 || progress > 100) {
            return res.status(400).json({
                success: false,
                message: 'Progress must be between 0 and 100'
            });
        }

        const user = await User.findById(req.user.id);
        const enrollment = user.enrolledCourses.find(
            e => e.course.toString() === courseId
        );

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                message: 'Not enrolled in this course'
            });
        }

        enrollment.progress = progress;
        if (progress === 100) {
            enrollment.completed = true;
            enrollment.completedAt = new Date();
        }
        enrollment.lastAccessed = new Date();

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Progress updated',
            progress,
            completed: enrollment.completed
        });
    } catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get instructor's courses
// @route   GET /api/courses/instructor/:instructorId
// @access  Public
const getInstructorCourses = async (req, res) => {
    try {
        const { instructorId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const [courses, total] = await Promise.all([
            Course.find({ instructor: instructorId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit))
                .populate('instructor', 'name avatar')
                .lean(),
            Course.countDocuments({ instructor: instructorId })
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
        console.error('Get instructor courses error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createCourse,
    getCourses,
    getCourse,
    updateCourse,
    deleteCourse,
    enrollCourse,
    updateProgress,
    getInstructorCourses
};