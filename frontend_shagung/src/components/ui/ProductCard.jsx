import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Eye, Star, Check, Loader2, Flame } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from './Badge'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../ToastContext'

const ProductCard = ({
    product,
    onAddToCart,
    onRemoveFromCart,
    onToggleWishlist,
    isInCart = false,
    isWishlisted = false,
    showQuickView = true,
    onQuickView,
    className = '',
    cartLoading = false,
    wishlistLoading = false,
}) => {
    const [isHovered, setIsHovered] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)
    const { user } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const {
        id,
        name,
        price,
        compare_at_price,
        image,
        category_image,
        primary_image,
        badge,
        rating,
        avg_rating,
        reviews,
        review_count,
        category,
        category_name,
        // Sale related props
        badge_text,
        sale_name,
        sale_price,
        sale_discount,
        on_sale,
        is_new,
        brand_by
    } = product

    // Determine if product is on sale based on API flag
    const isOnSale = on_sale === true || (on_sale !== false && Boolean(sale_price));
    const saleLabel = badge_text || 'SALE';

    // 1. Determine "Final Selling Price" (what the user pays)
    let finalPrice = parseFloat(price || 0);
    if (isOnSale && sale_price) {
        finalPrice = parseFloat(sale_price);
    }
    // Round off the final price as requested
    finalPrice = Math.round(finalPrice);


    // 2. Determine "Reference Price" (Crossed out aka MRP)
    // Always prefer compare_at_price (MRP) if it exists and is higher than final price.
    // If not, fall back to 'price' (Regular Sell Price) *only if* we are on sale and price > finalPrice.
    let referencePrice = parseFloat(compare_at_price || 0);

    // If MRP isn't set or is lower/equal (invalid), check if we can use regular price as reference (e.g. sale is on)
    if (!referencePrice || referencePrice <= finalPrice) {
        if (isOnSale && parseFloat(price) > finalPrice) {
            referencePrice = parseFloat(price);
        } else {
            referencePrice = null; // No crossed out price
        }
    }

    // 3. Calculate "Total Discount %"
    let discount = 0;
    if (referencePrice && referencePrice > finalPrice) {
        discount = Math.round(((referencePrice - finalPrice) / referencePrice) * 100);
    }

    // Set display variables
    const displayPrice = finalPrice;
    const displayOriginalPrice = referencePrice;

    const firstImage = product.images?.[0];
    const displayImage = image || category_image || primary_image || (typeof firstImage === 'object' ? firstImage?.image_url : firstImage)
    const displayRating = rating || parseFloat(avg_rating) || 0
    const displayReviews = reviews || review_count || 0
    const displayCategory = category || category_name

    const handleWishlistClick = (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (!user) {
            showToast('Please login to add to wishlist', 'info')
            navigate('/account', { state: { from: `/products/${id}` } })
            return
        }

        onToggleWishlist?.(product)
    }

    const handleCartClick = (e) => {
        e.preventDefault()
        e.stopPropagation()

        if (isInCart) {
            onRemoveFromCart?.(product)
        } else {
            onAddToCart?.(product)
        }
    }

    return (
        <motion.div
            className={`group flex flex-col ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
        >
            {/* Image Container */}
            <div className="relative aspect-[3/4] bg-[#faf9f8] overflow-hidden">
                {/* Skeleton loader */}
                {!imageLoaded && (
                    <div className="absolute inset-0 bg-neutral-100 animate-pulse" />
                )}

                <Link to={`/products/${id}`} className="block w-full h-full">
                    <img
                        src={displayImage}
                        alt={name}
                        className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                            }`}
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80'
                            setImageLoaded(true)
                        }}
                    />
                </Link>

                {/* Sale Badge */}
                {isOnSale && (
                    <div className="absolute top-3 left-3 z-10">
                        <div className="px-2.5 py-1 bg-rose-600 text-white text-[10px] uppercase tracking-widest font-bold shadow-sm">
                            {saleLabel}
                        </div>
                    </div>
                )}

                {/* Regular Badge (New, etc) - Only show if not on sale */}
                {!isOnSale && (badge || product.is_new) && (
                    <div className="absolute top-3 left-3 z-10">
                        <div className={`px-2.5 py-1 text-white text-[10px] uppercase tracking-widest font-bold shadow-sm ${discount > 0 ? 'bg-black' : 'bg-emerald-600'}`}>
                            {discount > 0 ? `-${discount}%` : badge || 'NEW'}
                        </div>
                    </div>
                )}

                {/* Wishlist Button */}
                <button
                    onClick={handleWishlistClick}
                    disabled={wishlistLoading}
                    className="absolute top-3 right-3 z-10 p-2 bg-white/50 hover:bg-white backdrop-blur-sm rounded-full transition-colors flex items-center justify-center shadow-sm"
                >
                    {wishlistLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-black" strokeWidth={1.5} />
                    ) : (
                        <Heart
                            className={`h-4 w-4 transition-colors ${isWishlisted
                                ? 'text-rose-500 fill-rose-500'
                                : 'text-black/70 hover:text-black'
                                }`}
                            strokeWidth={1.5}
                        />
                    )}
                </button>

                {/* Wishlist Button - Smaller on mobile */}
                <motion.button
                    onClick={handleWishlistClick}
                    disabled={wishlistLoading}
                    className="product-card-wishlist z-10 !p-1.5 md:!p-2 !top-2 !right-2 md:!top-3 md:!right-3"
                    whileTap={{ scale: 0.9 }}
                    animate={isWishlisted ? { scale: [1, 1.2, 1] } : {}}
                >
                    {wishlistLoading ? (
                        <Loader2 className="h-3.5 w-3.5 md:h-4 md:w-4 animate-spin" />
                    ) : (
                        <Heart
                            className={`h-3.5 w-3.5 md:h-4 md:w-4 transition-colors ${isWishlisted
                                ? 'text-red-500 fill-red-500'
                                : 'text-muted-foreground hover:text-red-500'
                                }`}
                        />
                    )}
                </motion.button>

                {/* Quick Actions - Desktop Slide up */}
                <div
                    className={`
                        hidden md:block
                        absolute bottom-0 left-0 right-0 z-10
                        translate-y-full group-hover:translate-y-0
                        transition-transform duration-300 ease-out
                    `}
                >
                    <button
                        onClick={handleCartClick}
                        disabled={cartLoading}
                        className={`
                            w-full flex items-center justify-center gap-2
                            py-3.5 font-outfit text-[11px] uppercase tracking-widest font-bold
                            transition-colors
                            ${isInCart
                                ? 'bg-amber-500 text-black hover:bg-amber-600'
                                : 'bg-black text-white hover:bg-neutral-900'
                            }
                        `}
                    >
                        {cartLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                        ) : isInCart ? (
                            <>
                                <span>Remove from Bag</span>
                            </>
                        ) : (
                            <>
                                <span>Add to Bag</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Product Info */}
            <div className="pt-5 pb-2 text-center md:text-left font-outfit">
                {/* Category */}
                <p className="text-[10px] uppercase tracking-widest font-semibold text-neutral-400 mb-2">
                    {displayCategory || 'Product'}
                </p>

                {/* Name */}
                <Link to={`/products/${id}`} className="block mb-1 border-b border-transparent hover:border-black/20 pb-0.5 transition-colors max-w-fit md:max-w-none mx-auto md:mx-0">
                    <h3 className="font-playfair font-medium text-lg leading-snug text-black line-clamp-1">
                        {name}
                    </h3>
                </Link>

                {/* Brand By */}
                {(product.brand_by) && (
                    <p className="text-[10px] uppercase font-medium tracking-wide text-neutral-500 mb-2">
                        by {product.brand_by}
                    </p>
                )}

                {/* Rating */}
                {displayRating > 0 && (
                    <div className="flex items-center justify-center md:justify-start gap-1 mb-3">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < Math.floor(displayRating)
                                        ? 'text-amber-500 fill-amber-500'
                                        : 'text-neutral-200'
                                        }`}
                                    strokeWidth={1}
                                />
                            ))}
                        </div>
                        {displayReviews > 0 && (
                            <span className="text-[10px] tracking-widest font-semibold text-neutral-400">({displayReviews})</span>
                        )}
                    </div>
                )}

                {/* Price */}
                <div className="mt-2 flex items-center justify-center md:justify-start gap-3 flex-wrap">
                    <span className="text-sm tracking-wide font-medium text-black">₹{displayPrice?.toLocaleString?.() || displayPrice}</span>
                    {displayOriginalPrice && displayOriginalPrice > displayPrice && (
                        <span className="text-xs text-neutral-400 line-through decoration-neutral-300">₹{displayOriginalPrice?.toLocaleString?.()}</span>
                    )}
                    {discount > 0 && (
                        <span className="text-[10px] uppercase tracking-widest font-bold text-amber-600">({discount}% OFF)</span>
                    )}
                </div>

                {/* Mobile Add to Cart Button */}
                <div className="md:hidden pt-4">
                    <button
                        onClick={handleCartClick}
                        disabled={cartLoading}
                        className={`
                            w-full flex items-center justify-center gap-1.5
                            py-3 font-outfit text-[10px] uppercase tracking-widest font-bold
                            transition-colors border
                            ${isInCart
                                ? 'bg-amber-500 text-black border-amber-500'
                                : 'bg-transparent text-black border-black/20 hover:border-black'
                            }
                        `}
                    >
                        {cartLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                        ) : isInCart ? (
                            <>
                                <span>Added</span>
                            </>
                        ) : (
                            <>
                                <span>Quick Add</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

// Grid wrapper for product cards
const ProductGrid = ({ children, columns = 4, className = '' }) => (
    <div className={`
    grid gap-4 md:gap-6
    grid-cols-2 md:grid-cols-3 lg:grid-cols-${columns}
    ${className}
  `}>
        {children}
    </div>
)

// Skeleton loading state
const ProductCardSkeleton = () => (
    <div className="animate-fade-in mb-8">
        <div className="aspect-[3/4] bg-neutral-100 animate-pulse mb-4" />
        <div className="space-y-3 px-1 md:px-0">
            <div className="h-2 w-16 bg-neutral-100 animate-pulse mx-auto md:mx-0" />
            <div className="h-4 w-3/4 bg-neutral-100 animate-pulse mx-auto md:mx-0" />
            <div className="flex gap-1 justify-center md:justify-start">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-3 w-3 rounded-full bg-neutral-100 animate-pulse" />
                ))}
            </div>
            <div className="flex gap-2 pt-2 justify-center md:justify-start">
                <div className="h-4 w-16 bg-neutral-100 animate-pulse" />
                <div className="h-4 w-12 bg-neutral-100 animate-pulse" />
            </div>
        </div>
    </div>
)

export { ProductCard, ProductGrid, ProductCardSkeleton }
export default ProductCard
