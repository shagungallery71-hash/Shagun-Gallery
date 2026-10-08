// ProductDetails/index.js - Main export file
export { default } from './ProductDetailPage'
export { default as ProductDetailPage } from './ProductDetailPage'

// Re-export all components for external use
export { ImageGallery } from './ImageGallery'
export { ProductInfo } from './ProductInfo'
export { SizeSelector, ColorSelector, QuantitySelector } from './ProductSelectors'
export { ActionButtons, ViewCartLink, ShippingInfoCard, TrustBadgesSection, PincodeChecker } from './ProductActions'
export { ProductTabs } from './ProductTabs'
export { ProductReviews, FAQSection } from './ProductReviews'
export { RelatedProducts } from './RelatedProducts'
