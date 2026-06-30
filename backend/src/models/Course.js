const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a course title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    subtitle: {
        type: String,
        trim: true,
        maxlength: [200, 'Subtitle cannot be more than 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Please provide a course description'],
        trim: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: [
            'Programming', 
            'Web Development', 
            'Data Science', 
            'AI & Machine Learning',
            'Design', 
            'Business', 
            'Marketing', 
            'Science', 
            'Art',
            'Music',
            'Photography',
            'Health & Fitness',
            'Language',
            'Other'
        ],
        required: true
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
        default: 'Beginner'
    },
    price: {
        type: Number,
        default: 0,
        min: 0
    },
    thumbnail: {
        url: {
            type: String,
            default: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
        },
        public_id: String
    },
    modules: [{
        title: {
            type: String,
            required: true
        },
        description: String,
        lessons: [{
            title: {
                type: String,
                required: true
            },
            description: String,
            content: String,
            videoUrl: String,
            videoPublicId: String,
            duration: {
                type: Number,
                default: 0
            },
            order: {
                type: Number,
                default: 0
            },
            isFree: {
                type: Boolean,
                default: false
            }
        }],
        order: {
            type: Number,
            default: 0
        }
    }],
    totalDuration: {
        type: Number,
        default: 0
    },
    totalLessons: {
        type: Number,
        default: 0
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    numberOfReviews: {
        type: Number,
        default: 0
    },
    numberOfEnrollments: {
        type: Number,
        default: 0
    },
    language: {
        type: String,
        default: 'English'
    },
    requirements: [String],
    learningObjectives: [String],
    tags: [String],
    isPublished: {
        type: Boolean,
        default: false
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Calculate total duration and lessons before saving
courseSchema.pre('save', function(next) {
    if (this.modules && this.modules.length > 0) {
        let totalDuration = 0;
        let totalLessons = 0;
        
        this.modules.forEach(module => {
            if (module.lessons) {
                totalLessons += module.lessons.length;
                module.lessons.forEach(lesson => {
                    totalDuration += lesson.duration || 0;
                });
            }
        });
        
        this.totalDuration = totalDuration;
        this.totalLessons = totalLessons;
    }
    next();
});

module.exports = mongoose.model('Course', courseSchema);