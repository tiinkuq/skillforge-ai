import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { isAuthenticated, user } = useAuth();

    return (
        <div className="home-page">
            <motion.div 
                className="hero-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1>Welcome to SkillForge AI</h1>
                <p className="hero-subtitle">
                    AI-Powered Learning Platform for the Future
                </p>
                <div className="hero-buttons">
                    {!isAuthenticated ? (
                        <>
                            <Link to="/register" className="btn-primary">
                                Get Started
                            </Link>
                            <Link to="/login" className="btn-secondary">
                                Login
                            </Link>
                        </>
                    ) : (
                        <Link to="/dashboard" className="btn-primary">
                            Go to Dashboard
                        </Link>
                    )}
                </div>
                <div className="hero-stats">
                    <div className="stat">
                        <span className="stat-number">1000+</span>
                        <span className="stat-label">Students</span>
                    </div>
                    <div className="stat">
                        <span className="stat-number">200+</span>
                        <span className="stat-label">Courses</span>
                    </div>
                    <div className="stat">
                        <span className="stat-number">50+</span>
                        <span className="stat-label">Instructors</span>
                    </div>
                </div>
            </motion.div>

            <div className="features-section">
                <h2>Why Choose SkillForge AI?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>AI Tutor</h3>
                        <p>Learn with personalized AI assistance 24/7</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📚</div>
                        <h3>Expert Courses</h3>
                        <p>Learn from industry experts and professionals</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">💬</div>
                        <h3>Real-time Chat</h3>
                        <p>Connect with instructors and peers instantly</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📊</div>
                        <h3>Track Progress</h3>
                        <p>Monitor your learning journey with analytics</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;