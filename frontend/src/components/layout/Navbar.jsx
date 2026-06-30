import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { user, isAuthenticated, logout, isInstructor, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
        setIsMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-brand">
                    <span className="brand-icon">⚡</span>
                    SkillForge AI
                </Link>

                <button 
                    className="menu-toggle"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <span className="hamburger">☰</span>
                </button>

                <div className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
                    <Link to="/courses" onClick={() => setIsMenuOpen(false)}>
                        Courses
                    </Link>

                    {isAuthenticated && (
                        <>
                            <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                                Dashboard
                            </Link>
                            <Link to="/chats" onClick={() => setIsMenuOpen(false)}>
                                💬 Chats
                            </Link>
                            {isInstructor && (
                                <Link to="/create-course" onClick={() => setIsMenuOpen(false)}>
                                    Create Course
                                </Link>
                            )}
                            {/* Admin Link */}
                            {isAdmin && (
                                <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                                    ⚡ Admin
                                </Link>
                            )}
                        </>
                    )}

                    {isAuthenticated ? (
                        <div className="user-menu">
                            <Link to="/profile" className="user-profile" onClick={() => setIsMenuOpen(false)}>
                                {user?.avatar?.url ? (
                                    <img 
                                        src={user.avatar.url} 
                                        alt={user.name}
                                        className="avatar-small"
                                    />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {user?.name?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <span className="user-name">{user?.name}</span>
                            </Link>
                            
                            {isAdmin && (
                                <span className="badge admin-badge">Admin</span>
                            )}

                            <button onClick={handleLogout} className="btn-logout">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <Link to="/login" className="btn-login">
                                Login
                            </Link>
                            <Link to="/register" className="btn-register">
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;