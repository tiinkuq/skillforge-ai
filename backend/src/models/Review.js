const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: [1000, 'Comment cannot be more than 1000 characters'],
        minlength: [10, 'Comment must be at least 10 characters']
    },
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    instructorReply: {
        comment: {
            type: String,
            trim: true,
            maxlength: [500, 'Reply cannot be more than 500 characters']
        },
        createdAt: {
            type: Date
        }
    },
    helpfulCount: {
        type: Number,
        default: 0
    },
    helpfulUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: Date
}, {
    timestamps: true
});

// Ensure one review per user per course
reviewSchema.index({ user: 1, course: 1 }, { unique: true });

// Static method to calculate average rating
reviewSchema.statics.getAverageRating = async function(courseId) {
    const result = await this.aggregate([
        { $match: { course: courseId } },
        { $group: {
            _id: '$course',
            averageRating: { $avg: '$rating' },
            numberOfReviews: { $sum: 1 }
        }}
    ]);

    if (result.length > 0) {
        return {
            averageRating: Math.round(result[0].averageRating * 10) / 10,
            numberOfReviews: result[0].numberOfReviews
        };
    }
    return { averageRating: 0, numberOfReviews: 0 };
};

module.exports = mongoose.model('Review', reviewSchema);