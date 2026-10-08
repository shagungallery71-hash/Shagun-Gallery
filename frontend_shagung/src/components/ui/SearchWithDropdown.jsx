import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, TrendingUp, Clock, ArrowRight, Loader2 } from 'lucide-react'
import { api } from '../../api/client'
import { cookieStorage } from '../../utils/cookieStorage'

// Debounce hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => clearTimeout(handler)
    }, [value, delay])

    return debouncedValue
}

export default function SearchWithDropdown({
    placeholder = "Search products...",
    className = "",
    onClose
}) {
    const [query, setQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [suggestions, setSuggestions] = useState([])
    const [products, setProducts] = useState([])
    const [trending, setTrending] = useState([])
    const [recentSearches, setRecentSearches] = useState([])
    const [responseTime, setResponseTime] = useState(null)

    const inputRef = useRef(null)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()

    const debouncedQuery = useDebounce(query, 200) // 200ms debounce

    // Load recent searches from cookies
    useEffect(() => {
        const recent = cookieStorage.getItem('recent_searches')
        if (recent) {
            try {
                setRecentSearches(JSON.parse(recent).slice(0, 5))
            } catch (e) {
                console.error('Failed to parse recent searches')
            }
        }
    }, [])

    // Load trending searches
    useEffect(() => {
        api.trendingSearches()
            .then(data => {
                if (data.trending) {
                    setTrending(data.trending)
                }
            })
            .catch(console.error)
    }, [])

    // Fetch suggestions when query changes
    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setSuggestions([])
            setProducts([])
            return
        }

        setIsLoading(true)

        // Fetch both suggestions and products in parallel
        Promise.all([
            api.searchSuggestions(debouncedQuery),
            api.searchProducts(debouncedQuery, { limit: 6 })
        ])
            .then(([suggestionsData, productsData]) => {
                setSuggestions(suggestionsData.suggestions || [])
                setProducts(productsData.products || [])
                setResponseTime(productsData.responseTime)
            })
            .catch(console.error)
            .finally(() => setIsLoading(false))
    }, [debouncedQuery])

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Save to recent searches
    const saveRecentSearch = useCallback((searchTerm) => {
        const recent = cookieStorage.getItem('recent_searches')
        let searches = []
        try {
            searches = recent ? JSON.parse(recent) : []
        } catch (e) {
            searches = []
        }

        // Remove duplicate and add to front
        searches = [searchTerm, ...searches.filter(s => s !== searchTerm)].slice(0, 5)
        cookieStorage.setItem('recent_searches', JSON.stringify(searches))
        setRecentSearches(searches)
    }, [])

    // Handle search submit
    const handleSearch = useCallback((searchTerm) => {
        if (!searchTerm.trim()) return

        saveRecentSearch(searchTerm.trim())
        setIsOpen(false)
        setQuery('')
        navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`)
        if (onClose) onClose()
    }, [navigate, saveRecentSearch, onClose])

    // Handle product click
    const handleProductClick = useCallback((product) => {
        saveRecentSearch(product.name)
        setIsOpen(false)
        setQuery('')
        navigate(`/products/${product.id}`)
        if (onClose) onClose()
    }, [navigate, saveRecentSearch, onClose])

    // Handle category click
    const handleCategoryClick = useCallback((category) => {
        saveRecentSearch(category.name)
        setIsOpen(false)
        setQuery('')
        navigate(`/products?category=${category.slug}`)
        if (onClose) onClose()
    }, [navigate, saveRecentSearch, onClose])

    // Handle keyboard
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch(query)
        } else if (e.key === 'Escape') {
            setIsOpen(false)
            inputRef.current?.blur()
        }
    }

    // Clear recent searches
    const clearRecentSearches = () => {
        cookieStorage.removeItem('recent_searches')
        setRecentSearches([])
    }

    const showDropdown = isOpen && (query.length >= 2 || recentSearches.length > 0 || trending.length > 0)

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Search Input */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
                <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="
            w-full h-12 pl-12 pr-10 border border-stone-200 bg-stone-50
            text-stone-900 placeholder:text-stone-400 placeholder:font-serif
            transition-all duration-300
            focus:outline-none focus:bg-white focus:border-stone-900 focus:ring-1 focus:ring-stone-900
            hover:bg-white
          "
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('')
                            inputRef.current?.focus()
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                    >
                        <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                )}
                {isLoading && (
                    <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                )}
            </div>

            {/* Dropdown */}
            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 shadow-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
                    >
                        {/* Search Results */}
                        {query.length >= 2 ? (
                            <div className="p-4">
                                {/* Response time indicator */}
                                {responseTime && (
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Results in {responseTime}ms {products.length > 0 && `• ${products.length} products`}
                                    </p>
                                )}

                                {/* Categories from suggestions */}
                                {suggestions.filter(s => s.type === 'category').length > 0 && (
                                    <div className="mb-6">
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Categories</p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.filter(s => s.type === 'category').map((cat, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleCategoryClick(cat)}
                                                    className="px-4 py-2 border border-stone-200 bg-stone-50 text-stone-900 text-[10px] font-bold uppercase tracking-widest hover:border-stone-900 hover:bg-white transition-colors"
                                                >
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Subcategories from suggestions */}
                                {suggestions.filter(s => s.type === 'subcategory').length > 0 && (
                                    <div className="mb-6">
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Subcategories</p>
                                        <div className="flex flex-wrap gap-2">
                                            {suggestions.filter(s => s.type === 'subcategory').map((cat, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleCategoryClick(cat)}
                                                    className="px-4 py-2 border border-stone-200 text-stone-600 text-[10px] font-bold uppercase tracking-widest hover:border-stone-900 text-black transition-colors flex items-center gap-1.5"
                                                >
                                                    <span>{cat.label}</span>
                                                    {cat.parent_name && (
                                                        <span className="text-stone-400 font-normal ml-1">in {cat.parent_name}</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Products */}
                                {products.length > 0 ? (
                                    <div>
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3 border-t border-stone-100 pt-4">Products</p>
                                        <div className="space-y-1">
                                            {products.map((product) => (
                                                <button
                                                    key={product.id}
                                                    onClick={() => handleProductClick(product)}
                                                    className="w-full flex items-center gap-4 p-3 hover:bg-stone-50 transition-colors text-left border border-transparent hover:border-stone-200 group"
                                                >
                                                    {product.image || product.category_image ? (
                                                        <img
                                                            src={product.image || product.category_image}
                                                            alt={product.name}
                                                            className="w-14 h-18 object-cover bg-stone-100"
                                                        />
                                                    ) : (
                                                        <div className="w-14 h-18 bg-stone-100 flex items-center justify-center">
                                                            <Search className="w-4 h-4 text-stone-300" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-serif text-sm tracking-wide text-stone-900 truncate mb-1">{product.name}</p>
                                                        <p className="text-xs font-medium text-stone-500">₹{product.price}</p>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-stone-900 group-hover:translate-x-1 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : !isLoading && (
                                    <div className="text-center py-12 px-4">
                                        <Search className="w-8 h-8 text-stone-300 mx-auto mb-4" strokeWidth={1} />
                                        <p className="font-serif text-lg tracking-wide text-stone-900">No results found for "{query}"</p>
                                        <p className="text-xs text-stone-500 uppercase tracking-widest mt-2">Try a different search term</p>
                                    </div>
                                )}

                                {/* View All Button */}
                                {products.length > 0 && (
                                    <button
                                        onClick={() => handleSearch(query)}
                                        className="w-full mt-6 py-4 bg-stone-900 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-stone-800 transition-colors flex items-center justify-center gap-2 group"
                                    >
                                        View all results
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            /* Default view - Recent & Trending */
                            <div className="p-4">
                                {/* Recent Searches */}
                                {recentSearches.length > 0 && (
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" strokeWidth={2} /> Recent Searches
                                            </p>
                                            <button
                                                onClick={clearRecentSearches}
                                                className="text-[10px] text-stone-400 uppercase tracking-widest hover:text-stone-900 transition-colors"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2.5">
                                            {recentSearches.map((term, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleSearch(term)}
                                                    className="px-4 py-2 border border-stone-200 text-stone-600 hover:border-stone-900 hover:text-stone-900 text-[11px] uppercase tracking-wider transition-colors"
                                                >
                                                    {term}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Trending Searches */}
                                {trending.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5 mb-4 border-t border-stone-100 pt-6">
                                            <TrendingUp className="w-3 h-3" strokeWidth={2} /> Trending
                                        </p>
                                        <div className="flex flex-wrap gap-2.5">
                                            {trending.map((item, i) => {
                                                const name = typeof item === 'string' ? item : item.name
                                                const slug = typeof item === 'string' ? item.toLowerCase() : item.slug
                                                const count = typeof item === 'object' ? item.productCount : null

                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => {
                                                            saveRecentSearch(name)
                                                            setIsOpen(false)
                                                            navigate(`/products?category=${slug}`)
                                                            if (onClose) onClose()
                                                        }}
                                                        className="px-4 py-2 bg-stone-50 border border-stone-200 hover:border-stone-400 text-stone-900 text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 focus:outline-none"
                                                    >
                                                        {name}
                                                        {count > 0 && (
                                                            <span className="text-stone-400 border-l border-stone-200 pl-1.5 ml-1">
                                                                {count}
                                                            </span>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
