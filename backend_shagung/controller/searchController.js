import pool from "../config/dbconfig.js";

// =============================================================================
// IN-MEMORY CACHE FOR SEARCH
// =============================================================================
const searchCache = new Map();
const CACHE_TTL = 5 * 60 * 1000 * 5; // 5 minutes TTL
const MAX_CACHE_SIZE = 500; // Max cached queries

// Helper to get cache key
const getCacheKey = (query, filters) => {
    return `${query.toLowerCase().trim()}:${JSON.stringify(filters)}`;
};

// Helper to check if cache is valid
const isCacheValid = (cacheEntry) => {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TTL;
};

// Clean old cache entries (called periodically)
const cleanCache = () => {
    const now = Date.now();
    for (const [key, value] of searchCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            searchCache.delete(key);
        }
    }
    // If still too large, remove oldest entries
    if (searchCache.size > MAX_CACHE_SIZE) {
        const entries = Array.from(searchCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = entries.slice(0, searchCache.size - MAX_CACHE_SIZE);
        toRemove.forEach(([key]) => searchCache.delete(key));
    }
};

// Run cleanup every minute
setInterval(cleanCache, 60 * 1000);

// =============================================================================
// SEARCH PRODUCTS - Fast with caching
// =============================================================================
export const searchProducts = async (req, res) => {
    const startTime = Date.now();

    try {
        const {
            q = '',
            category = '',
            minPrice = 0,
            maxPrice = 999999,
            limit = 10,
            page = 1
        } = req.query;

        const query = q.trim();

        // Require at least 2 characters
        if (query.length < 2) {
            return res.json({
                success: true,
                products: [],
                total: 0,
                cache: false,
                responseTime: Date.now() - startTime
            });
        }

        const filters = { category, minPrice, maxPrice, limit, page };
        const cacheKey = getCacheKey(query, filters);

        // Check cache first
        const cachedResult = searchCache.get(cacheKey);
        if (isCacheValid(cachedResult)) {
            return res.json({
                ...cachedResult.data,
                cache: true,
                responseTime: Date.now() - startTime
            });
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Build search query with fuzzy matching
        // Using PostgreSQL's ILIKE and similarity features
        let queryParams = [];
        let paramIndex = 1;

        // Search pattern for ILIKE
        const searchPattern = `%${query}%`;

        let sql = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.stock,
        p.is_published,
        c.name as category_name,
        c.slug as category_slug,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.position ASC LIMIT 1) as image,
        (SELECT COALESCE(AVG(r.rating), 0) FROM product_reviews r WHERE r.product_id = p.id) as avg_rating,
        (SELECT COUNT(*) FROM product_reviews r WHERE r.product_id = p.id) as review_count,
        CASE 
          WHEN LOWER(p.name) = LOWER($${paramIndex}) THEN 100
          WHEN LOWER(p.name) LIKE LOWER($${paramIndex + 1}) THEN 80
          WHEN LOWER(p.name) LIKE $${paramIndex + 2} THEN 60
          WHEN LOWER(p.description) LIKE $${paramIndex + 2} THEN 40
          WHEN LOWER(c.name) LIKE $${paramIndex + 2} THEN 30
          ELSE 10
        END as relevance_score
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_published = true
        AND (
          LOWER(p.name) LIKE $${paramIndex + 2}
          OR LOWER(p.description) LIKE $${paramIndex + 2}
          OR LOWER(c.name) LIKE $${paramIndex + 2}
        )
    `;

        queryParams.push(query, query + '%', searchPattern);
        paramIndex += 3;

        // Add category filter
        if (category && category.trim()) {
            sql += ` AND (LOWER(c.name) = LOWER($${paramIndex}) OR LOWER(c.slug) = LOWER($${paramIndex}))`;
            queryParams.push(category);
            paramIndex++;
        }

        // Add price filters
        if (minPrice && parseFloat(minPrice) > 0) {
            sql += ` AND p.price >= $${paramIndex}`;
            queryParams.push(parseFloat(minPrice));
            paramIndex++;
        }

        if (maxPrice && parseFloat(maxPrice) < 999999) {
            sql += ` AND p.price <= $${paramIndex}`;
            queryParams.push(parseFloat(maxPrice));
            paramIndex++;
        }

        // Order by relevance and recency
        sql += ` ORDER BY relevance_score DESC, p.created_at DESC`;

        // Add pagination
        sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(parseInt(limit), offset);

        // Execute query
        const result = await pool.query(sql, queryParams);

        // Get total count for pagination
        let countSql = `
      SELECT COUNT(*) as total
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_published = true
        AND (
          LOWER(p.name) LIKE $1
          OR LOWER(p.description) LIKE $1
          OR LOWER(c.name) LIKE $1
        )
    `;

        const countResult = await pool.query(countSql, [searchPattern]);
        const total = parseInt(countResult.rows[0]?.total || 0);

        const responseData = {
            success: true,
            products: result.rows,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            hasMore: offset + result.rows.length < total,
            query: query
        };

        // Cache the result
        searchCache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });

        return res.json({
            ...responseData,
            cache: false,
            responseTime: Date.now() - startTime
        });

    } catch (error) {
        console.error("Search error:", error);
        return res.status(500).json({
            success: false,
            error: error.message,
            responseTime: Date.now() - startTime
        });
    }
};

// =============================================================================
// SEARCH SUGGESTIONS - Ultra fast autocomplete with subcategories
// =============================================================================
export const searchSuggestions = async (req, res) => {
    const startTime = Date.now();

    try {
        const { q = '' } = req.query;
        const query = q.trim();

        if (query.length < 2) {
            return res.json({
                success: true,
                suggestions: [],
                responseTime: Date.now() - startTime
            });
        }

        const cacheKey = `suggestions:${query.toLowerCase()}`;
        const cachedResult = searchCache.get(cacheKey);

        if (isCacheValid(cachedResult)) {
            return res.json({
                ...cachedResult.data,
                cache: true,
                responseTime: Date.now() - startTime
            });
        }

        const searchPattern = `%${query}%`;

        // Get product name suggestions
        const productSuggestions = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC LIMIT 1) as image,
        'product' as type
      FROM products p
      WHERE p.is_published = true
        AND LOWER(p.name) LIKE $1
      ORDER BY 
        CASE WHEN LOWER(p.name) LIKE $2 THEN 0 ELSE 1 END,
        p.name
      LIMIT 6
    `, [searchPattern, query.toLowerCase() + '%']);

        // Get main category suggestions (parent_id IS NULL)
        const mainCategorySuggestions = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.image_url as image,
        'category' as type,
        NULL as parent_id,
        NULL as parent_name,
        NULL as parent_slug,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_published = true) as product_count
      FROM categories c
      WHERE c.parent_id IS NULL
        AND LOWER(c.name) LIKE $1
      ORDER BY 
        CASE WHEN LOWER(c.name) LIKE $2 THEN 0 ELSE 1 END,
        c.name
      LIMIT 3
    `, [searchPattern, query.toLowerCase() + '%']);

        // Get subcategory suggestions (parent_id IS NOT NULL)
        const subCategorySuggestions = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.image_url as image,
        'subcategory' as type,
        c.parent_id,
        parent.name as parent_name,
        parent.slug as parent_slug,
        (SELECT COUNT(*) FROM products p WHERE p.category_id = c.parent_id AND p.is_published = true) as product_count
      FROM categories c
      LEFT JOIN categories parent ON c.parent_id = parent.id
      WHERE c.parent_id IS NOT NULL
        AND LOWER(c.name) LIKE $1
      ORDER BY 
        CASE WHEN LOWER(c.name) LIKE $2 THEN 0 ELSE 1 END,
        c.name
      LIMIT 5
    `, [searchPattern, query.toLowerCase() + '%']);

        // Combine and format suggestions
        const suggestions = [
            // Main categories first
            ...mainCategorySuggestions.rows.map(c => ({
                ...c,
                label: c.name,
                sublabel: `${c.product_count} products`,
                type: 'category'
            })),
            // Subcategories
            ...subCategorySuggestions.rows.map(c => ({
                ...c,
                label: c.name,
                sublabel: c.parent_name ? `in ${c.parent_name}` : `${c.product_count} products`,
                type: 'subcategory'
            })),
            // Products
            ...productSuggestions.rows.map(p => ({
                ...p,
                label: p.name,
                sublabel: `₹${p.price}`,
                type: 'product'
            }))
        ];

        const responseData = {
            success: true,
            suggestions,
            query
        };

        // Cache suggestions
        searchCache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });

        return res.json({
            ...responseData,
            cache: false,
            responseTime: Date.now() - startTime
        });

    } catch (error) {
        console.error("Suggestions error:", error);
        return res.status(500).json({
            success: false,
            suggestions: [],
            error: error.message,
            responseTime: Date.now() - startTime
        });
    }
};

// =============================================================================
// TRENDING SEARCHES - Fetch categories from database
// =============================================================================
export const getTrendingSearches = async (req, res) => {
    try {
        const cacheKey = 'trending_searches';
        const cachedResult = searchCache.get(cacheKey);

        if (isCacheValid(cachedResult)) {
            return res.json({
                ...cachedResult.data,
                cache: true
            });
        }

        // Fetch all categories with product counts
        const result = await pool.query(`
            SELECT 
                c.id,
                c.name,
                c.slug,
                c.parent_id,
                (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_published = true) as product_count
            FROM categories c
            ORDER BY 
                CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END,
                c.name ASC
            LIMIT 15
        `);

        // Format categories for trending display
        const trending = result.rows.map(cat => ({
            name: cat.name,
            slug: cat.slug,
            productCount: parseInt(cat.product_count) || 0,
            isSubcategory: cat.parent_id !== null
        }));

        const responseData = {
            success: true,
            trending
        };

        // Cache the result
        searchCache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
        });

        res.json({
            ...responseData,
            cache: false
        });
    } catch (error) {
        console.error('Trending searches error:', error);
        // Fallback to static list on error
        res.json({
            success: true,
            trending: [
                { name: 'Lehenga', slug: 'lehenga-s', productCount: 0 },
                { name: 'Saree', slug: 'saree', productCount: 0 },
                { name: 'Ethnic', slug: 'ethnic', productCount: 0 },
                { name: 'Dress', slug: 'dress', productCount: 0 }
            ],
            cache: true,
            fallback: true
        });
    }
};

// =============================================================================
// CLEAR SEARCH CACHE - Admin only
// =============================================================================
export const clearSearchCache = async (req, res) => {
    try {
        searchCache.clear();
        res.json({
            success: true,
            message: 'Search cache cleared'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export default {
    searchProducts,
    searchSuggestions,
    getTrendingSearches,
    clearSearchCache
};
