import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';

const Dashboard = () => {
    const { user } = useAuth(); // Don't use refreshUser here
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        averageProgress: 0
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const hasLoaded = useRef(false); // Prevent multiple loads

    useEffect(() => {
        // Only load once on mount
        if (!hasLoaded.current) {
            hasLoaded.current = true;
            loadDashboardData();
        }
    }, []); // Empty dependency array

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            console.log('📚 Loading dashboard data...');
            
            const currentUser = user;
            
            if (currentUser?.enrolledCourses && currentUser.enrolledCourses.length > 0) {
                console.log(`📚 Found ${currentUser.enrolledCourses.length} enrolled courses`);
                
                const courses = await Promise.all(
                    currentUser.enrolledCourses.map(async (enrollment) => {
                        try {
                            const courseId = enrollment.course?._id || enrollment.course;
                            if (!courseId) return null;
                            
                            const response = await courseService.getCourse(courseId);
                            console.log('📖 Course fetched:', response.course?.title);
                            
                            return {
                                ...response.course,
                                progress: enrollment.progress || 0,
                                completed: enrollment.completed || false,
                                enrolledAt: enrollment.enrolledAt
                            };
                        } catch (error) {
                            console.error('Error fetching course:', error);
                            return null;
                        }
                    })
                );
                
                const validCourses = courses.filter(c => c !== null);
                console.log(`✅ Valid courses: ${validCourses.length}`);
                setEnrolledCourses(validCourses);
                
                const total = validCourses.length;
                const completed = validCourses.filter(c => c.completed).length;
                const averageProgress = total > 0 
                    ? Math.round(validCourses.reduce((acc, c) => acc + c.progress, 0) / total)
                    : 0;
                
                setStats({ total, completed, averageProgress });
            } else {
                console.log('ℹ️ No enrolled courses found');
                setEnrolledCourses([]);
                setStats({ total: 0, completed: 0, averageProgress: 0 });
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
            setEnrolledCourses([]);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Use the current user data without refreshing
        await loadDashboardData();
        setIsRefreshing(false);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1>Welcome, {user?.name}!</h1>
                        <p>Track your learning progress and achievements</p>
                    </div>
                    <button 
                        onClick={handleRefresh} 
                        className="btn-secondary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? '⏳ Refreshing...' : '🔄 Refresh'}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-info">
                        <h3>{stats.total}</h3>
                        <p>Enrolled Courses</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <h3>{stats.completed}</h3>
                        <p>Completed Courses</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-info">
                        <h3>{stats.averageProgress}%</h3>
                        <p>Average Progress</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-info">
                        <h3>{user?.role === 'instructor' ? 'Instructor' : 'Student'}</h3>
                        <p>Role</p>
                    </div>
                </div>
            </div>

            {/* Debug: Show enrolled courses count */}
            <div style={{ marginBottom: '1rem', padding: '0.5rem', background: '#f7fafc', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#4a5568' }}>
                    📊 Found <strong>{enrolledCourses.length}</strong> enrolled course(s)
                </p>
            </div>

            {/* Enrolled Courses */}
            <div className="dashboard-courses">
                <h2>Your Courses</h2>
                {enrolledCourses.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📖</div>
                        <h3>No courses enrolled yet</h3>
                        <p>Browse our courses and start learning today!</p>
                        <Link to="/courses" className="btn-primary">
                            Browse Courses
                        </Link>
                    </div>
                ) : (
                    <div className="enrolled-courses-grid">
                        {enrolledCourses.map((course, index) => (
                            <motion.div
                                key={course._id || index}
                                className="enrolled-course-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <Link to={`/courses/${course._id}`}>
                                    <div className="course-thumbnail-small">
                                        <img 
                                            src={course.thumbnail?.url || 'https://via.placeholder.com/300x150/4f46e5/ffffff?text=Course'} 
                                            alt={course.title}
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/300x150/4f46e5/ffffff?text=Course';
                                            }}
                                        />
                                    </div>
                                    <div className="course-info-dashboard">
                                        <h3>{course.title}</h3>
                                        <p className="course-instructor-name">
                                            👨‍🏫 {course.instructor?.name || 'Unknown'}
                                        </p>
                                        <div className="course-progress">
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress-fill"
                                                    style={{ width: `${course.progress}%` }}
                                                />
                                            </div>
                                            <span className="progress-text">
                                                {course.progress}%
                                            </span>
                                        </div>
                                        <p className="course-status">
                                            {course.completed ? '✅ Completed' : '🔄 In Progress'}
                                        </p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;