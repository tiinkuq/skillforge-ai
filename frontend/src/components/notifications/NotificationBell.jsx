import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../../context/ToastContext';

const NotificationBell = () => {
    const { user, isAuthenticated } = useAuth();
    const { socket } = useSocket();
    const showToast = useToast();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const bellRef = useRef(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (socket) {
            socket.on('new-notification', (notification) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
                showToast.info(notification.title);
            });
        }

        return () => {
            if (socket) {
                socket.off('new-notification');
            }
        };
    }, [socket, showToast]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (bellRef.current && !bellRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationService.getNotifications();
            setNotifications(response.notifications);
            setUnreadCount(response.unreadCount);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationService.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n =>
                    n._id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, read: true }))
            );
            setUnreadCount(0);
            showToast.success('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (notificationId) => {
        try {
            await notificationService.deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            if (!notifications.find(n => n._id === notificationId)?.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'message': return '💬';
            case 'enrollment': return '📚';
            case 'review': return '⭐';
            case 'course_published': return '🚀';
            case 'welcome': return '👋';
            case 'certificate_earned': return '🎓';
            default: return '🔔';
        }
    };

    if (!isAuthenticated) return null;

    return (
        <div className="notification-bell" ref={bellRef}>
            <button
                className="bell-button"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="unread-badge">{unreadCount}</span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="notification-dropdown"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="notification-header">
                            <h3>Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    className="mark-all-read"
                                    onClick={handleMarkAllAsRead}
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="notification-list">
                            {loading ? (
                                <div className="loading-spinner">Loading...</div>
                            ) : notifications.length === 0 ? (
                                <div className="empty-notifications">
                                    <span className="empty-icon">🎉</span>
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                        onClick={() => {
                                            if (!notification.read) {
                                                handleMarkAsRead(notification._id);
                                            }
                                            if (notification.link) {
                                                window.location.href = notification.link;
                                            }
                                        }}
                                    >
                                        <div className="notification-icon">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="notification-content">
                                            <div className="notification-title">
                                                {notification.title}
                                            </div>
                                            <div className="notification-message">
                                                {notification.message}
                                            </div>
                                            <div className="notification-time">
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button
                                            className="notification-delete"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(notification._id);
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="notification-footer">
                            <Link to="/notifications" onClick={() => setIsOpen(false)}>
                                View All
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;