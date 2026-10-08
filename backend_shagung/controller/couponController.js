import pool from '../config/dbconfig.js';
import { invalidateCouponCache } from '../utils/cacheService.js';

// =============================================================================
// GET ALL COUPONS (Admin)
// =============================================================================
export const getAllCoupons = async (req, res) => {
    try {
        const { page = 1, limit = 20, status = '' } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status === 'active') {
            whereClause += ` AND is_active = true AND (expires_at IS NULL OR expires_at > NOW())`;
        } else if (status === 'expired') {
            whereClause += ` AND expires_at <= NOW()`;
        } else if (status === 'inactive') {
            whereClause += ` AND is_active = false`;
        }

        const query = `
      SELECT *,
        COUNT(*) OVER() as total_count,
        CASE 
          WHEN expires_at IS NOT NULL AND expires_at <= NOW() THEN 'expired'
          WHEN is_active = false THEN 'inactive'
          ELSE 'active'
        END as status
      FROM coupons
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        params.push(limit, offset);
        const result = await pool.query(query, params);

        const totalCount = result.rows[0]?.total_count || 0;

        res.json({
            success: true,
            coupons: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalCount: parseInt(totalCount),
                totalPages: Math.ceil(totalCount / limit),
            },
        });
    } catch (error) {
        console.error('Get Coupons Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch coupons', error: error.message });
    }
};

// =============================================================================
// CREATE COUPON (Admin)
// =============================================================================
export const createCoupon = async (req, res) => {
    try {
        const {
            code, description, discount_type, discount_value,
            max_discount, min_order_amount, max_uses,
            is_active = true, starts_at, expires_at
        } = req.body;

        if (!code || !discount_type || !discount_value) {
            return res.status(400).json({
                success: false,
                message: 'Code, discount type, and discount value are required',
            });
        }

        // Check if code already exists
        const existing = await pool.query('SELECT id FROM coupons WHERE code = $1', [code.toUpperCase()]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, message: 'Coupon code already exists' });
        }

        const result = await pool.query(`
      INSERT INTO coupons (code, description, discount_type, discount_value, max_discount, min_order_amount, max_uses, is_active, starts_at, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [code.toUpperCase(), description, discount_type, discount_value, max_discount, min_order_amount, max_uses, is_active, starts_at, expires_at]);

        // Invalidate coupon cache after creation
        await invalidateCouponCache();

        res.status(201).json({ success: true, message: 'Coupon created', coupon: result.rows[0] });
    } catch (error) {
        console.error('Create Coupon Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create coupon', error: error.message });
    }
};

// =============================================================================
// UPDATE COUPON (Admin)
// =============================================================================
export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            code, description, discount_type, discount_value,
            max_discount, min_order_amount, max_uses,
            is_active, starts_at, expires_at
        } = req.body;

        const result = await pool.query(`
      UPDATE coupons SET
        code = COALESCE($1, code),
        description = COALESCE($2, description),
        discount_type = COALESCE($3, discount_type),
        discount_value = COALESCE($4, discount_value),
        max_discount = $5,
        min_order_amount = $6,
        max_uses = $7,
        is_active = COALESCE($8, is_active),
        starts_at = $9,
        expires_at = $10
      WHERE id = $11
      RETURNING *
    `, [code?.toUpperCase(), description, discount_type, discount_value, max_discount, min_order_amount, max_uses, is_active, starts_at, expires_at, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        // Invalidate coupon cache after update
        await invalidateCouponCache();

        res.json({ success: true, message: 'Coupon updated', coupon: result.rows[0] });
    } catch (error) {
        console.error('Update Coupon Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update coupon', error: error.message });
    }
};

// =============================================================================
// DELETE COUPON (Admin)
// =============================================================================
export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM coupons WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        // Invalidate coupon cache after deletion
        await invalidateCouponCache();

        res.json({ success: true, message: 'Coupon deleted' });
    } catch (error) {
        console.error('Delete Coupon Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete coupon', error: error.message });
    }
};

// =============================================================================
// TOGGLE COUPON STATUS (Admin)
// =============================================================================
export const toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
      UPDATE coupons SET is_active = NOT is_active WHERE id = $1 RETURNING *
    `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        res.json({
            success: true,
            message: result.rows[0].is_active ? 'Coupon activated' : 'Coupon deactivated',
            coupon: result.rows[0],
        });
    } catch (error) {
        console.error('Toggle Coupon Error:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle coupon', error: error.message });
    }
};

// =============================================================================
// GET ANALYTICS DATA (Admin)
// =============================================================================
export const getAnalytics = async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const days = parseInt(period) || 30;

        // Revenue by day
        const revenueByDay = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total) as revenue
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        AND payment_status = 'paid'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

        // Orders by status
        const ordersByStatus = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY status
    `);

        // Top products
        const topProducts = await pool.query(`
      SELECT 
        p.id, p.name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image,
        SUM(oi.quantity) as sold,
        SUM(oi.total) as revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY p.id, p.name
      ORDER BY sold DESC
      LIMIT 10
    `);

        // Top categories
        const topCategories = await pool.query(`
      SELECT 
        c.id, c.name,
        SUM(oi.quantity) as sold,
        SUM(oi.total) as revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at >= CURRENT_DATE - INTERVAL '${days} days'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
      LIMIT 5
    `);

        // Customer growth
        const customerGrowth = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_customers
      FROM users
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        AND role != 'admin'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

        // Summary stats
        const summary = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days') as total_orders,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days' AND payment_status = 'paid') as total_revenue,
        (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days' AND role != 'admin') as new_customers,
        (SELECT COALESCE(AVG(total), 0) FROM orders WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days') as avg_order_value
    `);

        res.json({
            success: true,
            analytics: {
                revenueByDay: revenueByDay.rows,
                ordersByStatus: ordersByStatus.rows,
                topProducts: topProducts.rows,
                topCategories: topCategories.rows,
                customerGrowth: customerGrowth.rows,
                summary: summary.rows[0],
            },
        });
    } catch (error) {
        console.error('Get Analytics Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
    }
};

export default {
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    getAnalytics,
};
