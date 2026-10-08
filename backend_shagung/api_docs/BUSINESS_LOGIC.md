# Business Logic & Techniques Documentation

> Deep dive into the business logic, patterns, and techniques used in Shagung E-commerce API

---

## Table of Contents

1. [Order Processing Flow](#order-processing-flow)
2. [Inventory Management](#inventory-management)
3. [Pricing & Discount Logic](#pricing--discount-logic)
4. [Caching Strategies](#caching-strategies)
5. [Image Upload Pipeline](#image-upload-pipeline)
6. [Search Implementation](#search-implementation)
7. [Email System](#email-system)
8. [Payment Integration](#payment-integration)
9. [Admin Operations](#admin-operations)
10. [Performance Optimization](#performance-optimization)

---

## Order Processing Flow

### Complete Order Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORDER PROCESSING FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐                                                            │
│  │  CART       │ User adds products to cart                                 │
│  │  STAGE      │ • Validate product exists & is published                   │
│  │             │ • Validate variant exists & has stock                      │
│  │             │ • Check quantity ≤ available stock                         │
│  └──────┬──────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────┐                                                            │
│  │  CHECKOUT   │ User initiates checkout                                    │
│  │  STAGE      │ • Validate address exists                                  │
│  │             │ • Re-validate all cart items                               │
│  │             │ • Calculate subtotal, tax, shipping                        │
│  │             │ • Apply coupon if provided                                 │
│  └──────┬──────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────┐                                                            │
│  │  PAYMENT    │ Process payment                                            │
│  │  STAGE      │ • COD: Create order immediately                            │
│  │             │ • Online: Create payment intent → Cashfree                 │
│  │             │ • Wait for payment confirmation                            │
│  └──────┬──────┘                                                            │
│         │                                                                    │
│    ┌────┴────────────────┐                                                  │
│    │                     │                                                  │
│    ▼                     ▼                                                  │
│  ┌─────────┐        ┌─────────┐                                             │
│  │ SUCCESS │        │ FAILURE │                                             │
│  └────┬────┘        └────┬────┘                                             │
│       │                  │                                                  │
│       ▼                  ▼                                                  │
│  ┌─────────────┐   ┌─────────────┐                                          │
│  │ CREATE      │   │ RELEASE     │                                          │
│  │ ORDER       │   │ STOCK       │                                          │
│  │ • Generate  │   │ • Restore   │                                          │
│  │   order #   │   │   reserved  │                                          │
│  │ • Deduct    │   │   quantities│                                          │
│  │   stock     │   └─────────────┘                                          │
│  │ • Clear cart│                                                            │
│  │ • Send email│                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                    │
│         ▼                                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ORDER STATUS LIFECYCLE                            │   │
│  │                                                                      │   │
│  │  pending → confirmed → processing → shipped → delivered              │   │
│  │     │           │                      │                             │   │
│  │     └───────────┴──────────────────────┼────► cancelled              │   │
│  │                                        │                             │   │
│  │                                        ▼                             │   │
│  │                                  order_history                       │   │
│  │                                  (status log)                        │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Order Creation Logic

```javascript
// controller/orderController.js - createOrder

export const createOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');  // Start transaction
    
    const userId = req.user.id;
    const { addressId, paymentMethod, couponCode } = req.body;

    // 1. Get cart items with product/variant details
    const cartResult = await client.query(`
      SELECT ci.*, p.name, p.price, pv.size, pv.color, pv.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      JOIN product_variants pv ON ci.variant_id = pv.id
      WHERE ci.user_id = $1
    `, [userId]);

    if (cartResult.rows.length === 0) {
      throw new Error('Cart is empty');
    }

    // 2. Validate stock for each item
    for (const item of cartResult.rows) {
      if (item.quantity > item.stock) {
        throw new Error(`Insufficient stock for ${item.name}`);
      }
    }

    // 3. Calculate totals
    let subtotal = 0;
    for (const item of cartResult.rows) {
      subtotal += parseFloat(item.price) * item.quantity;
    }

    // 4. Apply coupon if provided
    let discount = 0;
    if (couponCode) {
      const coupon = await validateCoupon(couponCode, subtotal, client);
      if (coupon) {
        discount = calculateDiscount(coupon, subtotal);
      }
    }

    // 5. Calculate final total
    const shippingCost = subtotal >= 999 ? 0 : 99;  // Free shipping over ₹999
    const total = subtotal - discount + shippingCost;

    // 6. Get address details
    const addressResult = await client.query(
      'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
      [addressId, userId]
    );

    // 7. Generate order number
    const orderNumber = generateOrderNumber();  // ORD-YYYYMMDD-XXX

    // 8. Create order
    const orderResult = await client.query(`
      INSERT INTO orders (
        user_id, order_number, status, subtotal, discount,
        shipping_cost, total, coupon_code, payment_method,
        shipping_name, shipping_phone, shipping_address,
        shipping_city, shipping_state, shipping_postal_code
      ) VALUES ($1, $2, 'pending', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [userId, orderNumber, subtotal, discount, shippingCost, total,
        couponCode, paymentMethod, /* address fields... */]);

    const order = orderResult.rows[0];

    // 9. Create order items
    for (const item of cartResult.rows) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, variant_id,
          product_name, variant_info, price, quantity, total)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [order.id, item.product_id, item.variant_id,
          item.name, `${item.size} / ${item.color}`,
          item.price, item.quantity,
          parseFloat(item.price) * item.quantity]);
      
      // 10. Deduct stock
      await client.query(`
        UPDATE product_variants
        SET stock = stock - $1
        WHERE id = $2
      `, [item.quantity, item.variant_id]);
    }

    // 11. Clear cart
    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

    // 12. Create initial order history
    await client.query(`
      INSERT INTO order_history (order_id, status, notes)
      VALUES ($1, 'pending', 'Order placed')
    `, [order.id]);

    await client.query('COMMIT');

    // 13. Send order confirmation email (async)
    sendOrderConfirmationEmail(order);

    res.status(201).json({
      success: true,
      data: order
    });

  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};
```

### Order Number Generation

```javascript
function generateOrderNumber() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${dateStr}-${random}`;
  // Example: ORD-20241226-042
}
```

---

## Inventory Management

### Stock Operations

```
┌─────────────────────────────────────────────────────────────────────┐
│                     STOCK MANAGEMENT                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  STOCK INCREASE                    STOCK DECREASE                   │
│  ──────────────                    ──────────────                   │
│  • Admin adds stock                • Order placed                   │
│  • Order cancelled                 • (Reserved during checkout)     │
│  • Return processed                                                 │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   STOCK CHECK LOGIC                          │   │
│  │                                                              │   │
│  │  1. Add to Cart:                                             │   │
│  │     IF requested_qty <= variant.stock → Allow                │   │
│  │     ELSE → Return "Insufficient stock"                       │   │
│  │                                                              │   │
│  │  2. Checkout:                                                │   │
│  │     Re-validate all items (stock might have changed)         │   │
│  │                                                              │   │
│  │  3. Order Creation (Transaction):                            │   │
│  │     UPDATE product_variants                                  │   │
│  │     SET stock = stock - ordered_qty                          │   │
│  │     WHERE id = variant_id                                    │   │
│  │                                                              │   │
│  │  4. Order Cancellation:                                      │   │
│  │     UPDATE product_variants                                  │   │
│  │     SET stock = stock + cancelled_qty                        │   │
│  │     WHERE id = variant_id                                    │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  LOW STOCK ALERTS                                                   │
│  ────────────────                                                   │
│  • Variant has low_stock_threshold field                           │
│  • Admin dashboard shows products with stock < threshold            │
│  • Can be extended to send email alerts                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Variant Selection

```javascript
// Frontend sends variant_id when adding to cart
// Backend validates:

async function validateVariant(productId, variantId, quantity) {
  const result = await pool.query(`
    SELECT pv.*, p.name, p.is_published
    FROM product_variants pv
    JOIN products p ON pv.product_id = p.id
    WHERE pv.id = $1 AND pv.product_id = $2
  `, [variantId, productId]);

  const variant = result.rows[0];

  // Validation checks
  if (!variant) throw new Error('Variant not found');
  if (!variant.is_published) throw new Error('Product not available');
  if (!variant.is_available) throw new Error('Variant not available');
  if (variant.stock < quantity) throw new Error('Insufficient stock');

  return variant;
}
```

---

## Pricing & Discount Logic

### Price Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRICE DETERMINATION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Check if product is on ACTIVE SALE                          │
│     │                                                            │
│     ├─► YES: Calculate sale price                               │
│     │        sale_price = original_price × (1 - discount/100)  │
│     │        OR                                                 │
│     │        sale_price = original_price - fixed_discount      │
│     │                                                            │
│     └─► NO: Continue to variant price                           │
│                                                                  │
│  2. Check VARIANT has custom price                               │
│     │                                                            │
│     ├─► YES: Use variant.price                                  │
│     │                                                            │
│     └─► NO: Use product.price                                   │
│                                                                  │
│  3. Display pricing                                              │
│                                                                  │
│     ┌────────────────────────────────────────────────────┐     │
│     │  Original: ₹3,999  (compare_at_price or original)  │     │
│     │  Sale:     ₹2,999  (calculated or variant price)   │     │
│     │  Savings:  ₹1,000 (25% off)                        │     │
│     └────────────────────────────────────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Sale Price Calculation

```javascript
// Calculate sale discount for a product

async function getProductWithSalePrice(product) {
  const now = new Date();

  // Check for active sale
  const saleResult = await pool.query(`
    SELECT s.*, ps.custom_discount
    FROM sales s
    JOIN product_sales ps ON s.id = ps.sale_id
    WHERE ps.product_id = $1
      AND s.is_active = true
      AND s.starts_at <= $2
      AND s.ends_at >= $2
    ORDER BY s.priority DESC
    LIMIT 1
  `, [product.id, now]);

  if (saleResult.rows.length > 0) {
    const sale = saleResult.rows[0];
    const discount = sale.custom_discount || sale.discount_value;

    let salePrice;
    if (sale.discount_type === 'percentage') {
      salePrice = product.price * (1 - discount / 100);
    } else {
      salePrice = product.price - discount;
    }

    return {
      ...product,
      original_price: product.price,
      sale_price: Math.max(0, salePrice),
      discount_percent: sale.discount_type === 'percentage' 
        ? discount 
        : Math.round((discount / product.price) * 100),
      on_sale: true,
      sale_name: sale.name,
      sale_ends_at: sale.ends_at
    };
  }

  return { ...product, on_sale: false };
}
```

### Coupon Validation & Application

```javascript
async function validateAndApplyCoupon(code, subtotal, userId) {
  const couponResult = await pool.query(`
    SELECT * FROM coupons
    WHERE code = $1
      AND is_active = true
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (expires_at IS NULL OR expires_at >= NOW())
      AND (max_uses IS NULL OR used_count < max_uses)
  `, [code.toUpperCase()]);

  if (couponResult.rows.length === 0) {
    return { valid: false, message: 'Invalid or expired coupon' };
  }

  const coupon = couponResult.rows[0];

  // Check minimum order amount
  if (subtotal < coupon.min_order_amount) {
    return {
      valid: false,
      message: `Minimum order ₹${coupon.min_order_amount} required`
    };
  }

  // Calculate discount
  let discount;
  if (coupon.discount_type === 'percentage') {
    discount = subtotal * (coupon.discount_value / 100);
    if (coupon.max_discount && discount > coupon.max_discount) {
      discount = coupon.max_discount;
    }
  } else {
    discount = coupon.discount_value;
  }

  return {
    valid: true,
    discount: discount,
    coupon: coupon
  };
}
```

---

## Caching Strategies

### Cache Layer Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CACHING ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  REQUEST FLOW WITH CACHING:                                                  │
│                                                                              │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────┐    │
│  │  Client  │───►│    Cache     │───►│  Controller  │───►│  Database  │    │
│  │          │◄───│  Middleware  │◄───│              │◄───│            │    │
│  └──────────┘    └──────────────┘    └──────────────┘    └────────────┘    │
│                        │                                                     │
│                        │                                                     │
│            ┌───────────┴───────────┐                                        │
│            │                       │                                        │
│       Cache HIT               Cache MISS                                    │
│            │                       │                                        │
│            ▼                       ▼                                        │
│     Return cached            Execute handler                                │
│     response                       │                                        │
│     (skip handler)                 ▼                                        │
│                              Store in cache                                 │
│                              (with TTL)                                     │
│                                    │                                        │
│                                    ▼                                        │
│                              Return fresh                                   │
│                              response                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Cache Middleware Implementation

```javascript
// middleware/cache.js

const cache = new Map();  // In-memory cache

export function cacheMiddleware(ttlSeconds) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    // Generate cache key from URL + query params
    const key = `cache:${req.originalUrl}`;

    // Check cache
    const cached = cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return res.json(cached.data);
    }

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json to cache response
    res.json = (data) => {
      // Only cache successful responses
      if (data.success !== false) {
        cache.set(key, {
          data: data,
          expiry: Date.now() + (ttlSeconds * 1000)
        });
      }
      return originalJson(data);
    };

    next();
  };
}
```

### Cache Key Patterns

```javascript
// Cache key naming convention

const cacheKeys = {
  // Product caches
  productList: 'products:page:1:limit:20:cat:0:sort:newest',
  productDetail: 'product:182',
  productFeatured: 'products:featured:8',
  
  // Category caches
  categoryList: 'categories:all',
  categoryMain: 'categories:main',
  categoryTree: 'categories:tree',
  
  // Sale caches
  saleActive: 'sales:active',
  saleProducts: 'sales:products:page:1',
  
  // Other caches
  heroSlides: 'hero:slides',
  heroSettings: 'hero:settings',
  searchResults: 'search:q:saree:cat:1:page:1',
};
```

### Cache Invalidation

```javascript
// utils/cachePublisher.js

export async function invalidateProductCaches(productId, categoryId) {
  // Clear specific product
  await cacheDel(`product:${productId}`);
  
  // Clear product lists
  await cacheDel('products:*');
  
  // Clear featured products
  await cacheDel('products:featured:*');
  
  // Clear category products
  if (categoryId) {
    await cacheDel(`categories:sub:${categoryId}*`);
  }
  
  // Clear search results
  await cacheDel('search:*');
  
  console.log(`🗑️ Invalidated caches for product ${productId}`);
}

// Called when:
// - Product created/updated/deleted
// - Variant stock changes
// - Sale status changes
// - Category changes
```

---

## Image Upload Pipeline

### Cloudinary Upload Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      IMAGE UPLOAD PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CLIENT UPLOAD                                                           │
│     ─────────────                                                           │
│     • User selects files                                                    │
│     • FormData with 'images' field                                          │
│     • Max 10 files, 10MB each                                               │
│                                                                              │
│         ▼                                                                   │
│                                                                              │
│  2. MULTER MIDDLEWARE                                                       │
│     ─────────────────                                                       │
│     • Parse multipart/form-data                                             │
│     • Store in memory buffer                                                │
│     • Validate file types (image/*)                                         │
│     • Apply size limits                                                     │
│                                                                              │
│         ▼                                                                   │
│                                                                              │
│  3. CLOUDINARY UPLOAD                                                       │
│     ─────────────────                                                       │
│     • Convert buffer to base64                                              │
│     • Upload to Cloudinary                                                  │
│     • Apply transformations                                                 │
│     • Get secure URL                                                        │
│                                                                              │
│         ▼                                                                   │
│                                                                              │
│  4. DATABASE STORAGE                                                        │
│     ────────────────                                                        │
│     • Store image_url in product_images                                     │
│     • Set is_primary flag                                                   │
│     • Store position for ordering                                           │
│     • Associate color if provided                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Upload Implementation

```javascript
// controller/productController.js - createProductImage

import { v2 as cloudinary } from 'cloudinary';

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload helper
async function uploadToCloudinary(buffer, mimetype, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
          { width: 1200, height: 1200, crop: 'limit' }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    // Convert buffer to readable stream
    const Readable = require('stream').Readable;
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    stream.pipe(uploadStream);
  });
}

// Controller function
export const createProductImage = async (req, res) => {
  const { product_id, color, color_code, is_primary } = req.body;

  try {
    const uploadedImages = [];

    for (const file of req.files) {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(
        file.buffer,
        file.mimetype,
        'product_images'
      );

      // Save to database
      const dbResult = await pool.query(`
        INSERT INTO product_images 
        (product_id, image_url, is_primary, position, color, color_code)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        product_id,
        result.secure_url,
        is_primary === 'true',
        uploadedImages.length,
        color || null,
        color_code || null
      ]);

      uploadedImages.push(dbResult.rows[0]);
    }

    // Invalidate product cache
    await invalidateProductCaches(product_id);

    res.status(201).json({
      success: true,
      data: uploadedImages
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Image upload failed'
    });
  }
};
```

---

## Search Implementation

### Search Algorithm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SEARCH ALGORITHM                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUT: "silk saree red"                                                    │
│                                                                              │
│  1. TOKENIZATION                                                            │
│     ─────────────                                                           │
│     Split query: ["silk", "saree", "red"]                                   │
│                                                                              │
│  2. SEARCH FIELDS (weighted)                                                │
│     ───────────────────────                                                 │
│     • name         (weight: 4)                                              │
│     • description  (weight: 2)                                              │
│     • brand        (weight: 2)                                              │
│     • material     (weight: 2)                                              │
│     • tags         (weight: 1)                                              │
│                                                                              │
│  3. QUERY BUILDING                                                          │
│     ──────────────                                                          │
│     For each token, search all fields using ILIKE                           │
│     Combine with AND (all terms must match somewhere)                       │
│                                                                              │
│  4. RELEVANCE SCORING                                                       │
│     ─────────────────                                                       │
│     Score based on:                                                         │
│     • Number of field matches                                               │
│     • Field weight                                                          │
│     • Position of match (beginning = higher)                                │
│     • Exact match bonus                                                     │
│                                                                              │
│  5. FILTERING                                                               │
│     ─────────                                                               │
│     Apply optional filters:                                                 │
│     • Category                                                              │
│     • Price range                                                           │
│     • Availability                                                          │
│                                                                              │
│  6. SORTING                                                                 │
│     ───────                                                                 │
│     • relevance (default)                                                   │
│     • price_asc                                                             │
│     • price_desc                                                            │
│     • newest                                                                │
│     • rating                                                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Search Query Implementation

```javascript
// controller/searchController.js

export const searchProducts = async (req, res) => {
  const { q, category, minPrice, maxPrice, limit = 20, page = 1 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters'
    });
  }

  const searchTerm = q.trim().toLowerCase();
  const offset = (page - 1) * limit;

  try {
    // Build search query with relevance scoring
    let query = `
      SELECT 
        p.*,
        (SELECT image_url FROM product_images WHERE product_id = p.id 
         ORDER BY is_primary DESC LIMIT 1) as image,
        c.name as category_name,
        -- Relevance scoring
        (
          CASE WHEN LOWER(p.name) LIKE $1 THEN 100 ELSE 0 END +
          CASE WHEN LOWER(p.name) LIKE $2 THEN 50 ELSE 0 END +
          CASE WHEN LOWER(p.description) LIKE $2 THEN 20 ELSE 0 END +
          CASE WHEN LOWER(p.brand) LIKE $2 THEN 30 ELSE 0 END +
          CASE WHEN LOWER(p.material) LIKE $2 THEN 25 ELSE 0 END
        ) as relevance_score
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_published = true
        AND (
          LOWER(p.name) LIKE $2 OR
          LOWER(p.description) LIKE $2 OR
          LOWER(p.brand) LIKE $2 OR
          LOWER(p.material) LIKE $2
        )
    `;

    const params = [
      searchTerm,           // $1 - exact match
      `%${searchTerm}%`,    // $2 - contains match
    ];

    let paramIndex = 3;

    // Add category filter
    if (category) {
      query += ` AND p.category_id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Add price filters
    if (minPrice) {
      query += ` AND p.price >= $${paramIndex}`;
      params.push(minPrice);
      paramIndex++;
    }
    if (maxPrice) {
      query += ` AND p.price <= $${paramIndex}`;
      params.push(maxPrice);
      paramIndex++;
    }

    // Order by relevance
    query += ` ORDER BY relevance_score DESC, p.created_at DESC`;

    // Pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.rowCount
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
};
```

### Search Suggestions

```javascript
// Get autocomplete suggestions
export const searchSuggestions = async (req, res) => {
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.json({ success: true, data: [] });
  }

  const result = await pool.query(`
    SELECT DISTINCT name
    FROM products
    WHERE is_published = true
      AND LOWER(name) LIKE $1
    ORDER BY name
    LIMIT 10
  `, [`%${q.toLowerCase()}%`]);

  res.json({
    success: true,
    data: result.rows.map(r => r.name)
  });
};
```

---

## Email System

### Email Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EMAIL SYSTEM                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRIGGER EVENTS:                                                            │
│  ───────────────                                                            │
│  • User registration     → Verification email                               │
│  • Password reset        → OTP email                                        │
│  • Order placed          → Order confirmation                               │
│  • Order shipped         → Shipping notification                            │
│  • Order delivered       → Delivery confirmation                            │
│                                                                              │
│  EMAIL FLOW:                                                                 │
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Trigger    │───►│   Generate   │───►│   Send via   │                  │
│  │   Event      │    │   Template   │    │   Nodemailer │                  │
│  └──────────────┘    └──────────────┘    └──────────────┘                  │
│                             │                    │                          │
│                             ▼                    ▼                          │
│                      HTML Template          Gmail SMTP                      │
│                      with Variables          Service                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Email Implementation

```javascript
// utils/emailService.js

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,  // App password
  },
});

export async function sendVerificationEmail(email, token, userId) {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}&user_id=${userId}`;

  const mailOptions = {
    from: `"Shagun Gallery" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - Shagun Gallery',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f43f5e;">Welcome to Shagun Gallery!</h1>
        <p>Thank you for registering. Please verify your email by clicking the button below:</p>
        <a href="${verifyUrl}" style="
          display: inline-block;
          background: linear-gradient(135deg, #f43f5e, #ec4899);
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 8px;
          margin: 20px 0;
        ">Verify Email</a>
        <p>This link expires in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">
          If you didn't create an account, please ignore this email.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendOrderConfirmationEmail(order, items) {
  const itemsHtml = items.map(item => `
    <tr>
      <td>${item.product_name}</td>
      <td>${item.variant_info}</td>
      <td>${item.quantity}</td>
      <td>₹${item.price}</td>
    </tr>
  `).join('');

  const mailOptions = {
    from: `"Shagun Gallery" <${process.env.EMAIL_USER}>`,
    to: order.email,
    subject: `Order Confirmed - ${order.order_number}`,
    html: `
      <h1>Order Confirmed! 🎉</h1>
      <p>Order Number: <strong>${order.order_number}</strong></p>
      <table border="1" cellpadding="10">
        <tr><th>Product</th><th>Variant</th><th>Qty</th><th>Price</th></tr>
        ${itemsHtml}
      </table>
      <p><strong>Total: ₹${order.total}</strong></p>
    `,
  };

  await transporter.sendMail(mailOptions);
}
```

---

## Payment Integration

### Cashfree Payment Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PAYMENT FLOW (Cashfree)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 1: CREATE ORDER SESSION                                               │
│  ────────────────────────────                                               │
│  Frontend → POST /api/payments/create-intent                                │
│           ← { payment_session_id, order_id }                                │
│                                                                              │
│  STEP 2: REDIRECT TO PAYMENT                                                │
│  ───────────────────────────                                                │
│  Frontend redirects to Cashfree checkout                                    │
│  User completes payment (UPI/Card/NetBanking)                               │
│                                                                              │
│  STEP 3: WEBHOOK NOTIFICATION                                               │
│  ───────────────────────────                                                │
│  Cashfree → POST /api/payments/webhook                                      │
│           { order_id, payment_status, signature }                           │
│                                                                              │
│  STEP 4: VERIFY & UPDATE                                                    │
│  ─────────────────────                                                      │
│  • Verify webhook signature                                                 │
│  • Update order payment_status                                              │
│  • Update order status to 'confirmed'                                       │
│  • Send confirmation email                                                  │
│                                                                              │
│  STEP 5: FRONTEND REDIRECT                                                  │
│  ────────────────────────                                                   │
│  User returns to success/failure page                                       │
│  Frontend calls /api/payments/verify for final status                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Performance Optimization

### Query Optimization Techniques

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE OPTIMIZATIONS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. DATABASE INDEXES                                                        │
│     ─────────────────                                                       │
│     • All foreign keys indexed                                              │
│     • Frequent filter columns indexed                                       │
│     • Composite indexes for common queries                                  │
│                                                                              │
│  2. QUERY OPTIMIZATION                                                       │
│     ──────────────────                                                      │
│     • Use LIMIT for pagination                                              │
│     • Select only needed columns                                            │
│     • Use subqueries for aggregations                                       │
│     • Avoid N+1 queries (use JOINs)                                         │
│                                                                              │
│  3. CACHING                                                                 │
│     ───────                                                                 │
│     • Product lists: 1 hour                                                 │
│     • Categories: 1 hour                                                    │
│     • Single product: 1 hour                                                │
│     • Search results: 15 minutes                                            │
│                                                                              │
│  4. RESPONSE COMPRESSION                                                    │
│     ────────────────────                                                    │
│     • Gzip compression enabled                                              │
│     • JSON minification                                                     │
│                                                                              │
│  5. IMAGE OPTIMIZATION                                                      │
│     ──────────────────                                                      │
│     • Cloudinary auto-format (WebP)                                         │
│     • Responsive image sizes                                                │
│     • Lazy loading on frontend                                              │
│                                                                              │
│  6. CONNECTION POOLING                                                      │
│     ────────────────────                                                    │
│     • PostgreSQL connection pool                                            │
│     • Max connections: 20                                                   │
│     • Idle timeout: 30s                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Example Optimized Query

```javascript
// BEFORE (N+1 problem)
const products = await pool.query('SELECT * FROM products LIMIT 20');
for (const product of products.rows) {
  const images = await pool.query(  // ❌ 20 extra queries!
    'SELECT * FROM product_images WHERE product_id = $1',
    [product.id]
  );
}

// AFTER (Single query with subquery)
const products = await pool.query(`
  SELECT 
    p.*,
    (SELECT image_url FROM product_images 
     WHERE product_id = p.id 
     ORDER BY is_primary DESC, id ASC 
     LIMIT 1) as image,
    (SELECT json_agg(image_url ORDER BY is_primary DESC) 
     FROM product_images 
     WHERE product_id = p.id) as images
  FROM products p
  WHERE p.is_published = true
  LIMIT 20
`);  // ✅ Single query!
```

---

This documentation covers the core business logic and techniques used throughout the application. For specific endpoint details, see [ENDPOINTS.md](./ENDPOINTS.md).
