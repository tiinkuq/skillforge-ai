const {
    generateCertificate: generateCert,
    getCertificate: getCert,
    getUserCertificates: getUserCerts
} = require('../services/certificateService');

// @desc    Generate certificate
// @route   POST /api/certificates/generate
// @access  Private
const generateCertificate = async (req, res) => {
    try {
        const { courseId } = req.body;
        const certificate = await generateCert(req.user.id, courseId);
        
        res.status(201).json({
            success: true,
            certificate
        });
    } catch (error) {
        console.error('Generate certificate error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get certificate
// @route   GET /api/certificates/:id
// @access  Private
const getCertificate = async (req, res) => {
    try {
        const certificate = await getCert(req.params.id);
        
        // Check if user is authorized
        if (certificate.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this certificate'
            });
        }

        res.status(200).json({
            success: true,
            certificate
        });
    } catch (error) {
        console.error('Get certificate error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user certificates
// @route   GET /api/certificates/user/certificates
// @access  Private
const getUserCertificates = async (req, res) => {
    try {
        const certificates = await getUserCerts(req.user.id);
        
        res.status(200).json({
            success: true,
            certificates
        });
    } catch (error) {
        console.error('Get user certificates error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    generateCertificate,
    getCertificate,
    getUserCertificates
};