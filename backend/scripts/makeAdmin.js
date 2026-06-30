const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillforge')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ Connection error:', err));

// User schema (simplified)
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    role: String,
    avatar: mongoose.Schema.Types.Mixed,
    enrolledCourses: Array,
    isVerified: Boolean,
    createdAt: Date,
    updatedAt: Date
}));

// Update user to admin
const makeAdmin = async (email) => {
    try {
        // First, show all users
        const allUsers = await User.find({}, { name: 1, email: 1, role: 1 });
        console.log('\n📋 All registered users:');
        allUsers.forEach(u => {
            console.log(`   ${u.name} (${u.email}) - Role: ${u.role}`);
        });
        console.log('');

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`❌ User with email "${email}" not found`);
            console.log('💡 Please use one of the emails listed above');
            return;
        }

        const oldRole = user.role;
        user.role = 'admin';
        await user.save();

        console.log(`✅ ${user.name} (${user.email}) updated from ${oldRole} to admin`);
        console.log('🔑 Now login and visit /admin');
    } catch (error) {
        console.error('❌ Error updating user:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
};

// Get email from command line argument
const email = process.argv[2];
if (!email) {
    console.log('❌ Please provide an email: node scripts/makeAdmin.js email@example.com');
    process.exit(1);
}

makeAdmin(email);