const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Course = require('../models/Course');
const crypto = require('crypto');

// Generate certificate ID
const generateCertificateId = () => {
    const prefix = 'SKF';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};

// Generate certificate
const generateCertificate = async (userId, courseId) => {
    try {
        const user = await User.findById(userId);
        const course = await Course.findById(courseId);

        if (!user || !course) {
            throw new Error('User or course not found');
        }

        // Check if certificate already exists
        let certificate = await Certificate.findOne({ user: userId, course: courseId });
        if (certificate) {
            return certificate;
        }

        // Create certificate
        const certificateId = generateCertificateId();
        certificate = await Certificate.create({
            user: userId,
            course: courseId,
            certificateId
        });

        // Generate download URL
        certificate.downloadUrl = `${process.env.FRONTEND_URL}/certificates/${certificate._id}`;
        await certificate.save();

        return certificate;
    } catch (error) {
        console.error('Certificate generation error:', error);
        throw error;
    }
};

// Get certificate by ID
const getCertificate = async (certificateId) => {
    try {
        const certificate = await Certificate.findById(certificateId)
            .populate('user', 'name email')
            .populate('course', 'title instructor')
            .populate('course.instructor', 'name');

        if (!certificate) {
            throw new Error('Certificate not found');
        }

        return certificate;
    } catch (error) {
        console.error('Get certificate error:', error);
        throw error;
    }
};

// Get user certificates
const getUserCertificates = async (userId) => {
    try {
        const certificates = await Certificate.find({ user: userId })
            .populate('course', 'title thumbnail')
            .sort({ issuedAt: -1 });

        return certificates;
    } catch (error) {
        console.error('Get user certificates error:', error);
        throw error;
    }
};

module.exports = {
    generateCertificate,
    getCertificate,
    getUserCertificates
};