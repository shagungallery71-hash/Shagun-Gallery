import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Star, ThumbsUp, ThumbsDown, Flag, Trash2,
    Check, X, Search, Filter, RefreshCw, MessageSquare
} from 'lucide-react';
import { adminApi } from './index';
import { Button, Card, Badge, Skeleton } from '../../components/ui';
import AdminLayout from './AdminLayout';

// Star Rating Display
const StarRating = ({ rating }) => (
    <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`w-4 h-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
            />
        ))}
        <span className="text-sm text-gray-500 ml-1">({rating})</span>
    </div>
);

// Review Card
const ReviewCard = ({ review, onApprove, onDelete, deleting }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-gray-100 p-4 hover:bg-gray-50/50"
        >
            <div className="flex gap-4">
                {/* Product Image */}
                <Link to={`/product/${review.product_id}`} className="shrink-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                        {review.product_image ? (
                            <img src={review.product_image} alt={review.product_name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                        )}
                    </div>
                </Link>

                {/* Review Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div>
                            <Link to={`/product/${review.product_id}`} className="font-medium text-gray-900 hover:text-primary">
                                {review.product_name || `Product #${review.product_id}`}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                                <StarRating rating={review.rating} />
                                {review.is_verified && (
                                    <Badge variant="success" size="sm"><Check className="w-3 h-3" /> Verified</Badge>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium">{review.user_name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString('en-IN')}
                            </p>
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">{review.comment || 'No comment provided'}</p>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                        {!review.is_approved && (
                            <Button
                                onClick={() => onApprove(review.id, true)}
                                variant="success"
                                size="sm"
                                leftIcon={<Check className="w-4 h-4" />}
                            >
                                Approve
                            </Button>
                        )}
                        {review.is_approved && (
                            <Button
                                onClick={() => onApprove(review.id, false)}
                                variant="outline"
                                size="sm"
                                leftIcon={<X className="w-4 h-4" />}
                            >
                                Unapprove
                            </Button>
                        )}
                        <Button
                            onClick={() => onDelete(review.id)}
                            loading={deleting === review.id}
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            leftIcon={<Trash2 className="w-4 h-4" />}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Main Reviews Management
export default function AdminReviews() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        rating: '',
        search: '',
        page: 1,
    });
    const [pagination, setPagination] = useState({});
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, avgRating: 0 });

    // Fetch reviews
    const fetchReviews = async () => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                limit: 20,
                ...(filters.status && { status: filters.status }),
                ...(filters.rating && { rating: filters.rating }),
                ...(filters.search && { search: filters.search }),
            };

            const data = await adminApi.getReviews(params);
            const reviewsList = data.reviews || [];
            setReviews(reviewsList);
            setPagination(data.pagination || {});

            // Calculate average rating from reviews if not provided
            let avgRating = parseFloat(data.stats?.avg_rating) || 0;
            if (!avgRating && reviewsList.length > 0) {
                avgRating = reviewsList.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsList.length;
            }

            setStats({
                total: data.stats?.total || reviewsList.length,
                pending: data.stats?.pending || 0,
                approved: data.stats?.approved || reviewsList.length,
                avgRating: avgRating,
            });
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle search submit
    const handleSearch = () => {
        setFilters(prev => ({ ...prev, page: 1 }));
        fetchReviews();
    };

    useEffect(() => {
        fetchReviews();
    }, [filters.status, filters.rating, filters.page]);

    // Approve/Unapprove review
    const handleApprove = async (reviewId, approve) => {
        try {
            await adminApi.approveReview(reviewId, approve);
            fetchReviews();
        } catch (error) {
            console.error('Failed to update review:', error);
        }
    };

    // Delete review
    const handleDelete = async (reviewId) => {
        if (!confirm('Are you sure you want to delete this review?')) return;

        setDeleting(reviewId);
        try {
            await adminApi.deleteReview(reviewId);
            fetchReviews();
        } catch (error) {
            console.error('Failed to delete review:', error);
        } finally {
            setDeleting(null);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
                        <p className="text-gray-500">Manage product reviews</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 text-center" hover={false}>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-sm text-gray-500">Total Reviews</p>
                    </Card>
                    <Card className="p-4 text-center" hover={false}>
                        <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
                        <p className="text-sm text-gray-500">Pending</p>
                    </Card>
                    <Card className="p-4 text-center" hover={false}>
                        <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
                        <p className="text-sm text-gray-500">Approved</p>
                    </Card>
                    <Card className="p-4 text-center" hover={false}>
                        <div className="flex items-center justify-center gap-1">
                            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                            <span className="text-2xl font-bold">{stats.avgRating?.toFixed(1) || '0.0'}</span>
                        </div>
                        <p className="text-sm text-gray-500">Avg Rating</p>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="p-4 mb-6" hover={false}>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px] flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by product name or comment..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                                />
                            </div>
                            <Button onClick={handleSearch} variant="primary" size="sm">
                                Search
                            </Button>
                        </div>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            className="px-4 py-2 border border-gray-200 rounded-lg"
                        >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                        </select>
                        <select
                            value={filters.rating}
                            onChange={(e) => setFilters({ ...filters, rating: e.target.value, page: 1 })}
                            className="px-4 py-2 border border-gray-200 rounded-lg"
                        >
                            <option value="">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                        <Button variant="outline" onClick={fetchReviews}>
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </Card>

                {/* Reviews List */}
                <Card className="overflow-hidden" hover={false}>
                    {loading ? (
                        <div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="p-16 text-center">
                            <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No reviews found</p>
                        </div>
                    ) : (
                        <div>
                            {reviews.map((review) => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    onApprove={handleApprove}
                                    onDelete={handleDelete}
                                    deleting={deleting}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Page {pagination.page} of {pagination.totalPages}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                    disabled={filters.page <= 1}
                                    variant="outline"
                                    size="sm"
                                >
                                    Previous
                                </Button>
                                <Button
                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                    disabled={filters.page >= pagination.totalPages}
                                    variant="outline"
                                    size="sm"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
