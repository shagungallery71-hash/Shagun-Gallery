// =============================================================================
// CACHE SERVICE - COMPREHENSIVE REDIS CACHING WITH SMART INVALIDATION
// =============================================================================

import { redis, isRedisAvailable } from '../config/redis.js';

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

const CACHE_CONFIG = {
    // Cache TTL (Time To Live) in seconds (0 = forever/no expiration)
    TTL: {
        SHORT: 0,           // Forever - no expiration
        MEDIUM: 0,          // Forever - no expiration  
        LONG: 0,            // Forever - no expiration
        DAY: 0,             // Forever - no expiration
        FOREVER: 0,         // Explicit forever option
    },

    // Cache key prefixes for different data types
    PREFIX: {
        PRODUCTS: 'products_v2',
        PRODUCT: 'product_v2',
        CATEGORIES: 'categories_v2',
        FEATURED: 'featured_v2',
        SEARCH: 'search_v2',
        REVIEWS: 'reviews_v2',
        COUPONS: 'coupons_v2',
        CART: 'cart_v2',
        WISHLIST: 'wishlist_v2',
        USER: 'user_v2',
        ORDERS: 'orders_v2',
        STATS: 'stats_v2',
        NEWSLETTER: 'newsletter_v2',
    }
};

// =============================================================================
// CACHE KEY GENERATORS - Standardized key generation for consistency
// =============================================================================

export const CacheKeys = {
    // Products
    allProducts: (page, limit, sort, category) =>
        `${CACHE_CONFIG.PREFIX.PRODUCTS}:list:p${page}:l${limit}:s${sort}:c${category || 'all'}`,

    productDetail: (id) =>
        `${CACHE_CONFIG.PREFIX.PRODUCT}:${id}`,

    productsByCategory: (categorySlug, page, limit, sort) =>
        `${CACHE_CONFIG.PREFIX.PRODUCTS}:cat:${categorySlug}:p${page}:l${limit}:s${sort}`,

    featuredProducts: () =>
        `${CACHE_CONFIG.PREFIX.FEATURED}:products`,

    relatedProducts: (productId) =>
        `${CACHE_CONFIG.PREFIX.PRODUCTS}:related:${productId}`,

    // Categories
    allCategories: () =>
        `${CACHE_CONFIG.PREFIX.CATEGORIES}:all`,

    mainCategories: () =>
        `${CACHE_CONFIG.PREFIX.CATEGORIES}:main`,

    categoryWithSubs: (id) =>
        `${CACHE_CONFIG.PREFIX.CATEGORIES}:withsubs:${id}`,

    // Search
    searchProducts: (query, filters) =>
        `${CACHE_CONFIG.PREFIX.SEARCH}:${query}:${JSON.stringify(filters)}`,

    // Reviews
    productReviews: (productId, page, limit) =>
        `${CACHE_CONFIG.PREFIX.REVIEWS}:${productId}:p${page}:l${limit}`,

    // Stats (Admin)
    adminStats: () =>
        `${CACHE_CONFIG.PREFIX.STATS}:admin:dashboard`,

    // Coupons
    allCoupons: () =>
        `${CACHE_CONFIG.PREFIX.COUPONS}:all`,

    activeCoupons: () =>
        `${CACHE_CONFIG.PREFIX.COUPONS}:active`,
};

// =============================================================================
// CACHE PATTERNS FOR INVALIDATION
// =============================================================================

export const InvalidationPatterns = {
    // When a product is created/updated/deleted
    products: () => [
        `${CACHE_CONFIG.PREFIX.PRODUCTS}:*`,
        `${CACHE_CONFIG.PREFIX.PRODUCT}:*`,
        `${CACHE_CONFIG.PREFIX.FEATURED}:*`,
        `${CACHE_CONFIG.PREFIX.SEARCH}:*`,
        // Also invalidate API route caches
        'api:/api/products*',
        'api:/api/search*',
        'api:/api/featured*',
    ],

    // When a specific product is modified
    singleProduct: (id) => [
        `${CACHE_CONFIG.PREFIX.PRODUCT}:${id}`,
        `${CACHE_CONFIG.PREFIX.PRODUCTS}:*`,
        `${CACHE_CONFIG.PREFIX.FEATURED}:*`,
        `${CACHE_CONFIG.PREFIX.PRODUCTS}:related:*`,
        // Also invalidate API route caches
        `api:/api/products/${id}*`,
        'api:/api/products*',
    ],

    // When categories change
    categories: () => [
        `${CACHE_CONFIG.PREFIX.CATEGORIES}:*`,
        `${CACHE_CONFIG.PREFIX.PRODUCTS}:*`, // Products list needs refresh
        `${CACHE_CONFIG.PREFIX.PRODUCT}:*`,  // Product details need refresh (they contain category info)
        // Also invalidate API route caches
        'api:/api/categories*',
        'api:/api/products*',
        'api:/api/category*',
    ],

    // When reviews are added/modified
    reviews: (productId) => [
        `${CACHE_CONFIG.PREFIX.REVIEWS}:${productId}:*`,
        `${CACHE_CONFIG.PREFIX.PRODUCT}:${productId}`, // Product detail includes review stats
        `api:/api/products/${productId}*`,
    ],

    // When coupons change
    coupons: () => [
        `${CACHE_CONFIG.PREFIX.COUPONS}:*`,
        'api:/api/coupons*',
    ],

    // When admin stats might change (orders, products, customers)
    stats: () => [
        `${CACHE_CONFIG.PREFIX.STATS}:*`,
        'api:/api/admin/stats*',
    ],

    // When sales are created/updated/deleted or products are added/removed from sale
    sales: (productId = null) => {
        const patterns = [
            // Clear all product-related caches since sale affects product display
            `${CACHE_CONFIG.PREFIX.PRODUCTS}:*`,
            `${CACHE_CONFIG.PREFIX.PRODUCT}:*`,
            `${CACHE_CONFIG.PREFIX.FEATURED}:*`,
            `${CACHE_CONFIG.PREFIX.CATEGORIES}:*`,
            `${CACHE_CONFIG.PREFIX.SEARCH}:*`,
            // API route caches
            'api:/api/products*',
            'api:/api/sales*',
            'api:/api/categories*',
            'api:/api/featured*',
        ];

        if (productId) {
            patterns.push(`api:/api/products/${productId}*`);
        }

        return patterns;
    },

    // Clear all cache
    all: () => ['*'],
};

// =============================================================================
// CORE CACHE OPERATIONS
// =============================================================================

/**
 * Get data from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Cached data or null
 */
export const cacheGet = async (key) => {
    if (!isRedisAvailable()) return null;

    try {
        const data = await redis.get(key);
        if (data) {
            console.log(`📦 Cache HIT: ${key}`);
            return typeof data === 'string' ? JSON.parse(data) : data;
        }
        console.log(`📭 Cache MISS: ${key}`);
        return null;
    } catch (error) {
        console.error(`❌ Cache GET error for ${key}:`, error.message);
        return null;
    }
};

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} - Success status
 */
export const cacheSet = async (key, data, ttl = CACHE_CONFIG.TTL.MEDIUM) => {
    if (!isRedisAvailable()) return false;

    try {
        const serialized = JSON.stringify(data);
        // If TTL is 0 or undefined, cache forever (no expiration)
        if (ttl === 0 || ttl === undefined) {
            await redis.set(key, serialized);
            console.log(`💾 Cache SET: ${key} (TTL: FOREVER)`);
        } else {
            await redis.setex(key, ttl, serialized);
            console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
        }
        return true;
    } catch (error) {
        console.error(`❌ Cache SET error for ${key}:`, error.message);
        return false;
    }
};

/**
 * Delete specific cache key
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
export const cacheDel = async (key) => {
    if (!isRedisAvailable()) return false;

    try {
        await redis.del(key);
        console.log(`🗑️ Cache DEL: ${key}`);
        return true;
    } catch (error) {
        console.error(`❌ Cache DEL error for ${key}:`, error.message);
        return false;
    }
};

/**
 * Invalidate cache by pattern(s)
 * @param {string[]} patterns - Array of patterns to invalidate
 * @returns {Promise<number>} - Number of keys deleted
 */
export const invalidateByPatterns = async (patterns) => {
    if (!isRedisAvailable()) return 0;

    let totalDeleted = 0;

    for (const pattern of patterns) {
        try {
            // Use SCAN to find keys matching pattern (safer than KEYS for large datasets)
            const keys = await redis.keys(pattern);

            if (keys && keys.length > 0) {
                await redis.del(...keys);
                totalDeleted += keys.length;
                console.log(`🧹 Invalidated ${keys.length} keys matching: ${pattern}`);
            }
        } catch (error) {
            console.error(`❌ Invalidation error for pattern ${pattern}:`, error.message);
        }
    }

    return totalDeleted;
};

/**
 * Convenience function to invalidate product-related cache
 * Call this when admin creates/updates/deletes products
 */
export const invalidateProductCache = async (productId = null) => {
    const patterns = productId
        ? InvalidationPatterns.singleProduct(productId)
        : InvalidationPatterns.products();

    // Also invalidate stats since product counts may change
    patterns.push(...InvalidationPatterns.stats());

    return invalidateByPatterns(patterns);
};

/**
 * Convenience function to invalidate category cache
 * Call this when admin creates/updates/deletes categories
 */
export const invalidateCategoryCache = async () => {
    return invalidateByPatterns(InvalidationPatterns.categories());
};

/**
 * Convenience function to invalidate review cache
 * Call this when reviews are added/modified
 */
export const invalidateReviewCache = async (productId) => {
    return invalidateByPatterns(InvalidationPatterns.reviews(productId));
};

/**
 * Convenience function to invalidate coupon cache
 */
export const invalidateCouponCache = async () => {
    return invalidateByPatterns(InvalidationPatterns.coupons());
};

/**
 * Convenience function to invalidate admin stats
 */
export const invalidateStatsCache = async () => {
    return invalidateByPatterns(InvalidationPatterns.stats());
};

/**
 * Convenience function to invalidate sales-related cache
 * Call this when products are added/removed from sales
 */
export const invalidateSalesCache = async (productId = null) => {
    return invalidateByPatterns(InvalidationPatterns.sales(productId));
};

/**
 * Clear ALL cache - use with caution!
 */
export const clearAllCache = async () => {
    if (!isRedisAvailable()) return false;

    try {
        await redis.flushdb();
        console.log('🧹 ALL CACHE CLEARED');
        return true;
    } catch (error) {
        console.error('❌ Failed to clear all cache:', error.message);
        return false;
    }
};

// =============================================================================
// CACHE-ASIDE PATTERN HELPER
// =============================================================================

/**
 * Get data with cache-aside pattern
 * First check cache, if miss then call fetcher and cache result
 * 
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function to fetch fresh data
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} - Data from cache or fetcher
 */
export const getOrSet = async (key, fetcher, ttl = CACHE_CONFIG.TTL.MEDIUM) => {
    // Try cache first
    const cached = await cacheGet(key);
    if (cached !== null) {
        return cached;
    }

    // Cache miss - fetch fresh data
    const freshData = await fetcher();

    // Cache the result
    if (freshData !== null && freshData !== undefined) {
        await cacheSet(key, freshData, ttl);
    }

    return freshData;
};

/**
 * Get data with cache-aside pattern WITH cache flag
 * Returns both the data and whether it came from cache
 * 
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function to fetch fresh data
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<{data: any, fromCache: boolean}>} - Data and cache flag
 */
export const getOrSetWithFlag = async (key, fetcher, ttl = CACHE_CONFIG.TTL.MEDIUM) => {
    // Try cache first
    const cached = await cacheGet(key);
    if (cached !== null) {
        return { data: cached, fromCache: true };
    }

    // Cache miss - fetch fresh data
    const freshData = await fetcher();

    // Cache the result
    if (freshData !== null && freshData !== undefined) {
        await cacheSet(key, freshData, ttl);
    }

    return { data: freshData, fromCache: false };
};

// =============================================================================
// CACHE MIDDLEWARE (Express)
// =============================================================================

/**
 * Express middleware for automatic response caching
 * Adds `cache: true/false` to responses so developers know if data came from cache
 * @param {number} ttl - Time to live in seconds
 * @param {Function} keyGenerator - Optional function to generate custom cache key
 */
export const cacheMiddleware = (ttl = CACHE_CONFIG.TTL.MEDIUM, keyGenerator = null) => {
    return async (req, res, next) => {
        if (!isRedisAvailable()) {
            return next();
        }

        // Skip caching for non-GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Skip caching for authenticated routes with user-specific data
        if (req.user && req.path.includes('/my')) {
            return next();
        }

        // Generate cache key - strip _t timestamp parameter for consistent caching
        let cacheUrl = req.originalUrl;

        // Remove _t=timestamp from URL for cache key
        const url = new URL(cacheUrl, 'http://localhost');
        url.searchParams.delete('_t');
        cacheUrl = url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '');

        const key = keyGenerator
            ? keyGenerator(req)
            : `api:${cacheUrl}:v3`;

        try {
            // Check cache
            const cached = await cacheGet(key);
            if (cached) {
                // Add cache flag to response
                const responseWithCacheFlag = typeof cached === 'object' && cached !== null
                    ? { ...cached, cache: true }
                    : cached;
                return res.json(responseWithCacheFlag);
            }

            // Override res.json to cache the response
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cacheSet(key, data, ttl).catch(() => { });
                }
                // Add cache: false flag to fresh data response
                const responseWithCacheFlag = typeof data === 'object' && data !== null
                    ? { ...data, cache: false }
                    : data;
                return originalJson(responseWithCacheFlag);
            };

            next();
        } catch (error) {
            // On error, just continue without caching
            next();
        }
    };
};

// =============================================================================
// EXPORT CACHE TTL CONFIG
// =============================================================================

export const CacheTTL = CACHE_CONFIG.TTL;

// Re-export isRedisAvailable for convenience
export { isRedisAvailable } from '../config/redis.js';

export default {
    cacheGet,
    cacheSet,
    cacheDel,
    invalidateByPatterns,
    invalidateProductCache,
    invalidateCategoryCache,
    invalidateReviewCache,
    invalidateCouponCache,
    invalidateStatsCache,
    invalidateSalesCache,
    clearAllCache,
    getOrSet,
    getOrSetWithFlag,
    cacheMiddleware,
    CacheKeys,
    CacheTTL,
};
