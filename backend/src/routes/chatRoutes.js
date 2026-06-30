const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getChats,
    getChat,
    createChat,
    sendMessage,
    markAsRead,
    deleteChat
} = require('../controllers/chatController');

// All routes are protected
router.get('/', protect, getChats);
router.get('/:id', protect, getChat);
router.post('/', protect, createChat);
router.post('/:id/message', protect, sendMessage);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteChat);

module.exports = router;