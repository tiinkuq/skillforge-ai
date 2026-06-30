import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const courseService = {
    // Get all courses with filters
    getCourses: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const response = await axios.get(`${API_URL}/courses?${params}`);
        return response.data;
    },

    // Get single course - Updated to include enrollment status
    getCourse: async (id) => {
        const response = await axios.get(`${API_URL}/courses/${id}`);
        console.log('Course Response:', response.data); // Debug log
        return response.data;
    },

    // Create course
    createCourse: async (courseData) => {
        const response = await axios.post(`${API_URL}/courses`, courseData);
        return response.data;
    },

    // Update course
    updateCourse: async (id, courseData) => {
        const response = await axios.put(`${API_URL}/courses/${id}`, courseData);
        return response.data;
    },

    // Delete course
    deleteCourse: async (id) => {
        const response = await axios.delete(`${API_URL}/courses/${id}`);
        return response.data;
    },

    // Enroll in course - Updated to handle response better
    enrollCourse: async (id) => {
        try {
            const response = await axios.post(`${API_URL}/courses/${id}/enroll`);
            console.log('Enroll API Response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Enroll API Error:', error.response?.data);
            throw error;
        }
    },

    // Update progress
    updateProgress: async (id, progress) => {
        const response = await axios.put(`${API_URL}/courses/${id}/progress`, { progress });
        return response.data;
    },

    // Get instructor courses
    getInstructorCourses: async (instructorId) => {
        const response = await axios.get(`${API_URL}/courses/instructor/${instructorId}`);
        return response.data;
    }
};