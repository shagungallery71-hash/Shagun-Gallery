// ProductDetails/ProductReviews.jsx - Customer reviews section
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Star, ThumbsUp, Camera, Check, MessageCircle, X, Play, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react'
import { RatingStars, RatingBar, ExpandableSection } from './shared'

// ============================================================================
// MAIN PRODUCT REVIEWS COMPONENT
// ============================================================================
export const ProductReviews = ({
    reviews,
    reviewStats,
    isLoggedIn,
    rating,
    setRating,
    comment,
    setComment,
    onSubmit,
    reviewLoading,
    reviewError,
    reviewSuccess,
    currentPage,
    totalPages,
    onPageChange,
    limit,
    onLimitChange,
    loading
}) => {
    const [selectedMedia, setSelectedMedia] = useState(null)
    const reviewCount = reviewStats?.total_reviews || reviews?.length || 0
    const avgRating = reviewStats?.average_rating || 0

    return (
        <section id="reviews" className="mt-16 relative font-outfit">
            {/* Media Modal */}
            {selectedMedia && (
                <MediaModal
                    media={selectedMedia}
                    onClose={() => setSelectedMedia(null)}
                />
            )}

            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12 border-b border-black/5 pb-4">
                <h2 className="text-xl md:text-2xl font-playfair font-medium text-black">Client Experiences</h2>
                {reviewCount > 0 && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-4 text-amber-500">
                            <RatingStars rating={avgRating} size="sm" />
                        </div>
                        <span className="text-xs text-neutral-500 uppercase tracking-widest">
                            Based on {reviewCount} review{reviewCount > 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
                {/* Rating Overview */}
                <div className="lg:col-span-4">
                    <RatingOverview reviewStats={reviewStats} />

                    {/* Write Review Form moved to left column for modern look */}
                    <div className="mt-12 bg-[#faf9f8] p-6 lg:p-8 border border-black/5">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-black mb-6 flex items-center gap-3">
                            <span className="w-8 h-px bg-black block" />
                            Share Your Thoughts
                        </h3>

                        <ReviewForm
                            isLoggedIn={isLoggedIn}
                            rating={rating}
                            setRating={setRating}
                            comment={comment}
                            setComment={setComment}
                            onSubmit={onSubmit}
                            loading={reviewLoading}
                            error={reviewError}
                            success={reviewSuccess}
                        />
                    </div>
                </div>

                {/* Reviews List */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Items per page selector */}
                    {reviewCount > 0 && (
                        <div className="flex justify-between items-center pb-4 text-xs text-neutral-500 uppercase tracking-widest border-b border-black/5">
                            <span>Showing {reviews?.length || 0} reviews</span>
                            <div className="flex items-center gap-3">
                                <span>Display:</span>
                                <select
                                    value={limit}
                                    onChange={(e) => onLimitChange(Number(e.target.value))}
                                    className="bg-transparent border-b border-black/20 pb-1 focus:border-black outline-none font-semibold text-black"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="space-y-6 min-h-[200px] relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                                <span className="text-[10px] uppercase tracking-[0.3em] font-semibold animate-pulse">Loading</span>
                            </div>
                        )}

                        {reviews?.length > 0 ? (
                            reviews.map((review, idx) => (
                                <ReviewCard
                                    key={review.id || idx}
                                    review={review}
                                    onViewMedia={setSelectedMedia}
                                />
                            ))
                        ) : (
                            <div className="text-center py-20 border border-black/5">
                                <p className="text-sm font-light text-neutral-500 mb-2">No reviews yet.</p>
                                <p className="text-[10px] text-black uppercase tracking-widest font-semibold">Be the first to review this piece.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-black/5">
                            <button
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1 || loading}
                                className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-black disabled:text-neutral-300 transition-colors hover:text-amber-600"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Prev
                            </button>

                            <div className="flex items-center gap-4 text-xs font-semibold">
                                <span className="text-black">{currentPage}</span>
                                <span className="text-neutral-300">/</span>
                                <span className="text-neutral-400">{totalPages}</span>
                            </div>

                            <button
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage === totalPages || loading}
                                className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-black disabled:text-neutral-300 transition-colors hover:text-amber-600"
                            >
                                Next <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

// ============================================================================
// MEDIA MODAL COMPONENT (Lightbox)
// ============================================================================
const MediaModal = ({ media, onClose }) => {
    if (!media) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors z-50"
            >
                <X className="h-6 w-6" strokeWidth={1} />
            </button>

            {/* Content */}
            <div className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center p-4">
                {media.type === 'image' ? (
                    <img
                        src={media.url}
                        alt="Full view"
                        className="max-w-full max-h-full object-contain"
                    />
                ) : (
                    <video
                        src={media.url}
                        className="max-w-full max-h-full"
                        controls
                        autoPlay
                    />
                )}
            </div>
        </div>
    )
}

// ============================================================================
// REVIEW CARD COMPONENT
// ============================================================================
const ReviewCard = ({ review, onViewMedia }) => {
    const [isHelpful, setIsHelpful] = useState(false)

    // Parse images and videos if they are strings
    const reviewImages = typeof review.images === 'string'
        ? JSON.parse(review.images || '[]')
        : (review.images || [])
    const reviewVideos = typeof review.videos === 'string'
        ? JSON.parse(review.videos || '[]')
        : (review.videos || [])

    return (
        <div className="py-6 border-b border-black/5 last:border-0">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <RatingStars rating={review.rating} size="sm" showValue={false} />
                        {review.verified && (
                            <span className="flex items-center gap-1 text-[9px] text-neutral-500 uppercase tracking-widest">
                                <Check className="h-3 w-3" strokeWidth={1.5} /> Verified
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
                    {review.created_at ? new Date(review.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    }) : 'Recent'}
                </p>
            </div>

            {review.comment && (
                <p className="text-black text-sm font-light leading-relaxed mb-4">{review.comment}</p>
            )}

            {/* Review Media Gallery */}
            {(reviewImages.length > 0 || reviewVideos.length > 0) && (
                <div className="flex flex-wrap gap-3 mb-6">
                    {/* Images */}
                    {reviewImages.map((img, i) => (
                        <div
                            key={`img-${i}`}
                            onClick={() => onViewMedia({ type: 'image', url: img })}
                            className="group relative h-24 w-20 overflow-hidden cursor-pointer border border-black/5"
                        >
                            <img
                                src={img}
                                alt="Review"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <Maximize2 className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
                            </div>
                        </div>
                    ))}

                    {/* Videos */}
                    {reviewVideos.map((vid, i) => (
                        <div
                            key={`vid-${i}`}
                            onClick={() => onViewMedia({ type: 'video', url: vid })}
                            className="group relative h-24 w-20 overflow-hidden cursor-pointer border border-black/5 bg-black"
                        >
                            <video
                                src={vid}
                                className="w-full h-full object-cover opacity-80"
                                muted
                                preload="metadata"
                            />
                            {/* Play Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-rose-900/40 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-rose-500/80 backdrop-blur-sm shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Play className="h-3 w-3 text-white fill-white ml-0.5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between pt-2">
                <button
                    onClick={() => setIsHelpful(!isHelpful)}
                    className={`flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold transition-colors ${isHelpful ? 'text-rose-600' : 'text-neutral-400 hover:text-amber-600'
                        }`}
                >
                    <ThumbsUp className={`h-3 w-3 ${isHelpful ? 'fill-rose-100 text-rose-600' : ''}`} strokeWidth={1.5} />
                    Helpful {isHelpful && '(1)'}
                </button>
                {review.user_name && (
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400">By {review.user_name}</span>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// RATING OVERVIEW COMPONENT
// ============================================================================
const RatingOverview = ({ reviewStats }) => {
    const avgRating = reviewStats?.average_rating || 0
    const totalReviews = reviewStats?.total_reviews || 0
    const distribution = reviewStats?.rating_distribution || {}

    return (
        <div className="border border-black/5 p-6 md:p-8">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-black mb-6">Rating Snapshot</h3>
            <div className="flex items-end gap-4 mb-8">
                <div className="text-5xl font-playfair font-medium text-black leading-none">
                    {avgRating.toFixed(1)}
                </div>
                <div className="pb-1">
                    <RatingStars rating={avgRating} size="sm" showValue={false} />
                </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-3">
                {[5, 4, 3, 2, 1].map(ratingNum => (
                    <div key={ratingNum} className="flex items-center gap-3">
                        <span className="text-[10px] font-semibold text-black">{ratingNum}</span>
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                        <div className="flex-1 h-1 bg-neutral-100 overflow-hidden rounded-full">
                            <div 
                                className="h-full bg-amber-400 transition-all duration-1000 rounded-full" 
                                style={{ width: `${totalReviews > 0 ? ((distribution[ratingNum] || 0) / totalReviews) * 100 : 0}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-neutral-400 w-6 text-right">{distribution[ratingNum] || 0}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ============================================================================
// REVIEW FORM COMPONENT
// ============================================================================
const ReviewForm = ({
    isLoggedIn,
    rating,
    setRating,
    comment,
    setComment,
    onSubmit,
    loading,
    error,
    success
}) => {
    if (!isLoggedIn) {
        return (
            <div className="text-center py-6">
                <p className="text-xs font-light text-neutral-600 mb-6">Please sign in to write an experience.</p>
                <Link
                    to="/login"
                    className="inline-block px-8 py-3 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-800 transition-colors"
                >
                    Sign In to Continue
                </Link>
            </div>
        )
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Rating Select */}
            <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-black mb-3">
                    Your Rating
                </label>
                <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <Star
                                className={`h-6 w-6 transition-colors ${star <= rating ? 'text-black' : 'text-neutral-200'
                                    }`}
                                fill={star <= rating ? 'black' : 'none'}
                                strokeWidth={1}
                            />
                        </button>
                    ))}
                    <span className="ml-3 text-xs text-neutral-500 font-semibold">{rating}/5</span>
                </div>
            </div>

            {/* Comment */}
            <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-black mb-3">
                    Your Review
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="w-full bg-transparent border-b border-black/20 focus:border-black py-2 text-sm font-light text-black outline-none resize-none transition-colors placeholder:text-neutral-400"
                    placeholder="Describe your experience..."
                />
            </div>

            {/* Image Upload */}
            <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold text-black mb-3">
                    Add Media (Optional)
                </label>
                <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    name="media"
                    className="w-full text-xs text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border file:border-black file:text-[10px] file:uppercase file:tracking-[0.2em] file:font-semibold file:bg-transparent file:text-black hover:file:bg-black hover:file:text-white transition-all cursor-pointer"
                />
            </div>

            {/* Status Messages */}
            {error && (
                <p className="text-[10px] uppercase tracking-widest text-red-500 font-semibold border border-red-200 p-3">{error}</p>
            )}
            {success && (
                <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-semibold border border-emerald-200 p-3">{success}</p>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Submitting...' : 'Post Review'}
            </button>
        </form>
    )
}

// ============================================================================
// FAQ SECTION COMPONENT
// ============================================================================
export const FAQSection = ({ faqs }) => {
    if (!faqs || faqs.length === 0) return null

    return (
        <section className="max-w-4xl mx-auto font-outfit">
            <h2 className="text-xl md:text-2xl font-playfair font-medium text-black mb-10 text-center">
                Frequently Asked Questions
            </h2>
            <div className="space-y-4">
                {faqs.map((faq, idx) => (
                    <div key={idx} className="border-b border-black/10 pb-4">
                        <ExpandableSection
                            title={faq.question}
                            defaultOpen={idx === 0}
                        >
                            <p className="text-neutral-600 font-light text-sm pt-4 pb-2">{faq.answer}</p>
                        </ExpandableSection>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default ProductReviews
