const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    checkWishlist
} = require('../controllers/wishlistController');

router.get('/', protect, getWishlist);
router.post('/', protect, addToWishlist);
router.delete('/:courseId', protect, removeFromWishlist);
router.get('/check/:courseId', protect, checkWishlist);

module.exports = router;