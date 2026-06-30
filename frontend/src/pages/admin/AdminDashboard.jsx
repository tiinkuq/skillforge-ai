import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const showToast = useToast();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await adminService.getStats();
            setStats(response.stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
            showToast.error('Failed to load statistics');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader">Loading dashboard...</div>
            </div>
        );
    }

    const COLORS = ['#4f46e5', '#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
    const pieData = stats?.categoryDistribution?.map(cat => ({
        name: cat._id || 'Other',
        value: cat.count
    })) || [];

    const userGrowthData = stats?.userGrowth?.map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        users: item.count
    })) || [];

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1>Dashboard</h1>
                <p>Platform overview and statistics</p>
            </div>

            {/* Stats Cards */}
            <div className="admin-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon users">👥</div>
                    <div className="stat-info">
                        <h3>{stats?.totalUsers || 0}</h3>
                        <p>Total Users</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon courses">📚</div>
                    <div className="stat-info">
                        <h3>{stats?.totalCourses || 0}</h3>
                        <p>Published Courses</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon reviews">⭐</div>
                    <div className="stat-info">
                        <h3>{stats?.totalReviews || 0}</h3>
                        <p>Total Reviews</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon revenue">💰</div>
                    <div className="stat-info">
                        <h3>${stats?.totalRevenue?.toFixed(2) || '0.00'}</h3>
                        <p>Total Revenue</p>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="admin-charts-row">
                <div className="admin-chart-card">
                    <h3>User Growth (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="users" 
                                stroke="#4f46e5" 
                                strokeWidth={2}
                                dot={{ fill: '#4f46e5' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="admin-chart-card">
                    <h3>Course Categories</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Users */}
            <div className="admin-table-section">
                <div className="table-header">
                    <h3>Recent Users</h3>
                    <Link to="/admin/users" className="view-all">View All →</Link>
                </div>
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recentUsers?.map((user) => (
                                <tr key={user._id}>
                                    <td>
                                        <div className="user-cell">
                                            {user.avatar?.url ? (
                                                <img src={user.avatar.url} alt={user.name} className="user-avatar-small" />
                                            ) : (
                                                <div className="user-avatar-placeholder">
                                                    {user.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                            <span>{user.name}</span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge ${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Courses */}
            <div className="admin-table-section">
                <div className="table-header">
                    <h3>Recent Courses</h3>
                    <Link to="/admin/courses" className="view-all">View All →</Link>
                </div>
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Instructor</th>
                                <th>Price</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.recentCourses?.map((course) => (
                                <tr key={course._id}>
                                    <td>{course.title}</td>
                                    <td>{course.instructor?.name || 'Unknown'}</td>
                                    <td>${course.price || 0}</td>
                                    <td>
                                        <span className={`status-badge ${course.isPublished ? 'published' : 'draft'}`}>
                                            {course.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;