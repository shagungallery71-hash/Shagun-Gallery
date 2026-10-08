import pool from '../config/dbconfig.js';

// =============================================================================
// GET CART
// =============================================================================
export const getCart = async (req, res) => {
    try {
        const userId = req.user?.id;

        // Return empty cart if not authenticated
        if (!userId) {
            return res.json({
                success: true,
                cart: {
                    items: [],
                    itemCount: 0,
                    subtotal: 0,
                    shipping: 0,
                    total: 0,
                },
            });
        }

        const result = await pool.query(`
      SELECT 
        ci.id,
        ci.product_id,
        ci.variant_id,
        ci.quantity,
        p.name as product_name,
        p.slug as product_slug,
        p.price as base_price,
        COALESCE(pv.price, p.price) as price,
        pv.size,
        pv.color,
        pv.color_code,
        pv.stock,
        p.gst_included,
        p.gst_rate,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.user_id = $1
      ORDER BY ci.created_at DESC
    `, [userId]);

        // Helper function to get GST rate based on price
        // Rate Chart: ₹0-₹1,000 = 5%, Above ₹1,000 = 18%
        const getGstRate = (price, customRate) => {
            if (customRate !== null && customRate !== undefined) return parseFloat(customRate);
            if (price <= 1000) return 5;
            return 18;
        };

        // Calculate totals
        let subtotal = 0;
        let totalGst = 0;
        const items = result.rows.map((item) => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            // Calculate GST if not included
            const gstIncluded = item.gst_included !== false;
            const gstRate = getGstRate(item.price, item.gst_rate);
            let gstAmount = 0;

            if (!gstIncluded && gstRate > 0) {
                gstAmount = (itemTotal * gstRate) / 100;
                totalGst += gstAmount;
            }

            return {
                ...item,
                total: itemTotal,
                gst_included: gstIncluded,
                gst_rate: gstRate,
                gst_amount: gstAmount,
            };
        });

        const shipping = subtotal >= 999 ? 0 : 99;
        const total = subtotal + totalGst + shipping;

        res.json({
            success: true,
            cart: {
                items,
                itemCount: items.length,
                subtotal,
                gstTotal: totalGst,
                shipping,
                total,
                freeShippingThreshold: 999,
                remainingForFreeShipping: Math.max(0, 999 - subtotal),
            },
        });
    } catch (error) {
        console.error('Get Cart Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cart',
            error: error.message,
        });
    }
};

// =============================================================================
// ADD TO CART
// =============================================================================
export const addToCart = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required',
            });
        }

        // Verify user exists in database
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userCheck.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Please login again.',
            });
        }

        const { productId, variantId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required',
            });
        }

        // Check if product exists
        const productResult = await pool.query(
            'SELECT id, name, price FROM products WHERE id = $1',
            [productId]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Check stock if variant specified
        if (variantId) {
            const variantResult = await pool.query(
                'SELECT stock FROM product_variants WHERE id = $1',
                [variantId]
            );

            if (variantResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Variant not found',
                });
            }

            if (variantResult.rows[0].stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: 'Not enough stock available',
                    availableStock: variantResult.rows[0].stock,
                });
            }
        }

        // Check if item already in cart
        const existingItem = await pool.query(`
      SELECT id, quantity 
      FROM cart_items 
      WHERE user_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))
    `, [userId, productId, variantId]);

        let result;

        if (existingItem.rows.length > 0) {
            // Update quantity
            const newQuantity = existingItem.rows[0].quantity + quantity;
            result = await pool.query(`
        UPDATE cart_items 
        SET quantity = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [newQuantity, existingItem.rows[0].id]);
        } else {
            // Add new item
            result = await pool.query(`
        INSERT INTO cart_items (user_id, product_id, variant_id, quantity)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [userId, productId, variantId, quantity]);
        }

        res.status(201).json({
            success: true,
            message: 'Item added to cart',
            item: result.rows[0],
        });
    } catch (error) {
        console.error('Add to Cart Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add to cart',
            error: error.message,
        });
    }
};

// =============================================================================
// UPDATE CART ITEM
// =============================================================================
export const updateCartItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { itemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1',
            });
        }

        // Get cart item
        const cartItem = await pool.query(`
      SELECT ci.*, pv.stock 
      FROM cart_items ci
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.id = $1 AND ci.user_id = $2
    `, [itemId, userId]);

        if (cartItem.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found',
            });
        }

        // Check stock
        if (cartItem.rows[0].stock && cartItem.rows[0].stock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Not enough stock available',
                availableStock: cartItem.rows[0].stock,
            });
        }

        // Update quantity
        const result = await pool.query(`
      UPDATE cart_items 
      SET quantity = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `, [quantity, itemId, userId]);

        res.json({
            success: true,
            message: 'Cart updated',
            item: result.rows[0],
        });
    } catch (error) {
        console.error('Update Cart Item Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update cart',
            error: error.message,
        });
    }
};

// =============================================================================
// REMOVE FROM CART
// =============================================================================
export const removeFromCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { itemId } = req.params;

        const result = await pool.query(`
      DELETE FROM cart_items 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [itemId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cart item not found',
            });
        }

        res.json({
            success: true,
            message: 'Item removed from cart',
        });
    } catch (error) {
        console.error('Remove from Cart Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove from cart',
            error: error.message,
        });
    }
};

// =============================================================================
// CLEAR CART
// =============================================================================
export const clearCart = async (req, res) => {
    try {
        const userId = req.user?.id;

        await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

        res.json({
            success: true,
            message: 'Cart cleared',
        });
    } catch (error) {
        console.error('Clear Cart Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear cart',
            error: error.message,
        });
    }
};

// =============================================================================
// GET CART COUNT
// =============================================================================
export const getCartCount = async (req, res) => {
    try {
        const userId = req.user?.id;

        const result = await pool.query(`
      SELECT COALESCE(SUM(quantity), 0) as total_items
      FROM cart_items 
      WHERE user_id = $1
    `, [userId]);

        res.json({
            success: true,
            count: parseInt(result.rows[0].total_items),
        });
    } catch (error) {
        console.error('Get Cart Count Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get cart count',
            error: error.message,
        });
    }
};

// =============================================================================
// APPLY COUPON
// =============================================================================
export const applyCoupon = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code is required',
            });
        }

        // Get coupon
        const couponResult = await pool.query(`
      SELECT * FROM coupons 
      WHERE code = $1 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR uses_count < max_uses)
    `, [code.toUpperCase()]);

        if (couponResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired coupon code',
            });
        }

        const coupon = couponResult.rows[0];

        // Get cart total
        const cartResult = await pool.query(`
      SELECT SUM(COALESCE(pv.price, p.price) * ci.quantity) as subtotal
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.user_id = $1
    `, [userId]);

        const subtotal = parseFloat(cartResult.rows[0].subtotal) || 0;

        // Check minimum order amount
        if (coupon.min_order_amount && subtotal < coupon.min_order_amount) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount of ₹${coupon.min_order_amount} required`,
            });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discount_type === 'percentage') {
            discount = (subtotal * coupon.discount_value) / 100;
            if (coupon.max_discount) {
                discount = Math.min(discount, coupon.max_discount);
            }
        } else {
            discount = coupon.discount_value;
        }

        res.json({
            success: true,
            message: 'Coupon applied successfully',
            coupon: {
                code: coupon.code,
                discountType: coupon.discount_type,
                discountValue: coupon.discount_value,
                discount: Math.round(discount * 100) / 100,
            },
        });
    } catch (error) {
        console.error('Apply Coupon Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to apply coupon',
            error: error.message,
        });
    }
};

// =============================================================================
// GET AVAILABLE COUPONS
// =============================================================================
export const getAvailableCoupons = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT code, description, discount_type, discount_value, min_order_amount
      FROM coupons 
      WHERE is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (max_uses IS NULL OR uses_count < max_uses)
      ORDER BY created_at DESC
    `);

        res.json({
            success: true,
            coupons: result.rows,
        });
    } catch (error) {
        console.error('Get Available Coupons Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coupons',
            error: error.message,
        });
    }
};
