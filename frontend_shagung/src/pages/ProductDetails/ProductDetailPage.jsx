// ProductDetails/ProductDetailPage.jsx - Main product detail page
import { useParams, Link } from 'react-router-dom'
import { useRef, useEffect, useState } from 'react'
import { Package } from 'lucide-react'
import { motion } from 'framer-motion'

// API and Context
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ToastContext'

// SEO
import { ProductDetailSEO } from '../../components/SEO'

// Redux
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, removeFromCart, selectCartItems } from '../../store/slices/cartSlice'

// Layout Components
import Footer from '../../components/Footer'
import { StickyNavbar, BreadcrumbNavigator } from '../../components/UtilityUx'

// Local Components
import { ProductLoadingSkeleton } from './shared'
import { ImageGallery } from './ImageGallery'
import { ProductInfo } from './ProductInfo'
import { SizeSelector, ColorSelector, QuantitySelector } from './ProductSelectors'
import { ActionButtons, ViewCartLink, ShippingInfoCard, TrustBadgesSection, PincodeChecker } from './ProductActions'
import { ProductTabs } from './ProductTabs'
import { ProductReviews, FAQSection } from './ProductReviews'
import { RelatedProducts, AllProductsSlider } from './RelatedProducts'

// ============================================================================
// MAIN PRODUCT DETAIL PAGE
// ============================================================================
export default function ProductDetailPage() {
    const { id } = useParams()

    // Product State
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [relatedProducts, setRelatedProducts] = useState([])

    // Selection State
    const [selectedSize, setSelectedSize] = useState('')
    const [selectedColor, setSelectedColor] = useState('')
    const [quantity, setQuantity] = useState(1)
    const [isDesktop, setIsDesktop] = useState(false)
    const [isWishlisted, setIsWishlisted] = useState(false)
    const [activeTab, setActiveTab] = useState('description')
    const tabsRef = useRef(null)

    // Reviews State
    const [reviewsList, setReviewsList] = useState([])
    const [reviewsPage, setReviewsPage] = useState(1)
    const [reviewsLimit, setReviewsLimit] = useState(5)
    const [reviewsTotal, setReviewsTotal] = useState(0)
    const [reviewsTotalPages, setReviewsTotalPages] = useState(1)
    const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false)

    // Review Form State
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [reviewStatus, setReviewStatus] = useState('')
    const [reviewError, setReviewError] = useState('')
    const [reviewLoading, setReviewLoading] = useState(false)

    // Context & Redux
    const dispatch = useDispatch()
    const cartItems = useSelector(selectCartItems)
    const { user, token } = useAuth()
    const { showToast } = useToast()

    // =========================================================================
    // FETCH PRODUCT DATA
    // =========================================================================
    useEffect(() => {
        setLoading(true)
        setProduct(null)
        setRelatedProducts([])

        api.productDetail(id)
            .then((p) => {
                setProduct(p)
                setLoading(false)

                // Fetch reviews and related products IN PARALLEL (non-blocking)
                Promise.all([
                    fetchReviews(1, 5),
                    api.relatedProducts(id)
                        .then(res => {
                            if (res.success) {
                                setRelatedProducts(res.products || [])
                            }
                        })
                        .catch(err => console.error('Failed to fetch related products:', err))
                ])
            })
            .catch((err) => {
                console.error("Failed to fetch product:", err)
                setProduct(null)
                setLoading(false)
            })
    }, [id])

    // =========================================================================
    // CHECK WISHLIST STATUS
    // =========================================================================
    useEffect(() => {
        async function checkWishlistStatus() {
            if (!user || !token || !product?.id) return
            try {
                const response = await api.checkWishlist(product.id, token)
                setIsWishlisted(response?.inWishlist || response?.isWishlisted || false)
            } catch (err) {
                console.log('Could not check wishlist status')
            }
        }
        checkWishlistStatus()
    }, [user, token, product?.id])

    // =========================================================================
    // RESPONSIVE CHECK
    // =========================================================================
    useEffect(() => {
        if (typeof window === 'undefined') return
        const mql = window.matchMedia('(min-width: 1024px)')
        const handleChange = (e) => setIsDesktop(e.matches)
        setIsDesktop(mql.matches)
        mql.addEventListener('change', handleChange)
        return () => mql.removeEventListener('change', handleChange)
    }, [])

    // =========================================================================
    // GET SELECTED VARIANT
    // =========================================================================
    const getSelectedVariant = () => {
        if (!product?.variants) return null
        return product.variants.find(v =>
            v.size === selectedSize &&
            (selectedColor ? v.color === selectedColor : true)
        ) || product.variants.find(v => v.size === selectedSize)
    }

    const selectedVariant = getSelectedVariant()

    const isOnSale = product?.on_sale || (product?.sale_price && product?.sale_price < product?.price)
    const basePrice = selectedVariant?.price ?? product?.price ?? 0
    const baseComparePrice = selectedVariant?.compare_at_price ?? product?.compare_at_price ?? 0
    let displayPrice = parseFloat(basePrice)
    let displayComparePrice = parseFloat(baseComparePrice)

    if (isOnSale) {
        if (product && product.sale_price) {
            displayPrice = parseFloat(product.sale_price)
            if (!displayComparePrice || displayComparePrice <= displayPrice) {
                displayComparePrice = parseFloat(product.price)
            }
        }
    }

    displayPrice = Math.round(displayPrice)
    if (displayComparePrice <= displayPrice) {
        displayComparePrice = null
    }

    // =========================================================================
    // CART LOGIC
    // =========================================================================
    const cartItem = cartItems.find(
        (i) => (i.id === product?.id || i.product_id === product?.id) &&
            ((i.size || '') === (selectedSize || '') || !i.size)
    )

    const handleAddToCart = () => {
        if (!product) return

        if (product.available_sizes?.length > 0 && !selectedSize) {
            showToast('PLEASE SELECT A SIZE', 'warning')
            return
        }

        if (cartItem) {
            dispatch(removeFromCart(cartItem.id || cartItem.product_id))
                .unwrap()
                .then(() => showToast('Removed from cart', 'info'))
                .catch((err) => showToast(err || 'Failed to remove from cart', 'error'))
        } else {
            dispatch(addToCart({
                product: {
                    ...product,
                    size: selectedSize,
                    color: selectedColor,
                    color_code: selectedVariant?.color_code,
                    price: displayPrice
                },
                quantity: quantity,
                variantId: selectedVariant?.id
            })).unwrap()
                .then(() => showToast('Added to bag successfully', 'success'))
                .catch((err) => showToast(err || 'Failed to add to cart', 'error'))
        }
    }

    const [wishlistLoading, setWishlistLoading] = useState(false)

    const handleToggleWishlist = async () => {
        if (!product) return
        if (!user || !token) {
            showToast('Please sign in to save items', 'warning')
            return
        }

        setWishlistLoading(true)
        try {
            if (isWishlisted) {
                await api.removeFromWishlist(product.id, token)
                setIsWishlisted(false)
                showToast('Removed from saved items', 'info')
            } else {
                await api.addToWishlist(product.id, token)
                setIsWishlisted(true)
                showToast('Added to saved items', 'success')
            }
        } catch (err) {
            showToast(err.message || 'Failed to update saved items', 'error')
        } finally {
            setWishlistLoading(false)
        }
    }

    const fetchReviews = async (page = 1, limit = 5) => {
        if (!id) return
        try {
            setReviewsLoadingMore(true)
            const res = await api.getReviews(id, page, limit)
            if (res.success) {
                setReviewsList(res.reviews)
                setReviewsPage(page)
                setReviewsLimit(limit)
                if (res.pagination) {
                    setReviewsTotal(res.pagination.total)
                    setReviewsTotalPages(res.pagination.totalPages)
                }
            }
        } catch (err) {
            console.error('Failed to fetch reviews:', err)
        } finally {
            setReviewsLoadingMore(false)
        }
    }

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= reviewsTotalPages) {
            fetchReviews(newPage, reviewsLimit)
            document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const handleLimitChange = (newLimit) => {
        fetchReviews(1, newLimit)
    }

    const handleSubmitReview = async (e) => {
        e.preventDefault()
        if (!product) return

        try {
            setReviewLoading(true)
            setReviewError('')
            setReviewStatus('')

            const formData = new FormData()
            formData.append('rating', rating)
            formData.append('comment', comment)

            const fileInput = e.target.querySelector('input[type="file"]')
            if (fileInput?.files.length > 0) {
                for (let i = 0; i < fileInput.files.length; i++) {
                    formData.append('media', fileInput.files[i])
                }
            }

            const res = await api.createReviewWithImage(product.id, formData, token)

            if (res?.data) {
                fetchReviews(1, reviewsLimit)
                setProduct(prev => prev ? {
                    ...prev,
                    review_stats: {
                        ...prev.review_stats,
                        total_reviews: (prev.review_stats?.total_reviews || 0) + 1
                    }
                } : prev)

                setComment('')
                setRating(5)
                if (fileInput) fileInput.value = ''
            }

            setReviewStatus('Review submitted successfully')
        } catch (err) {
            setReviewError(err.message || 'Failed to submit review')
        } finally {
            setReviewLoading(false)
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: product?.name,
                    text: `Check out ${product?.name}`,
                    url: window.location.href,
                })
            } catch (err) {
                // Share cancelled
            }
        } else {
            navigator.clipboard.writeText(window.location.href)
            alert('Link copied to clipboard')
        }
    }

    const handleSizeGuideClick = () => {
        setActiveTab('size-guide')
        setTimeout(() => {
            tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }

    // =========================================================================
    // LOADING & NOT FOUND STATES
    // =========================================================================
    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <StickyNavbar />
                <BreadcrumbNavigator />
                <ProductLoadingSkeleton />
                <Footer />
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-white">
                <StickyNavbar />
                <BreadcrumbNavigator />
                <div className="container mx-auto px-4 py-32 text-center font-outfit">
                    <div className="max-w-md mx-auto">
                        <Package className="h-10 w-10 text-neutral-300 mx-auto mb-6" strokeWidth={1} />
                        <h2 className="text-sm font-bold tracking-[0.2em] text-black uppercase mb-3">Item Unavailable</h2>
                        <p className="text-xs text-neutral-500 mb-8 uppercase tracking-widest">This piece is no longer in our collection.</p>
                        <Link
                            to="/products"
                            className="inline-flex items-center gap-2 px-8 py-3.5 bg-rose-700 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-rose-800 shadow-sm transition-colors"
                        >
                            Return to Collections
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    // =========================================================================
    // DERIVED DATA
    // =========================================================================
    const availableSizes = product.available_sizes?.length > 0
        ? product.available_sizes
        : [...new Set(product.variants?.map(v => v.size).filter(Boolean))]

    const availableColors = product.variants?.length > 0
        ? (() => {
            const colors = [];
            const seen = new Set();
            product.variants.forEach(v => {
                if (v.color && !seen.has(v.color.toLowerCase())) {
                    colors.push({ name: v.color, code: v.color_code || v.color });
                    seen.add(v.color.toLowerCase());
                }
            });
            return colors;
        })()
        : (product.available_colors || []);

    const isOutOfStock = product.stock_info?.status === 'out_of_stock'
    const totalCartItems = cartItems.reduce((sum, i) => sum + (i.quantity || i.qty || 1), 0)

    // =========================================================================
    // RENDER
    // =========================================================================
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            <ProductDetailSEO product={product} />
            <div className="min-h-screen bg-white pb-20">
                <StickyNavbar />
                
                {/* Clean top divider below header instead of pink backgrounds */}
                <div className="border-b border-black/5"></div>
                
                <BreadcrumbNavigator />

                <main className="container mx-auto px-4 md:px-8 py-8 md:py-16 max-w-[1400px]">
                    
                    {/* Editorial Layout */}
                    <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 xl:gap-24 mb-24">

                        {/* Left Column - Images */}
                        {/* Span 7 out of 12 columns for larger imagery (luxury vibe) */}
                        <div className="lg:col-span-7">
                            <div className="lg:sticky lg:top-32">
                                <ImageGallery
                                    images={product.images}
                                    productName={product.name}
                                    isDesktop={isDesktop}
                                    isOnSale={isOnSale}
                                    selectedColor={selectedColor}
                                    onImageChange={(color) => {
                                        if (color && color !== selectedColor) {
                                            setSelectedColor(color);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        {/* Right Column - Product Info */}
                        <div className="lg:col-span-5 pt-4">
                            
                            <ProductInfo
                                product={product}
                                displayPrice={displayPrice}
                                displayComparePrice={displayComparePrice}
                                isOnSale={isOnSale}
                            />

                            <div className="mt-8 space-y-6">
                                {/* Dividers are sharper */}
                                <hr className="border-black/10" />

                                {availableSizes.length > 0 && (
                                    <SizeSelector
                                        sizes={availableSizes}
                                        variants={product.variants}
                                        selectedSize={selectedSize}
                                        onSelect={setSelectedSize}
                                        onSizeGuideClick={handleSizeGuideClick}
                                    />
                                )}

                                {availableColors.length > 0 && (
                                    <div className="pt-2">
                                    <ColorSelector
                                        colors={availableColors}
                                        selectedColor={selectedColor}
                                        onSelect={setSelectedColor}
                                    />
                                    </div>
                                )}

                                <div className="space-y-6 pt-6">
                                    <QuantitySelector
                                        quantity={quantity}
                                        onChange={setQuantity}
                                        max={selectedVariant?.stock || 99}
                                    />
                                    <ActionButtons
                                        product={product}
                                        isInCart={!!cartItem}
                                        isOutOfStock={isOutOfStock}
                                        isWishlisted={isWishlisted}
                                        wishlistLoading={wishlistLoading}
                                        onAddToCart={handleAddToCart}
                                        onToggleWishlist={handleToggleWishlist}
                                        onShare={handleShare}
                                    />

                                    {cartItem && (
                                        <div className="pt-2">
                                           <ViewCartLink cartItemCount={totalCartItems} />
                                        </div>
                                    )}
                                </div>
                                
                                <PincodeChecker />
                                <ShippingInfoCard shippingInfo={product.shipping_info} />
                                <TrustBadgesSection badges={product.trust_badges} />
                            </div>
                        </div>
                    </div>

                    <hr className="border-black/5 mb-16" />

                    {/* PRODUCT TABS */}
                    <div ref={tabsRef} className="scroll-mt-32 max-w-5xl mx-auto mb-24">
                        <ProductTabs
                            descriptionSection={product.description_section}
                            fabricCareSection={product.fabric_care_section}
                            shippingReturnsSection={product.shipping_returns_section}
                            sizeGuide={product.size_guide}
                            specifications={product.specifications}
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />
                    </div>

                    {/* FAQ SECTION */}
                    {product.faq_section?.length > 0 && (
                        <div className="bg-[#faf9f8] -mx-4 md:-mx-8 px-4 md:px-8 py-20 mb-20">
                            <FAQSection faqs={product.faq_section} />
                        </div>
                    )}

                    {/* REVIEWS SECTION */}
                    <div className="max-w-5xl mx-auto mb-32">
                        <ProductReviews
                            reviews={reviewsList}
                            reviewStats={product.review_stats}
                            isLoggedIn={!!user}
                            rating={rating}
                            setRating={setRating}
                            comment={comment}
                            setComment={setComment}
                            onSubmit={handleSubmitReview}
                            reviewLoading={reviewLoading}
                            reviewError={reviewError}
                            reviewSuccess={reviewStatus}
                            currentPage={reviewsPage}
                            totalPages={reviewsTotalPages}
                            onPageChange={handlePageChange}
                            limit={reviewsLimit}
                            onLimitChange={handleLimitChange}
                            loading={reviewsLoadingMore}
                        />
                    </div>

                    {/* RELATED PRODUCTS */}
                    <div className="bg-[#faf9f8] -mx-4 md:-mx-8 px-4 md:px-8 py-24 border-t border-black/5">
                        <RelatedProducts
                            products={relatedProducts}
                            title="Curated With This Piece"
                            categorySlug={product?.category_slug}
                        />
                    </div>

                    {/* ALL PRODUCTS SLIDER */}
                    <div className="pt-24 mb-10">
                        <AllProductsSlider excludeProductId={product?.id} />
                    </div>

                </main>

                <Footer />
            </div>
        </motion.div>
    )
}
