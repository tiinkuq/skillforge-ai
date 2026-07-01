import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { wishlistService } from '../../services/wishlistService';
import { useToast } from '../../context/ToastContext';

const WishlistButton = ({ courseId }) => {
    const { isAuthenticated } = useAuth();
    const showToast = useToast();
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated && courseId) {
            checkWishlistStatus();
        }
    }, [courseId, isAuthenticated]);

    const checkWishlistStatus = async () => {
        try {
            const response = await wishlistService.checkWishlist(courseId);
            setIsWishlisted(response.isWishlisted);
        } catch (error) {
            console.error('Error checking wishlist:', error);
        }
    };

    const toggleWishlist = async () => {
        if (!isAuthenticated) {
            showToast.error('Please login to save courses');
            return;
        }

        setLoading(true);
        try {
            if (isWishlisted) {
                await wishlistService.removeFromWishlist(courseId);
                setIsWishlisted(false);
                showToast.success('Removed from wishlist');
            } else {
                await wishlistService.addToWishlist(courseId);
                setIsWishlisted(true);
                showToast.success('Added to wishlist ❤️');
            }
        } catch (error) {
            console.error('Error toggling wishlist:', error);
            showToast.error('Failed to update wishlist');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
            onClick={toggleWishlist}
            disabled={loading}
        >
            <span className="wishlist-icon">
                {isWishlisted ? '❤️' : '🤍'}
            </span>
            {isWishlisted ? 'Saved' : 'Save'}
        </button>
    );
};

export default WishlistButton;