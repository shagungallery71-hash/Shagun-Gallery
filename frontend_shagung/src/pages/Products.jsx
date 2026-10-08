import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Filter, Grid3X3, LayoutGrid,
  ChevronDown, X, Loader2
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { ProductCard, ProductCardSkeleton } from '../components/ui/ProductCard'
import { AnimatedSection, StaggeredContainer, StaggeredItem } from '../components/ui/AnimatedSection'
import Button from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { api } from '../api/client'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart, removeFromCart, selectCartItems } from '../store/slices/cartSlice'
import { selectAllProducts, selectProductStatus, fetchProducts as fetchProductsAction } from '../store/slices/productSlice'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ToastContext'
import { ProductsPageSEO } from '../components/SEO'

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
]

// Helper function to convert slug to display name
// Handles special cases like "lehenga-s" → "Lehenga's"
const slugToDisplayName = (slug) => {
  if (!slug) return ''

  // Handle apostrophe 's case (e.g., lehenga-s → Lehenga's)
  let name = slug.replace(/-s$/, "'s")

  // Replace remaining hyphens with spaces
  name = name.replace(/-/g, ' ')

  // Capitalize first letter of each word
  return name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}


export default function Products() {
  const dispatch = useDispatch()
  const cartItems = useSelector(selectCartItems)
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  // State
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [sortBy, setSortBy] = useState('newest')
  const [gridCols, setGridCols] = useState(4)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [likedIds, setLikedIds] = useState(new Set())

  // Redux Cache
  const reduxProducts = useSelector(selectAllProducts)
  const reduxStatus = useSelector(selectProductStatus)

  // Pagination State
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const loaderRef = useRef(null)

  // Cart loading state
  const [cartLoadingIds, setCartLoadingIds] = useState(new Set())
  const [wishlistLoadingIds, setWishlistLoadingIds] = useState(new Set())

  // Memoize cart item IDs for O(1) lookup efficiency
  const cartItemIds = useMemo(() => {
    return new Set(cartItems.map(item => item.product_id || item.id))
  }, [cartItems])

  const isInCart = useCallback((productId) => {
    return cartItemIds.has(productId)
  }, [cartItemIds])

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        setCategoriesLoading(true)
        // Use mainCategories which returns proper structure: { id, name, slug, ... }
        const response = await api.mainCategories()
        const apiCategories = Array.isArray(response) ? response : (response.data || response.categories || [])
        const cats = [{ id: 'all', slug: 'all', name: 'All' }, ...apiCategories]
        setCategories(cats)

        // Set initial category from URL
        const categoryParam = searchParams.get('category')
        if (categoryParam) {
          const found = cats.find(c =>
            c.slug?.toLowerCase() === categoryParam.toLowerCase() ||
            String(c.id) === categoryParam
          )
          if (found) {
            setSelectedCategory(found)
          } else {
            // Category from URL is not in main categories (might be a subcategory)
            // Create a temporary category object to enable filtering
            setSelectedCategory({
              id: categoryParam,
              slug: categoryParam,
              name: slugToDisplayName(categoryParam)
            })
          }
        } else {
          setSelectedCategory(cats[0])
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err)
        setCategories([{ id: 'all', slug: 'all', name: 'All' }])
        setSelectedCategory({ id: 'all', slug: 'all', name: 'All' })
      } finally {
        setCategoriesLoading(false)
      }
    }
    fetchCategories()
  }, [])

  // Watch for URL changes (when navigating from header)
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    if (categories.length > 0) {
      if (categoryParam) {
        const found = categories.find(c =>
          c.slug?.toLowerCase() === categoryParam.toLowerCase() ||
          String(c.id) === categoryParam
        )
        if (found && found.slug !== selectedCategory?.slug) {
          setSelectedCategory(found)
        } else if (!found && selectedCategory?.slug !== categoryParam) {
          // Create temporary category for subcategory filtering
          setSelectedCategory({
            id: categoryParam,
            slug: categoryParam,
            name: slugToDisplayName(categoryParam)
          })
        }
      } else if (selectedCategory?.slug !== 'all') {
        setSelectedCategory(categories[0])
      }
    }
  }, [searchParams, categories])

  // Local Fetch Handler (for custom filters / pagination)
  const fetchProductsLocal = useCallback(async (pageNum, reset = false) => {
    if (!reset && !hasMore) return;

    try {
      if (reset) {
        setIsLoading(true)
      } else {
        setIsFetchingMore(true)
      }

      const params = {
        page: pageNum,
        limit: 12 // Reduced initial load for speed
      }

      if (selectedCategory && selectedCategory.slug !== 'all') {
        params.category = selectedCategory.slug || selectedCategory.id
      }
      if (sortBy) {
        params.sort = sortBy
      }

      const response = await api.products(params)

      const productsList = Array.isArray(response)
        ? response
        : Array.isArray(response?.products)
          ? response.products
          : Array.isArray(response?.data)
            ? response.data
            : []

      if (reset) {
        setProducts(productsList)
      } else {
        setProducts(prev => [...prev, ...productsList])
      }

      setHasMore(productsList.length >= 12)
      setPage(pageNum)
    } catch (err) {
      console.error('Failed to fetch products:', err)
      if (reset) setProducts([])
      setHasMore(false) // Stop infinite scrolling on error
    } finally {
      setIsLoading(false)
      setIsFetchingMore(false)
    }
  }, [selectedCategory, sortBy])

  // Main Data Synchronization Effect
  useEffect(() => {
    if (selectedCategory === null) return;

    // Always fetch locally to avoid caching and loop issues
    fetchProductsLocal(1, true)
  }, [fetchProductsLocal])

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isFetchingMore) {
          fetchProductsLocal(page + 1, products.length === 0)
        }
      },
      { threshold: 0.1 } // Load when 10% of loader is visible
    )

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current)
      }
    }
  }, [loaderRef, fetchProductsLocal, page, hasMore, isLoading, isFetchingMore, products.length])

  // Fetch wishlist
  useEffect(() => {
    async function fetchWishlist() {
      if (!user || !token) return
      try {
        const response = await api.getWishlist(token)
        // Handle different response structures
        const wishlist = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.items)
              ? response.items
              : Array.isArray(response?.wishlist)
                ? response.wishlist
                : []
        setLikedIds(new Set(wishlist.map(item => item.product_id || item.productId || item.id)))
      } catch (err) {
        console.error('Failed to fetch wishlist:', err)
      }
    }
    fetchWishlist()
  }, [user, token])

  const handleCategoryChange = useCallback((categorySlug) => {
    const found = categories.find(c => c.slug === categorySlug || c.id === categorySlug)
    setSelectedCategory(found || categories[0])
    if (categorySlug === 'all') {
      searchParams.delete('category')
    } else {
      searchParams.set('category', categorySlug)
    }
    setSearchParams(searchParams)
    setShowMobileFilters(false)
  }, [categories, searchParams, setSearchParams])

  const handleToggleWishlist = useCallback(async (product) => {
    if (!user || !token) {
      showToast('Please login to add items to wishlist', 'warning')
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
      console.error('Wishlist error:', err)
      showToast('Failed to update wishlist', 'error')
    } finally {
      setWishlistLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }
  }, [user, token, likedIds, showToast])

  const handleAddToCart = useCallback(async (product) => {
    setCartLoadingIds(prev => new Set(prev).add(product.id))
    try {
      // Redux Thunk handles API + Optimistic Update
      await dispatch(addToCart({ product, quantity: 1 })).unwrap()
      showToast(`${product.name} added to cart!`, 'success')
    } catch (err) {
      console.error('Add to cart error:', err)
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
      // Find the cart item ID
      const cartItem = cartItems.find(item => item.product_id === product.id || item.id === product.id)

      if (cartItem) {
        // Dispatch remove (id is the unique cart id)
        await dispatch(removeFromCart(cartItem.id)).unwrap()
        showToast(`${product.name} removed from cart`, 'info')
      } else {
        // Should not happen if isInCart is correct
        console.warn('Item not found for removal')
      }
    } catch (err) {
      console.error('Remove error:', err)
      showToast('Failed to remove from cart', 'error')
    } finally {
      setCartLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }
  }, [cartItems, dispatch, showToast])

  // Memoize the rendered Products Grid to avoid expensive re-renders
  const productsGrid = useMemo(() => {
    if (isLoading) {
      return (
        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${gridCols} gap-4 md:gap-6`}>
          {[...Array(12)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )
    }

    if (products.length > 0) {
      return (
        <StaggeredContainer
          className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${gridCols} gap-4 md:gap-6`}
          staggerDelay={0.05}
        >
          {products.map((product) => (
            <StaggeredItem key={product.id}>
              <ProductCard
                product={product}
                onAddToCart={handleAddToCart}
                onRemoveFromCart={handleRemoveFromCart}
                onToggleWishlist={handleToggleWishlist}
                isInCart={isInCart(product.id)}
                isWishlisted={likedIds.has(product.id)}
                cartLoading={cartLoadingIds.has(product.id)}
                wishlistLoading={wishlistLoadingIds.has(product.id)}
              />
            </StaggeredItem>
          ))}
        </StaggeredContainer>
      )
    }

    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
          <Filter className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-lg mb-2">No products found</p>
        <p className="text-sm text-muted-foreground mb-4">
          Try selecting a different category or clearing filters
        </p>
        <Button
          variant="outline"
          onClick={() => handleCategoryChange('all')}
        >
          View All Products
        </Button>
      </div>
    )
  }, [
    isLoading,
    products,
    gridCols,
    handleAddToCart,
    handleRemoveFromCart,
    handleToggleWishlist,
    isInCart,
    likedIds,
    cartLoadingIds,
    wishlistLoadingIds,
    handleCategoryChange
  ])

  return (
    <>
      <ProductsPageSEO category={selectedCategory} totalProducts={products.length} />
      <motion.div
        className="min-h-screen bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Header />

        <main className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <AnimatedSection className="mb-10 text-center font-outfit">
            <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold text-neutral-400 mb-6">
              <Link to="/" className="hover:text-amber-500 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-black">Collections</span>
              {selectedCategory && selectedCategory.slug !== 'all' && (
                <>
                  <span>/</span>
                  <span className="text-black">{selectedCategory.name}</span>
                </>
              )}
            </div>
            <h1 className="font-playfair text-4xl md:text-5xl font-medium text-black mb-4">
              {selectedCategory && selectedCategory.slug !== 'all'
                ? selectedCategory.name
                : 'The Collection'
              }
            </h1>
            <p className="text-xs font-light text-neutral-500 tracking-[0.1em] uppercase">
              {isLoading
                ? 'Curating collection...'
                : `Discover ${products.length} handpicked pieces`
              }
            </p>
          </AnimatedSection>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-black/10 pb-6 mb-8 mt-12 gap-6 font-outfit">
            {/* Categories - Desktop */}
            <div className="hidden md:flex items-center gap-8 flex-wrap">
              {categoriesLoading ? (
                <div className="flex items-center gap-3 text-neutral-400">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                  <span className="text-[10px] uppercase tracking-widest font-semibold">Loading...</span>
                </div>
              ) : (
                categories.map((cat, index) => (
                  <button
                    key={cat.id || cat._id || `cat-${index}`}
                    onClick={() => handleCategoryChange(cat.slug || cat.id)}
                    className={`
                    text-[11px] uppercase tracking-[0.2em] font-semibold pb-2 transition-all relative group
                    ${(selectedCategory?.id === cat.id || selectedCategory?.slug === cat.slug)
                        ? 'text-amber-600'
                        : 'text-neutral-500 hover:text-black'
                      }
                  `}
                  >
                    {cat.name}
                    {/* Minimalist active indicator */}
                    {(selectedCategory?.id === cat.id || selectedCategory?.slug === cat.slug) && (
                         <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-amber-500" />
                    )}
                    {(selectedCategory?.id !== cat.id && selectedCategory?.slug !== cat.slug) && (
                         <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-black scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Mobile Filter Button */}
            <button
              className="md:hidden flex items-center justify-center gap-2 w-full py-3 border border-black/10 text-[10px] uppercase tracking-widest font-bold text-black hover:bg-[#faf9f8] transition-colors"
              onClick={() => setShowMobileFilters(true)}
            >
              <Filter className="h-3.5 w-3.5" strokeWidth={1.5} />
              Filters {selectedCategory && selectedCategory.slug !== 'all' && `(${selectedCategory.name})`}
            </button>

            <div className="flex items-center gap-6">
              {/* Sort Dropdown */}
              <div className="relative border-b border-black/20 pb-1 group">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="
                  appearance-none bg-transparent pr-6 text-[11px] uppercase tracking-[0.15em] font-semibold text-black cursor-pointer
                  focus:outline-none focus:border-black
                "
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none text-neutral-400 group-hover:text-black transition-colors" strokeWidth={1.5} />
              </div>

              {/* Grid Toggle */}
              <div className="hidden md:flex items-center gap-3 pl-4 border-l border-black/10">
                <button
                  onClick={() => setGridCols(3)}
                  className={`transition-colors ${gridCols === 3 ? 'text-black' : 'text-neutral-300 hover:text-neutral-500'}`}
                >
                  <Grid3X3 className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setGridCols(4)}
                  className={`transition-colors ${gridCols === 4 ? 'text-black' : 'text-neutral-300 hover:text-neutral-500'}`}
                >
                  <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {selectedCategory && selectedCategory.slug !== 'all' && (
            <div className="flex items-center gap-3 mb-8 font-outfit">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">Active filters:</span>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-amber-200 bg-amber-50 text-amber-800 text-[10px] uppercase tracking-widest font-bold">
                {selectedCategory.name}
                <button onClick={() => handleCategoryChange('all')} className="hover:bg-amber-100 rounded-full p-0.5 transition-colors">
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* Render Memoized Grid */}
          {productsGrid}

          {/* Infinite Scroll Loader Trigger */}
          <div ref={loaderRef} className="h-10 w-full flex items-center justify-center p-4 mt-4">
            {isFetchingMore && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
          </div>

        </main>

        {/* Mobile Filters Modal */}
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white md:hidden font-outfit"
          >
            <div className="flex items-center justify-between p-6 border-b border-black/5">
              <h2 className="text-lg font-playfair font-bold text-black uppercase tracking-wider">Filters</h2>
              <button onClick={() => setShowMobileFilters(false)} className="p-2 -mr-2 text-neutral-400 hover:text-black transition-colors">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-500 mb-6 block">Categories</h3>
                {categoriesLoading ? (
                  <div className="flex items-center gap-3 text-neutral-400 py-4">
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-widest font-semibold">Loading...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0 border-t border-black/5">
                    {categories.map((cat, index) => (
                      <button
                        key={cat.id || cat._id || `mobile-cat-${index}`}
                        onClick={() => handleCategoryChange(cat.slug || cat.id)}
                        className={`
                        w-full text-left py-4 border-b border-black/5 text-xs tracking-[0.15em] uppercase transition-colors font-semibold flex items-center justify-between
                        ${(selectedCategory?.id === cat.id || selectedCategory?.slug === cat.slug)
                            ? 'text-amber-600'
                            : 'text-black hover:text-amber-500'
                          }
                      `}
                      >
                        {cat.name}
                        {(selectedCategory?.id === cat.id || selectedCategory?.slug === cat.slug) && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <Footer />
      </motion.div>
    </>
  )
}
