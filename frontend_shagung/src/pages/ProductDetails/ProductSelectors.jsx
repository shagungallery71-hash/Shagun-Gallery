// ProductDetails/ProductSelectors.jsx - Size and Color selectors
import { Ruler, Info, Check } from 'lucide-react'

// ============================================================================
// SIZE SELECTOR
// ============================================================================
export const SizeSelector = ({ sizes, variants, selectedSize, onSelect, onSizeGuideClick }) => {
    const getVariantForSize = (size) => {
        return variants?.find(v => v.size === size)
    }

    return (
        <div className="space-y-4 font-outfit">
            <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-neutral-500">Pick Size</span>
                <button
                    type="button"
                    onClick={onSizeGuideClick}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-neutral-400 hover:text-black font-medium transition-colors"
                >
                    <Ruler className="h-3 w-3" strokeWidth={1.5} />
                    Size Guide
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                    const variant = getVariantForSize(size)
                    const isOutOfStock = variant && variant.stock === 0
                    const isSelected = selectedSize === size

                    return (
                        <button
                            key={size}
                            type="button"
                            onClick={() => !isOutOfStock && onSelect(size)}
                            disabled={isOutOfStock}
                            className={`
                                relative min-w-[3.5rem] h-12 flex items-center justify-center px-4 rounded-none font-medium text-xs tracking-wider
                                transition-all duration-300 border
                                ${isSelected
                                    ? 'bg-rose-700 text-white border-rose-700 shadow-md ring-1 ring-offset-1 ring-rose-200'
                                    : isOutOfStock
                                        ? 'bg-[#faf9f8] text-neutral-300 border-transparent cursor-not-allowed line-through'
                                        : 'bg-white text-rose-950 font-bold border-rose-100 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50/30'
                                }
                            `}
                        >
                            {size}
                            {variant?.stock > 0 && variant?.stock <= 3 && !isSelected && (
                                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-rose-500 rounded-full" />
                            )}
                        </button>
                    )
                })}
            </div>

            {selectedSize && (
                <p className="text-[10px] uppercase tracking-widest text-neutral-400 flex items-center gap-1.5 mt-2">
                    <Info className="h-3 w-3" />
                    {variants?.find(v => v.size === selectedSize)?.stock > 0
                        ? `${variants?.find(v => v.size === selectedSize)?.stock} items remaining`
                        : 'Temporarily out of stock'}
                </p>
            )}
        </div>
    )
}

// ============================================================================
// COLOR SELECTOR
// ============================================================================
export const ColorSelector = ({ colors, selectedColor, onSelect }) => {
    const colorMap = {
        'Black': '#000000',
        'White': '#FFFFFF',
        'Red': '#EF4444',
        'Blue': '#3B82F6',
        'Green': '#22C55E',
        'Pink': '#EC4899',
        'Purple': '#A855F7',
        'Yellow': '#EAB308',
        'Orange': '#F97316',
        'Navy': '#1E3A5F',
        'Maroon': '#800000',
        'Gold': '#FFD700',
        'Silver': '#C0C0C0',
        'Beige': '#F5F5DC',
        'Brown': '#8B4513',
        'Gray': '#6B7280',
        'Grey': '#6B7280',
        'Cream': '#FFFDD0',
    }

    if (!colors || colors.length === 0) return null

    return (
        <div className="space-y-4 font-outfit pt-2">
            <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-neutral-500">Color Palette</span>
                {selectedColor && (
                    <span className="text-[10px] uppercase tracking-widest text-neutral-800 font-semibold">{selectedColor}</span>
                )}
            </div>

            <div className="flex flex-wrap gap-4">
                {colors.map((colorItem) => {
                    // colorItem can be a string (name) or an object { name, code }
                    const colorName = typeof colorItem === 'string' ? colorItem : colorItem.name;
                    const colorCode = typeof colorItem === 'string'
                        ? (colorMap[colorItem] || colorItem)
                        : (colorItem.code || colorMap[colorName] || colorName);

                    const isSelected = selectedColor === colorName;

                    return (
                        <div 
                            key={colorName}
                            className={`p-0.5 rounded-full outline transition-all duration-300 ${isSelected ? 'outline-[1.5px] outline-offset-2 outline-rose-400 scale-110' : 'outline-transparent'}`}
                        >
                            <button
                                type="button"
                                onClick={() => onSelect(colorName)}
                                title={colorName}
                                className={`
                                    relative w-8 h-8 rounded-full transition-all duration-200
                                    ${!isSelected && 'hover:scale-105 shadow-[0_2px_4px_rgba(0,0,0,0.05)]'}
                                `}
                                style={{
                                    backgroundColor: colorCode,
                                    border: ['white', 'cream', '#ffffff', '#fffdd0'].includes(colorCode.toLowerCase()) || colorName.toLowerCase() === 'white'
                                        ? '1px solid #e5e7eb'
                                        : 'none'
                                }}
                            >
                                <span className="sr-only">{colorName}</span>
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ============================================================================
// QUANTITY SELECTOR
// ============================================================================
export const QuantitySelector = ({ quantity, onChange, max = 99 }) => {
    return (
        <div className="flex items-center gap-6 font-outfit">
            <span className="text-xs uppercase tracking-[0.2em] font-semibold text-neutral-500 whitespace-nowrap">Quantity</span>
            <div className="flex items-center border border-neutral-200 overflow-hidden bg-white">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(1, quantity - 1))}
                    className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    disabled={quantity <= 1}
                >
                    <svg width="12" height="2" viewBox="0 0 12 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 1H12" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                </button>
                <div className="w-12 h-12 flex items-center justify-center font-medium text-black">
                    {quantity}
                </div>
                <button
                    type="button"
                    onClick={() => onChange(Math.min(max, quantity + 1))}
                    className="w-12 h-12 flex items-center justify-center text-neutral-400 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    disabled={quantity >= max}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 0V12M0 6H12" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                </button>
            </div>
        </div>
    )
}

export default { SizeSelector, ColorSelector, QuantitySelector }
