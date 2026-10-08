// =============================================================================
// SALES CONTROLLER
// Manages sale campaigns and products on sale
// =============================================================================

import pool from "../config/dbconfig.js";
import { publishCacheInvalidation } from "../utils/cachePublisher.js";
import { invalidateSalesCache } from "../utils/cacheService.js";

// =============================================================================
// GET ALL SALES (Admin)
// =============================================================================
export const getAllSales = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.*,
                (SELECT COUNT(*) FROM product_sales ps WHERE ps.sale_id = s.id) as product_count
            FROM sales s
            ORDER BY s.priority ASC, s.created_at DESC
        `);

        res.json({
            success: true,
            sales: result.rows
        });
    } catch (error) {
        console.error('Get All Sales Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// =============================================================================
// GET ACTIVE SALES (Public)
// =============================================================================
export const getActiveSales = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.id,
                s.name,
                s.slug,
                s.description,
                s.banner_image,
                s.background_image,
                s.background_color,
                s.badge_text,
                s.discount_percentage,
                s.start_date,
                s.end_date,
                s.priority,
                s.offer_heading,
                s.offer_subheading,
                s.timezone,
                s.show_countdown,
                s.show_products_count,
                s.cta_text,
                s.cta_link,
                (SELECT COUNT(*) FROM product_sales ps WHERE ps.sale_id = s.id) as product_count
            FROM sales s
            WHERE s.is_active = true
                AND s.start_date <= NOW()
                AND s.end_date >= NOW()
            ORDER BY s.priority ASC, s.end_date ASC
        `);

        res.json({
            success: true,
            sales: result.rows
        });
    } catch (error) {
        console.error('Get Active Sales Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// =============================================================================
// GET SALE BY ID/SLUG
// =============================================================================
export const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if id is a number or slug
        const isNumeric = /^\d+$/.test(id);

        const result = await pool.query(`
            SELECT s.*
            FROM sales s
            WHERE ${isNumeric ? 's.id = $1' : 's.slug = $1'}
        `, [isNumeric ? parseInt(id) : id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        res.json({
            success: true,
            sale: result.rows[0]
        });
    } catch (error) {
        console.error('Get Sale Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// =============================================================================
// CREATE SALE (Admin)
// =============================================================================
export const createSale = async (req, res) => {
    try {
        const {
            name,
            slug,
            description,
            banner_image,
            background_image,
            background_color,
            badge_text,
            discount_percentage,
            start_date,
            end_date,
            is_active,
            priority,
            offer_heading,
            offer_subheading,
            timezone,
            show_countdown,
            show_products_count,
            cta_text,
            cta_link
        } = req.body;

        if (!name || !slug || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Name, slug, start_date, and end_date are required'
            });
        }

        const result = await pool.query(`
            INSERT INTO sales (
                name, slug, description, banner_image, background_image, background_color,
                badge_text, discount_percentage, start_date, end_date, is_active, priority,
                offer_heading, offer_subheading, timezone, show_countdown, show_products_count,
                cta_text, cta_link
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *
        `, [
            name,
            slug,
            description || null,
            banner_image || null,
            background_image || null,
            background_color || 'linear-gradient(135deg, #e91e63, #9c27b0)',
            badge_text || 'SALE',
            discount_percentage || 0,
            start_date,
            end_date,
            is_active !== false,
            priority || 0,
            offer_heading || 'Limited Time Offer',
            offer_subheading || null,
            timezone || 'Asia/Kolkata',
            show_countdown !== false,
            show_products_count !== false,
            cta_text || 'Shop Now',
            cta_link || '/sale'
        ]);

        res.status(201).json({
            success: true,
            sale: result.rows[0]
        });
    } catch (error) {
        console.error('Create Sale Error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'Sale with this slug already exists' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// =============================================================================
// UPDATE SALE (Admin)
// =============================================================================
export const updateSale = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            slug,
            description,
            banner_image,
            background_image,
            background_color,
            badge_text,
            discount_percentage,
            start_date,
            end_date,
            is_active,
            priority,
            offer_heading,
            offer_subheading,
            timezone,
            show_countdown,
            show_products_count,
            cta_text,
            cta_link
        } = req.body;

        const result = await pool.query(`
            UPDATE sales SET
                name = COALESCE($1, name),
                slug = COALESCE($2, slug),
                description = $3,
                banner_image = $4,
                background_image = $5,
                background_color = COALESCE($6, background_color),
                badge_text = COALESCE($7, badge_text),
                discount_percentage = COALESCE($8, discount_percentage),
                start_date = COALESCE($9, start_date),
                end_date = COALESCE($10, end_date),
                is_active = COALESCE($11, is_active),
                priority = COALESCE($12, priority),
                offer_heading = COALESCE($13, offer_heading),
                offer_subheading = $14,
                timezone = COALESCE($15, timezone),
                show_countdown = COALESCE($16, show_countdown),
                show_products_count = COALESCE($17, show_products_count),
                cta_text = COALESCE($18, cta_text),
                cta_link = COALESCE($19, cta_link),
                updated_at = NOW()
            WHERE id = $20
            RETURNING *
        `, [
            name, slug, description, banner_image, background_image, background_color,
            badge_text, discount_percentage, start_date, end_date, is_active, priority,
            offer_heading, offer_subheading, timezone, show_countdown, show_products_count,
            cta_text, cta_link, id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        res.json({
            success: true,
            sale: result.rows[0]
        });
    } catch (error) {
        console.error('Update Sale Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// =============================================================================
// DELETE SALE (Admin)
// =============================================================================
export const deleteSale = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM sales WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sale not found' });
        }

        res.json({
            success: true,
            message: 'Sale deleted successfully'
        });
    } catch (error) {
        console.error('Delete Sale Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// =============================================================================
// GET PRODUCTS ON SALE
// Calculates sale_price dynamically: sale_price = price - (price * discount_percentage / 100)
// =============================================================================
export const getSaleProducts = async (req, res) => {
    try {
        const { sale_id, limit = 20, page = 1 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let sql, params;

        if (sale_id) {
            // Get products for specific sale
            sql = `
                SELECT 
                    p.id,
                    p.name,
                    p.slug,
                    p.price,
                    p.compare_at_price,
                    -- Calculate sale_price: product price - (product price * sale discount / 100)
                    ROUND(p.price - (p.price * COALESCE(s.discount_percentage, 0) / 100), 2) as sale_price,
                    -- Original price (before sale) for comparison
                    p.price as original_price,
                    s.discount_percentage as sale_discount,
                    ps.discount_percentage as product_discount,
                    s.badge_text,
                    s.name as sale_name,
                    s.end_date as sale_end_date,
                    c.name as category_name,
                    c.slug as category_slug,
                    true as on_sale,
                    (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.position ASC LIMIT 1) as image
                FROM product_sales ps
                JOIN products p ON ps.product_id = p.id
                JOIN sales s ON ps.sale_id = s.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE ps.sale_id = $1
                    AND p.is_published = true
                ORDER BY ps.created_at DESC
                LIMIT $2 OFFSET $3
            `;
            params = [sale_id, parseInt(limit), offset];
        } else {
            // Get all products currently on sale
            sql = `
                SELECT DISTINCT ON (p.id)
                    p.id,
                    p.name,
                    p.slug,
                    p.price,
                    p.compare_at_price,
                    -- Calculate sale_price: product price - (product price * sale discount / 100)
                    ROUND(p.price - (p.price * COALESCE(s.discount_percentage, 0) / 100), 2) as sale_price,
                    -- Original price (before sale) for comparison
                    p.price as original_price,
                    s.discount_percentage as sale_discount,
                    ps.discount_percentage as product_discount,
                    s.badge_text,
                    s.name as sale_name,
                    s.end_date as sale_end_date,
                    c.name as category_name,
                    c.slug as category_slug,
                    true as on_sale,
                    (SELECT pi.image_url FROM product_images pi WHERE pi.product_id = p.id ORDER BY pi.is_primary DESC, pi.position ASC LIMIT 1) as image
                FROM product_sales ps
                JOIN products p ON ps.product_id = p.id
                JOIN sales s ON ps.sale_id = s.id
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE s.is_active = true
                    AND s.start_date <= NOW()
                    AND s.end_date >= NOW()
                    AND p.is_published = true
                ORDER BY p.id, s.priority ASC
                LIMIT $1 OFFSET $2
            `;
            params = [parseInt(limit), offset];
        }

        const result = await pool.query(sql, params);

        // Get total count
        const countResult = await pool.query(`
            SELECT COUNT(DISTINCT ps.product_id) as total
            FROM product_sales ps
            JOIN products p ON ps.product_id = p.id
            JOIN sales s ON ps.sale_id = s.id
            WHERE s.is_active = true
                AND s.start_date <= NOW()
                AND s.end_date >= NOW()
                AND p.is_published = true
        `);

        res.json({
            success: true,
            products: result.rows,
            total: parseInt(countResult.rows[0]?.total || 0),
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error('Get Sale Products Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// =============================================================================
// ADD PRODUCT TO SALE (Admin)
// =============================================================================
export const addProductToSale = async (req, res) => {
    try {
        const { product_id, sale_id, sale_price, discount_percentage } = req.body;

        if (!product_id || !sale_id) {
            return res.status(400).json({
                success: false,
                message: 'product_id and sale_id are required'
            });
        }

        const result = await pool.query(`
            INSERT INTO product_sales (product_id, sale_id, sale_price, discount_percentage)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (product_id, sale_id) 
            DO UPDATE SET sale_price = $3, discount_percentage = $4
            RETURNING *
        `, [product_id, sale_id, sale_price || null, discount_percentage || 0]);

        // Invalidate all sales-related caches BEFORE sending response
        await invalidateSalesCache(product_id);

        // Also publish for distributed cache invalidation
        await publishCacheInvalidation(`cache:*products*`);
        await publishCacheInvalidation(`cache:*categories*`);
        await publishCacheInvalidation(`cache:*featured*`);
        await publishCacheInvalidation(`cache:*sales*`);

        res.json({
            success: true,
            productSale: result.rows[0]
        });
    } catch (error) {
        console.error('Add Product to Sale Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// =============================================================================
// REMOVE PRODUCT FROM SALE (Admin)
// =============================================================================
export const removeProductFromSale = async (req, res) => {
    try {
        const { product_id, sale_id } = req.body;

        if (!product_id || !sale_id) {
            return res.status(400).json({
                success: false,
                message: 'product_id and sale_id are required'
            });
        }

        await pool.query(
            'DELETE FROM product_sales WHERE product_id = $1 AND sale_id = $2',
            [product_id, sale_id]
        );

        // Invalidate all sales-related caches BEFORE sending response
        await invalidateSalesCache(product_id);

        // Also publish for distributed cache invalidation
        await publishCacheInvalidation(`cache:*products*`);
        await publishCacheInvalidation(`cache:*categories*`);
        await publishCacheInvalidation(`cache:*featured*`);
        await publishCacheInvalidation(`cache:*sales*`);

        res.json({
            success: true,
            message: 'Product removed from sale'
        });
    } catch (error) {
        console.error('Remove Product from Sale Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// =============================================================================
// GET PRODUCT SALE STATUS (Check if product is on sale)
// =============================================================================
export const getProductSaleStatus = async (req, res) => {
    try {
        const { product_id } = req.params;

        const result = await pool.query(`
            SELECT 
                ps.id,
                ps.sale_price,
                ps.discount_percentage,
                s.id as sale_id,
                s.name as sale_name,
                s.slug as sale_slug,
                s.badge_text,
                s.discount_percentage as sale_discount,
                s.end_date
            FROM product_sales ps
            JOIN sales s ON ps.sale_id = s.id
            WHERE ps.product_id = $1
                AND s.is_active = true
                AND s.start_date <= NOW()
                AND s.end_date >= NOW()
            ORDER BY s.priority ASC
            LIMIT 1
        `, [product_id]);

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                onSale: false
            });
        }

        res.json({
            success: true,
            onSale: true,
            saleInfo: result.rows[0]
        });
    } catch (error) {
        console.error('Get Product Sale Status Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// =============================================================================
// BULK ADD PRODUCTS TO SALE (Admin)
// =============================================================================
export const bulkAddProductsToSale = async (req, res) => {
    try {
        const { sale_id, product_ids, discount_percentage } = req.body;

        if (!sale_id || !product_ids || !Array.isArray(product_ids)) {
            return res.status(400).json({
                success: false,
                message: 'sale_id and product_ids array are required'
            });
        }

        const values = product_ids.map((pid, idx) =>
            `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3})`
        ).join(', ');

        const params = product_ids.flatMap(pid => [pid, sale_id, discount_percentage || 0]);

        await pool.query(`
            INSERT INTO product_sales (product_id, sale_id, discount_percentage)
            VALUES ${values}
            ON CONFLICT (product_id, sale_id) DO UPDATE SET discount_percentage = EXCLUDED.discount_percentage
        `, params);

        res.json({
            success: true,
            message: `${product_ids.length} products added to sale`
        });

        // Invalidate product cache
        await publishCacheInvalidation(`cache:*products*`);
        if (sale_id) {
            // We'd ideally invalidate each product, but wildcard is okay or we can loop.
            // Since we don't have product_ids easily accessible individually if they were from other sources, 
            // but here we have the array.
            for (const pid of product_ids) {
                await publishCacheInvalidation(`cache:*/api/products/${pid}*`);
            }
        }
    } catch (error) {
        console.error('Bulk Add Products to Sale Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

export default {
    getAllSales,
    getActiveSales,
    getSaleById,
    createSale,
    updateSale,
    deleteSale,
    getSaleProducts,
    addProductToSale,
    removeProductFromSale,
    getProductSaleStatus,
    bulkAddProductsToSale
};
