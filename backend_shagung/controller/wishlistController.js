import pool from '../config/dbconfig.js';

// =============================================================================
// GET WISHLIST
// =============================================================================
export const getWishlist = async (req, res) => {
    try {
        const userId = req.user?.id;

        const result = await pool.query(`
      SELECT 
        w.id,
        w.product_id,
        w.created_at as added_at,
        p.name,
        p.slug,
        p.price,
        p.description,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image,
        (SELECT COUNT(*) FROM product_reviews WHERE product_id = p.id) as review_count,
        (SELECT COALESCE(AVG(rating), 0) FROM product_reviews WHERE product_id = p.id) as avg_rating,
        (SELECT MIN(pv.stock) FROM product_variants pv WHERE pv.product_id = p.id) as min_stock
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `, [userId]);

        res.json({
            success: true,
            wishlist: result.rows,
            count: result.rows.length,
        });
    } catch (error) {
        console.error('Get Wishlist Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get wishlist',
            error: error.message,
        });
    }
};

// =============================================================================
// ADD TO WISHLIST
// =============================================================================
export const addToWishlist = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required',
            });
        }

        // Check if product exists
        const productResult = await pool.query(
            'SELECT id, name FROM products WHERE id = $1',
            [productId]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Check if already in wishlist
        const existingItem = await pool.query(
            'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (existingItem.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Product already in wishlist',
            });
        }

        // Add to wishlist
        const result = await pool.query(`
      INSERT INTO wishlist (user_id, product_id)
      VALUES ($1, $2)
      RETURNING *
    `, [userId, productId]);

        res.status(201).json({
            success: true,
            message: 'Added to wishlist',
            item: result.rows[0],
        });
    } catch (error) {
        console.error('Add to Wishlist Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add to wishlist',
            error: error.message,
        });
    }
};

// =============================================================================
// REMOVE FROM WISHLIST
// =============================================================================
export const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { productId } = req.params;

        const result = await pool.query(`
      DELETE FROM wishlist 
      WHERE user_id = $1 AND product_id = $2
      RETURNING *
    `, [userId, productId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in wishlist',
            });
        }

        res.json({
            success: true,
            message: 'Removed from wishlist',
        });
    } catch (error) {
        console.error('Remove from Wishlist Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove from wishlist',
            error: error.message,
        });
    }
};

// =============================================================================
// TOGGLE WISHLIST (Add if not exists, remove if exists)
// =============================================================================
export const toggleWishlist = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required',
            });
        }

        // Check if already in wishlist
        const existingItem = await pool.query(
            'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (existingItem.rows.length > 0) {
            // Remove from wishlist
            await pool.query(
                'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2',
                [userId, productId]
            );

            return res.json({
                success: true,
                message: 'Removed from wishlist',
                isWishlisted: false,
            });
        }

        // Check if product exists
        const productResult = await pool.query(
            'SELECT id FROM products WHERE id = $1',
            [productId]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Add to wishlist
        await pool.query(
            'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)',
            [userId, productId]
        );

        res.json({
            success: true,
            message: 'Added to wishlist',
            isWishlisted: true,
        });
    } catch (error) {
        console.error('Toggle Wishlist Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle wishlist',
            error: error.message,
        });
    }
};

// =============================================================================
// CHECK IF IN WISHLIST
// =============================================================================
export const checkWishlist = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { productId } = req.params;

        const result = await pool.query(
            'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        res.json({
            success: true,
            isWishlisted: result.rows.length > 0,
        });
    } catch (error) {
        console.error('Check Wishlist Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check wishlist',
            error: error.message,
        });
    }
};

// =============================================================================
// MOVE TO CART
// =============================================================================
export const moveToCart = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user?.id;
        const { productId, variantId } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required',
            });
        }

        await client.query('BEGIN');

        // Check if in wishlist
        const wishlistItem = await client.query(
            'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        if (wishlistItem.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Item not found in wishlist',
            });
        }

        // Check if already in cart
        const cartItem = await client.query(`
      SELECT id, quantity FROM cart_items 
      WHERE user_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))
    `, [userId, productId, variantId]);

        if (cartItem.rows.length > 0) {
            // Update quantity
            await client.query(`
        UPDATE cart_items SET quantity = quantity + 1, updated_at = NOW()
        WHERE id = $1
      `, [cartItem.rows[0].id]);
        } else {
            // Add to cart
            await client.query(`
        INSERT INTO cart_items (user_id, product_id, variant_id, quantity)
        VALUES ($1, $2, $3, 1)
      `, [userId, productId, variantId]);
        }

        // Remove from wishlist
        await client.query(
            'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2',
            [userId, productId]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Item moved to cart',
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Move to Cart Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to move to cart',
            error: error.message,
        });
    } finally {
        client.release();
    }
};

// =============================================================================
// CLEAR WISHLIST
// =============================================================================
export const clearWishlist = async (req, res) => {
    try {
        const userId = req.user?.id;

        await pool.query('DELETE FROM wishlist WHERE user_id = $1', [userId]);

        res.json({
            success: true,
            message: 'Wishlist cleared',
        });
    } catch (error) {
        console.error('Clear Wishlist Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear wishlist',
            error: error.message,
        });
    }
};
