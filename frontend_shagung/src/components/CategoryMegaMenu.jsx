// CategoryMegaMenu.jsx - Dynamic categories with subcategories on hover
// Backend Redis handles caching - no frontend caching
import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { api } from '../api/client'

// Process raw API data into categoriesWithSubs format
const processCategories = (response) => {
    // Handle both old format (array) and new format ({ data, cache })
    const data = Array.isArray(response) ? response : (response?.data || [])

    const mainCategories = Array.isArray(data)
        ? data.filter(cat => !cat.parent_id)
        : []

    const allCategories = Array.isArray(data) ? data : []
    return mainCategories.map(main => ({
        ...main,
        subcategories: allCategories.filter(cat => cat.parent_id === main.id)
    }))
}

// ============================================================================
// SKELETON LOADER - Shows while API is loading
// ============================================================================
const CategorySkeleton = () => (
    <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded-lg animate-pulse" />
        ))}
    </div>
)

// ============================================================================
// SUBCATEGORY DROPDOWN - Uses pre-loaded data, no API call on hover
// ============================================================================
const SubcategoryDropdown = ({ subcategories, isOpen, parentSlug }) => {
    if (!isOpen) return null

    return (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {subcategories && subcategories.length > 0 ? (
                subcategories.map(sub => (
                    <Link
                        key={sub.id}
                        to={`/products?category=${sub.slug}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-pink-50 transition-colors"
                    >
                        {sub.image_url && (
                            <img
                                src={sub.image_url}
                                alt={sub.name}
                                className="w-8 h-8 rounded-lg object-cover"
                            />
                        )}
                        <span className="text-sm text-gray-700 hover:text-pink-600">
                            {sub.name}
                        </span>
                    </Link>
                ))
            ) : (
                <Link
                    to={`/products?category=${parentSlug}`}
                    className="block px-4 py-2.5 text-sm text-gray-500"
                >
                    View all products
                </Link>
            )}
        </div>
    )
}

// ============================================================================
// CATEGORY NAV ITEM
// ============================================================================
const CategoryNavItem = ({ category }) => {
    const [isOpen, setIsOpen] = useState(false)
    const timeoutRef = useRef(null)

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setIsOpen(true)
    }

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => setIsOpen(false), 150)
    }

    const hasSubcategories = category.subcategories && category.subcategories.length > 0

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Link
                to={`/products?category=${category.slug}`}
                className={`
          flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all
          ${isOpen
                        ? 'text-pink-600 bg-pink-50'
                        : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50/50'
                    }
        `}
            >
                {category.name}
                {hasSubcategories && (
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </Link>

            {hasSubcategories && (
                <SubcategoryDropdown
                    subcategories={category.subcategories}
                    isOpen={isOpen}
                    parentSlug={category.slug}
                />
            )}
        </div>
    )
}

// ============================================================================
// MAIN CATEGORY MEGA MENU - Backend Redis handles caching
// ============================================================================
export default function CategoryMegaMenu() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Fetch categories from API (backend Redis handles caching)
        api.categoriesWithSub()
            .then(data => {
                const processed = processCategories(data)
                setCategories(processed)
            })
            .catch(err => {
                console.error('Failed to fetch categories:', err)
                setCategories([])
            })
            .finally(() => setLoading(false))
    }, [])

    // Memoize categories to prevent unnecessary re-renders
    const memoizedCategories = useMemo(() => categories, [categories])

    return (
        <nav className="hidden md:flex items-center gap-1">
            {/* All Products Link - Always visible */}
            <Link
                to="/products"
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-pink-600 hover:bg-pink-50/50 rounded-lg transition-all"
            >
                All
            </Link>

            {/* Category Items - Show skeleton while loading */}
            {loading ? (
                <CategorySkeleton />
            ) : (
                memoizedCategories.map(category => (
                    <CategoryNavItem key={category.id} category={category} />
                ))
            )}

            {/* Sale Link - Always visible */}
            <Link
                to="/sale"
                className="px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all"
            >
                Sale 🔥
            </Link>
        </nav>
    )
}

// ============================================================================
// MOBILE CATEGORY MENU
// ============================================================================
export function MobileCategoryMenu({ isOpen, onClose }) {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState(null)

    useEffect(() => {
        if (isOpen) {
            // Fetch fresh data from API
            api.categoriesWithSub()
                .then(data => {
                    const processed = processCategories(data)
                    setCategories(processed)
                })
                .catch(() => setCategories([]))
                .finally(() => setLoading(false))
        }
    }, [isOpen])

    // Memoize categories
    const memoizedCategories = useMemo(() => categories, [categories])

    const handleToggle = (catId) => {
        setExpandedId(expandedId === catId ? null : catId)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-white md:hidden">
            <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-bold">Categories</h2>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                    ✕
                </button>
            </div>

            <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-60px)]">
                {/* All Products - Always visible */}
                <Link
                    to="/products"
                    onClick={onClose}
                    className="block px-4 py-3 text-gray-900 font-medium hover:bg-pink-50 rounded-lg"
                >
                    All Products
                </Link>

                {/* Categories - Show skeleton while loading */}
                {loading ? (
                    <div className="space-y-2 py-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    memoizedCategories.map(cat => (
                        <div key={cat.id}>
                            <div className="flex items-center justify-between px-4 py-3 text-gray-900 font-medium hover:bg-pink-50 rounded-lg">
                                <Link to={`/products?category=${cat.slug}`} onClick={onClose}>
                                    {cat.name}
                                </Link>
                                {cat.subcategories?.length > 0 && (
                                    <button onClick={() => handleToggle(cat.id)}>
                                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === cat.id ? 'rotate-180' : ''}`} />
                                    </button>
                                )}
                            </div>

                            {expandedId === cat.id && cat.subcategories?.length > 0 && (
                                <div className="ml-4 mt-1 space-y-1 border-l-2 border-pink-200 pl-4">
                                    <Link
                                        to={`/products?category=${cat.slug}`}
                                        onClick={onClose}
                                        className="block py-2 text-sm text-gray-600 hover:text-pink-600"
                                    >
                                        View All {cat.name}
                                    </Link>
                                    {cat.subcategories.map(sub => (
                                        <Link
                                            key={sub.id}
                                            to={`/products?category=${sub.slug}`}
                                            onClick={onClose}
                                            className="block py-2 text-sm text-gray-600 hover:text-pink-600"
                                        >
                                            {sub.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}

                {/* Sale Link - Always visible */}
                <Link
                    to="/sale"
                    onClick={onClose}
                    className="block px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-lg"
                >
                    Sale 🔥
                </Link>
            </div>
        </div>
    )
}
