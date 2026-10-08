// =============================================================================
// SEO COMPONENT - Comprehensive SEO with React Helmet Async
// Supports: Meta tags, Open Graph, Twitter Cards, JSON-LD Structured Data
// =============================================================================

import { Helmet } from 'react-helmet-async';

// Site Configuration
const SITE_CONFIG = {
    siteName: 'Shagun Gallery',
    siteUrl: 'https://shagungallery.com',
    defaultTitle: 'Shagun Gallery - Premium Ethnic Wear | Bridal, Sarees & Lehengas',
    defaultDescription: 'Discover exquisite ethnic wear at Shagun Gallery. Shop premium bridal lehengas, designer sarees, elegant suits, and modern fusion wear. Free shipping, easy returns.',
    defaultImage: '/og-image.jpg',
    twitterHandle: '@shagungallery',
    locale: 'en_IN',
    currency: 'INR',
};

// SEO Component
export default function SEO({
    title,
    description,
    image,
    url,
    type = 'website',
    noindex = false,

    // For Product pages
    product = null,

    // For Category/Collection pages
    category = null,

    // Breadcrumbs for structured data
    breadcrumbs = null,

    // Additional meta tags
    keywords = null,
    author = 'Shagun Gallery',

    // Custom structured data
    structuredData = null,
}) {
    // Build full title
    const fullTitle = title
        ? `${title} | ${SITE_CONFIG.siteName}`
        : SITE_CONFIG.defaultTitle;

    // Build description
    const metaDescription = description || SITE_CONFIG.defaultDescription;

    // Build canonical URL
    const canonicalUrl = url
        ? `${SITE_CONFIG.siteUrl}${url}`
        : SITE_CONFIG.siteUrl;

    // Build image URL
    const ogImage = image
        ? (image.startsWith('http') ? image : `${SITE_CONFIG.siteUrl}${image}`)
        : `${SITE_CONFIG.siteUrl}${SITE_CONFIG.defaultImage}`;

    // Generate Product Structured Data
    const getProductStructuredData = () => {
        if (!product) return null;

        return {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            description: product.description || metaDescription,
            image: product.images?.map(img => img.image_url || img) || [ogImage],
            sku: product.sku || `SG-${product.id}`,
            brand: {
                '@type': 'Brand',
                name: product.brand_by || 'Shagun Gallery',
            },
            offers: {
                '@type': 'Offer',
                url: canonicalUrl,
                priceCurrency: SITE_CONFIG.currency,
                price: parseFloat(product.price),
                priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                availability: product.stock > 0
                    ? 'https://schema.org/InStock'
                    : 'https://schema.org/OutOfStock',
                seller: {
                    '@type': 'Organization',
                    name: 'Shagun Gallery',
                },
            },
            ...(product.review_stats?.total_reviews > 0 && {
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: product.review_stats.average_rating,
                    reviewCount: product.review_stats.total_reviews,
                    bestRating: 5,
                    worstRating: 1,
                },
            }),
        };
    };

    // Generate Breadcrumb Structured Data
    const getBreadcrumbStructuredData = () => {
        if (!breadcrumbs || breadcrumbs.length === 0) return null;

        return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((crumb, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: crumb.label || crumb.name,
                item: crumb.path ? `${SITE_CONFIG.siteUrl}${crumb.path}` : undefined,
            })),
        };
    };

    // Generate Organization Structured Data
    const getOrganizationStructuredData = () => ({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Shagun Gallery',
        url: SITE_CONFIG.siteUrl,
        logo: `${SITE_CONFIG.siteUrl}/logo.png`,
        sameAs: [
            'https://www.facebook.com/shagungallery',
            'https://www.instagram.com/shagungallery',
            'https://twitter.com/shagungallery',
        ],
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+91-XXXXXXXXXX',
            contactType: 'customer service',
            areaServed: 'IN',
            availableLanguage: ['English', 'Hindi'],
        },
    });

    // Generate WebSite Structured Data (for sitelinks search box)
    const getWebsiteStructuredData = () => ({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_CONFIG.siteName,
        url: SITE_CONFIG.siteUrl,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${SITE_CONFIG.siteUrl}/products?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
    });

    // Generate Collection/Category Page Structured Data
    const getCollectionStructuredData = () => {
        if (!category) return null;

        return {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: category.name,
            description: category.description || `Shop ${category.name} at Shagun Gallery`,
            url: canonicalUrl,
            mainEntity: {
                '@type': 'ItemList',
                numberOfItems: category.productCount || 0,
            },
        };
    };

    // Combine all structured data
    const allStructuredData = [
        getOrganizationStructuredData(),
        getWebsiteStructuredData(),
        product && getProductStructuredData(),
        breadcrumbs && getBreadcrumbStructuredData(),
        category && getCollectionStructuredData(),
        structuredData,
    ].filter(Boolean);

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            <link rel="canonical" href={canonicalUrl} />

            {/* Robots */}
            {noindex ? (
                <meta name="robots" content="noindex, nofollow" />
            ) : (
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            )}

            {/* Keywords (still helps for some search engines) */}
            {keywords && <meta name="keywords" content={keywords} />}

            {/* Author */}
            <meta name="author" content={author} />

            {/* Language & Region */}
            <meta name="language" content="English" />
            <meta name="geo.region" content="IN" />
            <meta name="geo.placename" content="India" />

            {/* Mobile */}
            <meta name="theme-color" content="#ec4899" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />

            {/* Open Graph (Facebook, WhatsApp, LinkedIn) */}
            <meta property="og:type" content={product ? 'product' : type} />
            <meta property="og:site_name" content={SITE_CONFIG.siteName} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:image:alt" content={title || SITE_CONFIG.siteName} />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:locale" content={SITE_CONFIG.locale} />

            {/* Product-specific Open Graph */}
            {product && (
                <>
                    <meta property="product:price:amount" content={product.price} />
                    <meta property="product:price:currency" content={SITE_CONFIG.currency} />
                    <meta property="product:availability" content={product.stock > 0 ? 'in stock' : 'out of stock'} />
                    <meta property="product:brand" content={product.brand_by || 'Shagun Gallery'} />
                </>
            )}

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content={SITE_CONFIG.twitterHandle} />
            <meta name="twitter:creator" content={SITE_CONFIG.twitterHandle} />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={ogImage} />

            {/* Pinterest */}
            <meta name="pinterest-rich-pin" content="true" />

            {/* Structured Data (JSON-LD) */}
            {allStructuredData.map((data, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                >
                    {JSON.stringify(data)}
                </script>
            ))}
        </Helmet>
    );
}

// =============================================================================
// QUICK SEO PRESETS
// =============================================================================

// Home Page SEO
export function HomePageSEO() {
    return (
        <SEO
            title="Premium Ethnic Wear - Bridal, Sarees & Lehengas"
            description="Discover the finest collection of ethnic wear at Shagun Gallery. Shop bridal lehengas, designer sarees, elegant suits, kurtas, and modern fusion wear. Premium quality, free shipping on orders above ₹999."
            url="/"
            keywords="ethnic wear, bridal lehenga, designer sarees, Indian fashion, wedding collection, festive wear, Shagun Gallery"
            breadcrumbs={[{ label: 'Home', path: '/' }]}
        />
    );
}

// Products Listing SEO
export function ProductsPageSEO({ category, totalProducts }) {
    const title = category?.name && category.name !== 'All'
        ? `${category.name} Collection`
        : 'All Products';

    const description = category?.name && category.name !== 'All'
        ? `Explore our exclusive ${category.name} collection. Premium quality ethnic wear with free shipping and easy returns at Shagun Gallery.`
        : 'Browse our complete collection of premium ethnic wear. Bridal lehengas, sarees, suits, kurtas and more at Shagun Gallery.';

    return (
        <SEO
            title={title}
            description={description}
            url={category?.slug ? `/products?category=${category.slug}` : '/products'}
            keywords={`${category?.name || 'ethnic wear'}, buy online, Indian fashion, Shagun Gallery`}
            category={category ? { ...category, productCount: totalProducts } : null}
            breadcrumbs={[
                { label: 'Home', path: '/' },
                { label: 'Products', path: '/products' },
                ...(category?.name && category.name !== 'All' ? [{ label: category.name, path: `/products?category=${category.slug}` }] : []),
            ]}
        />
    );
}

// Product Detail SEO
export function ProductDetailSEO({ product }) {
    if (!product) return null;

    const primaryImage = product.images?.find(img => img.is_primary)?.image_url
        || product.images?.[0]?.image_url
        || product.image;

    return (
        <SEO
            title={product.name}
            description={product.description || `Buy ${product.name} at best price. ${product.fabric?.type || 'Premium quality'} with free shipping at Shagun Gallery.`}
            url={`/products/${product.id}`}
            image={primaryImage}
            type="product"
            product={product}
            keywords={`${product.name}, ${product.category_name || ''}, buy online, Shagun Gallery`}
            breadcrumbs={product.breadcrumbs || [
                { label: 'Home', path: '/' },
                { label: 'Products', path: '/products' },
                ...(product.category_name ? [{ label: product.category_name, path: `/products?category=${product.category_slug}` }] : []),
                { label: product.name, path: null },
            ]}
        />
    );
}

// Cart Page SEO
export function CartPageSEO() {
    return (
        <SEO
            title="Shopping Cart"
            description="Review your shopping cart at Shagun Gallery. Secure checkout with multiple payment options."
            url="/cart"
            noindex={true}
        />
    );
}

// Checkout SEO
export function CheckoutPageSEO() {
    return (
        <SEO
            title="Checkout"
            description="Complete your purchase securely at Shagun Gallery."
            url="/checkout"
            noindex={true}
        />
    );
}

// Account SEO
export function AccountPageSEO() {
    return (
        <SEO
            title="My Account"
            description="Manage your Shagun Gallery account, orders, and preferences."
            url="/account"
            noindex={true}
        />
    );
}

// Wishlist SEO
export function WishlistPageSEO() {
    return (
        <SEO
            title="My Wishlist"
            description="View your saved items at Shagun Gallery."
            url="/wishlist"
            noindex={true}
        />
    );
}

// Static Pages
export function AboutPageSEO() {
    return (
        <SEO
            title="About Us"
            description="Learn about Shagun Gallery - Your destination for premium ethnic wear. Our story, values, and commitment to quality Indian fashion."
            url="/about"
            keywords="about Shagun Gallery, ethnic wear brand, Indian fashion"
        />
    );
}

export function ContactPageSEO() {
    return (
        <SEO
            title="Contact Us"
            description="Get in touch with Shagun Gallery. We're here to help with your orders, styling advice, and any questions."
            url="/contact"
            keywords="contact Shagun Gallery, customer support, help"
        />
    );
}

// Sale Page SEO
export function SalePageSEO({ sale, productsCount = 0 }) {
    // Build dynamic title and description based on sale data
    const title = sale?.name
        ? `${sale.name} - Up to ${sale.discount_percentage || 50}% Off`
        : 'Hot Sale - Amazing Discounts on Ethnic Wear';

    const description = sale?.description
        || `Shop ${productsCount} products on sale at Shagun Gallery! Get up to ${sale?.discount_percentage || 50}% off on bridal lehengas, designer sarees, suits, and more. Limited time offer - don't miss out!`;

    // Structured data for Sale/Offer
    const saleStructuredData = sale ? {
        '@context': 'https://schema.org',
        '@type': 'Sale',
        name: sale.name || 'Hot Sale at Shagun Gallery',
        description: description,
        url: 'https://shagungallery.com/sale',
        startDate: sale.start_date,
        endDate: sale.end_date,
        seller: {
            '@type': 'Organization',
            name: 'Shagun Gallery',
        },
        offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: 499,
            highPrice: 99999,
            offerCount: productsCount,
            availability: 'https://schema.org/InStock',
        }
    } : null;

    return (
        <SEO
            title={title}
            description={description}
            url="/sale"
            keywords="sale, discount, ethnic wear sale, bridal lehenga sale, saree sale, Shagun Gallery offers, festive sale, clearance sale"
            image={sale?.banner_image || sale?.background_image}
            structuredData={saleStructuredData}
            breadcrumbs={[
                { label: 'Home', path: '/' },
                { label: 'Sale', path: '/sale' },
                ...(sale?.name ? [{ label: sale.name, path: null }] : []),
            ]}
        />
    );
}
