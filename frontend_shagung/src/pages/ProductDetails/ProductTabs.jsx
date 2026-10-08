// ProductDetails/ProductTabs.jsx - Description, Fabric & Care, Shipping & Returns, Size Guide tabs
import { useState } from 'react'
import {
    Info, Sparkles, Truck, Ruler, Check, RefreshCw,
    Package, MapPin, CreditCard, Hand, Droplets, Sun,
    ShoppingBag
} from 'lucide-react'

// ============================================================================
// TABS NAVIGATION (Not Used directly but kept if needed)
// ============================================================================
const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`
      flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.2em] font-medium border-b transition-colors whitespace-nowrap font-outfit
      ${isActive
                ? 'border-black text-black'
                : 'border-transparent text-neutral-400 hover:text-black hover:border-black/30'
            }
    `}
    >
        <Icon className="h-4 w-4" strokeWidth={1.5} />
        {label}
    </button>
)

// ============================================================================
// DESCRIPTION TAB CONTENT
// ============================================================================
const DescriptionTab = ({ descriptionSection, specifications }) => (
    <div className="font-outfit max-w-3xl">
        {/* Short Description */}
        <p className="text-neutral-600 leading-relaxed text-sm font-light">
            {descriptionSection?.short || 'No description available.'}
        </p>

        {/* Features */}
        {descriptionSection?.features?.length > 0 && (
            <div className="mt-8">
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-900 mb-4">Key Features</h4>
                <ul className="space-y-3">
                    {descriptionSection.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-4 text-neutral-600 text-sm font-light">
                            <span className="w-1.5 h-1.5 mt-1.5 bg-rose-500 rotate-45 shrink-0" />
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        {/* Product Specifications */}
        {specifications?.length > 0 && (
            <div className="mt-10">
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-900 mb-4">Specifications</h4>
                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-0 border-t border-rose-100">
                    {specifications.map((spec, idx) => (
                        <div key={idx} className="flex items-center justify-between py-3 border-b border-rose-50">
                            <span className="text-xs text-neutral-500 uppercase tracking-widest">{spec.label}</span>
                            <span className="text-sm font-medium text-rose-950">{spec.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
)

// ============================================================================
// FABRIC & CARE TAB CONTENT
// ============================================================================
const FabricCareTab = ({ fabricCareSection }) => {
    const fabricInfo = fabricCareSection?.fabric || {}
    const careInstructions = fabricCareSection?.care_instructions || []
    const specialCare = fabricCareSection?.special_care || []

    const iconMap = {
        hand: Hand,
        iron: Sparkles,
        sun: Sun,
        hanger: ShoppingBag,
    }

    return (
        <div className="space-y-10 font-outfit max-w-4xl">
            {/* Fabric Info */}
            <div>
                <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-900 mb-4">Fabric Details</h4>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {fabricInfo.type && (
                        <div className="p-5 bg-rose-50/50 border border-rose-100 hover:border-rose-300 transition-colors">
                            <p className="text-[10px] font-semibold text-rose-600/80 uppercase tracking-widest mb-2">Type</p>
                            <p className="text-sm font-medium text-rose-950">{fabricInfo.type}</p>
                        </div>
                    )}
                    {fabricInfo.composition && (
                        <div className="p-5 bg-rose-50/50 border border-rose-100 hover:border-rose-300 transition-colors">
                            <p className="text-[10px] font-semibold text-rose-600/80 uppercase tracking-widest mb-2">Composition</p>
                            <p className="text-sm font-medium text-rose-950">{fabricInfo.composition}</p>
                        </div>
                    )}
                    {fabricInfo.weave && (
                        <div className="p-5 bg-rose-50/50 border border-rose-100 hover:border-rose-300 transition-colors">
                            <p className="text-[10px] font-semibold text-rose-600/80 uppercase tracking-widest mb-2">Weave</p>
                            <p className="text-sm font-medium text-rose-950">{fabricInfo.weave}</p>
                        </div>
                    )}
                    {fabricInfo.feel && (
                        <div className="p-5 bg-rose-50/50 border border-rose-100 hover:border-rose-300 transition-colors">
                            <p className="text-[10px] font-semibold text-rose-600/80 uppercase tracking-widest mb-2">Feel</p>
                            <p className="text-sm font-medium text-rose-950">{fabricInfo.feel}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Care Instructions */}
            {careInstructions.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-900 mb-4">Care Instructions</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {careInstructions.map((care, idx) => {
                            const IconComponent = iconMap[care.icon] || Info
                            return (
                                <div key={idx} className="flex items-start gap-4 p-5 bg-sky-50/50 border border-sky-100 hover:border-sky-300 group transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-white group-hover:bg-sky-100 flex items-center justify-center flex-shrink-0 transition-colors">
                                        <IconComponent className="h-4 w-4 text-sky-600 group-hover:text-sky-700 transition-colors" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sky-950 text-xs uppercase tracking-widest">{care.title}</p>
                                        <p className="text-sm font-light text-sky-800 mt-1">{care.instruction}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Special Care Notes */}
            {specialCare.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-900 mb-4">Special Care Notes</h4>
                    <ul className="space-y-3">
                        {specialCare.map((note, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-neutral-600 font-light text-sm">
                                <Check className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                <span>{note}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}

// ============================================================================
// SHIPPING & RETURNS TAB CONTENT
// ============================================================================
const ShippingReturnsTab = ({ shippingReturnsSection }) => {
    const shipping = shippingReturnsSection?.shipping || {}
    const returns = shippingReturnsSection?.returns || {}

    return (
        <div className="space-y-8 font-outfit max-w-4xl">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Shipping Info */}
                <div className="border border-teal-100 bg-teal-50/30 p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-teal-100/50 flex items-center justify-center rounded-full">
                            <Truck className="h-5 w-5 text-teal-600" strokeWidth={1.5} />
                        </div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-950">Shipping</h4>
                    </div>

                    <p className="text-sm font-light text-teal-800 mb-6">{shipping.message || 'Standard shipping available'}</p>

                    {/* Delivery Options */}
                    {shipping.options?.length > 0 && (
                        <div className="space-y-0 border-t border-teal-100">
                            {shipping.options.map((option, idx) => (
                                <div key={idx} className="flex items-center justify-between py-3 border-b border-teal-100/50">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-teal-900">{option.name}</p>
                                        <p className="text-xs text-teal-600/80 mt-1">{option.days}</p>
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-widest ${option.price === 'FREE' ? 'text-teal-600' : 'text-teal-900'}`}>
                                        {option.price}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Additional Info */}
                    <div className="flex flex-col gap-2 mt-6">
                        {shipping.pincode_check && (
                            <span className="flex items-center gap-2 text-xs text-teal-700 uppercase tracking-widest">
                                <MapPin className="h-3 w-3" strokeWidth={1.5} /> Pincode verification available
                            </span>
                        )}
                        {shipping.cash_on_delivery && (
                            <span className="flex items-center gap-2 text-xs text-teal-700 uppercase tracking-widest">
                                <CreditCard className="h-3 w-3" strokeWidth={1.5} /> Cash on Delivery available
                            </span>
                        )}
                    </div>
                </div>

                {/* Returns Info */}
                <div className="border border-indigo-100 bg-indigo-50/30 p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-indigo-100/50 flex items-center justify-center rounded-full">
                            <RefreshCw className="h-5 w-5 text-indigo-600" strokeWidth={1.5} />
                        </div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-950">Returns</h4>
                    </div>

                    <p className="text-sm font-light text-indigo-800 mb-6">{returns.policy || 'Easy returns within 7 days.'}</p>

                    {/* Return Conditions */}
                    {returns.conditions?.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-[10px] uppercase tracking-widest text-indigo-500 font-semibold mb-2">Conditions</p>
                            <ul className="space-y-2">
                                {returns.conditions.map((condition, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm font-light text-indigo-800">
                                        <Check className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                                        <span>{condition}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Return Process Steps */}
            {returns.process?.length > 0 && (
                <div className="pt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-900 mb-6">Return Process</h4>
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {returns.process.map((step, idx) => (
                            <div key={idx} className="text-center p-6 border border-rose-100 bg-white relative group hover:border-rose-300 transition-colors">
                                <div className="absolute top-0 left-0 w-full h-1 bg-rose-100 group-hover:bg-rose-500 transition-colors" />
                                <div className="text-[10px] text-rose-400 uppercase tracking-widest font-bold mb-3">
                                    Step {idx + 1}
                                </div>
                                <p className="font-semibold text-rose-950 text-xs uppercase tracking-widest mb-2">{step.title}</p>
                                <p className="text-xs font-light text-rose-600/80">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================================
// SIZE GUIDE TAB CONTENT
// ============================================================================
const SizeGuideTab = ({ sizeGuide }) => {
    if (!sizeGuide || Object.keys(sizeGuide).length === 0) {
        return <p className="text-neutral-500 font-outfit text-sm">Size guide not available for this product.</p>
    }

    // Get column headers from first size entry
    const columns = Object.keys(Object.values(sizeGuide)[0] || {})

    return (
        <div className="overflow-x-auto font-outfit">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-rose-200">
                        <th className="py-4 px-4 text-left text-xs uppercase tracking-[0.2em] font-semibold text-rose-900">Size</th>
                        {columns.map(col => (
                            <th key={col} className="py-4 px-4 text-center text-xs uppercase tracking-[0.2em] font-semibold text-rose-900">
                                {col.replace(/_/g, ' ')} (in)
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(sizeGuide).map(([size, measurements]) => (
                        <tr key={size} className="border-b border-rose-50 hover:bg-rose-50/50 transition-colors">
                            <td className="py-4 px-4 font-semibold text-rose-950">{size}</td>
                            {columns.map(col => (
                                <td key={col} className="py-4 px-4 text-center text-neutral-600 font-light">
                                    {measurements[col] || '-'}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <p className="mt-6 text-xs text-neutral-400 uppercase tracking-widest text-center">
                Measurements are in inches. Variations of +/- 0.5 inches may occur.
            </p>
        </div>
    )
}

// ============================================================================
// MAIN PRODUCT TABS COMPONENT
// ============================================================================
export const ProductTabs = ({
    descriptionSection,
    fabricCareSection,
    shippingReturnsSection,
    sizeGuide,
    specifications,
    activeTab: externalActiveTab,
    onTabChange
}) => {
    const [internalActiveTab, setInternalActiveTab] = useState('description')

    const activeTab = externalActiveTab || internalActiveTab
    const setActiveTab = onTabChange || setInternalActiveTab

    const tabs = [
        { id: 'description', label: 'Details', icon: Info },
        { id: 'fabric', label: 'Fabric', icon: Sparkles },
        { id: 'shipping', label: 'Shipping', icon: Truck },
        { id: 'size-guide', label: 'Size', icon: Ruler },
    ]

    return (
        <section className="mt-12 font-outfit">
            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8 border-b border-black/10 mb-8 md:mb-12">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 pb-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors relative group
                            ${activeTab === tab.id
                                ? 'text-rose-600'
                                : 'text-neutral-400 hover:text-rose-500'
                            }
                        `}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-rose-600" />
                        )}
                        {activeTab !== tab.id && (
                            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-rose-200 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="px-2 md:px-0">
                {activeTab === 'description' && (
                    <DescriptionTab
                        descriptionSection={descriptionSection}
                        specifications={specifications}
                    />
                )}
                {activeTab === 'fabric' && (
                    <FabricCareTab fabricCareSection={fabricCareSection} />
                )}
                {activeTab === 'shipping' && (
                    <ShippingReturnsTab shippingReturnsSection={shippingReturnsSection} />
                )}
                {activeTab === 'size-guide' && (
                    <SizeGuideTab sizeGuide={sizeGuide} />
                )}
            </div>
        </section>
    )
}

export default ProductTabs
