import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { chatService } from '../services/chatService';
import { useToast } from '../context/ToastContext';

const Chats = () => {
    const { user } = useAuth();
    const { onlineUsers, newMessageNotification } = useChat();
    const showToast = useToast();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        if (newMessageNotification) {
            // Refresh chats to show new message
            fetchChats();
            showToast.info(`New message from ${newMessageNotification.senderName || 'someone'}`);
        }
    }, [newMessageNotification]);

    const fetchChats = async () => {
        try {
            setLoading(true);
            const response = await chatService.getChats();
            setChats(response.chats);
        } catch (error) {
            console.error('Error fetching chats:', error);
            showToast.error('Failed to load chats');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader">Loading chats...</div>
            </div>
        );
    }

    return (
        <div className="chats-page">
            <div className="chats-header">
                <h1>Messages</h1>
                <p>Connect with instructors and students</p>
            </div>

            {chats.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">💬</div>
                    <h3>No messages yet</h3>
                    <p>Start a conversation by enrolling in a course or messaging an instructor</p>
                    <Link to="/courses" className="btn-primary">Browse Courses</Link>
                </div>
            ) : (
                <div className="chats-list">
                    {chats.map((chat) => {
                        const otherUser = chat.participants.find(
                            p => p._id !== user.id
                        );
                        const isOnline = onlineUsers.includes(otherUser?._id);
                        const unreadCount = chat.unreadCount || 0;

                        return (
                            <motion.div
                                key={chat._id}
                                className={`chat-item ${unreadCount > 0 ? 'unread' : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Link to={`/chat/${chat._id}`}>
                                    <div className="chat-avatar">
                                        {otherUser?.avatar?.url ? (
                                            <img 
                                                src={otherUser.avatar.url} 
                                                alt={otherUser.name}
                                            />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {otherUser?.name?.charAt(0) || 'U'}
                                            </div>
                                        )}
                                        {isOnline && <span className="online-status" />}
                                    </div>
                                    <div className="chat-info">
                                        <div className="chat-name">
                                            <h4>{otherUser?.name || 'Unknown User'}</h4>
                                            {isOnline && (
                                                <span className="online-badge">Online</span>
                                            )}
                                        </div>
                                        <p className="chat-last-message">
                                            {chat.lastMessage?.content || 'No messages yet'}
                                        </p>
                                        {chat.course && (
                                            <span className="chat-course">
                                                📚 {chat.course.title}
                                            </span>
                                        )}
                                    </div>
                                    <div className="chat-meta">
                                        {chat.lastMessage?.timestamp && (
                                            <span className="chat-time">
                                                {new Date(chat.lastMessage.timestamp).toLocaleDateString()}
                                            </span>
                                        )}
                                        {unreadCount > 0 && (
                                            <span className="unread-badge">{unreadCount}</span>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Chats;