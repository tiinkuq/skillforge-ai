import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const adminService = {
    // Get platform statistics
    getStats: async () => {
        const response = await axios.get(`${API_URL}/admin/stats`);
        return response.data;
    },

    // Get all users
    getUsers: async (params = {}) => {
        const query = new URLSearchParams(params);
        const response = await axios.get(`${API_URL}/admin/users?${query}`);
        return response.data;
    },

    // Update user role
    updateUserRole: async (userId, role) => {
        const response = await axios.put(`${API_URL}/admin/users/${userId}/role`, { role });
        return response.data;
    },

    // Delete user
    deleteUser: async (userId) => {
        const response = await axios.delete(`${API_URL}/admin/users/${userId}`);
        return response.data;
    },

    // Get all courses (admin view)
    getCourses: async (params = {}) => {
        const query = new URLSearchParams(params);
        const response = await axios.get(`${API_URL}/admin/courses?${query}`);
        return response.data;
    },

    // Delete course (admin)
    deleteCourse: async (courseId) => {
        const response = await axios.delete(`${API_URL}/admin/courses/${courseId}`);
        return response.data;
    },

    // Get all orders
    getOrders: async (params = {}) => {
        const query = new URLSearchParams(params);
        const response = await axios.get(`${API_URL}/admin/orders?${query}`);
        return response.data;
    },

    // Get revenue analytics
    getRevenueAnalytics: async (period = 'month') => {
        const response = await axios.get(`${API_URL}/admin/revenue?period=${period}`);
        return response.data;
    }
};