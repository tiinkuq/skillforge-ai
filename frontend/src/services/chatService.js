import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const chatService = {
    // Get all chats
    getChats: async () => {
        try {
            const response = await axios.get(`${API_URL}/chat`);
            return response.data;
        } catch (error) {
            console.error('Get chats error:', error);
            throw error;
        }
    },

    // Get single chat
    getChat: async (chatId) => {
        try {
            const response = await axios.get(`${API_URL}/chat/${chatId}`);
            return response.data;
        } catch (error) {
            console.error('Get chat error:', error);
            throw error;
        }
    },

    // Create chat
    createChat: async (data) => {
        try {
            console.log('📤 Creating chat with data:', data);
            const response = await axios.post(`${API_URL}/chat`, data);
            console.log('📥 Create chat response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Create chat error:', error);
            console.error('Error response:', error.response?.data);
            throw error;
        }
    },

    // Send message
    sendMessage: async (chatId, content) => {
        try {
            const response = await axios.post(`${API_URL}/chat/${chatId}/message`, { content });
            return response.data;
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    },

    // Mark as read
    markAsRead: async (chatId) => {
        try {
            const response = await axios.put(`${API_URL}/chat/${chatId}/read`);
            return response.data;
        } catch (error) {
            console.error('Mark read error:', error);
            throw error;
        }
    },

    // Delete chat
    deleteChat: async (chatId) => {
        try {
            const response = await axios.delete(`${API_URL}/chat/${chatId}`);
            return response.data;
        } catch (error) {
            console.error('Delete chat error:', error);
            throw error;
        }
    }
};