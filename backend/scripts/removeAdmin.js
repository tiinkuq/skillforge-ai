const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillforge')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ Connection error:', err));

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

const removeAdmin = async (email) => {
    try {
        // Show all users
        const allUsers = await User.find({}, { name: 1, email: 1, role: 1 });
        console.log('\n📋 All registered users:');
        allUsers.forEach(u => {
            console.log(`   ${u.name} (${u.email}) - Role: ${u.role}`);
        });
        console.log('');

        // Check if admin@skillforgeai.com exists
        const adminUser = await User.findOne({ email: "admin@skillforgeai.com" });
        if (!adminUser) {
            console.log('❌ Admin user (admin@skillforgeai.com) not found!');
            console.log('💡 Please register first or create the user.');
            return;
        }

        // Remove admin from student@test.com
        const student = await User.findOne({ email: "student@test.com" });
        if (student) {
            student.role = "student";
            await student.save();
            console.log(`✅ ${student.name} (${student.email}) role set to student`);
        }

        // Remove admin from instructor@test.com
        const instructor = await User.findOne({ email: "instructor@test.com" });
        if (instructor) {
            instructor.role = "instructor";
            await instructor.save();
            console.log(`✅ ${instructor.name} (${instructor.email}) role set to instructor`);
        }

        // Make sure admin@skillforgeai.com is admin
        adminUser.role = "admin";
        await adminUser.save();
        console.log(`✅ ${adminUser.name} (${adminUser.email}) role set to admin`);

        console.log('\n📋 Updated users:');
        const updatedUsers = await User.find({}, { name: 1, email: 1, role: 1 });
        updatedUsers.forEach(u => {
            console.log(`   ${u.name} (${u.email}) - Role: ${u.role}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
        process.exit(0);
    }
};

removeAdmin();