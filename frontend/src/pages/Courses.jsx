import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { courseService } from '../services/courseService';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        category: '',
        level: '',
        sort: 'newest',
        search: ''
    });
    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        pages: 0
    });

    const categories = [
        'Programming', 'Web Development', 'Data Science', 
        'AI & Machine Learning', 'Design', 'Business', 
        'Marketing', 'Science', 'Art', 'Music', 'Other'
    ];

    const levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];

    useEffect(() => {
        fetchCourses();
    }, [filters, pagination.page]);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await courseService.getCourses({
                ...filters,
                page: pagination.page,
                limit: 9
            });
            setCourses(response.courses);
            setPagination({
                page: response.pagination.page,
                total: response.pagination.total,
                pages: response.pagination.pages
            });
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader">Loading courses...</div>
            </div>
        );
    }

    return (
        <div className="courses-page">
            <div className="courses-header">
                <h1>All Courses</h1>
                <p>Explore our collection of expert-led courses</p>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="filters-container">
                    <div className="filter-group">
                        <label>Search</label>
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>

                    <div className="filter-group">
                        <label>Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Level</label>
                        <select
                            value={filters.level}
                            onChange={(e) => handleFilterChange('level', e.target.value)}
                        >
                            <option value="">All Levels</option>
                            {levels.map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Sort By</label>
                        <select
                            value={filters.sort}
                            onChange={(e) => handleFilterChange('sort', e.target.value)}
                        >
                            <option value="newest">Newest</option>
                            <option value="oldest">Oldest</option>
                            <option value="price-low">Price: Low to High</option>
                            <option value="price-high">Price: High to Low</option>
                            <option value="rating">Highest Rated</option>
                            <option value="popular">Most Popular</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Course Grid */}
            {courses.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📚</div>
                    <h3>No courses found</h3>
                    <p>Try adjusting your filters or search terms</p>
                </div>
            ) : (
                <>
                    <div className="courses-grid">
                        {courses.map((course, index) => (
                            <motion.div
                                key={course._id}
                                className="course-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <Link to={`/courses/${course._id}`}>
                                    <div className="course-thumbnail">
                                        <img 
                                            src={course.thumbnail?.url || 'https://via.placeholder.com/300x200'} 
                                            alt={course.title}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/300x200?text=Course';
                                            }}
                                        />
                                        {course.isPublished && (
                                            <span className="badge published">Published</span>
                                        )}
                                        {course.featured && (
                                            <span className="badge featured">Featured</span>
                                        )}
                                    </div>
                                    <div className="course-info">
                                        <div className="course-category">{course.category}</div>
                                        <h3>{course.title}</h3>
                                        <p className="course-description">
                                            {course.description.substring(0, 100)}...
                                        </p>
                                        <div className="course-meta">
                                            <div className="instructor">
                                                <span>👨‍🏫</span>
                                                {course.instructor?.name || 'Unknown'}
                                            </div>
                                            <div className="rating">
                                                <span>⭐</span>
                                                {course.rating?.toFixed(1) || '0.0'}
                                                ({course.numberOfReviews || 0})
                                            </div>
                                        </div>
                                        <div className="course-footer">
                                            <div className="price">
                                                {course.price === 0 ? 'Free' : `$${course.price}`}
                                            </div>
                                            <div className="students">
                                                👥 {course.numberOfEnrollments || 0}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                            >
                                Previous
                            </button>
                            <span>
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Courses;