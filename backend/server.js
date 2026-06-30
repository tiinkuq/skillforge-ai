const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const courseRoutes = require('./src/routes/courseRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const userRoutes = require('./src/routes/userRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Initialize app
const app = express();
const server = http.createServer(app);

// CORS options
const corsOptions = {
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With']
};

// Socket.io setup
const io = new Server(server, {
    cors: corsOptions,
    transports: ['polling', 'websocket'],
    path: '/socket.io/',
    allowEIO3: true
});

// Make io accessible globally
global.io = io;

// Store connected users
const connectedUsers = new Map();

// Middleware - Apply CORS FIRST
app.use(cors(corsOptions));

// Other middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api', reviewRoutes);
app.use('/api/admin', adminRoutes);
// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: 'SkillForge AI API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Socket.io connection handling - FIXED ONLINE STATUS
io.on('connection', (socket) => {
    console.log('🟢 New client connected:', socket.id);

    // Get user ID from handshake auth
    const userId = socket.handshake.auth.userId;
    const userName = socket.handshake.auth.userName;
    
    if (userId) {
        // Store user connection
        socket.userId = userId;
        socket.userName = userName || 'User';
        connectedUsers.set(userId, { socketId: socket.id, userName: socket.userName });
        
        // Join user's personal room
        socket.join(`user-${userId}`);
        console.log(`👤 User ${socket.userName} (${userId}) joined room user-${userId}`);
        
        // BROADCAST ONLINE STATUS TO ALL OTHER USERS
        io.emit('user-online', { 
            userId, 
            userName: socket.userName,
            status: 'online' 
        });
        console.log(`📢 Broadcast: ${socket.userName} is ONLINE`);
        
        // Send current online users to the newly connected user
        const onlineUsersList = Array.from(connectedUsers.entries()).map(([id, data]) => ({
            userId: id,
            userName: data.userName
        }));
        socket.emit('online-users-list', { users: onlineUsersList });
        console.log(`📋 Sent online users list to ${socket.userName}:`, onlineUsersList.length);
    }

    // Join chat room
    socket.on('join-chat', ({ chatId }) => {
        if (chatId) {
            socket.join(`chat-${chatId}`);
            console.log(`📩 Socket ${socket.id} joined chat ${chatId}`);
            socket.emit('chat-joined', { chatId });
        }
    });

    // Leave chat room
    socket.on('leave-chat', ({ chatId }) => {
        if (chatId) {
            socket.leave(`chat-${chatId}`);
            console.log(`📤 Socket ${socket.id} left chat ${chatId}`);
        }
    });

    // Send message
    socket.on('send-message', (data) => {
        try {
            const { chatId, message, senderId, recipientId } = data;
            console.log(`💬 Message from ${senderId}: ${message.substring(0, 30)}...`);
            
            const messageData = {
                chatId,
                message,
                senderId,
                recipientId,
                senderName: socket.userName || 'User',
                timestamp: new Date(),
                read: false
            };

            // Emit to all users in the chat room
            io.to(`chat-${chatId}`).emit('new-message', messageData);

            // Send notification to recipient
            if (recipientId) {
                io.to(`user-${recipientId}`).emit('message-notification', {
                    chatId,
                    message: message,
                    senderId,
                    senderName: socket.userName || 'Someone',
                    timestamp: new Date()
                });
                console.log(`🔔 Notification sent to user ${recipientId}`);
            }
        } catch (error) {
            console.error('Send message error:', error);
            socket.emit('message-error', { message: 'Failed to send message' });
        }
    });

    // Typing indicator
    socket.on('typing', ({ chatId, userId, isTyping }) => {
        socket.to(`chat-${chatId}`).emit('user-typing', {
            userId,
            userName: socket.userName || 'User',
            isTyping
        });
    });

    // Mark messages as read
    socket.on('mark-read', ({ chatId, userId }) => {
        io.to(`chat-${chatId}`).emit('messages-read', { userId, chatId });
    });

    // Disconnect - BROADCAST OFFLINE STATUS
    socket.on('disconnect', () => {
        console.log('🔴 Client disconnected:', socket.id);
        if (socket.userId) {
            // Remove from connected users
            connectedUsers.delete(socket.userId);
            
            // BROADCAST OFFLINE STATUS TO ALL OTHER USERS
            io.emit('user-offline', { 
                userId: socket.userId,
                userName: socket.userName || 'User',
                status: 'offline' 
            });
            console.log(`📢 Broadcast: ${socket.userName} is OFFLINE`);
        }
    });
});

// Database connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillforge');
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        return false;
    }
};

// Start server
const startServer = async () => {
    const dbConnected = await connectDB();
    
    if (!dbConnected) {
        console.log('⚠️  Starting server without database connection...');
    }

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 API URL: http://localhost:${PORT}/api`);
        console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
        console.log(`🔌 Socket.io server ready on port ${PORT}`);
        console.log(`🌐 CORS enabled for: http://localhost:5173`);
    });
};

startServer();

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
});