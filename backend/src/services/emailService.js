const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Send email
const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const mailOptions = {
            from: `"SkillForge AI" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
            text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email error:', error);
        throw error;
    }
};

// Welcome email
const sendWelcomeEmail = async (user) => {
    const html = `
        <h1>Welcome to SkillForge AI!</h1>
        <p>Hi ${user.name},</p>
        <p>Thank you for joining SkillForge AI - your AI-powered learning platform.</p>
        <p>Get started by exploring our course catalog:</p>
        <a href="${process.env.FRONTEND_URL}/courses" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Browse Courses</a>
        <p>Happy learning!</p>
        <p>The SkillForge Team</p>
    `;

    return sendEmail({
        to: user.email,
        subject: 'Welcome to SkillForge AI! 🎉',
        html
    });
};

// Enrollment confirmation
const sendEnrollmentEmail = async (user, course) => {
    const html = `
        <h1>You're Enrolled! 🎓</h1>
        <p>Hi ${user.name},</p>
        <p>You have successfully enrolled in <strong>${course.title}</strong>.</p>
        <p>Start learning now:</p>
        <a href="${process.env.FRONTEND_URL}/courses/${course._id}" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Course</a>
        <p>Happy learning!</p>
        <p>The SkillForge Team</p>
    `;

    return sendEmail({
        to: user.email,
        subject: `Enrolled: ${course.title}`,
        html
    });
};

// New message notification
const sendNewMessageEmail = async (recipient, sender, message, courseTitle) => {
    const html = `
        <h1>New Message 💬</h1>
        <p>Hi ${recipient.name},</p>
        <p>You have a new message from <strong>${sender.name}</strong>:</p>
        <blockquote style="border-left: 4px solid #4f46e5; padding-left: 16px; margin: 16px 0;">
            ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}
        </blockquote>
        ${courseTitle ? `<p>Regarding: ${courseTitle}</p>` : ''}
        <a href="${process.env.FRONTEND_URL}/chats" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Message</a>
        <p>The SkillForge Team</p>
    `;

    return sendEmail({
        to: recipient.email,
        subject: `New message from ${sender.name}`,
        html
    });
};

// Password reset email
const sendPasswordResetEmail = async (user, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const html = `
        <h1>Reset Your Password</h1>
        <p>Hi ${user.name},</p>
        <p>You requested to reset your password. Click the link below:</p>
        <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link expires in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>The SkillForge Team</p>
    `;

    return sendEmail({
        to: user.email,
        subject: 'Reset Your Password',
        html
    });
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendEnrollmentEmail,
    sendNewMessageEmail,
    sendPasswordResetEmail
};