import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';

const AITutor = ({ courseId, courseTitle }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef(null);
    const { token } = useAuth();
    const showToast = useToast();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post(
                `${API_URL}/ai/chat`,
                {
                    question: input,
                    courseId: courseId,
                    conversationHistory: messages.slice(-5)
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                const aiMessage = {
                    role: 'assistant',
                    content: response.data.reply
                };
                setMessages(prev => [...prev, aiMessage]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            showToast.error('Failed to get AI response');
            
            // Add error message
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Chat Button */}
            <button
                className="ai-tutor-button"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="ai-icon">🤖</span>
                <span className="ai-label">AI Tutor</span>
            </button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="ai-tutor-window"
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="ai-tutor-header">
                            <div className="header-left">
                                <span className="header-icon">🤖</span>
                                <div>
                                    <h3>AI Tutor</h3>
                                    <p>{courseTitle || 'General Assistant'}</p>
                                </div>
                            </div>
                            <button
                                className="close-btn"
                                onClick={() => setIsOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="ai-tutor-messages">
                            {messages.length === 0 ? (
                                <div className="welcome-message">
                                    <div className="welcome-icon">👋</div>
                                    <h4>Welcome to AI Tutor!</h4>
                                    <p>Ask me anything about this course or topic.</p>
                                    <div className="suggestions">
                                        <button
                                            onClick={() => setInput('What is this course about?')}
                                            className="suggestion-btn"
                                        >
                                            What is this course about?
                                        </button>
                                        <button
                                            onClick={() => setInput('Explain the main concepts')}
                                            className="suggestion-btn"
                                        >
                                            Explain the main concepts
                                        </button>
                                        <button
                                            onClick={() => setInput('Give me a summary')}
                                            className="suggestion-btn"
                                        >
                                            Give me a summary
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`message ${msg.role}`}
                                    >
                                        <div className="message-avatar">
                                            {msg.role === 'assistant' ? '🤖' : '👤'}
                                        </div>
                                        <div className="message-content">
                                            <p>{msg.content}</p>
                                            <span className="message-time">
                                                {new Date().toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                            {loading && (
                                <div className="message assistant">
                                    <div className="message-avatar">🤖</div>
                                    <div className="message-content typing-indicator">
                                        <span>●</span>
                                        <span>●</span>
                                        <span>●</span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="ai-tutor-input">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask your AI tutor..."
                                rows={2}
                                disabled={loading}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={loading || !input.trim()}
                            >
                                {loading ? '...' : 'Send'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AITutor;