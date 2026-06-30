import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { courseService } from '../services/courseService';
import { useToast } from '../context/ToastContext';

const CreateCourse = () => {
    const navigate = useNavigate();
    const showToast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        category: '',
        level: 'Beginner',
        price: 0,
        language: 'English',
        requirements: [],
        learningObjectives: [],
        tags: []
    });

    const categories = [
        'Programming', 'Web Development', 'Data Science', 
        'AI & Machine Learning', 'Design', 'Business', 
        'Marketing', 'Science', 'Art', 'Music', 'Other'
    ];

    const levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleArrayChange = (e, field) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            [field]: value.split(',').map(item => item.trim()).filter(Boolean)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validate required fields
            if (!formData.title || !formData.description || !formData.category) {
                showToast.error('Please fill in all required fields');
                setLoading(false);
                return;
            }

            const response = await courseService.createCourse(formData);
            if (response.success) {
                showToast.success('Course created successfully!');
                navigate(`/courses/${response.course._id}`);
            }
        } catch (error) {
            console.error('Error creating course:', error);
            showToast.error(error.response?.data?.message || 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-course-page">
            <motion.div 
                className="create-course-container"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1>Create New Course</h1>
                <p className="subtitle">Share your knowledge with the world</p>

                <form onSubmit={handleSubmit} className="create-course-form">
                    <div className="form-section">
                        <h3>Basic Information</h3>
                        
                        <div className="form-group">
                            <label htmlFor="title">Course Title *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., React Mastery 2024"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="subtitle">Subtitle</label>
                            <input
                                type="text"
                                id="subtitle"
                                name="subtitle"
                                value={formData.subtitle}
                                onChange={handleChange}
                                placeholder="A brief subtitle for your course"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description *</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe what students will learn..."
                                rows={6}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Course Details</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="category">Category *</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="level">Level</label>
                                <select
                                    id="level"
                                    name="level"
                                    value={formData.level}
                                    onChange={handleChange}
                                >
                                    {levels.map(level => (
                                        <option key={level} value={level}>{level}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="price">Price ($)</label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="0 for free"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="language">Language</label>
                                <input
                                    type="text"
                                    id="language"
                                    name="language"
                                    value={formData.language}
                                    onChange={handleChange}
                                    placeholder="English"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Additional Information</h3>

                        <div className="form-group">
                            <label htmlFor="requirements">Requirements (comma separated)</label>
                            <input
                                type="text"
                                id="requirements"
                                value={formData.requirements.join(', ')}
                                onChange={(e) => handleArrayChange(e, 'requirements')}
                                placeholder="e.g., Basic JavaScript, HTML, CSS"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="learningObjectives">Learning Objectives (comma separated)</label>
                            <input
                                type="text"
                                id="learningObjectives"
                                value={formData.learningObjectives.join(', ')}
                                onChange={(e) => handleArrayChange(e, 'learningObjectives')}
                                placeholder="e.g., Build React apps, Understand state management"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="tags">Tags (comma separated)</label>
                            <input
                                type="text"
                                id="tags"
                                value={formData.tags.join(', ')}
                                onChange={(e) => handleArrayChange(e, 'tags')}
                                placeholder="e.g., React, JavaScript, Web Development"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="btn-secondary"
                            onClick={() => navigate('/dashboard')}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Course'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateCourse;