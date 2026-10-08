// ProductDetails/shared.jsx - Shared components and utilities
import { Star, Check, Clock, X, Shield, Truck, RefreshCw, Award } from 'lucide-react'

// ============================================================================
// FALLBACK DATA
// ============================================================================
export const FALLBACK_GALLERY = [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80&auto=format&fit=crop',
]

// ============================================================================
// RATING STARS COMPONENT
// ============================================================================
export const RatingStars = ({ rating, size = 'sm', showValue = true }) => {
    const sizes = { xs: 'h-3 w-3', sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }
    return (
        <div className="flex items-center gap-1.5">
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                        key={i}
                        className={`${sizes[size]} ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
                        fill={i <= Math.round(rating) ? 'currentColor' : 'none'}
                        strokeWidth={1.5}
                    />
                ))}
            </div>
            {showValue && (
                <span className="text-sm font-medium text-gray-700">{rating?.toFixed(1) || '0.0'}</span>
            )}
        </div>
    )
}

// ============================================================================
// TRUST BADGE COMPONENT
// ============================================================================
export const TrustBadge = ({ icon, text, description }) => {
    const icons = {
        shield: Shield,
        truck: Truck,
        refresh: RefreshCw,
        star: Award
    }
    const IconComponent = icons[icon] || Shield

    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 group hover:shadow-md transition-shadow">
            <IconComponent className="h-4 w-4 text-emerald-600" />
            <div>
                <span className="text-xs font-medium text-emerald-700">{text}</span>
                {description && (
                    <p className="text-[10px] text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">{description}</p>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// STOCK STATUS BADGE
// ============================================================================
export const StockBadge = ({ status, label }) => {
    const styles = {
        in_stock: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        low_stock: 'bg-amber-100 text-amber-700 border-amber-200',
        out_of_stock: 'bg-red-100 text-red-700 border-red-200'
    }
    const badgeIcons = {
        in_stock: Check,
        low_stock: Clock,
        out_of_stock: X
    }
    const Icon = badgeIcons[status] || Check

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
            <Icon className="h-3.5 w-3.5" />
            {label}
        </span>
    )
}

// ============================================================================
// RATING DISTRIBUTION BAR
// ============================================================================
export const RatingBar = ({ rating, count, total }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0
    return (
        <div className="flex items-center gap-3 text-sm">
            <span className="w-6 text-gray-600">{rating}★</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="w-8 text-right text-gray-500 text-xs">{count}</span>
        </div>
    )
}

// ============================================================================
// SKELETON LOADER
// ============================================================================
export const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
)

// ============================================================================
// SECTION HEADER
// ============================================================================
export const SectionHeader = ({ title, subtitle, icon: Icon, action }) => (
    <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
            {Icon && <Icon className="h-6 w-6 text-pink-500" />}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
        </div>
        {action}
    </div>
)

// ============================================================================
// EXPANDABLE SECTION
// ============================================================================
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export const ExpandableSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5 text-pink-500" />}
                    <span className="font-semibold text-gray-900">{title}</span>
                </div>
                {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
            </button>

            <div className={`transition-all duration-300 ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="px-5 pb-5 pt-0">
                    {children}
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// PRICE DISPLAY
// ============================================================================
export const PriceDisplay = ({ price, comparePrice, size = 'lg' }) => {
    const numPrice = Math.round(Number(price || 0))
    const numComparePrice = comparePrice ? Number(comparePrice) : null

    // Logic: Only show discount if comparePrice exists AND is higher than selling price
    const hasDiscount = numComparePrice && numComparePrice > numPrice
    const discountPercentage = hasDiscount
        ? Math.round(((numComparePrice - numPrice) / numComparePrice) * 100)
        : 0

    const sizeClasses = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-3xl md:text-4xl'
    }

    return (
        <div className="flex items-baseline gap-3 flex-wrap">
            <span className={`${sizeClasses[size]} font-bold text-gray-900 leading-none`}>
                ₹{numPrice.toLocaleString()}
            </span>
            {hasDiscount && (
                <>
                    <span className="text-xl text-gray-400 line-through decoration-gray-400/60 leading-none mb-0.5">
                        ₹{numComparePrice.toLocaleString()}
                    </span>
                    <span className="px-2 py-1 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-md self-center">
                        {discountPercentage}% OFF
                    </span>
                </>
            )}
        </div>
    )
}

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================
export const ProductLoadingSkeleton = () => (
    <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-10">
            {/* Image skeleton */}
            <div className="space-y-4">
                <Skeleton className="aspect-square rounded-2xl" />
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-16 h-16 rounded-xl" />)}
                </div>
            </div>
            {/* Info skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-32" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    </div>
)
