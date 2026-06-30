import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Configure axios
axios.defaults.withCredentials = true;

// Add request interceptor for debugging
axios.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token') || null);

    // Load user on mount
    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                const userData = response.data.user;
                // Ensure enrolledCourses is always an array
                userData.enrolledCourses = userData.enrolledCourses || [];
                console.log('✅ User loaded with enrolledCourses:', userData.enrolledCourses.length);
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            }
        } catch (error) {
            console.error('Load user error:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setToken(null);
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    };

    // Refresh user data
    const refreshUser = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;

            const response = await axios.get(`${API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            if (response.data.success) {
                const userData = response.data.user;
                userData.enrolledCourses = userData.enrolledCourses || [];
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                return userData;
            }
            return null;
        } catch (error) {
            console.error('Refresh user error:', error);
            return null;
        }
    }, []);

    const register = async (userData) => {
        try {
            const response = await axios.post(`${API_URL}/auth/register`, userData);
            if (response.data.success) {
                const { token, user } = response.data;
                setToken(token);
                localStorage.setItem('token', token);
                user.enrolledCourses = user.enrolledCourses || [];
                setUser(user);
                localStorage.setItem('user', JSON.stringify(user));
                toast.success('Registration successful! Welcome to SkillForge AI.');
                return { success: true };
            }
        } catch (error) {
            console.error('Register error:', error);
            const message = error.response?.data?.message || 'Registration failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, { email, password });
            if (response.data.success) {
                const { token, user } = response.data;
                setToken(token);
                localStorage.setItem('token', token);
                user.enrolledCourses = user.enrolledCourses || [];
                setUser(user);
                localStorage.setItem('user', JSON.stringify(user));
                toast.success(`Welcome back, ${user.name}!`);
                return { success: true };
            }
        } catch (error) {
            console.error('Login error:', error);
            const message = error.response?.data?.message || 'Login failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${API_URL}/auth/logout`);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            toast.success('Logged out successfully');
        }
    };

    const updateProfile = async (data) => {
        try {
            const response = await axios.put(`${API_URL}/auth/updateprofile`, data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (response.data.success) {
                const userData = response.data.user;
                userData.enrolledCourses = userData.enrolledCourses || [];
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                toast.success('Profile updated successfully');
                return { success: true };
            }
        } catch (error) {
            console.error('Update error:', error);
            const message = error.response?.data?.message || 'Update failed';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    const value = {
        user,
        loading,
        token,
        register,
        login,
        logout,
        updateProfile,
        refreshUser,
        isAuthenticated: !!user,
        isInstructor: user?.role === 'instructor' || user?.role === 'admin',
        isAdmin: user?.role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};