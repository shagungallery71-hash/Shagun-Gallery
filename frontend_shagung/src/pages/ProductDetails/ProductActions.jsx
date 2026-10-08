// ProductDetails/ProductActions.jsx - Add to cart, wishlist, share buttons
import { Link } from 'react-router-dom'
import { ShoppingBag, Heart, Share2, Truck, Loader2 } from 'lucide-react'
import { TrustBadge } from './shared'

// ============================================================================
// ACTION BUTTONS (Add to Cart, Wishlist, Share)
// ============================================================================
export const ActionButtons = ({
    product,
    isInCart,
    isOutOfStock,
    isWishlisted,
    wishlistLoading = false,
    onAddToCart,
    onToggleWishlist,
    onShare
}) => {
    return (
        <div className="flex gap-3 font-outfit" style={{ paddingTop: '10px' }}>
            {/* Add to Cart / Remove Button */}
            <button
                onClick={onAddToCart}
                disabled={isOutOfStock && !isInCart}
                className={`
                    flex-1 h-[52px] font-semibold text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3
                    transition-all duration-300 rounded-none border border-transparent
                    ${isInCart
                        ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600 shadow-sm'
                        : isOutOfStock
                            ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                            : 'bg-rose-700 text-white hover:bg-rose-800 shadow-md hover:shadow-lg hover:-translate-y-0.5'
                    }
                `}
            >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                {isInCart ? 'View In Cart' : isOutOfStock ? 'Sold Out' : 'Add to Bag'}
            </button>

            {/* Wishlist Button */}
            <button
                type="button"
                onClick={onToggleWishlist}
                disabled={wishlistLoading}
                className={`
                    w-[52px] h-[52px] flex items-center justify-center border transition-all duration-300 rounded-none
                    ${wishlistLoading
                        ? 'border-neutral-200 text-neutral-400 cursor-wait'
                        : isWishlisted
                            ? 'bg-rose-600 border-rose-600 text-white shadow-md'
                            : 'bg-white border-neutral-200 text-rose-600 hover:border-rose-600 hover:bg-rose-50'
                    }
                `}
                title={wishlistLoading ? 'Updating...' : isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
            >
                {wishlistLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Heart className={`h-5 w-5 hover:scale-110 transition-transform ${isWishlisted ? 'fill-current' : ''}`} strokeWidth={1.5} />
                )}
            </button>

            {/* Share Button */}
            <button
                type="button"
                onClick={onShare}
                className="w-[52px] h-[52px] bg-white flex items-center justify-center border border-neutral-200 text-neutral-400 hover:border-amber-200 hover:bg-amber-50/50 hover:text-amber-600 transition-all rounded-none"
                title="Share Article"
            >
                <Share2 className="h-4 w-4 hover:scale-110 transition-transform" strokeWidth={1.5} />
            </button>
        </div>
    )
}

// ============================================================================
// VIEW CART LINK
// ============================================================================
export const ViewCartLink = ({ cartItemCount }) => (
    <div className="font-outfit pt-2">
        <Link
            to="/cart"
            className="flex items-center justify-between px-5 py-3.5 bg-rose-600 border border-rose-600 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-rose-700 hover:border-rose-700 transition-all shadow-sm"
        >
            <span>Proceed to Checkout</span>
            <span>{cartItemCount} Items</span>
        </Link>
    </div>
)

// ============================================================================
// SHIPPING INFO CARD
// ============================================================================
export const ShippingInfoCard = ({ shippingInfo }) => {
    if (!shippingInfo) return null

    const deliveryDate = shippingInfo.delivery_date ||
        new Date(Date.now() + ((shippingInfo.estimated_days || 5) * 24 * 60 * 60 * 1000))
            .toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

    return (
        <div className="font-outfit bg-emerald-50/50 border border-emerald-100 hover:border-emerald-300 p-5 mt-6 relative overflow-hidden group transition-colors shadow-sm">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-200 group-hover:bg-emerald-500 transition-colors"></div>
            <div className="flex items-start gap-4">
                <Truck className="h-5 w-5 text-emerald-500 group-hover:text-emerald-600 transition-colors mt-0.5" strokeWidth={1.5} />
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-emerald-950 mb-1">{shippingInfo.message}</h4>
                    <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-widest">Expected: {deliveryDate}</p>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// TRUST BADGES SECTION
// ============================================================================
export const TrustBadgesSection = ({ badges }) => {
    if (!badges || badges.length === 0) return null

    const colorThemes = [
        { bg: 'bg-indigo-50', border: 'border-indigo-100', hoverBg: 'group-hover:bg-indigo-100', iconBg: 'bg-indigo-400', textTitle: 'text-indigo-950', textDesc: 'text-indigo-700/80' },
        { bg: 'bg-teal-50', border: 'border-teal-100', hoverBg: 'group-hover:bg-teal-100', iconBg: 'bg-teal-400', textTitle: 'text-teal-950', textDesc: 'text-teal-700/80' },
        { bg: 'bg-amber-50', border: 'border-amber-100', hoverBg: 'group-hover:bg-amber-100', iconBg: 'bg-amber-400', textTitle: 'text-amber-950', textDesc: 'text-amber-700/80' },
        { bg: 'bg-fuchsia-50', border: 'border-fuchsia-100', hoverBg: 'group-hover:bg-fuchsia-100', iconBg: 'bg-fuchsia-400', textTitle: 'text-fuchsia-950', textDesc: 'text-fuchsia-700/80' }
    ]

    return (
        <div className="grid grid-cols-2 gap-4 py-6 font-outfit">
            {badges.map((badge, idx) => {
                const theme = colorThemes[idx % colorThemes.length]
                return (
                    <div key={idx} className="flex gap-3 items-center group">
                        <div className={`w-8 h-8 rounded-full ${theme.bg} border ${theme.border} flex items-center justify-center shrink-0 ${theme.hoverBg} transition-colors`}>
                             <div className={`w-4 h-4 ${theme.iconBg} rounded-[2px]`} />
                        </div>
                        <div>
                            <div className={`text-[10px] uppercase tracking-widest font-bold ${theme.textTitle}`}>{badge.text}</div>
                            {badge.description && <div className={`text-[9px] uppercase tracking-widest ${theme.textDesc} line-clamp-1`}>{badge.description}</div>}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ============================================================================
// PINCODE CHECKER
// ============================================================================
import { useState } from 'react'
import { MapPin, CheckCircle, XCircle } from 'lucide-react'

export const PincodeChecker = () => {
    const [pincode, setPincode] = useState('')
    const [status, setStatus] = useState(null) // 'available' | 'unavailable' | null
    const [loading, setLoading] = useState(false)
    const [deliveryInfo, setDeliveryInfo] = useState(null)
    const [errorMessage, setErrorMessage] = useState('')

    const checkDelivery = async () => {
        if (pincode.length !== 6) return

        setLoading(true)
        setStatus(null)
        setDeliveryInfo(null)
        setErrorMessage('')

        try {
            // Import api dynamically to avoid circular dependencies
            const { api } = await import('../../api/client')
            const response = await api.checkPincode(pincode)

            if (response.available) {
                setStatus('available')
                setDeliveryInfo(response.deliveryInfo)
            } else {
                setStatus('unavailable')
                setErrorMessage(response.message || 'Delivery unavailable to this location')
            }
        } catch (error) {
            console.error('Pincode check error:', error)
            setStatus('unavailable')
            setErrorMessage('Unable to verify. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-3 font-outfit border-t border-b border-neutral-100 py-6 my-6">
            <label className="text-xs uppercase tracking-[0.2em] font-semibold text-rose-800 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-rose-600" strokeWidth={2} />
                Delivery Availability
            </label>
            <div className="flex h-12 border border-rose-200 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-200 transition-all bg-white shadow-sm">
                <input
                    type="text"
                    value={pincode}
                    onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setPincode(val)
                        setStatus(null)
                        setDeliveryInfo(null)
                        setErrorMessage('')
                    }}
                    placeholder="ENTER PINCODE"
                    className="flex-1 px-4 bg-transparent outline-none text-xs font-medium tracking-widest uppercase placeholder:text-neutral-300"
                    onKeyDown={(e) => e.key === 'Enter' && checkDelivery()}
                />
                <button
                    onClick={checkDelivery}
                    disabled={pincode.length !== 6 || loading}
                    className="px-6 border-l border-rose-200 bg-rose-50 text-[10px] font-bold tracking-widest uppercase hover:text-rose-700 hover:bg-rose-100 disabled:bg-neutral-50 disabled:text-neutral-300 transition-colors text-rose-600"
                >
                    {loading ? 'WAIT' : 'CHECK'}
                </button>
            </div>

            {/* Success State */}
            {status === 'available' && deliveryInfo && (
                <div className="mt-4 p-3 bg-emerald-50/50 border border-emerald-100 space-y-2">
                    <p className="text-[11px] uppercase tracking-widest flex items-center gap-1.5 text-emerald-800 font-semibold">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.5} />
                        Available for {pincode}
                    </p>
                    <div className="text-[10px] uppercase tracking-widest text-emerald-600/80 space-y-1 pl-5">
                        <p>Arrival: <span className="text-emerald-700 font-semibold">{deliveryInfo.estimatedDate}</span></p>
                        <p>Shipping: <span className="text-emerald-700 font-semibold">{deliveryInfo.shippingCost === 0 ? 'COMPLIMENTARY' : `₹${deliveryInfo.shippingCost} `}</span></p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {status === 'unavailable' && (
                <p className="text-[10px] uppercase tracking-widest flex items-center gap-1.5 text-neutral-500 font-semibold pt-2">
                    <XCircle className="h-3.5 w-3.5 text-neutral-500" strokeWidth={1.5} />
                    {errorMessage || 'Delivery unavailable to this location'}
                </p>
            )}
        </div>
    )
}

export default { ActionButtons, ViewCartLink, ShippingInfoCard, TrustBadgesSection, PincodeChecker }
