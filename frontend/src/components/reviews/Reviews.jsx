import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { reviewService } from '../../services/reviewService';
import { useToast } from '../../context/ToastContext';

const Reviews = ({ courseId, courseInstructorId }) => {
    const { user, isAuthenticated } = useAuth();
    const showToast = useToast();
    const [reviews, setReviews] = useState([]);
    const [ratingStats, setRatingStats] = useState({ averageRating: 0, numberOfReviews: 0 });
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
    const [editingReview, setEditingReview] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [hoveredRating, setHoveredRating] = useState(0);
    
    // Reply Modal State
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyComment, setReplyComment] = useState('');
    const [replyingToReview, setReplyingToReview] = useState(null);

    useEffect(() => {
        fetchReviews();
    }, [courseId, page]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await reviewService.getCourseReviews(courseId, page);
            setReviews(response.reviews);
            setRatingStats(response.ratingStats);
            setTotalPages(response.pagination.pages);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            showToast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) {
            showToast.error('Please login to review');
            return;
        }

        if (newReview.rating === 0) {
            showToast.error('Please select a rating');
            return;
        }

        try {
            const response = await reviewService.createReview(courseId, newReview);
            setReviews([response.review, ...reviews]);
            setRatingStats(response.ratingStats);
            setNewReview({ rating: 0, comment: '' });
            setShowForm(false);
            showToast.success('Review posted successfully!');
        } catch (error) {
            console.error('Error posting review:', error);
            showToast.error(error.response?.data?.message || 'Failed to post review');
        }
    };

    const handleUpdateReview = async (e) => {
        e.preventDefault();
        if (!editingReview) return;

        try {
            const response = await reviewService.updateReview(editingReview._id, {
                rating: editingReview.rating,
                comment: editingReview.comment
            });
            setReviews(reviews.map(r => r._id === response.review._id ? response.review : r));
            setRatingStats(response.ratingStats);
            setEditingReview(null);
            showToast.success('Review updated successfully!');
        } catch (error) {
            console.error('Error updating review:', error);
            showToast.error(error.response?.data?.message || 'Failed to update review');
        }
    };

    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;

        try {
            const response = await reviewService.deleteReview(reviewId);
            setReviews(reviews.filter(r => r._id !== reviewId));
            setRatingStats(response.ratingStats);
            showToast.success('Review deleted successfully');
        } catch (error) {
            console.error('Error deleting review:', error);
            showToast.error(error.response?.data?.message || 'Failed to delete review');
        }
    };

    const handleHelpful = async (reviewId) => {
        if (!isAuthenticated) {
            showToast.error('Please login to mark as helpful');
            return;
        }

        try {
            const response = await reviewService.markHelpful(reviewId);
            setReviews(reviews.map(r => {
                if (r._id === reviewId) {
                    return { ...r, helpfulCount: response.helpfulCount };
                }
                return r;
            }));
        } catch (error) {
            console.error('Error marking helpful:', error);
            showToast.error('Failed to mark as helpful');
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyComment.trim() || replyComment.trim().length < 5) {
            showToast.error('Reply must be at least 5 characters');
            return;
        }

        try {
            const response = await reviewService.replyToReview(replyingToReview._id, replyComment.trim());
            setReviews(reviews.map(r => 
                r._id === replyingToReview._id ? response.review : r
            ));
            showToast.success('Reply posted successfully!');
            setShowReplyModal(false);
            setReplyComment('');
            setReplyingToReview(null);
        } catch (error) {
            console.error('Error posting reply:', error);
            showToast.error(error.response?.data?.message || 'Failed to post reply');
        }
    };

    const renderStars = (rating, interactive = false) => {
        return (
            <div className="stars-container">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`star ${(interactive ? hoveredRating || rating : rating) >= star ? 'filled' : ''}`}
                        onClick={() => interactive && setNewReview({ ...newReview, rating: star })}
                        onMouseEnter={() => interactive && setHoveredRating(star)}
                        onMouseLeave={() => interactive && setHoveredRating(0)}
                        style={{
                            cursor: interactive ? 'pointer' : 'default',
                            fontSize: interactive ? '2rem' : '1.2rem',
                            color: (interactive ? hoveredRating || rating : rating) >= star ? '#f6b83e' : '#e2e8f0',
                            transition: 'color 0.2s'
                        }}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    if (loading && page === 1) {
        return (
            <div className="reviews-loading">
                <div className="loader">Loading reviews...</div>
            </div>
        );
    }

    return (
        <div className="reviews-section">
            {/* Rating Summary */}
            <div className="rating-summary">
                <div className="rating-stats">
                    <div className="average-rating">
                        <span className="rating-number">{ratingStats.averageRating || 0}</span>
                        <span className="rating-label">out of 5</span>
                    </div>
                    <div className="rating-stars-display">
                        {renderStars(Math.round(ratingStats.averageRating || 0))}
                        <span className="review-count">
                            {ratingStats.numberOfReviews} {ratingStats.numberOfReviews === 1 ? 'review' : 'reviews'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Write Review Button - Hide for instructors */}
            {isAuthenticated && 
             user.id !== courseInstructorId && 
             !reviews.some(r => r.user._id === user.id) && (
                <button
                    className="btn-primary"
                    onClick={() => setShowForm(!showForm)}
                    style={{ marginBottom: '1rem' }}
                >
                    {showForm ? 'Cancel' : '✍️ Write a Review'}
                </button>
            )}

            {/* Review Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        className="review-form"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <h3>Write a Review</h3>
                        <form onSubmit={handleSubmitReview}>
                            <div className="form-group">
                                <label>Rating</label>
                                <div className="star-rating-input">
                                    {renderStars(newReview.rating, true)}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Comment</label>
                                <textarea
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    placeholder="Share your experience with this course..."
                                    rows={4}
                                    required
                                    minLength={10}
                                />
                            </div>
                            <button type="submit" className="btn-primary">
                                Submit Review
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reviews List */}
            <div className="reviews-list">
                {reviews.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <h3>No reviews yet</h3>
                        <p>Be the first to review this course!</p>
                    </div>
                ) : (
                    reviews.map((review) => {
                        const isOwn = review.user._id === user?.id;
                        const isEditing = editingReview?._id === review._id;

                        return (
                            <motion.div
                                key={review._id}
                                className="review-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="review-header">
                                    <div className="review-user">
                                        <div className="review-avatar">
                                            {review.user.avatar?.url ? (
                                                <img src={review.user.avatar.url} alt={review.user.name} />
                                            ) : (
                                                <div className="avatar-placeholder">
                                                    {review.user.name?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4>{review.user.name}</h4>
                                            {review.isVerifiedPurchase && (
                                                <span className="verified-badge">✅ Verified Purchase</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="review-meta">
                                        {renderStars(review.rating)}
                                        <span className="review-date">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {isEditing ? (
                                    <form onSubmit={handleUpdateReview} className="edit-review-form">
                                        <div className="form-group">
                                            <div className="star-rating-input">
                                                {renderStars(editingReview.rating, true)}
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <textarea
                                                value={editingReview.comment}
                                                onChange={(e) => setEditingReview({ ...editingReview, comment: e.target.value })}
                                                rows={3}
                                                required
                                                minLength={10}
                                            />
                                        </div>
                                        <div className="edit-actions">
                                            <button type="submit" className="btn-primary">Save</button>
                                            <button
                                                type="button"
                                                className="btn-secondary"
                                                onClick={() => setEditingReview(null)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <p className="review-comment">{review.comment}</p>
                                )}

                                {review.edited && !isEditing && (
                                    <span className="edited-badge">(edited)</span>
                                )}

                                {/* Instructor Reply */}
                                {review.instructorReply && (
                                    <div className="instructor-reply">
                                        <div className="reply-header">
                                            <span className="reply-icon">👨‍🏫</span>
                                            <span className="reply-author">Instructor Response</span>
                                            <span className="reply-date">
                                                {new Date(review.instructorReply.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p>{review.instructorReply.comment}</p>
                                    </div>
                                )}

                                <div className="review-actions">
                                    <button
                                        className="helpful-btn"
                                        onClick={() => handleHelpful(review._id)}
                                    >
                                        👍 {review.helpfulCount || 0} helpful
                                    </button>

                                    {isOwn && !isEditing && (
                                        <>
                                            <button
                                                className="edit-btn"
                                                onClick={() => setEditingReview({ ...review })}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => handleDeleteReview(review._id)}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </>
                                    )}

                                    {/* Reply Button - Only for instructor, not on own reviews */}
                                    {!isOwn && courseInstructorId === user?.id && !review.instructorReply && (
                                        <button
                                            className="reply-btn"
                                            onClick={() => {
                                                setReplyingToReview(review);
                                                setShowReplyModal(true);
                                            }}
                                        >
                                            💬 Reply
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Reply Modal */}
            {showReplyModal && (
                <div className="modal-overlay" onClick={() => setShowReplyModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Reply to Review</h3>
                            <button className="modal-close" onClick={() => setShowReplyModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="original-review">
                                <p><strong>{replyingToReview?.user?.name}</strong> wrote:</p>
                                <p className="original-comment">"{replyingToReview?.comment}"</p>
                                <div className="original-rating">
                                    {renderStars(replyingToReview?.rating || 0)}
                                </div>
                            </div>
                            <form onSubmit={handleReplySubmit}>
                                <div className="form-group">
                                    <label htmlFor="replyComment">Your Reply</label>
                                    <textarea
                                        id="replyComment"
                                        value={replyComment}
                                        onChange={(e) => setReplyComment(e.target.value)}
                                        placeholder="Write your reply to this review..."
                                        rows={4}
                                        required
                                        minLength={5}
                                        maxLength={500}
                                    />
                                    <small>Minimum 5 characters</small>
                                </div>
                                <div className="modal-actions">
                                    <button 
                                        type="button" 
                                        className="btn-secondary" 
                                        onClick={() => {
                                            setShowReplyModal(false);
                                            setReplyComment('');
                                            setReplyingToReview(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Post Reply
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reviews;