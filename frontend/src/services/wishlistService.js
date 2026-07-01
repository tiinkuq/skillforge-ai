import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const wishlistService = {
    // Get wishlist
    getWishlist: async () => {
        const response = await axios.get(`${API_URL}/wishlist`);
        return response.data;
    },

    // Add to wishlist
    addToWishlist: async (courseId) => {
        const response = await axios.post(`${API_URL}/wishlist`, { courseId });
        return response.data;
    },

    // Remove from wishlist
    removeFromWishlist: async (courseId) => {
        const response = await axios.delete(`${API_URL}/wishlist/${courseId}`);
        return response.data;
    },

    // Check if course is in wishlist
    checkWishlist: async (courseId) => {
        const response = await axios.get(`${API_URL}/wishlist/check/${courseId}`);
        return response.data;
    }
};