import { Link } from 'react-router-dom';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-grid">
                    <div className="footer-section">
                        <h3>SkillForge AI</h3>
                        <p>AI-Powered Learning Platform</p>
                        <p className="footer-tagline">
                            Empowering learners with AI-driven education
                        </p>
                    </div>

                    <div className="footer-section">
                        <h4>Platform</h4>
                        <ul>
                            <li><Link to="/courses">Courses</Link></li>
                            <li><Link to="/">About</Link></li>
                            <li><Link to="/">Blog</Link></li>
                            <li><Link to="/">Community</Link></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Support</h4>
                        <ul>
                            <li><Link to="/">Help Center</Link></li>
                            <li><Link to="/">Contact</Link></li>
                            <li><Link to="/">Privacy Policy</Link></li>
                            <li><Link to="/">Terms of Service</Link></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Connect</h4>
                        <div className="social-links">
                            <a href="#" target="_blank" rel="noopener noreferrer">
                                <span className="social-icon">🐦</span>
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer">
                                <span className="social-icon">💼</span>
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer">
                                <span className="social-icon">📺</span>
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer">
                                <span className="social-icon">📱</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; {currentYear} SkillForge AI. All rights reserved.</p>
                    <p className="footer-version">v1.0.0</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;