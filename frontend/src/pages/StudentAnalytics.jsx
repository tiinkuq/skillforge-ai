import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { courseService } from '../services/courseService';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
    PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line 
} from 'recharts';

const StudentAnalytics = () => {
    const { user } = useAuth();
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState({
        totalCourses: 0,
        completedCourses: 0,
        averageProgress: 0,
        totalTimeSpent: 0
    });

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            // Fetch enrolled courses
            if (user?.enrolledCourses) {
                const courses = await Promise.all(
                    user.enrolledCourses.map(async (enrollment) => {
                        const response = await courseService.getCourse(enrollment.course);
                        return {
                            ...response.course,
                            progress: enrollment.progress || 0,
                            completed: enrollment.completed || false,
                            enrolledAt: enrollment.enrolledAt
                        };
                    })
                );
                setEnrolledCourses(courses);

                // Calculate analytics
                const total = courses.length;
                const completed = courses.filter(c => c.completed).length;
                const avgProgress = total > 0 ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / total) : 0;

                setAnalytics({
                    totalCourses: total,
                    completedCourses: completed,
                    averageProgress: avgProgress,
                    totalTimeSpent: total * 5 // Example: 5 hours per course
                });
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#4f46e5', '#7c3aed', '#ec4899', '#f59e0b', '#10b981'];

    const progressData = enrolledCourses.map(c => ({
        name: c.title?.substring(0, 15) || 'Course',
        progress: c.progress
    }));

    if (loading) {
        return <div className="loading-container"><div className="loader">Loading analytics...</div></div>;
    }

    return (
        <div className="analytics-page">
            <div className="analytics-header">
                <h1>📊 Your Learning Analytics</h1>
                <p>Track your progress and achievements</p>
            </div>

            {/* Stats Cards */}
            <div className="analytics-stats">
                <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-info">
                        <h3>{analytics.totalCourses}</h3>
                        <p>Enrolled Courses</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <h3>{analytics.completedCourses}</h3>
                        <p>Completed</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📈</div>
                    <div className="stat-info">
                        <h3>{analytics.averageProgress}%</h3>
                        <p>Average Progress</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏱️</div>
                    <div className="stat-info">
                        <h3>{analytics.totalTimeSpent}h</h3>
                        <p>Time Spent</p>
                    </div>
                </div>
            </div>

            {/* Progress Chart */}
            <div className="analytics-chart">
                <h3>Course Progress</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={progressData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="progress" fill="#4f46e5" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Certificate Section */}
            <div className="certificate-section">
                <h3>🎓 Your Certificates</h3>
                {enrolledCourses.filter(c => c.completed).length === 0 ? (
                    <p>Complete a course to earn a certificate!</p>
                ) : (
                    <div className="certificate-grid">
                        {enrolledCourses.filter(c => c.completed).map((course) => (
                            <div key={course._id} className="certificate-card">
                                <div className="certificate-icon">🎓</div>
                                <h4>{course.title}</h4>
                                <p>Completed: {new Date(course.completedAt || Date.now()).toLocaleDateString()}</p>
                                <button className="btn-primary" style={{ marginTop: '0.5rem' }}>
                                    Download PDF
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentAnalytics;