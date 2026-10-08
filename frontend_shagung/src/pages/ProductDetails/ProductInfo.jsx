// ProductDetails/ProductInfo.jsx - Product title, badges, price, and highlights
import { Link } from 'react-router-dom'
import { Sparkles, Zap, Flame } from 'lucide-react'
import { RatingStars, StockBadge, PriceDisplay } from './shared'

export const ProductInfo = ({ product, displayPrice, displayComparePrice, isOnSale }) => {
    const {
        name,
        category_name,
        category_id,
        is_new,
        is_featured,
        review_stats,
        reviews,
        compare_at_price,
        stock_info,
        highlights,
        sale_name // Added from backend
    } = product

    const reviewCount = review_stats?.total_reviews || reviews?.length || 0
    const avgRating = review_stats?.average_rating || 0

    return (
        <div className="space-y-6">
            <style>{`
                .font-playfair { font-family: 'Playfair Display', serif; }
                .font-outfit { font-family: 'Outfit', sans-serif; }
            `}</style>
            
            {/* Category & Badges */}
            <div className="flex flex-wrap items-center gap-2 font-outfit">
                {category_name && (
                    <Link
                        to={`/category/${category_id}`}
                        className="text-[10px] font-semibold text-neutral-500 tracking-[0.2em] uppercase hover:text-rose-600 transition-colors border-b border-transparent hover:border-rose-600"
                    >
                        {category_name}
                    </Link>
                )}
                <span className="text-neutral-300 mx-2 hidden sm:inline-block">/</span>
                {is_new && (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 uppercase tracking-widest">
                        New Arrival
                    </span>
                )}
                {is_featured && (
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles className="h-3 w-3" strokeWidth={1.5} /> Featured
                    </span>
                )}
            </div>

            {/* Sale Banner */}
            {isOnSale && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-600 text-white font-outfit font-bold text-[10px] tracking-widest uppercase shadow-sm">
                    <Flame className="w-3.5 h-3.5 fill-current text-white animate-pulse" />
                    <span>{sale_name || 'Limited Event'} is Live</span>
                </div>
            )}

            {/* Product Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-medium text-black leading-tight">
                {name}
            </h1>

            {/* Brand Name */}
            {product.brand_by && (
                <p className="text-xs font-outfit font-medium text-neutral-500 uppercase tracking-[0.2em]">
                    by {product.brand_by}
                </p>
            )}

            {/* Price section */}
            <div className="pt-2 pb-1">
                <div className="flex items-end gap-3 font-outfit">
                    <span className="text-2xl md:text-3xl font-medium text-black tracking-tight">
                        ₹{displayPrice?.toLocaleString?.() || displayPrice}
                    </span>
                    {displayComparePrice && (
                        <span className="text-base text-neutral-400 line-through pb-1">
                            ₹{displayComparePrice?.toLocaleString?.()}
                        </span>
                    )}
                </div>
            </div>

            {/* Rating & Reviews Summary */}
            {
                reviewCount > 0 && (
                    <div className="flex items-center gap-3 pt-1 border-t border-black/5 flex-wrap font-outfit">
                        <div className="flex items-center gap-1 text-amber-500">
                            <RatingStars rating={avgRating} size="sm" />
                            <span className="text-sm font-medium text-black ml-1 mr-2">{avgRating.toFixed(1)}</span>
                        </div>
                        <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                        <a
                            href="#reviews"
                            className="text-xs text-neutral-500 hover:text-rose-600 uppercase tracking-wider underline-offset-4 hover:underline transition-colors"
                        >
                            Read {reviewCount} Review{reviewCount > 1 ? 's' : ''}
                        </a>
                    </div>
                )
            }

            {/* Stock Status */}
            {
                stock_info && (
                    <div className="pt-2 font-outfit">
                         <StockBadge
                            status={stock_info.status}
                            label={stock_info.status_label}
                        />
                    </div>
                )
            }

            {/* Product Highlights */}
            {
                highlights?.length > 0 && (
                    <div className="flex flex-col gap-2 pt-4">
                        <span className="text-xs font-outfit font-semibold uppercase tracking-widest text-neutral-400 mb-1">Details</span>
                        <ul className="space-y-1">
                            {highlights.map((highlight, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-start gap-2 text-sm font-outfit text-neutral-700"
                                >
                                    <span className="w-1.5 h-1.5 mt-1.5 bg-neutral-300 rotate-45 shrink-0" />
                                    <span>{highlight}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )
            }
        </div >
    )
}

export default ProductInfo
