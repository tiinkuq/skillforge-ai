const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    messages: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            maxlength: 5000
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        read: {
            type: Boolean,
            default: false
        },
        readAt: Date,
        edited: {
            type: Boolean,
            default: false
        },
        editedAt: Date,
        deleted: {
            type: Boolean,
            default: false
        }
    }],
    lastMessage: {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: String,
        timestamp: Date,
        read: {
            type: Boolean,
            default: false
        }
    },
    unreadCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
chatSchema.index({ participants: 1 });
chatSchema.index({ course: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });

// Pre-save middleware to update lastMessage
chatSchema.pre('save', function(next) {
    if (this.messages.length > 0) {
        const lastMsg = this.messages[this.messages.length - 1];
        this.lastMessage = {
            sender: lastMsg.sender,
            content: lastMsg.content,
            timestamp: lastMsg.timestamp,
            read: false
        };
        this.unreadCount = this.messages.filter(m => !m.read).length;
    }
    next();
});

module.exports = mongoose.model('Chat', chatSchema);