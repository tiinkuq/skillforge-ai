const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'usd'
    },
    paymentMethod: {
        type: String,
        enum: ['stripe', 'razorpay', 'paypal'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    paymentId: String,
    orderId: String,
    receipt: String,
    refundId: String,
    refundAmount: Number,
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    completedAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);