// ProductDetails/RelatedProducts.jsx - Related products carousel
import { Link } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { api } from '../../api/client'
import { FALLBACK_GALLERY } from './shared'

// ============================================================================
// RELATED PRODUCT CARD
// ============================================================================
const RelatedProductCard = ({ product }) => {
    // Image fallback chain: image > images[0].image_url > images[0] > category_image > fallback
    const productImage = product.image ||
        product.images?.[0]?.image_url ||
        product.images?.[0] ||
        product.category_image ||
        FALLBACK_GALLERY[0];

    return (
        <Link
            to={`/products/${product.id}`}
            className="group flex-shrink-0 w-48 bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
            <div className="relative aspect-square overflow-hidden">
                <img
                    src={productImage}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                />
                {/* Quick view overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-full">
                        Quick View
                    </span>
                </div>
            </div>
            <div className="p-3">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-1 group-hover:text-rose-700 transition-colors">
                    {product.name}
                </h4>
                <div className="mt-1 flex items-center gap-2">
                    <span className="font-bold text-rose-700">₹{Number(product.price).toLocaleString()}</span>
                    {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                        <span className="text-xs text-gray-400 line-through">
                            ₹{Number(product.compare_at_price).toLocaleString()}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

// ============================================================================
// RELATED PRODUCTS SECTION
// ============================================================================
export const RelatedProducts = ({ products, title = "You May Also Like", categorySlug }) => {
    if (!products || products.length === 0) return null

    // Build the link - if categorySlug is provided, link to that category
    const viewAllLink = categorySlug
        ? `/products?category=${categorySlug}`
        : '/products'

    return (
        <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <Link
                    to={viewAllLink}
                    className="text-sm font-medium text-rose-700 hover:text-rose-800 flex items-center gap-1"
                >
                    View all
                    <span className="text-lg">→</span>
                </Link>
            </div>

            {/* Horizontal scrollable carousel */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-rose-200 scrollbar-track-gray-100">
                {products.map(prod => (
                    <RelatedProductCard key={prod.id} product={prod} />
                ))}
            </div>
        </section>
    )
}

// ============================================================================
// ALL PRODUCTS SLIDER - Infinite Circular Auto-Scrolling with Manual Drag
// ============================================================================
export const AllProductsSlider = ({ excludeProductId }) => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [isPaused, setIsPaused] = useState(false)
    const [isMouseDown, setIsMouseDown] = useState(false)
    const [hasDragged, setHasDragged] = useState(false) // Track if actual drag occurred
    const [startX, setStartX] = useState(0)
    const [scrollLeft, setScrollLeft] = useState(0)
    const scrollRef = useRef(null)
    const autoScrollRef = useRef(null)
    const DRAG_THRESHOLD = 5 // Minimum pixels to move before considering it a drag

    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                setLoading(true)
                const res = await api.products({ limit: 30 })
                if (res.products) {
                    // Filter out the current product if excludeProductId is provided
                    const filteredProducts = excludeProductId
                        ? res.products.filter(p => p.id !== excludeProductId)
                        : res.products
                    setProducts(filteredProducts)
                }
            } catch (err) {
                console.error('Failed to fetch all products:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchAllProducts()
    }, [excludeProductId])

    // Auto-scroll effect
    useEffect(() => {
        if (!scrollRef.current || loading || products.length === 0 || isPaused) return

        const scroll = () => {
            if (scrollRef.current && !isPaused && !isMouseDown) {
                scrollRef.current.scrollLeft += 1
                // Reset to start for infinite loop
                const maxScroll = scrollRef.current.scrollWidth / 2
                if (scrollRef.current.scrollLeft >= maxScroll) {
                    scrollRef.current.scrollLeft = 0
                }
            }
        }

        autoScrollRef.current = setInterval(scroll, 30)
        return () => clearInterval(autoScrollRef.current)
    }, [loading, products.length, isPaused, isMouseDown])

    // Mouse/Touch drag handlers
    const handleMouseDown = (e) => {
        setIsMouseDown(true)
        setHasDragged(false) // Reset drag state on new press
        setStartX(e.pageX - scrollRef.current.offsetLeft)
        setScrollLeft(scrollRef.current.scrollLeft)
    }

    const handleMouseMove = (e) => {
        if (!isMouseDown) return
        const x = e.pageX - scrollRef.current.offsetLeft
        const deltaX = Math.abs(x - startX)

        // Only start dragging if we've moved beyond the threshold
        if (deltaX > DRAG_THRESHOLD) {
            setHasDragged(true)
            e.preventDefault()
            const walk = (x - startX) * 2
            scrollRef.current.scrollLeft = scrollLeft - walk
        }
    }

    const handleMouseUp = () => {
        setIsMouseDown(false)
        // Reset hasDragged after a small delay to allow click to register
        setTimeout(() => setHasDragged(false), 10)
    }

    const handleMouseLeave = () => {
        setIsMouseDown(false)
        setHasDragged(false)
        setIsPaused(false)
    }

    // Touch handlers
    const handleTouchStart = (e) => {
        setIsMouseDown(true)
        setHasDragged(false)
        setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft)
        setScrollLeft(scrollRef.current.scrollLeft)
    }

    const handleTouchMove = (e) => {
        if (!isMouseDown) return
        const x = e.touches[0].pageX - scrollRef.current.offsetLeft
        const deltaX = Math.abs(x - startX)

        if (deltaX > DRAG_THRESHOLD) {
            setHasDragged(true)
            const walk = (x - startX) * 2
            scrollRef.current.scrollLeft = scrollLeft - walk
        }
    }

    const handleTouchEnd = () => {
        setIsMouseDown(false)
        setTimeout(() => setHasDragged(false), 10)
    }

    if (loading) {
        return (
            <section className="mt-16">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-gray-100 rounded-2xl aspect-square animate-pulse" />
                    ))}
                </div>
            </section>
        )
    }

    if (products.length === 0) return null

    // Duplicate products for seamless infinite scroll
    const duplicatedProducts = [...products, ...products]

    return (
        <section className="mt-16 py-8 bg-gradient-to-r from-rose-50/50 to-rose-100/30 -mx-4 md:rounded-3xl md:mx-0 overflow-hidden">
            <div className="flex items-center justify-between mb-6 px-4 md:px-8">
                <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
                <Link
                    to="/products"
                    className="text-sm font-medium text-rose-700 hover:text-rose-800 flex items-center gap-1"
                >
                    Browse all
                    <span className="text-lg">→</span>
                </Link>
            </div>

            {/* Infinite Circular Scroller with Manual Drag */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing select-none"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={handleMouseLeave}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {duplicatedProducts.map((prod, index) => (
                    <div
                        key={`${prod.id}-${index}`}
                        className="flex-shrink-0 w-48"
                        style={{ pointerEvents: hasDragged ? 'none' : 'auto' }}
                    >
                        <RelatedProductCard product={prod} />
                    </div>
                ))}
            </div>

            {/* Hint for manual scroll */}
            <p className="text-center text-xs text-gray-400 mt-3 px-4">
                ← Drag or swipe to browse →
            </p>

            {/* Hide scrollbar styles */}
            <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    )
}

// ============================================================================
// RECENTLY VIEWED PRODUCTS
// ============================================================================
export const RecentlyViewedProducts = ({ products }) => {
    if (!products || products.length === 0) return null

    return (
        <section className="mt-16 py-8 bg-gray-50 -mx-4 px-4 md:rounded-3xl md:mx-0 md:px-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recently Viewed</h2>
                <button className="text-sm text-gray-500 hover:text-gray-700">
                    Clear all
                </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {products.map(prod => (
                    <RelatedProductCard key={prod.id} product={prod} />
                ))}
            </div>
        </section>
    )
}

export default RelatedProducts

