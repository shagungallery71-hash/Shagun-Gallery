# API Endpoints Reference

> Complete reference for all API endpoints in Shagung E-commerce Backend

---

## Table of Contents

1. [Authentication](#authentication)
2. [Products](#products)
3. [Categories](#categories)
4. [Cart](#cart)
5. [Wishlist](#wishlist)
6. [Orders](#orders)
7. [Addresses](#addresses)
8. [Search](#search)
9. [Sales & Promotions](#sales--promotions)
10. [Hero Section](#hero-section)
11. [Blogs](#blogs)
12. [Careers](#careers)
13. [Newsletter](#newsletter)
14. [Coupons](#coupons)
15. [Payments](#payments)
16. [Admin Dashboard](#admin-dashboard)
17. [Delivery](#delivery)

---

## Base URL

```
Development: http://localhost:5000
Production:  https://your-domain.com
```

## Common Headers

```
Content-Type: application/json
Authorization: Bearer <jwt_token>  (for protected routes)
```

## Response Format

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error
{
  "success": false,
  "message": "Error description"
}

// Paginated
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Authentication

### Register User

```http
POST /api/auth/register
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `username` | string | Yes | User's display name (min 2 chars) |
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Password (min 6 chars) |

**Request:**
```json
{
  "username": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Check email to verify."
}
```

---

### Login

```http
POST /api/auth/login
```

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "is_verified": true
  }
}
```

---

### Verify Email

```http
GET /api/auth/verify?token=xxx&user_id=1
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | string | Verification token from email |
| `user_id` | integer | User ID |

---

### Forget Password

```http
POST /api/auth/forget-password
```

**Request:**
```json
{
  "email": "john@example.com"
}
```

---

### Verify OTP

```http
POST /api/auth/verify-otp
```

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

---

### Reset Password

```http
POST /api/auth/reset-password
```

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "newPassword": "newpassword123"
}
```

---

## Products

### Get All Products

```http
GET /api/products
```

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page |
| `category` | integer | - | Filter by category ID |
| `subcategory` | integer | - | Filter by subcategory |
| `minPrice` | number | - | Minimum price |
| `maxPrice` | number | - | Maximum price |
| `sort` | string | - | Sort: `price_asc`, `price_desc`, `newest` |
| `featured` | boolean | - | Featured products only |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Silk Saree",
      "slug": "silk-saree",
      "price": "2999.00",
      "compare_at_price": "3999.00",
      "discount_percent": 25,
      "image": "https://...",
      "images": ["https://..."],
      "category_id": 1,
      "category_name": "Sarees",
      "is_featured": true,
      "rating": "4.5",
      "review_count": 12
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

### Get Product Detail

```http
GET /api/products/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Silk Saree",
    "slug": "silk-saree",
    "description": "Beautiful handwoven silk saree...",
    "price": "2999.00",
    "compare_at_price": "3999.00",
    "discount_percent": 25,
    "category_id": 1,
    "category_name": "Sarees",
    "brand": "Shagun Gallery",
    "material": "Silk",
    "is_featured": true,
    "is_published": true,
    "images": [
      {
        "id": 1,
        "image_url": "https://...",
        "is_primary": true,
        "color": "Red",
        "color_code": "#FF0000"
      }
    ],
    "variants": [
      {
        "id": 1,
        "size": "Free Size",
        "color": "Red",
        "color_code": "#FF0000",
        "sku": "SILK-001-RED",
        "price": "2999.00",
        "stock": 50,
        "is_available": true
      }
    ],
    "reviews": {
      "average_rating": "4.5",
      "total_reviews": 12,
      "recent": [...]
    }
  }
}
```

---

### Get Featured Products

```http
GET /api/products/featured?limit=8
```

---

### Get Products by Category

```http
GET /api/products/category/:categoryId
```

---

### Get Related Products

```http
GET /api/products/:id/related
```

---

### Get Product Reviews

```http
GET /api/products/:id/reviews?page=1&limit=5
```

---

### Create Product Review (Auth Required)

```http
POST /api/products/:id/review
Authorization: Bearer <token>
```

**Request:**
```json
{
  "rating": 5,
  "comment": "Excellent quality!"
}
```

---

### Admin: Create Product

```http
POST /api/products
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "name": "New Saree",
  "slug": "new-saree",
  "description": "Beautiful saree description",
  "price": 2999,
  "compare_at_price": 3999,
  "category_id": 1,
  "brand": "Shagun Gallery",
  "material": "Silk",
  "is_featured": true,
  "is_published": true
}
```

---

### Admin: Update Product

```http
PUT /api/products/:id
Authorization: Bearer <admin_token>
```

---

### Admin: Delete Product

```http
DELETE /api/products/:id
Authorization: Bearer <admin_token>
```

---

### Admin: Upload Product Images

```http
POST /api/products/image
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

| Field | Type | Description |
|-------|------|-------------|
| `images` | file[] | Image files (max 10) |
| `product_id` | integer | Product ID |
| `color` | string | Color name (optional) |
| `color_code` | string | Hex color code (optional) |
| `is_primary` | boolean | Set as primary image |

---

### Admin: Manage Related Products

#### Get Admin Related Products (Detailed)
```http
GET /api/products/:id/related/admin
Authorization: Bearer <admin_token>
```

#### Add Related Product (Single)
```http
POST /api/products/:id/related
Authorization: Bearer <admin_token>
```
**Request:**
```json
{
  "related_product_id": 123,
  "sort_order": 0
}
```

#### Add Multiple Related Products (Bulk)
```http
POST /api/products/:id/related/bulk
Authorization: Bearer <admin_token>
```
**Request:**
```json
{
  "related_product_ids": [101, 102, 103]
}
```

#### Update Related Products Order
```http
PUT /api/products/:id/related/order
Authorization: Bearer <admin_token>
```
**Request:**
```json
{
  "related_products": [
    { "id": 101, "sort_order": 1 },
    { "id": 102, "sort_order": 2 }
  ]
}
```

#### Remove Related Product
```http
DELETE /api/products/:id/related/:relatedProductId
Authorization: Bearer <admin_token>
```

#### Clear All Related Products
```http
DELETE /api/products/:id/related
Authorization: Bearer <admin_token>
```

---

## Categories

### Get All Categories

```http
GET /api/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sarees",
      "slug": "sarees",
      "image_url": "https://...",
      "subcategories": [
        {
          "id": 2,
          "name": "Silk Sarees",
          "slug": "silk-sarees"
        }
      ]
    }
  ]
}
```

---

### Get Main Categories

```http
GET /api/categories/main
```

---

### Get Subcategories

```http
GET /api/categories/sub/:parentId
```

---

### Admin: Create Category

```http
POST /api/categories
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "is_featured": false,
  "is_active": true
}
```

---

### Admin: Create Subcategory

```http
POST /api/categories/sub
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "name": "Subcategory",
  "slug": "subcategory",
  "parent_id": 1
}
```

---

## Cart

> All cart endpoints require authentication

### Get Cart

```http
GET /api/cart
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "variant_id": 1,
        "quantity": 2,
        "product_name": "Silk Saree",
        "price": "2999.00",
        "size": "Free Size",
        "color": "Red",
        "image": "https://..."
      }
    ],
    "subtotal": "5998.00",
    "discount": "0.00",
    "total": "5998.00"
  }
}
```

---

### Add to Cart

```http
POST /api/cart
Authorization: Bearer <token>
```

**Request:**
```json
{
  "productId": 1,
  "variantId": 1,
  "quantity": 1
}
```

---

### Update Cart Item

```http
PUT /api/cart/:itemId
Authorization: Bearer <token>
```

**Request:**
```json
{
  "quantity": 2
}
```

---

### Remove from Cart

```http
DELETE /api/cart/:itemId
Authorization: Bearer <token>
```

---

### Clear Cart

```http
DELETE /api/cart
Authorization: Bearer <token>
```

---

### Apply Coupon

```http
POST /api/cart/coupon
Authorization: Bearer <token>
```

**Request:**
```json
{
  "code": "WELCOME20"
}
```

---

## Wishlist

> All wishlist endpoints require authentication

### Get Wishlist

```http
GET /api/wishlist
Authorization: Bearer <token>
```

---

### Add to Wishlist

```http
POST /api/wishlist
Authorization: Bearer <token>
```

**Request:**
```json
{
  "productId": 1
}
```

---

### Toggle Wishlist

```http
POST /api/wishlist/toggle
Authorization: Bearer <token>
```

**Request:**
```json
{
  "productId": 1
}
```

---

### Remove from Wishlist

```http
DELETE /api/wishlist/:productId
Authorization: Bearer <token>
```

---

### Move to Cart

```http
POST /api/wishlist/move-to-cart
Authorization: Bearer <token>
```

**Request:**
```json
{
  "productId": 1,
  "variantId": 1
}
```

---

## Orders

### Create Order (Auth Required)

```http
POST /api/orders
Authorization: Bearer <token>
```

**Request:**
```json
{
  "addressId": 1,
  "paymentMethod": "online",
  "couponCode": "WELCOME20"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order_id": 1,
    "order_number": "ORD-20241226-001",
    "total": "5998.00",
    "status": "pending",
    "payment_url": "https://..."
  }
}
```

---

### Get My Orders (Auth Required)

```http
GET /api/orders?page=1&limit=10
Authorization: Bearer <token>
```

---

### Get Order Detail (Auth Required)

```http
GET /api/orders/:orderId
Authorization: Bearer <token>
```

---

### Cancel Order (Auth Required)

```http
POST /api/orders/:orderId/cancel
Authorization: Bearer <token>
```

**Request:**
```json
{
  "reason": "Changed my mind"
}
```

---

### Track Order (Public)

```http
GET /api/orders/track/:orderNumber?email=john@example.com
```

---

### Admin: Get All Orders

```http
GET /api/orders/admin/all?page=1&status=pending
Authorization: Bearer <admin_token>
```

---

### Admin: Update Order Status

```http
PATCH /api/orders/admin/:orderId/status
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "status": "shipped",
  "tracking_number": "TRK123456789",
  "tracking_url": "https://..."
}
```

---

## Addresses

> All address endpoints require authentication

### Get Addresses

```http
GET /api/addresses
Authorization: Bearer <token>
```

---

### Add Address

```http
POST /api/addresses
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "address_line1": "123 Main Street",
  "address_line2": "Apt 4B",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "country": "India",
  "is_default": true,
  "address_type": "home"
}
```

---

### Update Address

```http
PUT /api/addresses/:addressId
Authorization: Bearer <token>
```

---

### Delete Address

```http
DELETE /api/addresses/:addressId
Authorization: Bearer <token>
```

---

### Set Default Address

```http
PATCH /api/addresses/:addressId/default
Authorization: Bearer <token>
```

---

## Search

### Search Products

```http
GET /api/search?q=saree&category=1&minPrice=1000&maxPrice=5000&limit=20&page=1
```

| Query Param | Type | Description |
|-------------|------|-------------|
| `q` | string | Search query (required) |
| `category` | integer | Filter by category |
| `minPrice` | number | Minimum price |
| `maxPrice` | number | Maximum price |
| `limit` | integer | Results per page |
| `page` | integer | Page number |

---

### Get Search Suggestions

```http
GET /api/search/suggestions?q=sar
```

---

### Get Trending Searches

```http
GET /api/search/trending
```

---

## Sales & Promotions

### Get Active Sales

```http
GET /api/sales/active
```

---

### Get Sale Products

```http
GET /api/sales/products?page=1&limit=20
```

---

### Get Sale Detail

```http
GET /api/sales/:id
```

---

### Check Product Sale Status

```http
GET /api/sales/product/:productId/status
```

---

### Admin: Create Sale

```http
POST /api/sales
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "name": "Summer Sale",
  "slug": "summer-sale",
  "description": "Big summer discounts!",
  "discount_type": "percentage",
  "discount_value": 20,
  "starts_at": "2024-06-01T00:00:00Z",
  "ends_at": "2024-08-31T23:59:59Z",
  "is_active": true
}
```

---

### Admin: Add Products to Sale

```http
POST /api/sales/products/bulk-add
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "sale_id": 1,
  "product_ids": [1, 2, 3, 4, 5]
}
```

---

## Hero Section

### Get Hero Slides

```http
GET /api/hero/slides
```

---

### Get Hero Settings

```http
GET /api/hero/settings
```

---

### Admin: Create Slide

```http
POST /api/hero/slides
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "title": "New Collection",
  "subtitle": "Spring 2024",
  "description": "Discover our latest designs",
  "image_url": "https://...",
  "button_text": "Shop Now",
  "button_link": "/products",
  "gradient": "from-rose-600 via-pink-500 to-fuchsia-500",
  "position": 1,
  "is_active": true
}
```

---

## Blogs

### Get All Blogs

```http
GET /api/blogs?page=1&limit=12&category=1&sort=recent
```

---

### Get Blog Categories

```http
GET /api/blogs/categories
```

---

### Get Featured Blogs

```http
GET /api/blogs/featured?limit=5
```

---

### Get Blog Detail

```http
GET /api/blogs/:idOrSlug
```

---

### Admin: Create Blog

```http
POST /api/blogs/admin
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Blog title |
| `slug` | string | URL slug |
| `content` | string | Blog content (HTML) |
| `excerpt` | string | Short summary |
| `category_id` | integer | Category ID |
| `is_published` | boolean | Publish status |
| `is_featured` | boolean | Featured status |
| `featured_image` | file | Featured image |

---

## Careers

### Get Active Jobs

```http
GET /api/careers/jobs
```

---

### Get Job Detail

```http
GET /api/careers/jobs/:id
```

---

### Submit Application

```http
POST /api/careers/apply
```

**Request:**
```json
{
  "job_id": 1,
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "resume_url": "https://...",
  "cover_letter": "I am excited to apply...",
  "years_of_experience": 3
}
```

---

### Admin: Create Job

```http
POST /api/careers/admin/jobs
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "title": "Senior Developer",
  "department": "Engineering",
  "location": "Remote",
  "employment_type": "Full-time",
  "salary_min": 1500000,
  "salary_max": 2500000,
  "description": "We are looking for...",
  "requirements": "5+ years experience...",
  "is_active": true
}
```

---

## Newsletter

### Subscribe

```http
POST /api/newsletter
```

**Request:**
```json
{
  "email": "subscriber@example.com"
}
```

---

### Unsubscribe

```http
DELETE /api/newsletter?email=subscriber@example.com
```

---

### Admin: Get Subscribers

```http
GET /api/newsletter/subscribers?page=1&limit=50
Authorization: Bearer <admin_token>
```

---

### Admin: Export Subscribers (CSV)

```http
GET /api/newsletter/export
Authorization: Bearer <admin_token>
```

---

## Coupons

> All coupon management endpoints require admin authentication

### Get All Coupons

```http
GET /api/coupons
Authorization: Bearer <admin_token>
```

---

### Create Coupon

```http
POST /api/coupons
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "code": "SUMMER25",
  "description": "Summer Sale 25% Off",
  "discount_type": "percentage",
  "discount_value": 25,
  "min_order_amount": 1000,
  "max_discount": 500,
  "max_uses": 100,
  "starts_at": "2024-06-01",
  "expires_at": "2024-08-31",
  "is_active": true
}
```

---

### Update Coupon

```http
PUT /api/coupons/:id
Authorization: Bearer <admin_token>
```

---

### Toggle Coupon Status

```http
PATCH /api/coupons/:id/toggle
Authorization: Bearer <admin_token>
```

---

### Delete Coupon

```http
DELETE /api/coupons/:id
Authorization: Bearer <admin_token>
```

---

## Payments

### Get Payment Status (Service Check)

```http
GET /api/payments/status
```

---

### Create Payment Intent

```http
POST /api/payments/create-intent
Authorization: Bearer <token>
```

**Request:**
```json
{
  "amount": 2999,
  "currency": "INR",
  "orderId": 1
}
```

---

### Verify Payment

```http
POST /api/payments/verify
Authorization: Bearer <token>
```

**Request:**
```json
{
  "orderId": "order_abc123"
}
```

---

### Admin: Create Refund

```http
POST /api/payments/refund
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "orderId": 1,
  "amount": 1999,
  "reason": "Customer requested refund"
}
```

---

## Admin Dashboard

### Get Dashboard Stats

```http
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "totalRevenue": "250000.00",
    "totalCustomers": 500,
    "totalProducts": 200,
    "pendingOrders": 15,
    "recentOrders": [...],
    "topProducts": [...]
  }
}
```

---

### Get All Users

```http
GET /api/admin/users
Authorization: Bearer <admin_token>
```

---

### Update User Role

```http
PATCH /api/admin/users/:id/role
Authorization: Bearer <admin_token>
```

**Request:**
```json
{
  "role": "admin"
}
```

---

### Clear Cache

```http
POST /api/admin/clear-cache
Authorization: Bearer <admin_token>
```

---

### Seed Database

```http
POST /api/admin/seed
Authorization: Bearer <admin_token>
```

---

## Delivery

### Check Pincode

```http
GET /api/delivery/check/:pincode
```

**Response:**
```json
{
  "success": true,
  "available": true,
  "pincode": "400001",
  "deliveryInfo": {
    "estimatedDays": 3,
    "estimatedDate": "Monday, Jan 1",
    "shippingCost": 0,
    "expressAvailable": true
  }
}
```

---

### Get All Serviceable Pincodes

```http
GET /api/delivery/pincodes
```

---

## Health Check

### Server Health

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-12-26T12:00:00Z",
  "uptime": 3600
}
```

---

## Error Codes Reference

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal error |
