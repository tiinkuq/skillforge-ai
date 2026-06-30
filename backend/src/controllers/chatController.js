const Chat = require('../models/Chat');
const User = require('../models/User');
const Course = require('../models/Course');

// @desc    Get all chats for user
// @route   GET /api/chat
// @access  Private
const getChats = async (req, res) => {
    try {
        const chats = await Chat.find({
            participants: req.user.id
        })
        .populate('participants', 'name avatar email')
        .populate('course', 'title thumbnail')
        .populate('lastMessage.sender', 'name')
        .sort({ 'lastMessage.timestamp': -1 });

        // Add unread count per chat
        const chatData = chats.map(chat => {
            const unreadCount = chat.messages.filter(
                msg => !msg.read && msg.sender.toString() !== req.user.id
            ).length;
            
            return {
                ...chat.toObject(),
                unreadCount
            };
        });

        res.status(200).json({
            success: true,
            chats: chatData
        });
    } catch (error) {
        console.error('Get chats error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single chat
// @route   GET /api/chat/:id
// @access  Private
const getChat = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id)
            .populate('participants', 'name avatar email')
            .populate('course', 'title thumbnail')
            .populate('messages.sender', 'name avatar');

        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if user is participant
        if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this chat'
            });
        }

        res.status(200).json({
            success: true,
            chat
        });
    } catch (error) {
        console.error('Get chat error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create or get chat
// @route   POST /api/chat
// @access  Private
const createChat = async (req, res) => {
    try {
        const { recipientId, courseId } = req.body;

        console.log('📩 Create chat request:', { recipientId, courseId, userId: req.user.id });

        if (!recipientId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a recipient'
            });
        }

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: 'Recipient not found'
            });
        }

        // Check if chat already exists
        let chat = await Chat.findOne({
            participants: { $all: [req.user.id, recipientId] },
            course: courseId || null
        });

        if (chat) {
            return res.status(200).json({
                success: true,
                chat,
                message: 'Chat already exists'
            });
        }

        // Create new chat
        chat = await Chat.create({
            participants: [req.user.id, recipientId],
            course: courseId || null,
            messages: [],
            isActive: true
        });

        // Populate and return
        const populatedChat = await Chat.findById(chat._id)
            .populate('participants', 'name avatar email')
            .populate('course', 'title thumbnail');

        res.status(201).json({
            success: true,
            chat: populatedChat,
            message: 'Chat created successfully'
        });
    } catch (error) {
        console.error('Create chat error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Send message
// @route   POST /api/chat/:id/message
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const chatId = req.params.id;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a message'
            });
        }

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if user is participant
        if (!chat.participants.includes(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to send messages in this chat'
            });
        }

        // Add message
        const newMessage = {
            sender: req.user.id,
            content,
            timestamp: new Date(),
            read: false
        };

        chat.messages.push(newMessage);
        chat.lastMessage = {
            sender: req.user.id,
            content,
            timestamp: new Date(),
            read: false
        };
        chat.unreadCount = chat.messages.filter(
            msg => !msg.read && msg.sender.toString() !== req.user.id
        ).length;

        await chat.save();

        // Populate sender info
        const populatedChat = await Chat.findById(chatId)
            .populate('participants', 'name avatar email')
            .populate('messages.sender', 'name avatar');

        res.status(200).json({
            success: true,
            message: populatedChat.messages[populatedChat.messages.length - 1]
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const chatId = req.params.id;

        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Mark all messages from other users as read
        chat.messages.forEach(msg => {
            if (msg.sender.toString() !== req.user.id && !msg.read) {
                msg.read = true;
                msg.readAt = new Date();
            }
        });

        chat.unreadCount = chat.messages.filter(
            msg => !msg.read && msg.sender.toString() !== req.user.id
        ).length;

        await chat.save();

        res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete chat
// @route   DELETE /api/chat/:id
// @access  Private
const deleteChat = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.id);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        if (!chat.participants.includes(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this chat'
            });
        }

        chat.isActive = false;
        await chat.save();

        res.status(200).json({
            success: true,
            message: 'Chat deleted successfully'
        });
    } catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getChats,
    getChat,
    createChat,
    sendMessage,
    markAsRead,
    deleteChat
};