// HomeSaleSection.jsx — Sale banner + products shown on the homepage
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, Timer, ArrowRight, Tag, Zap } from 'lucide-react'
import { api } from '../api/client'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, removeFromCart, selectCartItems } from '../store/slices/cartSlice'
import { useAuth } from '../context/AuthContext'
import { useToast } from './ToastContext'
import { ProductCard, ProductCardSkeleton } from './ui/ProductCard'

// ─── Countdown ────────────────────────────────────────────────────────────────
function CountdownTimer({ endDate }) {
    const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

    useEffect(() => {
        const tick = () => {
            const diff = new Date(endDate) - new Date()
            if (diff > 0) setT({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff / 3600000) % 24),
                minutes: Math.floor((diff / 60000) % 60),
                seconds: Math.floor((diff / 1000) % 60),
            })
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [endDate])

    const Block = ({ v, label }) => (
        <div className="flex flex-col items-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <span className="text-lg md:text-2xl font-serif text-white">{String(v).padStart(2, '0')}</span>
            </div>
            <span className="text-[9px] md:text-[10px] text-white/60 mt-1.5 uppercase tracking-widest font-bold">{label}</span>
        </div>
    )

    return (
        <div className="flex items-center gap-2 md:gap-3">
            <Block v={t.days} label="Days" />
            <span className="text-white/40 text-lg mb-4">:</span>
            <Block v={t.hours} label="Hrs" />
            <span className="text-white/40 text-lg mb-4">:</span>
            <Block v={t.minutes} label="Min" />
            <span className="text-white/40 text-lg mb-4 hidden sm:block">:</span>
            <div className="hidden sm:block"><Block v={t.seconds} label="Sec" /></div>
        </div>
    )
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export default function HomeSaleSection() {
    const dispatch = useDispatch()
    const cartItems = useSelector(selectCartItems)
    const { user, token } = useAuth()
    const { showToast } = useToast()

    const [sale, setSale] = useState(null)
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [likedIds, setLikedIds] = useState(new Set())
    const [cartLoadingIds, setCartLoadingIds] = useState(new Set())
    const [wishlistLoadingIds, setWishlistLoadingIds] = useState(new Set())

    const cartItemIds = useMemo(() =>
        new Set(cartItems.map(i => i.product_id || i.id)), [cartItems])

    useEffect(() => {
        const fetch = async () => {
            try {
                const salesRes = await api.getActiveSales()
                const sales = salesRes.sales || []
                if (sales.length > 0) {
                    setSale(sales[0])
                    const prodRes = await api.getSaleProducts({ limit: 6 })
                    setProducts((prodRes.products || []).slice(0, 6))
                }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        }
        fetch()
    }, [])

    useEffect(() => {
        if (!user || !token) return
        api.getWishlist(token)
            .then(res => {
                const list = Array.isArray(res) ? res : (res?.data || res?.items || [])
                setLikedIds(new Set(list.map(i => i.product_id || i.id)))
            })
            .catch(console.error)
    }, [user, token])

    const handleAddToCart = useCallback(async (product) => {
        setCartLoadingIds(prev => new Set(prev).add(product.id))
        try {
            await dispatch(addToCart({ product, quantity: 1 })).unwrap()
            showToast(`${product.name} added to cart!`, 'success')
        } catch { showToast('Failed to add to cart', 'error') }
        finally { setCartLoadingIds(prev => { const n = new Set(prev); n.delete(product.id); return n }) }
    }, [dispatch, showToast])

    const handleRemoveFromCart = useCallback(async (product) => {
        setCartLoadingIds(prev => new Set(prev).add(product.id))
        try {
            const item = cartItems.find(i => i.product_id === product.id || i.id === product.id)
            if (item) {
                await dispatch(removeFromCart(item.id)).unwrap()
                showToast(`${product.name} removed from cart`, 'info')
            }
        } catch { showToast('Failed to remove', 'error') }
        finally { setCartLoadingIds(prev => { const n = new Set(prev); n.delete(product.id); return n }) }
    }, [cartItems, dispatch, showToast])

    const handleToggleWishlist = useCallback(async (product) => {
        if (!user || !token) { showToast('Please login to add to wishlist', 'warning'); return }
        setWishlistLoadingIds(prev => new Set(prev).add(product.id))
        try {
            if (likedIds.has(product.id)) {
                await api.removeFromWishlist(product.id, token)
                setLikedIds(prev => { const n = new Set(prev); n.delete(product.id); return n })
                showToast('Removed from wishlist', 'info')
            } else {
                await api.addToWishlist(product.id, token)
                setLikedIds(prev => new Set(prev).add(product.id))
                showToast('Added to wishlist!', 'success')
            }
        } catch { showToast('Failed to update wishlist', 'error') }
        finally { setWishlistLoadingIds(prev => { const n = new Set(prev); n.delete(product.id); return n }) }
    }, [user, token, likedIds, showToast])

    // Don't render anything if no active sale
    if (!loading && (!sale || products.length === 0)) return null

    const bg = sale?.background_color || 'linear-gradient(135deg, #be123c, #7c3aed)'
    const bgImg = sale?.background_image

    return (
        <section className="relative overflow-hidden">
            {/* ── Gradient Hero Banner ────────────────────────────────── */}
            <div
                className="relative text-white py-10 md:py-16"
                style={{ background: bgImg ? `url(${bgImg}) center/cover no-repeat` : bg }}
            >
                {bgImg && <div className="absolute inset-0 bg-black/50" />}

                {/* Animated flame particles */}
                {!bgImg && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute"
                                initial={{ y: '110%', x: `${10 + i * 12}%`, opacity: 0 }}
                                animate={{ y: [null, '-110%'], opacity: [0, 0.6, 0.6, 0], scale: [0.5, 1, 0.5] }}
                                transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: i * 0.4, ease: 'linear' }}
                            >
                                <Flame className="w-5 h-5 text-orange-300/50" />
                            </motion.div>
                        ))}
                        <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" />
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
                    </div>
                )}

                <div className="relative container mx-auto px-4 max-w-6xl">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
                        {/* Left: title + badge */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex-1"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur border border-white/20 mb-4">
                                <Tag className="w-3 h-3 text-orange-300" />
                                <span className="text-[10px] font-bold tracking-[0.2em] text-white uppercase">
                                    {sale?.offer_heading || sale?.badge_text || 'EXCLUSIVE SALE'}
                                </span>
                            </div>
                            <h2 className="text-3xl md:text-5xl font-serif tracking-wide mb-3">
                                {sale?.name || 'Hot Deals'}
                            </h2>
                            <p className="text-sm text-white/70 font-light max-w-md mb-5">
                                {sale?.description || sale?.offer_subheading || `Shop ${products.length} pieces at special prices. Limited time only.`}
                            </p>
                            <Link
                                to="/sale"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-rose-700 font-bold text-xs uppercase tracking-widest hover:bg-rose-50 transition-colors"
                            >
                                <Zap className="w-3.5 h-3.5" />
                                Shop All Sale
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </motion.div>

                        {/* Right: countdown */}
                        {sale?.end_date && sale?.show_countdown !== false && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="flex flex-col items-start md:items-center"
                            >
                                <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-4 flex items-center gap-1.5">
                                    <Timer className="w-3 h-3" /> Offer Ends In
                                </p>
                                <CountdownTimer endDate={sale.end_date} />
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Products Grid ──────────────────────────────────────── */}
            <div className="bg-[#FAFAFA] py-8 md:py-14">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 md:mb-10">
                        <div>
                            <h3 className="text-xl md:text-2xl font-serif text-stone-900 tracking-wide">Featured Deals</h3>
                            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mt-0.5">{products.length} exclusive pieces</p>
                        </div>
                        <Link
                            to="/sale"
                            className="text-[10px] uppercase font-bold tracking-widest text-rose-600 hover:text-rose-800 border-b border-rose-300 hover:border-rose-800 pb-0.5 transition-colors flex items-center gap-1.5"
                        >
                            View All <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>

                    {/* Grid */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            {[...Array(6)].map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            {products.map((product, i) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.07 }}
                                >
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
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Bottom CTA */}
                    {!loading && products.length > 0 && (
                        <div className="text-center mt-8 md:mt-12">
                            <Link
                                to="/sale"
                                className="inline-flex items-center gap-2 px-8 py-3.5 bg-stone-900 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-rose-700 transition-colors duration-300"
                            >
                                <Flame className="w-3.5 h-3.5 text-orange-300" />
                                Explore All Sale Pieces
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
