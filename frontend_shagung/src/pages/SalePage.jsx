// Sale Page - Amazing sale with countdown timer and hot deals
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    Flame, Clock, ArrowRight, Sparkles,
    Zap, Timer, Gift, Tag, ChevronRight
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ProductCard, ProductCardSkeleton } from '../components/ui/ProductCard'
import { AnimatedSection, StaggeredContainer, StaggeredItem } from '../components/ui/AnimatedSection'
import Button from '../components/ui/Button'
import { api } from '../api/client'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, removeFromCart, selectCartItems } from '../store/slices/cartSlice'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastContext'
import { SalePageSEO } from '../components/SEO'

// =============================================================================
// COUNTDOWN TIMER COMPONENT
// =============================================================================
const CountdownTimer = ({ endDate }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(endDate) - new Date()

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                })
            }
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000)
        return () => clearInterval(timer)
    }, [endDate])

    const TimeBlock = ({ value, label }) => (
        <div className="flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20">
                <span className="text-2xl md:text-3xl font-serif text-white">{String(value).padStart(2, '0')}</span>
            </div>
            <span className="text-[10px] md:text-xs text-white/70 mt-3 font-bold uppercase tracking-widest">{label}</span>
        </div>
    )

    return (
        <div className="flex items-center justify-center gap-3 md:gap-4">
            <TimeBlock value={timeLeft.days} label="Days" />
            <span className="text-2xl text-white/50 font-light">:</span>
            <TimeBlock value={timeLeft.hours} label="Hours" />
            <span className="text-2xl text-white/50 font-light">:</span>
            <TimeBlock value={timeLeft.minutes} label="Mins" />
            <span className="text-2xl text-white/50 font-light hidden md:block">:</span>
            <div className="hidden md:block">
                <TimeBlock value={timeLeft.seconds} label="Secs" />
            </div>
        </div>
    )
}

// =============================================================================
// SALE HERO BANNER
// =============================================================================
const SaleHeroBanner = ({ sale, productsCount }) => {
    if (!sale) return null

    // Use admin settings or defaults
    const backgroundColor = sale.background_color || 'linear-gradient(135deg, #e91e63, #9c27b0)'
    const backgroundImage = sale.background_image
    const bannerImage = sale.banner_image
    const offerHeading = sale.offer_heading || sale.badge_text || 'HOT SALE'
    const showCountdown = sale.show_countdown !== false
    const showProductsCount = sale.show_products_count !== false

    return (
        <div
            className="relative overflow-hidden text-white"
            style={{
                background: backgroundImage
                    ? `url(${backgroundImage}) center/cover no-repeat`
                    : backgroundColor
            }}
        >
            {/* Overlay for better text readability when using image */}
            {backgroundImage && (
                <div className="absolute inset-0 bg-black/40" />
            )}

            {/* Animated Background Pattern (only show if no background image) */}
            {!backgroundImage && (
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-white/30 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-60 h-60 bg-yellow-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-500" />
                </div>
            )}

            {/* Fire Particles Animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        initial={{ y: '100%', x: `${Math.random() * 100}%`, opacity: 0 }}
                        animate={{
                            y: [null, '-100%'],
                            opacity: [0, 1, 1, 0],
                            scale: [0.5, 1, 0.5]
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                            ease: 'linear'
                        }}
                    >
                        <Flame className="w-6 h-6 text-orange-400/50" />
                    </motion.div>
                ))}
            </div>

            <div className="relative container mx-auto px-4 py-20 md:py-32">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Sale Badge */}
                    <motion.div
                        className="inline-flex items-center gap-2 px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 mb-8"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">{offerHeading}</span>
                    </motion.div>

                    {/* Sale Title */}
                    <motion.h1
                        className="text-5xl md:text-7xl lg:text-8xl font-serif tracking-wide mb-6"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {sale.name}
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                        className="text-sm md:text-base text-white/80 font-bold uppercase tracking-widest mb-12 max-w-2xl mx-auto leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        {sale.description || sale.offer_subheading || `Shop ${productsCount} pieces at special prices`}
                    </motion.p>

                    {/* Countdown Timer */}
                    {showCountdown && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mb-12"
                        >
                            <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-6 flex items-center justify-center gap-2">
                                <Timer className="w-3.5 h-3.5" />
                                Collection Closes In
                            </p>
                            <CountdownTimer endDate={sale.end_date} />
                        </motion.div>
                    )}

                    {/* Stats */}
                    {showProductsCount && (
                        <motion.div
                            className="flex items-center justify-center pt-8 border-t border-white/10"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-serif text-white">{productsCount}</div>
                                <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-2">Pieces Featured</div>
                            </div>
                        </motion.div>
                    )}

                    {/* Banner Image */}
                    {bannerImage && (
                        <motion.div
                            className="mt-8"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <img
                                src={bannerImage}
                                alt={sale.name}
                                className="max-w-full h-auto rounded-2xl shadow-2xl mx-auto"
                            />
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Bottom Wave */}
            <div className="absolute bottom-0 left-0 right-0">
                <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="white" fillOpacity="0.1" />
                </svg>
            </div>
        </div>
    )
}

// =============================================================================
// NO SALE STATE
// =============================================================================
const NoSaleState = () => (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 bg-[#FAFAFA]">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 h-20 border border-stone-200 bg-white flex items-center justify-center mb-8"
        >
            <Tag className="w-8 h-8 text-stone-300" strokeWidth={1} />
        </motion.div>
        <h2 className="text-3xl font-serif text-stone-900 tracking-wide mb-4">No Exclusive Sales Currently</h2>
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-10 max-w-md leading-relaxed">
            The collection is currently at standard pricing. Subscribe to our newsletter to receive private invitations for future sales.
        </p>
        <div className="flex gap-4">
            <Link to="/products" className="inline-flex items-center gap-2 px-8 py-3.5 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors">
                Explore The Collection
                <ArrowRight className="w-3.5 h-3.5" />
            </Link>
        </div>
    </div>
)

// =============================================================================
// MAIN SALE PAGE
// =============================================================================
export default function SalePage() {
    const dispatch = useDispatch()
    const cartItems = useSelector(selectCartItems)
    const { user, token } = useAuth()
    const { showToast } = useToast()

    const [activeSale, setActiveSale] = useState(null)
    const [products, setProducts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [likedIds, setLikedIds] = useState(new Set())
    const [cartLoadingIds, setCartLoadingIds] = useState(new Set())
    const [wishlistLoadingIds, setWishlistLoadingIds] = useState(new Set())

    // Cart item IDs for O(1) lookup
    const cartItemIds = useMemo(() =>
        new Set(cartItems.map(item => item.product_id || item.id)),
        [cartItems]
    )

    // Fetch sale data
    useEffect(() => {
        const fetchSaleData = async () => {
            try {
                setIsLoading(true)

                // Get active sales
                const salesRes = await api.getActiveSales()
                const sales = salesRes.sales || []

                if (sales.length > 0) {
                    setActiveSale(sales[0])

                    // Get sale products
                    const productsRes = await api.getSaleProducts({ limit: 50 })
                    setProducts(productsRes.products || [])
                }
            } catch (err) {
                console.error('Failed to fetch sale data:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchSaleData()
    }, [])

    // Fetch wishlist
    useEffect(() => {
        const fetchWishlist = async () => {
            if (!user || !token) return
            try {
                const response = await api.getWishlist(token)
                const wishlist = Array.isArray(response) ? response
                    : Array.isArray(response?.data) ? response.data
                        : Array.isArray(response?.items) ? response.items
                            : []
                setLikedIds(new Set(wishlist.map(item => item.product_id || item.id)))
            } catch (err) {
                console.error('Failed to fetch wishlist:', err)
            }
        }
        fetchWishlist()
    }, [user, token])

    const handleAddToCart = useCallback(async (product) => {
        setCartLoadingIds(prev => new Set(prev).add(product.id))
        try {
            await dispatch(addToCart({ product, quantity: 1 })).unwrap()
            showToast(`${product.name} added to cart!`, 'success')
        } catch (err) {
            showToast('Failed to add to cart', 'error')
        } finally {
            setCartLoadingIds(prev => {
                const next = new Set(prev)
                next.delete(product.id)
                return next
            })
        }
    }, [dispatch, showToast])

    const handleRemoveFromCart = useCallback(async (product) => {
        setCartLoadingIds(prev => new Set(prev).add(product.id))
        try {
            const cartItem = cartItems.find(item => item.product_id === product.id || item.id === product.id)
            if (cartItem) {
                await dispatch(removeFromCart(cartItem.id)).unwrap()
                showToast(`${product.name} removed from cart`, 'info')
            }
        } catch (err) {
            showToast('Failed to remove from cart', 'error')
        } finally {
            setCartLoadingIds(prev => {
                const next = new Set(prev)
                next.delete(product.id)
                return next
            })
        }
    }, [cartItems, dispatch, showToast])

    const handleToggleWishlist = useCallback(async (product) => {
        if (!user || !token) {
            showToast('Please login to add to wishlist', 'warning')
            return
        }

        setWishlistLoadingIds(prev => new Set(prev).add(product.id))
        try {
            const isLiked = likedIds.has(product.id)
            if (isLiked) {
                await api.removeFromWishlist(product.id, token)
                setLikedIds(prev => {
                    const next = new Set(prev)
                    next.delete(product.id)
                    return next
                })
                showToast(`${product.name} removed from wishlist`, 'info')
            } else {
                await api.addToWishlist(product.id, token)
                setLikedIds(prev => new Set(prev).add(product.id))
                showToast(`${product.name} added to wishlist!`, 'success')
            }
        } catch (err) {
            showToast('Failed to update wishlist', 'error')
        } finally {
            setWishlistLoadingIds(prev => {
                const next = new Set(prev)
                next.delete(product.id)
                return next
            })
        }
    }, [user, token, likedIds, showToast])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
                <SalePageSEO sale={null} productsCount={0} />
                <Header />
                <div className="h-64 bg-stone-900 animate-pulse flex items-center justify-center text-white/30 text-[10px] uppercase font-bold tracking-widest">
                    Loading
                </div>
                <div className="container mx-auto px-4 py-12 md:py-20 max-w-7xl">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {[...Array(8)].map((_, i) => (
                            <ProductCardSkeleton key={i} />
                        ))}
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    if (!activeSale || products.length === 0) {
        return (
            <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
                <SalePageSEO sale={null} productsCount={0} />
                <Header />
                <div className="flex-1">
                    <NoSaleState />
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
            {/* SEO Meta Tags */}
            <SalePageSEO sale={activeSale} productsCount={products.length} />

            <Header />

            {/* Hero Banner */}
            <SaleHeroBanner sale={activeSale} productsCount={products.length} />

            {/* Products Section */}
            <main className="flex-1 container mx-auto px-4 py-16 md:py-24 max-w-7xl">
                {/* Section Header */}
                <AnimatedSection className="mb-12 border-b border-stone-200 pb-6">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-serif text-stone-900 tracking-wide mb-2">Featured Deals</h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{products.length} Exclusive Pieces</p>
                        </div>
                        <Link
                            to="/products"
                            className="text-[10px] uppercase font-bold tracking-widest text-stone-500 hover:text-stone-900 border-b border-stone-400 hover:border-stone-900 pb-0.5 transition-colors flex items-center gap-2"
                        >
                            View All <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </AnimatedSection>

                {/* Products Grid */}
                <StaggeredContainer
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
                    staggerDelay={0.05}
                >
                    {products.map(product => (
                        <StaggeredItem key={product.id}>
                            <ProductCard
                                product={product}
                                onAddToCart={handleAddToCart}
                                onRemoveFromCart={handleRemoveFromCart}
                                onToggleWishlist={handleToggleWishlist}
                                isInCart={cartItemIds.has(product.id)}
                                isWishlisted={likedIds.has(product.id)}
                                cartLoading={cartLoadingIds.has(product.id)}
                                wishlistLoading={wishlistLoadingIds.has(product.id)}
                            />
                        </StaggeredItem>
                    ))}
                </StaggeredContainer>

                {/* Why Shop Sale Section */}
                <AnimatedSection className="mt-24 pt-24 border-t border-stone-200">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-16">
                            <h3 className="text-3xl font-serif text-stone-900 tracking-wide mb-4">The Shagun Promise</h3>
                            <div className="w-12 h-[1px] bg-stone-300 mx-auto"></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
                            {[
                                { icon: Tag, title: 'Unmatched Value', desc: 'Exceptional quality at exclusive rates' },
                                { icon: Zap, title: 'Limited Availability', desc: 'Secure the pieces before they vanish' },
                                { icon: Gift, title: 'Complimentary Curations', desc: 'On orders exceeding ₹2999' },
                                { icon: Clock, title: 'Ephemeral Timeframes', desc: "Offers available for a brief moment" },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    className="text-center group"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div className="w-16 h-16 border border-stone-200 bg-white flex items-center justify-center mx-auto mb-6 group-hover:border-stone-400 transition-colors">
                                        <item.icon className="w-6 h-6 text-stone-900" strokeWidth={1} />
                                    </div>
                                    <h4 className="font-serif text-lg text-stone-900 mb-2">{item.title}</h4>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 leading-relaxed">{item.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </AnimatedSection>
            </main>

            <Footer />
        </div>
    )
}
