import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, FreeMode } from 'swiper/modules'
import { ArrowLeft, ArrowRight, Heart, Star, Check, Loader2 } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, selectCartItems } from '../store/slices/cartSlice'
import { useAuth } from '../context/AuthContext'
import { useToast } from './ToastContext'
import { api } from '../api/client'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/free-mode'

function ProductCard({ product, onAddToCart, onToggleWishlist, isInCart, isWishlisted, wishlistLoading, index }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { user } = useAuth()
  const { showToast } = useToast()

  const {
    id, name, price, originalPrice, compare_at_price, image, category_image, primary_image,
    rating, avg_rating, reviews, review_count, category, category_name,
    badge_text, sale_price, sale_discount, on_sale,
  } = product

  const isOnSale = Boolean(badge_text || on_sale || sale_price)
  const saleLabel = badge_text || 'SALE'

  let displayPrice = isOnSale && sale_price ? parseFloat(sale_price) : price || product.price
  let displayOriginalPrice = isOnSale ? (price || compare_at_price) : (originalPrice || compare_at_price)
  let discount = displayOriginalPrice && displayOriginalPrice > displayPrice
    ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)
    : (sale_discount || 0)

  const displayImage = image || category_image || primary_image || product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&q=80'
  const displayRating = rating || parseFloat(avg_rating) || 0
  const displayReviews = reviews || review_count || 0

  const handleWishlistClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      showToast('Please login to add to wishlist', 'info')
      return
    }
    onToggleWishlist?.(product)
  }

  const handleCartClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(product)
  }

  return (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, delay: index * 0.1, ease: [0.25, 1, 0.5, 1] }}
        className="group flex flex-col items-start bg-transparent cursor-pointer font-sans"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-neutral-100 mb-5">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
        )}

        <Link to={`/products/${id}`} className="block w-full h-full">
          <img
            src={displayImage}
            alt={name}
            className={`w-full h-full object-cover object-top transition-transform duration-1000 ease-out ${imageLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`}
            onLoad={() => setImageLoaded(true)}
          />
        </Link>

        {/* Badges -> Sleeker, modern placement */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10">
          {isOnSale && (
            <span className="bg-white/90 backdrop-blur-sm text-black text-[9px] font-bold tracking-[0.2em] px-3 py-1.5 uppercase shadow-sm">
              {saleLabel}
            </span>
          )}
          {!isOnSale && discount > 0 && (
            <span className="bg-amber-500 text-black text-[9px] font-bold tracking-[0.2em] px-3 py-1.5 uppercase shadow-sm">
              -{discount}%
            </span>
          )}
        </div>
        
        {/* Wishlist -> Minimalist Floating Circle */}
        <button
            onClick={handleWishlistClick}
            disabled={wishlistLoading}
            className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center bg-white/50 backdrop-blur-md rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.05)] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-white z-20"
        >
            {wishlistLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
            <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-neutral-600'}`} strokeWidth={1.5} />
            )}
        </button>

        {/* Add to Cart Overlay -> Full slide up solid black */}
        <div className={`absolute bottom-0 left-0 w-full transition-transform duration-400 ease-[0.25,1,0.5,1] ${isHovered ? 'translate-y-0' : 'translate-y-full'}`}>
          <button
            onClick={handleCartClick}
            className={`w-full py-4 text-[11px] font-outfit tracking-[0.2em] uppercase font-semibold transition-colors ${isInCart
                ? 'bg-amber-500 text-white'
                : 'bg-rose-700 text-white hover:bg-rose-800'
              }`}
          >
            {isInCart ? (
              <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Added To Bag</span>
            ) : (
              'Quick Add'
            )}
          </button>
        </div>
      </div>

      {/* Info Container -> Editorial Typography */}
      <div className="w-full flex flex-col text-center items-center px-2">
        <Link to={`/products/${id}`} className="block mb-2 w-full">
          <h3 className="font-outfit font-medium text-neutral-900 text-sm hover:text-rose-700 transition-colors line-clamp-1">
            {name}
          </h3>
        </Link>

        {displayRating > 0 && (
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.floor(displayRating) ? 'text-amber-400 fill-amber-400' : 'text-neutral-200 fill-neutral-200'}`} />
            ))}
            <span className="text-[10px] text-neutral-400 tracking-wider ml-1">({displayReviews})</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 font-outfit">
          <span className="font-semibold text-black text-sm">
            ₹{displayPrice?.toLocaleString?.() || displayPrice}
          </span>
          {displayOriginalPrice && displayOriginalPrice > displayPrice && (
            <span className="text-xs text-neutral-400 line-through">₹{displayOriginalPrice?.toLocaleString?.()}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ProductSkeleton() {
  return (
    <div className="flex flex-col items-center w-full gap-4">
      <div className="w-full aspect-[3/4] bg-neutral-100 animate-pulse" />
      <div className="w-full space-y-3 flex flex-col items-center">
        <div className="h-3 w-3/4 bg-neutral-200 animate-pulse" />
        <div className="h-3 w-1/4 bg-neutral-200 animate-pulse" />
      </div>
    </div>
  )
}

export default function FeaturedProducts() {
  const dispatch = useDispatch()
  const cartItems = useSelector(selectCartItems)
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [products, setProducts] = useState([])
  const [likedIds, setLikedIds] = useState(() => new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [wishlistLoading, setWishlistLoading] = useState(new Set())
  const swiperRef = useRef(null)
  
  const headerRef = useRef(null)
  const isHeaderInView = useInView(headerRef, { once: true, margin: "-100px" })

  useEffect(() => {
    setIsLoading(true)
    api.featuredProducts(12)
      .then((data) => {
        const productList = data?.products || data
        if (Array.isArray(productList) && productList.length) setProducts(productList)
      })
      .catch((err) => console.error('Failed to fetch featured products:', err))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!user || !token) return
    api.getWishlist(token)
      .then((response) => {
        const wishlist = Array.isArray(response) ? response : (response?.data || response?.items || [])
        setLikedIds(new Set(wishlist.map(item => item.product_id || item.productId || item.id)))
      })
      .catch((err) => console.error('Failed to fetch wishlist:', err))
  }, [user, token])

  async function handleHeartClick(product) {
    if (!user || !token) { showToast('Please login to add to wishlist.', 'warning'); return }
    const productId = product.id
    const isLiked = likedIds.has(productId)
    setWishlistLoading(prev => new Set(prev).add(productId))
    try {
      if (isLiked) {
        await api.removeFromWishlist(productId, token)
        setLikedIds(prev => { const next = new Set(prev); next.delete(productId); return next })
        showToast('Removed from wishlist.', 'info')
      } else {
        await api.addToWishlist(productId, token)
        setLikedIds(prev => new Set(prev).add(productId))
        showToast('Added to wishlist!', 'success')
      }
    } catch (err) { showToast(err.message || 'Failed to update wishlist', 'error') }
    finally { setWishlistLoading(prev => { const next = new Set(prev); next.delete(productId); return next }) }
  }

  function handleAddToCart(product) {
    dispatch(addToCart({ product, quantity: 1 })).unwrap().catch(err => console.error('Add to cart failed', err))
    showToast(`${product.name} added to cart!`, 'success')
  }

  const isInCart = (productId) => cartItems.some(i => i.product_id === productId || i.id === productId)
  const isWishlistLoadingFor = (productId) => wishlistLoading.has(productId)

  return (
    <section className="bg-[#faf9f8] py-10 md:py-28 overflow-hidden relative">
      <style>{`
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-outfit { font-family: 'Outfit', sans-serif; }
      `}</style>
      
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-rose-100/40 to-transparent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-8 max-w-[1400px] relative z-10">
        {/* Editorial Header */}
        <div ref={headerRef} className="flex flex-col items-center justify-center text-center mb-8 md:mb-20">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-4 mb-4"
            >
                <span className="w-12 h-[1px] bg-rose-300"></span>
                <span className="font-outfit text-[10px] md:text-xs tracking-[0.4em] uppercase text-rose-600 font-semibold">
                    The Edits
                </span>
                <span className="w-12 h-[1px] bg-rose-300"></span>
            </motion.div>
            
            <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-2xl md:text-5xl lg:text-6xl font-playfair font-medium text-black mb-3 md:mb-6"
            >
                Curated Selection
            </motion.h2>
            
            <motion.p 
                initial={{ opacity: 0 }}
                animate={isHeaderInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-neutral-500 text-sm md:text-base font-outfit font-light max-w-md"
            >
                Explore our most sought-after pieces this season, masterfully crafted for the modern wardrobe.
            </motion.p>
        </div>

        {/* Custom Navigation & View All (Top Right on Desktop) */}
        <div className="absolute right-4 md:right-8 top-16 md:top-32 hidden md:flex items-center gap-6 z-20">
            <Link to="/products" className="font-outfit text-[11px] uppercase tracking-[0.2em] font-semibold text-rose-700 hover:text-rose-900 transition-colors pb-1 border-b border-transparent hover:border-rose-900">
                View All
            </Link>
            <div className="flex gap-2">
              <button
                onClick={() => swiperRef.current?.slidePrev()}
                className="w-10 h-10 rounded-full border border-rose-200 flex items-center justify-center text-rose-700 hover:bg-rose-700 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Previous slider"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => swiperRef.current?.slideNext()}
                className="w-10 h-10 rounded-full border border-rose-200 flex items-center justify-center text-rose-700 hover:bg-rose-700 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Next slider"
              >
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
        </div>

        {/* Products */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {[...Array(4)].map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : (
          <div className="relative">
            <Swiper
                modules={[Navigation, FreeMode]}
                spaceBetween={24}
                slidesPerView={1.2}
                freeMode={{ enabled: true, sticky: true }}
                breakpoints={{
                640: { slidesPerView: 2.2, spaceBetween: 24 },
                1024: { slidesPerView: 3.2, spaceBetween: 32 },
                1280: { slidesPerView: 4, spaceBetween: 40 },
                }}
                onSwiper={(swiper) => (swiperRef.current = swiper)}
                className="!overflow-visible !pb-12"
            >
                {products.map((product, index) => (
                <SwiperSlide key={product.id}>
                    <ProductCard
                    product={product}
                    index={index}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={handleHeartClick}
                    isInCart={isInCart(product.id)}
                    isWishlisted={likedIds.has(product.id)}
                    wishlistLoading={isWishlistLoadingFor(product.id)}
                    />
                </SwiperSlide>
                ))}
            </Swiper>
          </div>
        )}

        {/* Mobile View All */}
        <div className="md:hidden text-center mt-4 flex items-center justify-between px-4">
          <div className="flex gap-2">
              <button onClick={() => swiperRef.current?.slidePrev()} className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center">
                 <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button onClick={() => swiperRef.current?.slideNext()} className="w-10 h-10 rounded-full border border-black/10 flex items-center justify-center">
                 <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
          </div>
          <Link to="/products" className="font-outfit text-[11px] uppercase tracking-[0.2em] font-semibold text-rose-700 border-b border-rose-700 pb-0.5">
            Discover More
          </Link>
        </div>
      </div>
    </section>
  )
}
