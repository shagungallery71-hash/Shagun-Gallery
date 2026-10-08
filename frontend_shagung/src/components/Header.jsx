import { Search, ShoppingBag, User, Heart, Menu, X, ChevronDown, ChevronRight, Grid3X3, LogIn, LogOut } from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { useSelector } from 'react-redux'
import SearchWithDropdown from './ui/SearchWithDropdown'
import { api } from '../api/client'
import { selectCartTotalQty } from '../store/slices/cartSlice'
import Button from './ui/Button'
import { useAuth } from '../context/AuthContext'

// ============================================================================
// CATEGORY LINK 
// ============================================================================
const CategoryLink = ({ to, children, className, onClick }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleClick = (e) => {
    e.preventDefault()
    if (onClick) onClick()

    if (location.pathname.startsWith('/products')) {
      window.location.href = to
    } else {
      navigate(to)
    }
  }

  return (
    <a href={to} onClick={handleClick} className={className}>
      {children}
    </a>
  )
}

// ============================================================================
// CATEGORY DROPDOWN - Modern Glassmorphism
// ============================================================================
const CategoryDropdown = ({ category, isOpen }) => {
  if (!category.subcategories || category.subcategories.length === 0) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 15, rotateX: -10 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: 10, rotateX: -5 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ perspective: "1000px" }}
          className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 min-w-[260px] z-50"
        >
          <div className="bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />
            <div className="relative z-10 p-2 flex flex-col gap-1">
              {category.subcategories.map(sub => (
                <CategoryLink
                  key={sub.id}
                  to={`/products?category=${sub.slug}`}
                  className="group flex items-center justify-between px-4 py-3 rounded-xl hover:bg-black/5 hover:backdrop-blur-md transition-all duration-300"
                >
                  <span className="text-xs uppercase tracking-[0.15em] text-neutral-600 group-hover:text-black font-semibold transition-colors font-outfit">
                    {sub.name}
                  </span>
                  <ChevronRight className="h-3 w-3 text-neutral-400 group-hover:text-black group-hover:translate-x-1 transition-all" strokeWidth={2} />
                </CategoryLink>
              ))}

              <div className="px-3 pt-3 mt-2 border-t border-black/5 pb-2">
                <CategoryLink
                  to={`/products?category=${category.slug}`}
                  className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-black font-bold group bg-white py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all border border-black/5"
                >
                  View Collection
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
                </CategoryLink>
              </div>
            </div>
          </div>

          {/* The little pointing arrow */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/70 backdrop-blur-xl border-l border-t border-white/40 rotate-45 rounded-sm" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const ArrowRight = ({ className, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
)

// ============================================================================
// CATEGORY NAV ITEM
// ============================================================================
const CategoryNavItem = ({ category, isDarkBanner }) => {
  const [isOpen, setIsOpen] = useState(false)

  const baseTextColor = isDarkBanner ? 'text-white/80 hover:text-white' : 'text-neutral-500 hover:text-black'
  const activeTextColor = isDarkBanner ? 'text-white' : 'text-black'
  const underlineColor = isDarkBanner ? 'bg-white' : 'bg-black'

  return (
    <div
      className="relative flex items-center h-full group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <CategoryLink
        to={`/products?category=${category.slug}`}
        className={`
          relative flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors font-outfit
          ${isOpen ? activeTextColor : baseTextColor}
        `}
      >
        {category.name}
        {category.subcategories?.length > 0 && (
          <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${isOpen ? `rotate-180 ${activeTextColor}` : ''}`} strokeWidth={2} />
        )}

        {/* Animated Underline */}
        <motion.div
          className={`absolute bottom-0 left-0 right-0 h-[2px] ${underlineColor} origin-left`}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: isOpen ? 1 : 0, opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "circOut" }}
        />
      </CategoryLink>

      <CategoryDropdown category={category} isOpen={isOpen} />
    </div>
  )
}

// ============================================================================
// MEGA MENU - Redesigned Modal
// ============================================================================
const AllCategoriesMegaMenu = ({ categories, isOpen, onClose }) => {
  const [hoveredCategoryId, setHoveredCategoryId] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  const hoveredCategory = categories.find(c => c.id === hoveredCategoryId) || categories[0]

  const handleCategoryClick = (e, slug) => {
    e.preventDefault()
    onClose()
    const targetUrl = `/products?category=${slug}`
    if (location.pathname.startsWith('/products')) window.location.href = targetUrl
    else navigate(targetUrl)
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed left-0 right-0 bottom-0 bg-black/40 z-[90] top-0"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -20, x: "-50%", opacity: 0 }} animate={{ y: 0, x: "-50%", opacity: 1 }} exit={{ y: -10, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute top-[112px] left-1/2 w-[900px] max-w-[95vw] bg-white rounded-b-3xl overflow-hidden shadow-2xl flex border border-white/50"
            onClick={(e) => e.stopPropagation()}
            style={{ height: '480px' }}
          >
            {/* Visual Side Banner — dynamic category image */}
            <div className="hidden md:flex w-1/3 bg-zinc-950 relative overflow-hidden flex-col justify-end text-white">
              <AnimatePresence mode="wait">
                <motion.div
                  key={hoveredCategory?.id}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  {hoveredCategory?.image_url ? (
                    <img
                      src={hoveredCategory.image_url}
                      alt={hoveredCategory.name}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-rose-900 via-zinc-900 to-black" />
                  )}
                </motion.div>
              </AnimatePresence>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10" />
              {/* Text */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={hoveredCategory?.id + '-text'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-20 p-8"
                >
                  <p className="font-outfit text-xs uppercase tracking-[0.3em] text-white/50 mb-2">Collection</p>
                  <h3 className="font-playfair text-3xl font-bold leading-tight">{hoveredCategory?.name || 'Exclusives'}</h3>
                  <p className="mt-2 text-xs text-white/50 font-outfit">
                    {hoveredCategory?.subcategories?.length > 0
                      ? `${hoveredCategory.subcategories.length} subcollections`
                      : 'Explore the full collection'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Main Categories Col */}
            <div className="w-full md:w-[28%] bg-neutral-50/80 border-r border-neutral-100 py-8 px-6 overflow-y-auto">
              <p className="text-[10px] text-neutral-400 uppercase tracking-[0.2em] font-bold mb-6 px-4">Collections</p>
              <div className="flex flex-col gap-1">
                {categories.map(cat => (
                  <a key={cat.id} href={`/products?category=${cat.slug}`}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${hoveredCategoryId === cat.id ? 'bg-white shadow-sm font-bold text-black' : 'text-neutral-500 hover:text-black font-semibold'}`}
                    onMouseEnter={() => setHoveredCategoryId(cat.id)}
                    onClick={(e) => handleCategoryClick(e, cat.slug)}
                  >
                    {/* Category thumbnail */}
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-neutral-200 shrink-0">
                      {cat.image_url
                        ? <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover object-top" />
                        : <div className="w-full h-full bg-gradient-to-br from-rose-100 to-neutral-200" />
                      }
                    </div>
                    <span className="text-[11px] uppercase tracking-widest font-outfit flex-1">{cat.name}</span>
                    {cat.subcategories?.length > 0 && <ChevronRight className="h-3 w-3" strokeWidth={2} />}
                  </a>
                ))}
              </div>
            </div>

            {/* Subcategories Col */}
            <div className="hidden md:block flex-1 bg-white py-8 px-8 relative overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={hoveredCategory?.id}
                  initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="h-full flex flex-col"
                >
                  <h3 className="text-xl font-playfair font-bold text-black mb-5">
                    {hoveredCategory?.name}
                  </h3>
                  {hoveredCategory?.subcategories?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      {hoveredCategory.subcategories.map(sub => (
                        <a key={sub.id} href={`/products?category=${sub.slug}`}
                          className="group flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-all"
                          onClick={(e) => handleCategoryClick(e, sub.slug)}
                        >
                          {/* Subcategory image */}
                          <div className="w-12 h-14 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-100 group-hover:border-rose-200 transition-colors">
                            {sub.image_url
                              ? <img src={sub.image_url} alt={sub.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                              : <div className="w-full h-full bg-gradient-to-br from-rose-50 to-neutral-100 flex items-center justify-center text-neutral-300 text-[9px] font-bold uppercase tracking-wide">{sub.name?.charAt(0)}</div>
                            }
                          </div>
                          <span className="text-[11px] uppercase tracking-widest font-outfit font-semibold text-neutral-500 group-hover:text-black transition-colors leading-tight">
                            {sub.name}
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center text-neutral-400 text-sm italic font-playfair">
                      View the full collection
                    </div>
                  )}

                  <div className="mt-auto pt-6 border-t border-neutral-100">
                    <Button
                      variant="outline"
                      className="w-full rounded-full font-outfit uppercase tracking-widest text-[10px]"
                      onClick={(e) => handleCategoryClick(e, hoveredCategory?.slug)}
                    >
                      Explore All {hoveredCategory?.name}
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (typeof document === 'undefined') return modalContent
  return createPortal(modalContent, document.body)
}

// ============================================================================
// MAIN HEADER COMPONENT - REDESIGNED
// ============================================================================
let cachedCategories = null

export default function Header() {
  const totalQty = useSelector(selectCartTotalQty)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHidden, setIsHidden] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [allCategoriesOpen, setAllCategoriesOpen] = useState(false)
  const [categories, setCategories] = useState(cachedCategories || [])
  const [loading, setLoading] = useState(!cachedCategories)
  const location = useLocation()
  const allCategoriesRef = useRef(null)

  const { user, logout } = useAuth()
  const { scrollY } = useScroll()

  // Hide/Show logic based on scroll direction
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious()
    if (latest > 10) {
      setIsScrolled(true)
    } else {
      setIsScrolled(false)
    }

    // Disable hiding header on scroll down to keep it sticky
    setIsHidden(false)
  })

  useEffect(() => {
    if (cachedCategories && cachedCategories.length > 0) return
    const fetchCategories = async () => {
      try {
        const mainCatsResponse = await api.mainCategories()
        const catsArray = Array.isArray(mainCatsResponse) ? mainCatsResponse : (mainCatsResponse?.data || [])
        const initialCats = catsArray.map(cat => ({ ...cat, subcategories: [] }))
        setCategories(initialCats)
        cachedCategories = initialCats
        setLoading(false)

        const catsWithSubs = await Promise.all(
          catsArray.map(async (cat) => {
            try {
              const subData = await api.subcategories(cat.id)
              return { ...cat, subcategories: subData?.subcategories || [] }
            } catch {
              return { ...cat, subcategories: [] }
            }
          })
        )
        setCategories(catsWithSubs)
        cachedCategories = catsWithSubs
      } catch (err) {
        setCategories([])
        setLoading(false)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    setMenuOpen(false)
    setAllCategoriesOpen(false)
  }, [location.pathname])

  const headerCategories = useMemo(() => categories.slice(0, 5), [categories])

  const isHomeOrAdmin = location.pathname === '/' || location.pathname.startsWith('/admin')
  const isDarkBanner = isHomeOrAdmin && !isScrolled

  // Theme rules based on location & scroll
  const navTextColor = isDarkBanner ? 'text-white/80 hover:text-white' : 'text-neutral-500 hover:text-black'
  const logoColor = isDarkBanner ? 'text-white' : 'text-black'
  const iconColor = isDarkBanner ? 'text-white/90 hover:text-white' : 'text-black/80 hover:text-black'

  return (
    <>
      <style>{`
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-outfit { font-family: 'Outfit', sans-serif; }
      `}</style>

      <motion.header
        variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
        animate={isHidden ? "hidden" : "visible"}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-500`}
      >
        {/* Dynamic Background */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${isScrolled ? 'bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm' : 'bg-transparent'}`} />
        <div className={`absolute inset-0 transition-opacity duration-500 ${isDarkBanner ? 'bg-gradient-to-b from-black/80 via-black/40 to-transparent' : 'opacity-0'}`} />

        {/* Global Announcement Bar — matches live site */}
        <div className="relative w-full flex items-center justify-center bg-zinc-950 py-1.5 px-4 overflow-hidden">
          <p className="text-[10px] md:text-xs font-outfit font-medium tracking-wide text-center whitespace-nowrap overflow-hidden text-ellipsis">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse mr-2 align-middle" />
            <span className="text-rose-400 font-semibold">Free Shipping</span>
            <span className="text-white/60"> on orders over </span>
            <span className="text-white font-semibold">₹999</span>
            <span className="text-white/40 mx-2">•</span>
            <span className="text-white/60">Use code </span>
            <span className="text-amber-400 font-bold tracking-widest">SHAGUN10</span>
            <span className="text-white/60"> for extra 10% off</span>
          </p>
        </div>


        <div className="container relative mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-[72px] gap-8">

            {/* Mobile Menu Button */}
            <div className="flex-1 lg:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)} className={`p-2 -ml-2 transition-colors ${iconColor}`}>
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {/* Logo */}
            <div className="flex-1 flex justify-center lg:justify-start py-1">
              <Link to="/" className="flex items-center">
                <img
                  src="https://res.cloudinary.com/dsgktwwae/image/upload/v1773397047/WhatsApp_Image_2026-03-13_at_11.39.26_wepbgx.jpg"
                  alt="Shagun Gallery"
                  className={`h-10 md:h-12 lg:h-14 object-contain transition-all duration-300 ${isDarkBanner ? 'opacity-90 hover:opacity-100 border border-white/20 rounded' : 'mix-blend-multiply'}`}
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex flex-1 justify-center items-center h-full">
              <div className="flex items-center h-full" ref={allCategoriesRef}>
                {loading ? (
                  <div className="flex gap-4">
                    <div className="w-16 h-4 bg-white/20 animate-pulse rounded" />
                    <div className="w-16 h-4 bg-white/20 animate-pulse rounded" />
                  </div>
                ) : (
                  <>
                    {headerCategories.map(cat => (
                      <div key={cat.id} className="h-full px-2 flex items-center">
                        <CategoryNavItem category={cat} isDarkBanner={isDarkBanner} />
                      </div>
                    ))}

                    {/* Sale Link */}
                    <div className="h-full px-2 flex items-center">
                      <Link
                        to="/sale"
                        className={`flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-[0.2em] font-bold transition-colors font-outfit ${isDarkBanner ? 'text-rose-400 hover:text-rose-300' : 'text-rose-600 hover:text-rose-800'}`}
                      >
                        SALE
                      </Link>
                    </div>

                    {/* Collection Button triggers mega menu */}
                    <div className="h-full px-2 flex items-center">
                      <button
                        onClick={() => setAllCategoriesOpen(!allCategoriesOpen)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-[0.2em] font-semibold transition-colors font-outfit ${allCategoriesOpen ? 'text-black' : navTextColor}`}
                      >
                        <Grid3X3 className="h-3.5 w-3.5" strokeWidth={2} />
                        More
                      </button>
                    </div>
                  </>
                )}
                <AllCategoriesMegaMenu categories={categories} isOpen={allCategoriesOpen} onClose={() => setAllCategoriesOpen(false)} />
              </div>
            </nav>

            {/* Right Actions */}
            <div className="flex-1 flex items-center justify-end gap-5">
              <div className="hidden lg:block w-48 xl:w-64 transition-all duration-500">
                <SearchWithDropdown placeholder="Discover..." />
              </div>

              <button onClick={() => setSearchOpen(true)} className={`lg:hidden transition-transform hover:scale-110 ${iconColor}`}>
                <Search className="h-[18px] w-[18px]" strokeWidth={2} />
              </button>

              <Link to="/wishlist" className={`transition-transform hover:scale-110 ${iconColor}`}>
                <Heart className="h-[18px] w-[18px]" strokeWidth={2} />
              </Link>

              <Link to="/account" className={`transition-transform hover:scale-110 ${iconColor}`}>
                <User className="h-[18px] w-[18px]" strokeWidth={2} />
              </Link>

              <div className="flex items-center gap-4 pl-2 border-l border-white/20">
                <Link to="/cart" className={`relative flex items-center gap-2 transition-transform hover:scale-110 group ${iconColor}`}>
                  <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={2} />
                  <span className="hidden lg:block text-[11px] uppercase tracking-widest font-outfit font-semibold opacity-80 group-hover:opacity-100">Cart</span>
                  {totalQty > 0 && (
                    <span className="absolute -top-2 -left-2 min-w-[18px] h-[18px] flex items-center justify-center bg-amber-500 text-black text-[10px] font-bold rounded-full border-2 border-transparent">
                      {totalQty}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: '100vh', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden absolute top-[112px] left-0 right-0 bg-white z-40 overflow-y-auto"
            >
              <div className="container mx-auto px-6 py-8">
                <p className="font-playfair text-sm italic text-neutral-400 mb-6">Explore the collections</p>
                <div className="space-y-2">
                  {categories.map((cat, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + (i * 0.05) }}
                      key={cat.id}
                    >
                      <MobileCategoryItem category={cat} onClose={() => setMenuOpen(false)} />
                    </motion.div>
                  ))}

                  {/* Mobile Sale Link */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + (categories.length * 0.05) }}
                  >
                    <div className="border-b border-black/5 relative">
                      <div className="flex items-center justify-between py-4">
                        <Link to="/sale" onClick={() => setMenuOpen(false)} className="font-outfit text-xl font-bold text-rose-600 hover:text-rose-700 transition-colors">
                          SALE %
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="mt-12 pt-8 border-t border-neutral-100 grid grid-cols-2 gap-6">
                  <Link to="/account" onClick={() => setMenuOpen(false)} className="flex flex-col gap-2 font-outfit text-xs uppercase tracking-widest font-semibold text-neutral-600">
                    <User className="w-5 h-5 mb-1 text-black" />
                    My Account
                  </Link>
                  <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="flex flex-col gap-2 font-outfit text-xs uppercase tracking-widest font-semibold text-neutral-600">
                    <Heart className="w-5 h-5 mb-1 text-black" />
                    Wishlist
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full Screen Mobile Search Modal */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="fixed inset-0 z-[100] bg-white xl:hidden flex flex-col pt-safe"
            >
              <div className="flex items-center justify-between p-5 border-b border-black/5 bg-white">
                <h3 className="font-playfair text-2xl font-bold text-black tracking-wide">Search</h3>
                <button onClick={() => setSearchOpen(false)} className="p-2 -mr-2 text-black hover:text-stone-500 transition-colors">
                  <X className="h-6 w-6" strokeWidth={1.5} />
                </button>
              </div>
              <div className="p-5 flex-1 overflow-y-auto bg-[#FAFAFA]">
                <SearchWithDropdown placeholder="What are you looking for?" onClose={() => setSearchOpen(false)} className="w-full shadow-sm bg-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer so content doesn't jump since header is fixed */}
      {!isHomeOrAdmin && <div className="h-[112px]" />}
    </>
  )
}

// ============================================================================
// MOBILE CATEGORY ITEM
// ============================================================================
const MobileCategoryItem = ({ category, onClose }) => {
  const [expanded, setExpanded] = useState(false)
  const hasSubcategories = category.subcategories && category.subcategories.length > 0

  return (
    <div className="border-b border-black/5 last:border-0 relative">
      <div className="flex items-center justify-between py-4">
        <Link to={`/products?category=${category.slug}`} onClick={onClose} className="font-outfit text-xl font-semibold text-black hover:text-amber-500 transition-colors">
          {category.name}
        </Link>
        {hasSubcategories && (
          <button onClick={() => setExpanded(!expanded)} className="p-3 bg-neutral-50 rounded-full" aria-label="Expand">
            <ChevronDown className={`h-4 w-4 text-black transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} strokeWidth={2} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {expanded && hasSubcategories && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-6 pl-4 border-l-2 border-amber-500 space-y-4">
              {category.subcategories.map(sub => (
                <Link key={sub.id} to={`/products?category=${sub.slug}`} onClick={onClose} className="block font-outfit text-sm uppercase tracking-widest text-neutral-500 hover:text-black">
                  {sub.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
