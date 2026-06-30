import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const reviewService = {
    // Get reviews for a course
    getCourseReviews: async (courseId, page = 1, limit = 10) => {
        const response = await axios.get(`${API_URL}/courses/${courseId}/reviews?page=${page}&limit=${limit}`);
        return response.data;
    },

    // Create a review
    createReview: async (courseId, data) => {
        const response = await axios.post(`${API_URL}/courses/${courseId}/reviews`, data);
        return response.data;
    },

    // Update a review
    updateReview: async (reviewId, data) => {
        const response = await axios.put(`${API_URL}/reviews/${reviewId}`, data);
        return response.data;
    },

    // Delete a review
    deleteReview: async (reviewId) => {
        const response = await axios.delete(`${API_URL}/reviews/${reviewId}`);
        return response.data;
    },

    // Mark review as helpful
    markHelpful: async (reviewId) => {
        const response = await axios.put(`${API_URL}/reviews/${reviewId}/helpful`);
        return response.data;
    },

    // Reply to review (instructor only)
    replyToReview: async (reviewId, comment) => {
        const response = await axios.post(`${API_URL}/reviews/${reviewId}/reply`, { comment });
        return response.data;
    }
};