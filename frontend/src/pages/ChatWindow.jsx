import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { chatService } from '../services/chatService';
import { useToast } from '../context/ToastContext';

const ChatWindow = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { 
        onlineUsers, 
        joinChat, 
        leaveChat, 
        sendMessage, 
        sendTyping, 
        markAsRead,
        isConnected,
        socket
    } = useChat();
    const showToast = useToast();
    
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [isTypingTimeout, setIsTypingTimeout] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        fetchChat();
        joinChat(id);

        return () => {
            leaveChat(id);
        };
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Socket listeners
    useEffect(() => {
        if (!socket) {
            console.log('⚠️ Socket not available');
            return;
        }

        console.log('🎧 Setting up socket listeners for chat:', id);

        const handleNewMessage = (data) => {
            console.log('📩 New message received:', data);
            if (data.chatId === id) {
                // Check if message already exists (avoid duplicates)
                const exists = messages.some(m => 
                    m.content === data.message && 
                    m.sender === data.senderId &&
                    Math.abs(new Date(m.timestamp) - new Date(data.timestamp)) < 2000
                );
                
                if (!exists) {
                    const newMsg = {
                        _id: Date.now().toString(),
                        content: data.message,
                        sender: data.senderId,
                        senderName: data.senderName || 'User',
                        timestamp: data.timestamp || new Date(),
                        read: false
                    };
                    setMessages(prev => [...prev, newMsg]);
                    // Mark as read
                    chatService.markAsRead(id);
                    markAsRead(id);
                }
            }
        };

        const handleUserTyping = (data) => {
            if (data.userId !== user.id) {
                setTypingUser(data.isTyping ? data.userId : null);
            }
        };

        const handleMessagesRead = (data) => {
            if (data.chatId === id) {
                setMessages(prev => prev.map(msg => ({
                    ...msg,
                    read: msg.sender !== user.id ? true : msg.read
                })));
            }
        };

        // Register event listeners
        socket.on('new-message', handleNewMessage);
        socket.on('user-typing', handleUserTyping);
        socket.on('messages-read', handleMessagesRead);

        // Cleanup
        return () => {
            console.log('🧹 Cleaning up socket listeners for chat:', id);
            socket.off('new-message', handleNewMessage);
            socket.off('user-typing', handleUserTyping);
            socket.off('messages-read', handleMessagesRead);
        };
    }, [id, user.id, socket, messages]);

    const fetchChat = async () => {
        try {
            setLoading(true);
            const response = await chatService.getChat(id);
            setChat(response.chat);
            setMessages(response.chat.messages || []);
            
            // Mark messages as read
            await chatService.markAsRead(id);
            markAsRead(id);
        } catch (error) {
            console.error('Error fetching chat:', error);
            showToast.error('Failed to load chat');
            navigate('/chats');
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (!input.trim() || sending) return;

        const messageContent = input.trim();
        setInput('');
        setSending(true);

        try {
            // Send via API
            const response = await chatService.sendMessage(id, messageContent);
            
            // Add message to UI
            const newMessage = response.message;
            setMessages(prev => [...prev, newMessage]);

            // Send via socket for real-time
            const recipient = chat?.participants?.find(p => p._id !== user.id);
            if (sendMessage) {
                sendMessage({
                    chatId: id,
                    message: messageContent,
                    senderId: user.id,
                    recipientId: recipient?._id,
                    senderName: user.name
                });
                console.log('💬 Message sent via socket');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showToast.error('Failed to send message');
            setInput(messageContent);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleTyping = (e) => {
        const value = e.target.value;
        setInput(value);

        if (value.length > 0 && !isTyping) {
            setIsTyping(true);
            sendTyping(id, true);
        } else if (value.length === 0 && isTyping) {
            setIsTyping(false);
            sendTyping(id, false);
        }

        // Clear previous timeout
        if (isTypingTimeout) {
            clearTimeout(isTypingTimeout);
        }

        // Set new timeout to stop typing after 2 seconds of no input
        const timeout = setTimeout(() => {
            if (isTyping) {
                setIsTyping(false);
                sendTyping(id, false);
            }
        }, 2000);
        setIsTypingTimeout(timeout);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader">Loading chat...</div>
            </div>
        );
    }

    if (!chat) {
        return (
            <div className="empty-state">
                <div className="empty-icon">💬</div>
                <h3>Chat not found</h3>
                <Link to="/chats" className="btn-primary">Back to Chats</Link>
            </div>
        );
    }

    const otherUser = chat.participants?.find(p => p._id !== user.id);
    const isOnline = onlineUsers.includes(otherUser?._id);

    // Debug log
    console.log('🔍 Online status check:', {
        otherUserId: otherUser?._id,
        onlineUsers: onlineUsers,
        isOnline: isOnline
    });

    return (
        <div className="chat-window-page">
            {/* Chat Header */}
            <div className="chat-window-header">
                <button className="back-btn" onClick={() => navigate('/chats')}>
                    ←
                </button>
                <div className="chat-user-info">
                    <div className="chat-user-avatar">
                        {otherUser?.avatar?.url ? (
                            <img src={otherUser.avatar.url} alt={otherUser.name} />
                        ) : (
                            <div className="avatar-placeholder">
                                {otherUser?.name?.charAt(0) || 'U'}
                            </div>
                        )}
                        {/* Online Status Indicator */}
                        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
                    </div>
                    <div>
                        <h4>{otherUser?.name || 'Unknown User'}</h4>
                        <span className="user-status">
                            {isOnline ? '🟢 Online' : '⚪ Offline'}
                            {isConnected && <span className="connection-status"> • Connected</span>}
                        </span>
                    </div>
                </div>
                {chat.course && (
                    <Link to={`/courses/${chat.course._id}`} className="course-link">
                        📚 {chat.course.title}
                    </Link>
                )}
            </div>

            {/* Messages */}
            <div className="chat-window-messages">
                {messages.length === 0 ? (
                    <div className="empty-messages">
                        <p>No messages yet. Say hello! 👋</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isOwn = msg.sender?._id === user.id || msg.sender === user.id;
                        const sender = msg.sender?._id ? msg.sender : { name: msg.senderName || 'Unknown' };
                        
                        return (
                            <motion.div
                                key={index}
                                className={`message-wrapper ${isOwn ? 'own' : 'other'}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="message-avatar">
                                    {!isOwn && (sender?.avatar?.url ? (
                                        <img src={sender.avatar.url} alt="" />
                                    ) : (
                                        <div className="avatar-small">
                                            {sender?.name?.charAt(0) || 'U'}
                                        </div>
                                    ))}
                                </div>
                                <div className="message-content">
                                    <div className="message-bubble">
                                        <p>{msg.content}</p>
                                    </div>
                                    <span className="message-time">
                                        {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })
                )}
                {typingUser && (
                    <div className="typing-indicator">
                        <span>●</span>
                        <span>●</span>
                        <span>●</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-window-input">
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleTyping}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    rows={2}
                    disabled={sending}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || sending}
                >
                    {sending ? '...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default ChatWindow;