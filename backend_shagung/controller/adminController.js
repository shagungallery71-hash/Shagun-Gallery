import pool from '../config/dbconfig.js';

// =============================================================================
// GET ALL CUSTOMERS (Admin)
// =============================================================================
export const getAllCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = "WHERE role != 'admin'";
        const params = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        // Get customers with aggregated data
        const query = `
      SELECT 
        u.id, u.username as name, u.email, u.role, u.is_verified, u.created_at,
        COALESCE(o.order_count, 0) as order_count,
        COALESCE(o.total_spent, 0) as total_spent,
        COALESCE(w.wishlist_count, 0) as wishlist_count,
        COUNT(*) OVER() as total_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as order_count, SUM(total) as total_spent
        FROM orders
        GROUP BY user_id
      ) o ON o.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as wishlist_count
        FROM wishlist
        GROUP BY user_id
      ) w ON w.user_id = u.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        params.push(limit, offset);
        const result = await pool.query(query, params);

        const totalCount = result.rows[0]?.total_count || 0;

        res.json({
            success: true,
            customers: result.rows.map(row => ({
                ...row,
                total_spent: parseFloat(row.total_spent) || 0,
                order_count: parseInt(row.order_count) || 0,
                wishlist_count: parseInt(row.wishlist_count) || 0,
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalCount: parseInt(totalCount),
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error('Get Customers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customers',
            error: error.message,
        });
    }
};

// =============================================================================
// GET ALL USERS WITH STATS (Admin) - For user management panel
// =============================================================================
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', role = '', verified = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = "WHERE 1=1";
        const params = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (role) {
            whereClause += ` AND role = $${paramIndex}`;
            params.push(role);
            paramIndex++;
        }

        if (verified === 'true' || verified === 'false') {
            whereClause += ` AND is_verified = $${paramIndex}`;
            params.push(verified === 'true');
            paramIndex++;
        }

        // Get users with aggregated data
        const query = `
            SELECT 
                u.id, u.username, u.email, u.role, u.is_verified, u.created_at,
                COALESCE(o.order_count, 0) as order_count,
                COALESCE(o.total_spent, 0) as total_spent,
                COUNT(*) OVER() as total_count
            FROM users u
            LEFT JOIN (
                SELECT user_id, COUNT(*) as order_count, SUM(total) as total_spent
                FROM orders
                GROUP BY user_id
            ) o ON o.user_id = u.id
            ${whereClause}
            ORDER BY u.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limit, offset);
        const result = await pool.query(query, params);

        // Get user stats
        const statsResult = await pool.query(`
            SELECT
                COUNT(*) as total_users,
                COUNT(*) FILTER(WHERE role = 'admin') as admin_count,
                COUNT(*) FILTER(WHERE role = 'customer' OR role IS NULL) as customer_count,
                COUNT(*) FILTER(WHERE is_verified = true) as verified_count,
                COUNT(*) FILTER(WHERE is_verified = false) as unverified_count,
                COUNT(*) FILTER(WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_last_30_days
            FROM users
        `);

        const totalCount = result.rows[0]?.total_count || 0;
        const stats = statsResult.rows[0];

        res.json({
            success: true,
            users: result.rows.map(row => ({
                ...row,
                total_spent: parseFloat(row.total_spent) || 0,
                order_count: parseInt(row.order_count) || 0,
            })),
            stats: {
                total: parseInt(stats.total_users) || 0,
                admins: parseInt(stats.admin_count) || 0,
                customers: parseInt(stats.customer_count) || 0,
                verified: parseInt(stats.verified_count) || 0,
                unverified: parseInt(stats.unverified_count) || 0,
                newLast30Days: parseInt(stats.new_last_30_days) || 0,
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalCount: parseInt(totalCount),
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message,
        });
    }
};

// =============================================================================
// TOGGLE USER VERIFIED STATUS (Admin)
// =============================================================================
export const toggleUserVerified = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_verified } = req.body;

        if (typeof is_verified !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'is_verified must be a boolean',
            });
        }

        const result = await pool.query(`
            UPDATE users
            SET is_verified = $1
            WHERE id = $2
            RETURNING id, username, email, is_verified, role
        `, [is_verified, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            message: is_verified ? 'User verified successfully' : 'User unverified',
            user: result.rows[0],
        });
    } catch (error) {
        console.error('Toggle User Verified Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message,
        });
    }
};

// =============================================================================
// UPDATE USER ROLE (Admin)
// =============================================================================
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['customer', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
            });
        }

        const result = await pool.query(`
            UPDATE users
            SET role = $1
            WHERE id = $2
            RETURNING id, username, email, role
        `, [role, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.json({
            success: true,
            message: `User role updated to ${role}`,
            user: result.rows[0],
        });
    } catch (error) {
        console.error('Update User Role Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user role',
            error: error.message,
        });
    }
};


// =============================================================================
// GET CUSTOMER BY ID (Admin)
// =============================================================================
export const getCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const customerResult = await pool.query(`
      SELECT id, username as name, email, role, is_verified, created_at
      FROM users WHERE id = $1
        `, [id]);

        if (customerResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        const customer = customerResult.rows[0];

        // Get customer orders
        const ordersResult = await pool.query(`
      SELECT id, order_number, total, status, payment_status, created_at
      FROM orders WHERE user_id = $1
      ORDER BY created_at DESC LIMIT 10
        `, [id]);

        // Get customer addresses
        const addressesResult = await pool.query(`
    SELECT * FROM user_addresses WHERE user_id = $1
        `, [id]);

        res.json({
            success: true,
            customer: {
                ...customer,
                orders: ordersResult.rows,
                addresses: addressesResult.rows,
            },
        });
    } catch (error) {
        console.error('Get Customer Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch customer',
            error: error.message,
        });
    }
};

// =============================================================================
// GET ALL REVIEWS (Admin)
// =============================================================================
export const getAllReviews = async (req, res) => {
    try {
        const { page = 1, limit = 20, rating = '', search = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (rating) {
            whereClause += ` AND r.rating = $${paramIndex}`;
            params.push(parseInt(rating));
            paramIndex++;
        }

        if (search) {
            whereClause += ` AND (p.name ILIKE $${paramIndex} OR r.comment ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        const query = `
            SELECT 
                r.id, r.product_id, r.user_id, r.rating, r.comment, r.created_at,
                p.name as product_name,
                (SELECT image_url FROM product_images WHERE product_id = p.id LIMIT 1) as product_image,
                u.username as user_name, u.email as user_email,
                COUNT(*) OVER() as total_count
            FROM product_reviews r
            LEFT JOIN products p ON p.id = r.product_id
            LEFT JOIN users u ON u.id = r.user_id
            ${whereClause}
            ORDER BY r.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        params.push(limit, offset);
        const result = await pool.query(query, params);

        // Get stats
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COALESCE(AVG(rating), 0) as avg_rating
            FROM product_reviews
        `);

        const totalCount = result.rows[0]?.total_count || 0;

        res.json({
            success: true,
            reviews: result.rows,
            stats: {
                total: statsResult.rows[0]?.total || 0,
                pending: 0,
                approved: statsResult.rows[0]?.total || 0,
                avg_rating: parseFloat(statsResult.rows[0]?.avg_rating || 0).toFixed(1),
            },
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalCount: parseInt(totalCount),
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error('Get Reviews Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
            error: error.message,
        });
    }
};



// =============================================================================
// APPROVE/UNAPPROVE REVIEW (Admin)
// =============================================================================
export const approveReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_approved } = req.body;

        const result = await pool.query(`
      UPDATE product_reviews
      SET is_approved = $1
      WHERE id = $2
    RETURNING *
        `, [is_approved, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Review not found',
            });
        }

        res.json({
            success: true,
            message: is_approved ? 'Review approved' : 'Review unapproved',
            review: result.rows[0],
        });
    } catch (error) {
        console.error('Approve Review Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review',
            error: error.message,
        });
    }
};

// =============================================================================
// DELETE REVIEW (Admin)
// =============================================================================
export const deleteReview = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM product_reviews WHERE id = $1", [id]);
        res.json({ success: true, message: "Review deleted successfully" });
    } catch (error) {
        console.error('Delete Review Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// =============================================================================
// GET DASHBOARD STATS (Admin)
// =============================================================================
export const getDashboardStats = async (req, res) => {
    try {
        // Get various stats
        const [ordersStats, revenueStats, customersStats, productsStats] = await Promise.all([
            // Orders stats
            pool.query(`
    SELECT
    COUNT(*) as total,
        COUNT(*) FILTER(WHERE status = 'pending') as pending,
            COUNT(*) FILTER(WHERE status = 'confirmed') as confirmed,
                COUNT(*) FILTER(WHERE status = 'processing') as processing,
                    COUNT(*) FILTER(WHERE status = 'shipped') as shipped,
                        COUNT(*) FILTER(WHERE status = 'delivered') as delivered,
                            COUNT(*) FILTER(WHERE status = 'cancelled') as cancelled,
                                COUNT(*) FILTER(WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as last_30_days
        FROM orders
        `),

            // Revenue stats
            pool.query(`
    SELECT
    COALESCE(SUM(total), 0) as total_revenue,
        COALESCE(SUM(total) FILTER(WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'), 0) as last_30_days,
        COALESCE(SUM(total) FILTER(WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'), 0) as last_7_days,
        COALESCE(AVG(total), 0) as avg_order_value
        FROM orders
        WHERE payment_status = 'paid'
        `),

            // Customers stats
            pool.query(`
    SELECT
    COUNT(*) as total,
        COUNT(*) FILTER(WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_last_30_days,
            COUNT(*) FILTER(WHERE is_verified = true) as verified
        FROM users
        WHERE role != 'admin'
        `),

            // Products stats
            pool.query(`
    SELECT
    COUNT(*) as total,
        COUNT(*) FILTER(WHERE is_published = true) as published,
            COUNT(*) FILTER(WHERE stock <= 0) as out_of_stock,
                COUNT(*) FILTER(WHERE stock > 0 AND stock <= 10) as low_stock
        FROM products
        `),
        ]);

        // Recent orders
        const recentOrders = await pool.query(`
      SELECT id, order_number, total, status, created_at, shipping_address
      FROM orders
      ORDER BY created_at DESC
      LIMIT 5
        `);

        const orders = ordersStats.rows[0];
        const revenue = revenueStats.rows[0];
        const customers = customersStats.rows[0];
        const products = productsStats.rows[0];

        res.json({
            success: true,
            // Summary for main stat cards
            summary: {
                total_orders: parseInt(orders.total) || 0,
                total_revenue: parseFloat(revenue.total_revenue) || 0,
                new_customers: parseInt(customers.total) || 0,
                avg_order_value: parseFloat(revenue.avg_order_value) || 0,
            },
            // Orders by status for status breakdown
            ordersByStatus: {
                pending: parseInt(orders.pending) || 0,
                confirmed: parseInt(orders.confirmed) || 0,
                processing: parseInt(orders.processing) || 0,
                shipped: parseInt(orders.shipped) || 0,
                delivered: parseInt(orders.delivered) || 0,
                cancelled: parseInt(orders.cancelled) || 0,
            },
            // Raw stats for detailed view
            stats: {
                orders,
                revenue,
                customers,
                products,
            },
            recentOrders: recentOrders.rows,
        });
    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard stats',
            error: error.message,
        });
    }
};

// =============================================================================
// GET DATABASE STATISTICS (Admin)
// =============================================================================
export const getDatabaseStats = async (req, res) => {
    try {
        // Get table sizes and row counts
        const tableStats = await pool.query(`
            SELECT 
                relname as table_name,
                n_tup_ins as inserts,
                n_tup_upd as updates,
                n_tup_del as deletes,
                n_live_tup as row_count
            FROM pg_stat_user_tables
            ORDER BY n_live_tup DESC
        `);

        // Get database size (approximate)
        const dbSize = await pool.query(`
            SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
        `);

        // Get table counts
        const counts = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM products) as products,
                (SELECT COUNT(*) FROM orders) as orders,
                (SELECT COUNT(*) FROM users) as users,
                (SELECT COUNT(*) FROM categories) as categories,
                (SELECT COUNT(*) FROM product_reviews) as reviews,
                (SELECT COUNT(*) FROM product_images) as images,
                (SELECT COUNT(*) FROM coupons) as coupons,
                (SELECT COUNT(*) FROM newsletter_subscriptions) as subscribers
        `);

        res.json({
            success: true,
            database: {
                size: dbSize.rows[0]?.db_size || 'Unknown',
                tables: tableStats.rows,
                counts: counts.rows[0] || {},
            },
        });
    } catch (error) {
        console.error('Database Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch database stats',
            error: error.message,
        });
    }
};

// =============================================================================
// CLEAR CACHE (Admin)
// =============================================================================
export const clearCache = async (req, res) => {
    try {
        // Import the cache service
        const { clearAllCache } = await import('../utils/cacheService.js');

        // Clear all cache (works with both Redis and in-memory)
        await clearAllCache();

        res.json({
            success: true,
            message: 'Cache cleared successfully',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Clear Cache Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cache',
            error: error.message,
        });
    }
};

// =============================================================================
// GET CACHE STATS (Admin)
// =============================================================================
export const getCacheStats = async (req, res) => {
    try {
        const { inMemoryCache } = await import('../config/redis.js');

        // Check if Redis is configured
        const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL);

        const stats = inMemoryCache.getStats();

        res.json({
            success: true,
            cache: {
                type: hasRedis ? 'Redis + In-Memory Fallback' : 'In-Memory Only',
                redisConfigured: hasRedis,
                inMemory: {
                    size: stats.size,
                    sampleKeys: stats.keys,
                },
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Cache Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cache stats',
            error: error.message,
        });
    }
};

// =============================================================================
// EXPORT DATABASE (Admin) - Download all tables as JSON
// =============================================================================
export const exportDatabase = async (req, res) => {
    try {
        // Get all table names
        const tablesResult = await pool.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);

        const exportData = {
            exportDate: new Date().toISOString(),
            databaseType: 'PostgreSQL (Neon)',
            tables: {}
        };

        // Export each table
        for (const row of tablesResult.rows) {
            const tableName = row.table_name;
            const tableData = await pool.query(`SELECT * FROM ${tableName}`);
            exportData.tables[tableName] = {
                rowCount: tableData.rowCount,
                data: tableData.rows
            };
        }

        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=database_backup_${new Date().toISOString().split('T')[0]}.json`);

        res.json(exportData);
    } catch (error) {
        console.error('Export Database Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export database',
            error: error.message,
        });
    }
};

// =============================================================================
// EXPORT REDIS CACHE (Admin) - Download all cached data as JSON
// =============================================================================
export const exportRedis = async (req, res) => {
    try {
        let redisData = {
            exportDate: new Date().toISOString(),
            cacheType: 'Redis/Upstash',
            status: 'disabled',
            keys: []
        };

        // Check if Redis is configured
        if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
            const { Redis } = await import('@upstash/redis');
            const redis = new Redis({
                url: process.env.UPSTASH_REDIS_REST_URL,
                token: process.env.UPSTASH_REDIS_REST_TOKEN,
            });

            // Get all keys
            const keys = await redis.keys('*');
            redisData.status = 'active';
            redisData.totalKeys = keys.length;
            redisData.keys = [];

            // Get values for each key (limit to avoid timeout)
            const keyLimit = Math.min(keys.length, 100);
            for (let i = 0; i < keyLimit; i++) {
                const key = keys[i];
                try {
                    const value = await redis.get(key);
                    redisData.keys.push({
                        key,
                        value,
                        type: typeof value
                    });
                } catch (e) {
                    redisData.keys.push({
                        key,
                        error: 'Could not read value'
                    });
                }
            }

            if (keys.length > 100) {
                redisData.note = `Only first 100 of ${keys.length} keys exported`;
            }
        } else {
            redisData.message = 'Redis is not configured. UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing.';
        }

        // Set headers for file download
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=redis_backup_${new Date().toISOString().split('T')[0]}.json`);

        res.json(redisData);
    } catch (error) {
        console.error('Export Redis Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export Redis cache',
            error: error.message,
        });
    }
};

// =============================================================================
// RUN HERO TABLES MIGRATION (Admin)
// =============================================================================
export const runHeroMigration = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Create hero_slides table
        await client.query(`
            CREATE TABLE IF NOT EXISTS hero_slides (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                subtitle VARCHAR(255),
                description TEXT,
                image_url TEXT NOT NULL,
                badge_text VARCHAR(100),
                gradient VARCHAR(255) DEFAULT 'from-rose-600 via-pink-500 to-fuchsia-500',
                button_text VARCHAR(100) DEFAULT 'Shop Now',
                button_link VARCHAR(255) DEFAULT '/products',
                secondary_button_text VARCHAR(100),
                secondary_button_link VARCHAR(255),
                starting_price DECIMAL(10, 2),
                price_label VARCHAR(100) DEFAULT 'Starting from',
                position INTEGER DEFAULT 1,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create hero_settings table
        await client.query(`
            CREATE TABLE IF NOT EXISTS hero_settings (
                id SERIAL PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                setting_type VARCHAR(50) DEFAULT 'string',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_hero_slides_position ON hero_slides(position)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides(is_active)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_hero_settings_key ON hero_settings(setting_key)');

        // Check if we need to seed data
        const existingSlides = await client.query('SELECT COUNT(*) FROM hero_slides');

        if (parseInt(existingSlides.rows[0].count) === 0) {
            // Seed default slides
            await client.query(`
                INSERT INTO hero_slides (
                    title, subtitle, description, image_url, badge_text, gradient, 
                    button_text, button_link, secondary_button_text, secondary_button_link,
                    starting_price, price_label, position, is_active
                ) VALUES 
                ('Festive Glamour', '✨ New Collection 2025', 'Discover exquisite designs that blend tradition with contemporary elegance.',
                 'https://res.cloudinary.com/dsgktwwae/image/upload/v1766062147/Gemini_Generated_Image_c06zguc06zguc06z_2_vo7pcz.jpg',
                 'Trending Now', 'from-rose-600 via-pink-500 to-fuchsia-500', 'Shop Now', '/products', 'Sign Up', '/account', 999, 'Starting from', 1, true),
                ('Bridal Dreams', '👑 Premium Collection', 'Make your special day unforgettable with our handcrafted bridal wear.',
                 'https://res.cloudinary.com/dsgktwwae/image/upload/v1766062401/Gemini_Generated_Image_ajivycajivycajiv_2_hq3kg2.jpg',
                 'Exclusive', 'from-purple-600 via-violet-500 to-indigo-500', 'Shop Now', '/products', 'Sign Up', '/account', 1999, 'Starting from', 2, true),
                ('Ethnic Royale', '🌟 Limited Edition', 'Celebrate heritage with modern sophistication. Premium ethnic wear collection.',
                 'https://res.cloudinary.com/dsgktwwae/image/upload/v1766062766/fontlogo3_nj8da9.webp',
                 'Best Seller', 'from-amber-500 via-orange-500 to-red-500', 'Shop Now', '/products', 'Sign Up', '/account', 999, 'Starting from', 3, true)
            `);
        }

        // Check if we need to seed settings
        const existingSettings = await client.query('SELECT COUNT(*) FROM hero_settings');

        if (parseInt(existingSettings.rows[0].count) === 0) {
            // Seed default settings
            await client.query(`
                INSERT INTO hero_settings (setting_key, setting_value, setting_type, description) VALUES
                ('auto_slide_interval', '5000', 'number', 'Auto slide interval in milliseconds'),
                ('customer_count_text', '25K+ Happy Customers', 'string', 'Customer count badge text'),
                ('rating_value', '4.9', 'string', 'Rating value to display'),
                ('logo_url', 'https://res.cloudinary.com/dsgktwwae/image/upload/v1766060996/IMG-20250807-WA0012_1_h2hkya.jpg', 'string', 'Logo image URL'),
                ('brand_name', 'Shagun Gallery', 'string', 'Brand name text'),
                ('brand_tagline', 'Premium Ethnic Wear', 'string', 'Brand tagline text'),
                ('trust_badge_1_icon', '🚚', 'string', 'First trust badge icon'),
                ('trust_badge_1_text', 'Free Shipping', 'string', 'First trust badge text'),
                ('trust_badge_2_icon', '💯', 'string', 'Second trust badge icon'),
                ('trust_badge_2_text', 'Premium Quality', 'string', 'Second trust badge text'),
                ('trust_badge_3_icon', '🔒', 'string', 'Third trust badge icon'),
                ('trust_badge_3_text', 'Secure Pay', 'string', 'Third trust badge text')
            `);
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Hero tables migration completed successfully',
            tables: ['hero_slides', 'hero_settings'],
            seeded: {
                slides: parseInt(existingSlides.rows[0].count) === 0,
                settings: parseInt(existingSettings.rows[0].count) === 0
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Hero Migration Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to run hero migration',
            error: error.message
        });
    } finally {
        client.release();
    }
};

export default {
    getAllCustomers,
    getCustomer,
    getAllUsers,
    toggleUserVerified,
    updateUserRole,
    getAllReviews,
    approveReview,
    deleteReview,
    getDashboardStats,
    getDatabaseStats,
    clearCache,
    getCacheStats,
    exportDatabase,
    exportRedis,
    runHeroMigration,
};
