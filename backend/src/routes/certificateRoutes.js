const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    generateCertificate,
    getCertificate,
    getUserCertificates
} = require('../controllers/certificateController');

router.post('/generate', protect, generateCertificate);
router.get('/:id', protect, getCertificate);
router.get('/user/certificates', protect, getUserCertificates);

module.exports = router;