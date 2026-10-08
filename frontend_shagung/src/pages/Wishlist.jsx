import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ShoppingCart, Trash2, ArrowLeft, Loader2, ShoppingBag, LogOut } from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Button from '../components/ui/Button'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
// import { useCart } from '../context/CartContext'
import { useDispatch } from 'react-redux'
import { addToCart } from '../store/slices/cartSlice'
import { useToast } from '../components/ToastContext'

export default function Wishlist() {
    const { user, token, logout } = useAuth()
    const dispatch = useDispatch()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState({})

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!user) {
            showToast('Please login to view your wishlist', 'info')
            navigate('/login', { state: { from: '/wishlist' } })
        }
    }, [user, navigate, showToast])

    // Fetch wishlist
    useEffect(() => {
        if (user && token) {
            fetchWishlist()
        }
    }, [user, token])

    const fetchWishlist = async () => {
        try {
            setLoading(true)
            const data = await api.getWishlist(token)
            // Handle different API response formats
            let wishlistItems = []
            if (Array.isArray(data)) {
                wishlistItems = data
            } else if (data?.items && Array.isArray(data.items)) {
                wishlistItems = data.items
            } else if (data?.wishlist && Array.isArray(data.wishlist)) {
                wishlistItems = data.wishlist
            } else if (data?.products && Array.isArray(data.products)) {
                wishlistItems = data.products
            }
            setItems(wishlistItems)
        } catch (err) {
            console.error('Failed to fetch wishlist:', err)
            setItems([]) // Ensure items is always an array
            showToast('Failed to load wishlist', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = async (productId) => {
        setActionLoading(prev => ({ ...prev, [`remove-${productId}`]: true }))
        try {
            await api.removeFromWishlist(productId, token)
            setItems(items.filter(item => item.product_id !== productId && item.id !== productId))
            showToast('Removed from wishlist', 'success')
        } catch (err) {
            showToast('Failed to remove item', 'error')
        } finally {
            setActionLoading(prev => ({ ...prev, [`remove-${productId}`]: false }))
        }
    }

    const handleMoveToCart = async (item) => {
        const productId = item.product_id || item.id
        setActionLoading(prev => ({ ...prev, [`cart-${productId}`]: true }))
        try {
            // Construct product object for Redux
            const productToAdd = {
                id: productId,
                name: item.name || item.product_name,
                price: item.price || item.product_price,
                image: item.image || item.image_url || item.primary_image,
                // Add validation/defaults if needed
            };

            // Add to cart via Redux (handles API + State)
            await dispatch(addToCart({
                product: productToAdd,
                variantId: item.variant_id || null,
                quantity: 1
            })).unwrap();

            // Remove from wishlist
            await api.removeFromWishlist(productId, token)

            // Update local state
            setItems(items.filter(i => (i.product_id || i.id) !== productId))

            showToast('Moved to cart!', 'success')
        } catch (err) {
            console.error('Move to cart error', err);
            showToast('Failed to move to cart', 'error')
        } finally {
            setActionLoading(prev => ({ ...prev, [`cart-${productId}`]: false }))
        }
    }

    if (!user) {
        return null // Will redirect
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-stone-800 font-sans flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-12 md:py-20 max-w-7xl">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-stone-400 mb-10">
                    <Link to="/" className="hover:text-stone-900 transition-colors">Home</Link>
                    <span>/</span>
                    <span className="text-stone-900">Wishlist</span>
                </div>

                {/* Page Title */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-stone-200 pb-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-serif text-stone-900 tracking-wide mb-2">Saved Items</h1>
                        <p className="text-xs text-stone-500 uppercase tracking-widest">
                            {items.length} {items.length === 1 ? 'piece' : 'pieces'} in your collection
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/products" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 border-b border-transparent hover:border-stone-900 pb-0.5 transition-colors">
                            <ArrowLeft className="h-3 w-3" />
                            Continue Shopping
                        </Link>
                        <button
                            onClick={logout}
                            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-red-600 border-b border-transparent hover:border-red-400 pb-0.5 transition-colors"
                        >
                            <LogOut className="h-3 w-3" />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="w-8 h-8 border border-stone-800 border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p className="text-xs uppercase tracking-widest text-stone-500 font-medium">Loading Collection</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-32 border border-stone-200 bg-white">
                        <Heart className="h-10 w-10 text-stone-300 mx-auto mb-6" strokeWidth={1} />
                        <h2 className="font-serif text-xl tracking-wide text-stone-900 mb-3">Your wishlist is empty</h2>
                        <p className="text-xs text-stone-500 uppercase tracking-widest mb-8">Curate your collection by saving pieces you love</p>
                        <Link to="/products" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-stone-900 text-white text-[10px] uppercase font-bold tracking-widest hover:bg-stone-800 transition-colors">
                            <ShoppingBag className="h-3.5 w-3.5" />
                            Discover Collections
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-x-6 md:gap-y-10">
                        <AnimatePresence>
                            {items.map((item) => {
                                const productId = item.product_id || item.id
                                const productName = item.name || item.product_name
                                const productImage = item.image || item.image_url || item.primary_image
                                const productPrice = item.price || item.product_price
                                const productSlug = item.slug || item.product_slug || productId

                                return (
                                    <motion.div
                                        key={productId}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group flex flex-col bg-white border border-transparent hover:border-stone-200 transition-colors duration-300 relative"
                                    >
                                        {/* Image */}
                                        <Link to={`/products/${productSlug}`} className="block relative aspect-[3/4] bg-[#faf9f8] overflow-hidden">
                                            <img
                                                src={productImage}
                                                alt={productName}
                                                className="w-full h-full object-cover object-top mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                                            />

                                            {/* Remove Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    handleRemove(productId)
                                                }}
                                                disabled={actionLoading[`remove-${productId}`]}
                                                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur text-stone-400 hover:text-stone-900 transition-colors z-10"
                                            >
                                                {actionLoading[`remove-${productId}`] ? (
                                                    <div className="w-3.5 h-3.5 border border-stone-800 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                        </Link>

                                        {/* Info */}
                                        <div className="p-4 flex flex-col flex-1">
                                            <div>
                                                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
                                                    {item.category_name || item.category || 'Collection'}
                                                </p>
                                                <Link to={`/products/${productSlug}`}>
                                                    <h3 className="font-serif text-sm tracking-wide text-stone-900 line-clamp-1 mb-2">
                                                        {productName}
                                                    </h3>
                                                </Link>
                                            </div>

                                            <div className="flex items-center gap-3 mb-5">
                                                <span className="text-sm font-semibold text-stone-900">
                                                    ₹{productPrice?.toLocaleString?.() || productPrice}
                                                </span>

                                                {item.compare_at_price && item.compare_at_price > productPrice && (
                                                    <span className="text-xs text-stone-400 line-through">
                                                        ₹{item.compare_at_price?.toLocaleString?.()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Move to Cart Button */}
                                            <div className="mt-auto">
                                                <button
                                                    onClick={() => handleMoveToCart(item)}
                                                    disabled={actionLoading[`cart-${productId}`]}
                                                    className="w-full py-3 bg-stone-900 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {actionLoading[`cart-${productId}`] ? (
                                                        <span className="flex items-center justify-center gap-2">
                                                           Moving...
                                                        </span>
                                                    ) : (
                                                        <>
                                                            <ShoppingCart className="h-3.5 w-3.5" />
                                                            Move
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    )
}
