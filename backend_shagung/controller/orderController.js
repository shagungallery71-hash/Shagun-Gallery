import pool from '../config/dbconfig.js';
import { v4 as uuidv4 } from 'uuid';
import { invalidateStatsCache } from '../utils/cacheService.js';

// =============================================================================
// CREATE ORDER
// =============================================================================
export const createOrder = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user?.id;
        const {
            items, // Array of { productId, variantId, quantity, price }
            shippingAddress,
            billingAddress,
            paymentIntentId,
            couponCode,
            notes,
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must contain at least one item',
            });
        }

        if (!shippingAddress) {
            return res.status(400).json({
                success: false,
                message: 'Shipping address is required',
            });
        }

        await client.query('BEGIN');

        // Generate unique order number
        const orderNumber = `ORD-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;

        // Calculate totals
        let subtotal = 0;
        for (const item of items) {
            subtotal += item.price * item.quantity;
        }

        // Apply coupon discount if applicable
        let discount = 0;
        let couponId = null;

        if (couponCode) {
            const couponResult = await client.query(
                `SELECT * FROM coupons 
                 WHERE code = $1 
                 AND is_active = true 
                 AND (expires_at IS NULL OR expires_at > NOW())
                 AND (max_uses IS NULL OR uses_count < max_uses)`,
                [couponCode]
            );

            if (couponResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: 'Invalid or expired coupon code',
                });
            }

            const coupon = couponResult.rows[0];
            couponId = coupon.id;

            // Check minimum order amount
            if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    success: false,
                    message: `Coupon requires minimum order of ₹${coupon.min_order_amount}`,
                });
            }

            if (coupon.discount_type === 'percentage') {
                discount = (subtotal * coupon.discount_value) / 100;
                if (coupon.max_discount) {
                    discount = Math.min(discount, coupon.max_discount);
                }
            } else {
                discount = coupon.discount_value;
            }
        }

        // Calculate shipping (free above ₹999)
        const shippingCost = subtotal >= 999 ? 0 : 99;

        // GST is INCLUDED in the displayed price (Price shown = Base + 18% GST)
        // We need to EXTRACT the GST from the subtotal for display purposes
        // Formula: If price = base + 18% of base, then price = base * 1.18
        // So base = price / 1.18, and GST = price - base
        const taxRate = 0.18;

        // Apply discount first (discount is on the GST-inclusive price)
        const afterDiscount = subtotal - discount;

        // Extract GST from the after-discount amount (since GST is included)
        const baseAmount = afterDiscount / (1 + taxRate);
        const taxAmount = Number((afterDiscount - baseAmount).toFixed(2));

        // Total = afterDiscount (GST-inclusive price after discount) + shipping
        // Since GST is already included in the price, we don't add it again
        const total = afterDiscount + shippingCost;

        // Create order
        // Store baseAmount as subtotal (price before GST) for clear display
        // subtotal (base) + tax_amount = afterDiscount (GST-inclusive price after discount)
        // total = afterDiscount + shipping
        const orderResult = await client.query(`
      INSERT INTO orders (
        user_id,
        order_number,
        subtotal,
        discount,
        shipping_cost,
        tax_amount,
        total,
        shipping_address,
        billing_address,
        payment_intent_id,
        coupon_code,
        notes,
        status,
        payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
            userId,
            orderNumber,
            Number(baseAmount.toFixed(2)), // Base price (excluding GST)
            discount,
            shippingCost,
            taxAmount, // GST extracted from the price
            total, // afterDiscount + shipping
            JSON.stringify(shippingAddress),
            JSON.stringify(billingAddress || shippingAddress),
            paymentIntentId,
            couponCode,
            notes,
            'pending', // Initial order status
            paymentIntentId ? 'paid' : 'unpaid', // If paymentIntentId exists, payment was successful
        ]);

        const order = orderResult.rows[0];

        // Create order items
        for (const item of items) {
            await client.query(`
        INSERT INTO order_items (
          order_id,
          product_id,
          variant_id,
          quantity,
          price,
          total
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
                order.id,
                item.productId,
                item.variantId || null,
                item.quantity,
                item.price,
                item.price * item.quantity,
            ]);

            // Update stock (if variant specified)
            if (item.variantId) {
                await client.query(`
          UPDATE product_variants 
          SET stock = stock - $1
          WHERE id = $2
        `, [item.quantity, item.variantId]);
            }
        }

        // Increment coupon usage
        if (couponId) {
            await client.query(`
                UPDATE coupons 
                SET uses_count = COALESCE(uses_count, 0) + 1 
                WHERE id = $1
            `, [couponId]);
        }

        await client.query('COMMIT');

        // Fetch complete order with items
        const completeOrder = await getOrderById(order.id);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            order: completeOrder,
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create Order Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message,
        });
    } finally {
        client.release();
    }
};

// =============================================================================
// GET USER ORDERS
// =============================================================================
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { page = 1, limit = 10, status } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT 
        o.*,
        COUNT(*) OVER() as total_count,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'product_image', (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
            'variant_id', oi.variant_id,
            'size', pv.size,
            'color', pv.color,
            'color_code', pv.color_code,
            'quantity', oi.quantity,
            'price', oi.price,
            'total', oi.total
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      WHERE o.user_id = $1
    `;

        const params = [userId];
        let paramIndex = 2;

        if (status) {
            query += ` AND o.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += `
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        const totalCount = result.rows[0]?.total_count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            success: true,
            orders: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalCount: parseInt(totalCount),
                totalPages,
            },
        });
    } catch (error) {
        console.error('Get User Orders Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get orders',
            error: error.message,
        });
    }
};

// =============================================================================
// GET SINGLE ORDER
// =============================================================================
export const getOrder = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { orderId } = req.params;

        const order = await getOrderById(orderId, userId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        res.json({
            success: true,
            order,
        });
    } catch (error) {
        console.error('Get Order Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order',
            error: error.message,
        });
    }
};

// =============================================================================
// GET SINGLE ORDER (ADMIN - no user filter)
// =============================================================================
export const getOrderAdmin = async (req, res) => {
    try {
        const { orderId } = req.params;

        // For admin, don't filter by userId (pass null)
        const order = await getOrderById(orderId, null);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        res.json({
            success: true,
            order,
        });
    } catch (error) {
        console.error('Get Order Admin Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order',
            error: error.message,
        });
    }
};


// =============================================================================
// GET ORDER BY ORDER NUMBER
// =============================================================================
export const getOrderByNumber = async (req, res) => {
    try {
        const { orderNumber } = req.params;
        const email = req.query.email; // For guest order lookup

        let query = `
      SELECT 
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', p.name,
            'product_image', (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
            'size', pv.size,
            'color', pv.color,
            'color_code', pv.color_code,
            'quantity', oi.quantity,
            'price', oi.price
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN product_variants pv ON oi.variant_id = pv.id
      WHERE o.order_number = $1
    `;

        const params = [orderNumber];

        if (email) {
            // Verify email matches shipping address for guest tracking
            query += ` AND o.shipping_address->>'email' = $2`;
            params.push(email);
        }

        query += ' GROUP BY o.id';

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        res.json({
            success: true,
            order: result.rows[0],
        });
    } catch (error) {
        console.error('Get Order by Number Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order',
            error: error.message,
        });
    }
};

// =============================================================================
// UPDATE ORDER STATUS (Admin)
// =============================================================================
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, trackingNumber, trackingUrl, notes } = req.body;

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
            });
        }

        const result = await pool.query(`
      UPDATE orders
      SET 
        status = $1,
        tracking_number = COALESCE($2, tracking_number),
        tracking_url = COALESCE($3, tracking_url),
        notes = COALESCE($4, notes),
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [status, trackingNumber, trackingUrl, notes, orderId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Add to order history
        await pool.query(`
      INSERT INTO order_history (order_id, status, notes, created_by)
      VALUES ($1, $2, $3, $4)
    `, [orderId, status, notes, req.user?.id]);

        // Invalidate stats cache after order update
        await invalidateStatsCache();

        res.json({
            success: true,
            message: 'Order status updated',
            order: result.rows[0],
        });
    } catch (error) {
        console.error('Update Order Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
            error: error.message,
        });
    }
};

// =============================================================================
// CANCEL ORDER
// =============================================================================
export const cancelOrder = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'admin';
        const { orderId } = req.params;
        const { reason } = req.body;

        await client.query('BEGIN');

        // Get order
        let query = 'SELECT * FROM orders WHERE id = $1';
        const params = [orderId];

        if (!isAdmin) {
            query += ' AND user_id = $2';
            params.push(userId);
        }

        const orderResult = await client.query(query, params);

        if (orderResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        const order = orderResult.rows[0];

        // Check if order can be cancelled
        const nonCancellableStatuses = ['shipped', 'delivered', 'cancelled', 'refunded'];
        if (nonCancellableStatuses.includes(order.status)) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `Order cannot be cancelled when status is ${order.status}`,
            });
        }

        // Restore stock
        const orderItems = await client.query(
            'SELECT * FROM order_items WHERE order_id = $1',
            [orderId]
        );

        for (const item of orderItems.rows) {
            if (item.variant_id) {
                await client.query(`
          UPDATE product_variants 
          SET stock = stock + $1
          WHERE id = $2
        `, [item.quantity, item.variant_id]);
            }
        }

        // Update order status
        await client.query(`
      UPDATE orders 
      SET status = 'cancelled', cancellation_reason = $1, updated_at = NOW()
      WHERE id = $2
    `, [reason, orderId]);

        // Add to order history
        await client.query(`
      INSERT INTO order_history (order_id, status, notes, created_by)
      VALUES ($1, 'cancelled', $2, $3)
    `, [orderId, reason, userId]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Order cancelled successfully',
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Cancel Order Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel order',
            error: error.message,
        });
    } finally {
        client.release();
    }
};

// =============================================================================
// GET ALL ORDERS (Admin)
// =============================================================================
export const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, startDate, endDate, search } = req.query;
        const offset = (page - 1) * limit;

        let query = `
      SELECT 
        o.*,
        u.email as user_email,
        u.username as user_name,
        COUNT(*) OVER() as total_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
    `;

        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND o.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (startDate) {
            query += ` AND o.created_at >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND o.created_at <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        if (search) {
            query += ` AND (o.order_number ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += `
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
        params.push(limit, offset);

        const result = await pool.query(query, params);

        const totalCount = result.rows[0]?.total_count || 0;
        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            success: true,
            orders: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalCount: parseInt(totalCount),
                totalPages,
            },
        });
    } catch (error) {
        console.error('Get All Orders Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get orders',
            error: error.message,
        });
    }
};

// =============================================================================
// HELPER: Get order by ID with full details
// =============================================================================
async function getOrderById(orderId, userId = null) {
    let query = `
    SELECT 
      o.*,
      json_agg(
        json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', p.name,
          'product_image', (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1),
          'variant_id', oi.variant_id,
          'size', pv.size,
          'color', pv.color,
          'color_code', pv.color_code,
          'quantity', oi.quantity,
          'price', oi.price,
          'total', oi.total
        )
      ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    LEFT JOIN product_variants pv ON oi.variant_id = pv.id
    WHERE o.id = $1
  `;

    const params = [orderId];

    if (userId) {
        query += ' AND o.user_id = $2';
        params.push(userId);
    }

    query += ' GROUP BY o.id';

    const result = await pool.query(query, params);
    return result.rows[0] || null;
}

