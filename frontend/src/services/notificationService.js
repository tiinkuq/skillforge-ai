import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const notificationService = {
    // Get all notifications
    getNotifications: async (page = 1, unreadOnly = false) => {
        const response = await axios.get(`${API_URL}/notifications?page=${page}&unreadOnly=${unreadOnly}`);
        return response.data;
    },

    // Mark as read
    markAsRead: async (notificationId) => {
        const response = await axios.put(`${API_URL}/notifications/${notificationId}/read`);
        return response.data;
    },

    // Mark all as read
    markAllAsRead: async () => {
        const response = await axios.put(`${API_URL}/notifications/read-all`);
        return response.data;
    },

    // Delete notification
    deleteNotification: async (notificationId) => {
        const response = await axios.delete(`${API_URL}/notifications/${notificationId}`);
        return response.data;
    }
};