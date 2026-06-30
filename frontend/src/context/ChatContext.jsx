import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';

const ChatContext = createContext();

const SOCKET_URL = 'http://localhost:5000';

export const ChatProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [newMessageNotification, setNewMessageNotification] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);
    const [socket, setSocket] = useState(null);
    const isConnecting = useRef(false);

    useEffect(() => {
        // Only connect if user and token exist
        if (!user || !token) {
            console.log('⏭️ Skipping socket - no user or token');
            return;
        }

        // Don't connect if already connecting or connected
        if (isConnecting.current) {
            console.log('⏳ Socket connection already in progress...');
            return;
        }

        if (socketRef.current && socketRef.current.connected) {
            console.log('ℹ️ Socket already connected');
            return;
        }

        console.log('🔌 Connecting to socket at:', SOCKET_URL);
        console.log('👤 User:', user.id, user.name);

        isConnecting.current = true;

        try {
            const newSocket = io(SOCKET_URL, {
                auth: {
                    token: token,
                    userId: user.id,
                    userName: user.name
                },
                transports: ['polling', 'websocket'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 10000,
                forceNew: false
            });

            newSocket.on('connect', () => {
                console.log('✅ Socket connected! ID:', newSocket.id);
                setIsConnected(true);
                socketRef.current = newSocket;
                setSocket(newSocket);
                isConnecting.current = false;
                
                // Re-join user room
                if (user.id) {
                    newSocket.emit('join-user-room', user.id);
                }
            });

            newSocket.on('connect_error', (error) => {
                console.log('⚠️ Socket error:', error.message);
                setIsConnected(false);
                isConnecting.current = false;
            });

            newSocket.on('disconnect', (reason) => {
                console.log('🔌 Socket disconnected:', reason);
                setIsConnected(false);
            });

            newSocket.on('reconnect', (attemptNumber) => {
                console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
                setIsConnected(true);
            });

            // Handle online users list from server
            newSocket.on('online-users-list', ({ users }) => {
                console.log('📋 Received online users list:', users);
                const userIds = users.map(u => u.userId);
                // Filter out current user
                const otherUsers = userIds.filter(id => id !== user.id);
                setOnlineUsers(otherUsers);
                console.log('👥 Online users (excluding self):', otherUsers);
            });

            newSocket.on('user-online', ({ userId, userName }) => {
                console.log(`👤 ${userName} (${userId}) online`);
                setOnlineUsers(prev => {
                    if (!prev.includes(userId) && userId !== user.id) {
                        return [...prev, userId];
                    }
                    return prev;
                });
            });

            newSocket.on('user-offline', ({ userId, userName }) => {
                console.log(`👤 ${userName} (${userId}) offline`);
                setOnlineUsers(prev => prev.filter(id => id !== userId));
            });

            newSocket.on('message-notification', (data) => {
                console.log('🔔 New message notification:', data);
                setNewMessageNotification(data);
                setTimeout(() => setNewMessageNotification(null), 5000);
            });

            socketRef.current = newSocket;

            return () => {
                console.log('🧹 Cleaning up socket...');
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                    setIsConnected(false);
                    setSocket(null);
                    isConnecting.current = false;
                }
            };
        } catch (error) {
            console.log('⚠️ Socket init error:', error.message);
            isConnecting.current = false;
        }
    }, [user?.id, token]);

    const joinChat = (chatId) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('join-chat', { chatId });
        } else {
            console.log('⚠️ Cannot join chat: socket not connected');
        }
    };

    const leaveChat = (chatId) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('leave-chat', { chatId });
        }
    };

    const sendMessage = (data) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit('send-message', data);
        } else {
            console.log('⚠️ Cannot send: socket not connected');
        }
    };

    const sendTyping = (chatId, isTyping) => {
        if (socketRef.current && isConnected && user) {
            socketRef.current.emit('typing', { chatId, userId: user.id, isTyping });
        }
    };

    const markAsRead = (chatId) => {
        if (socketRef.current && isConnected && user) {
            socketRef.current.emit('mark-read', { chatId, userId: user.id });
        }
    };

    const isUserOnline = (userId) => {
        return onlineUsers.includes(userId);
    };

    return (
        <ChatContext.Provider value={{
            socket,
            onlineUsers,
            newMessageNotification,
            setNewMessageNotification,
            isConnected,
            joinChat,
            leaveChat,
            sendMessage,
            sendTyping,
            markAsRead,
            isUserOnline
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};