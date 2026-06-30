import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
    const { user } = useAuth();
    const location = useLocation();

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: '📊' },
        { path: '/admin/users', label: 'Users', icon: '👥' },
        { path: '/admin/courses', label: 'Courses', icon: '📚' },
        // Comment out for now if you don't have orders
        // { path: '/admin/orders', label: 'Orders', icon: '🛒' },
        // { path: '/admin/revenue', label: 'Revenue', icon: '💰' },
    ];

    return (
        <div className="admin-layout">
            <div className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <h2>⚡ Admin Panel</h2>
                    <div className="admin-user-info">
                        <div className="admin-avatar">
                            {user?.avatar?.url ? (
                                <img src={user.avatar.url} alt={user.name} />
                            ) : (
                                <span>{user?.name?.charAt(0) || 'A'}</span>
                            )}
                        </div>
                        <div>
                            <p className="admin-name">{user?.name}</p>
                            <p className="admin-role">Administrator</p>
                        </div>
                    </div>
                </div>
                <nav className="admin-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <div className="admin-sidebar-footer">
                    <Link to="/dashboard" className="admin-back-btn">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
            <div className="admin-content">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;