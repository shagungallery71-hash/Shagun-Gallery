# Shagung E-commerce Backend - API Documentation

> **Version:** 2.0.0  
> **Base URL:** `http://localhost:5000`  
> **Last Updated:** December 26, 2024

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Authentication System](#authentication-system)
4. [API Flow Patterns](#api-flow-patterns)
5. [Caching Strategy](#caching-strategy)
6. [Error Handling](#error-handling)
7. [Security Measures](#security-measures)
8. [Database Design](#database-design)
9. [File Structure](#file-structure)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Web App   │  │ Mobile App  │  │      Admin Panel        │  │
│  │  (React)    │  │  (Future)   │  │      (React)            │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          └────────────────┼─────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     Express.js Server                        │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │ │
│  │  │  CORS    │ │  Helmet  │ │   Rate   │ │ Compression  │   │ │
│  │  │          │ │ Security │ │ Limiting │ │              │   │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MIDDLEWARE LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    Auth     │  │    Cache    │  │      Validation         │  │
│  │ Middleware  │  │ Middleware  │  │      Middleware         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ROUTER LAYER                                 │
│  ┌────────┐ ┌─────────┐ ┌───────┐ ┌──────┐ ┌─────────────────┐ │
│  │  Auth  │ │Products │ │Orders │ │ Cart │ │ Categories ...  │ │
│  │ Routes │ │ Routes  │ │Routes │ │Routes│ │                 │ │
│  └────────┘ └─────────┘ └───────┘ └──────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONTROLLER LAYER                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Business Logic  •  Data Validation  •  Response Formatting │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                    │
│  ┌─────────────────┐     ┌─────────────────┐     ┌───────────┐  │
│  │   PostgreSQL    │     │   In-Memory     │     │ Cloudinary│  │
│  │   (Neon)        │     │     Cache       │     │ (Images)  │  │
│  └─────────────────┘     └─────────────────┘     └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Node.js 18+ | JavaScript runtime |
| **Framework** | Express.js 4.x | HTTP server framework |
| **Database** | PostgreSQL (Neon) | Primary data store |
| **Cache** | In-Memory Cache | Response caching |
| **Auth** | JWT (jsonwebtoken) | Token-based authentication |
| **Password** | bcryptjs | Password hashing |
| **Validation** | express-validator | Request validation |
| **File Upload** | Multer + Cloudinary | Image/file handling |
| **Security** | Helmet, CORS | Security headers |
| **Rate Limiting** | express-rate-limit | DDoS protection |
| **Email** | Nodemailer + Gmail | Transactional emails |

---

## Authentication System

### JWT Token Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐
│  Client │         │  Server │         │   DB    │
└────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │
     │  POST /login      │                   │
     │  {email, pass}    │                   │
     │──────────────────>│                   │
     │                   │  Verify User      │
     │                   │──────────────────>│
     │                   │  User Data        │
     │                   │<──────────────────│
     │                   │                   │
     │                   │  Verify Password  │
     │                   │  (bcrypt compare) │
     │                   │                   │
     │                   │  Generate JWT     │
     │                   │  (sign payload)   │
     │                   │                   │
     │  { token, user }  │                   │
     │<──────────────────│                   │
     │                   │                   │
     │  GET /api/orders  │                   │
     │  Auth: Bearer JWT │                   │
     │──────────────────>│                   │
     │                   │  Verify JWT       │
     │                   │  (middleware)     │
     │                   │                   │
     │                   │  Fetch Data       │
     │                   │──────────────────>│
     │                   │  Orders           │
     │                   │<──────────────────│
     │  { orders: [...] }│                   │
     │<──────────────────│                   │
```

### Token Structure

```javascript
// JWT Payload
{
  "id": 1,                    // User ID
  "email": "user@example.com",
  "role": "customer",         // customer | admin
  "iat": 1703577600,          // Issued at
  "exp": 1704182400           // Expires (7 days)
}
```

### Authentication Middleware

```javascript
// middleware/auth.js

// RequireAuth - For authenticated users
export const RequireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  // Attach user to request
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// PermissionAdmin - For admin-only routes
export const PermissionAdmin = async (req, res, next) => {
  await RequireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  });
};
```

### Password Security

```javascript
// Password Hashing (Registration)
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);

// Password Verification (Login)
const isMatch = await bcrypt.compare(password, user.password);
```

---

## API Flow Patterns

### 1. Request → Response Flow

```
Request
   │
   ├─▶ Rate Limiter (1000 req/15min per IP)
   │
   ├─▶ CORS Check (allowed origins)
   │
   ├─▶ Body Parser (JSON, URL-encoded)
   │
   ├─▶ Route Matching
   │
   ├─▶ Auth Middleware (if protected)
   │       ├─▶ Extract token from header
   │       ├─▶ Verify JWT signature
   │       └─▶ Attach user to request
   │
   ├─▶ Cache Middleware (if cacheable)
   │       ├─▶ Check cache for key
   │       └─▶ Return cached if found
   │
   ├─▶ Validation Middleware (if defined)
   │       ├─▶ Validate request body
   │       └─▶ Return 400 if invalid
   │
   ├─▶ Controller Function
   │       ├─▶ Business logic
   │       ├─▶ Database queries
   │       └─▶ Response formatting
   │
   └─▶ Response (with caching if enabled)
```

### 2. Standard API Response Format

```javascript
// Success Response
{
  "success": true,
  "data": { ... },      // or array [...]
  "message": "Operation successful"
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (dev only)"
}

// Paginated Response
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  }
}
```

### 3. Product Retrieval Pattern

```
GET /api/products?page=1&limit=20&category=1&sort=price_asc

     ┌─────────────────────────────────────────────────┐
     │              Cache Middleware                    │
     │  Key: "products:page:1:limit:20:cat:1:sort:..."│
     └────────────────────┬────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
         Cache HIT               Cache MISS
              │                       │
              ▼                       ▼
      Return Cached           Query Database
         Response                    │
                                     ▼
                              Build Response
                                     │
                                     ▼
                              Cache Response
                              (TTL: 1 hour)
                                     │
                                     ▼
                              Return Response
```

---

## Caching Strategy

### Cache Layers

```
┌────────────────────────────────────────────────────────────┐
│                     CACHE ARCHITECTURE                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────┐  │
│  │   Browser    │    │   In-Memory  │    │  Database  │  │
│  │    Cache     │◄───│    Cache     │◄───│   Query    │  │
│  │  (Client)    │    │  (Node.js)   │    │  Results   │  │
│  └──────────────┘    └──────────────┘    └────────────┘  │
│                                                            │
│  Cache-Control       CacheTTL constants    Query Cache   │
│  Headers             SHORT: 5min           (PostgreSQL)  │
│                      MEDIUM: 30min                       │
│                      LONG: 1hour                         │
│                      PRODUCT: 1hour                      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Cache TTL Configuration

```javascript
// utils/cacheService.js

export const CacheTTL = {
  SHORT: 300,      // 5 minutes - for dynamic data
  MEDIUM: 1800,    // 30 minutes - for semi-static data
  LONG: 3600,      // 1 hour - for static data
  PRODUCT: 3600,   // 1 hour - for product data
  CATEGORY: 3600,  // 1 hour - for category data
  SEARCH: 900,     // 15 minutes - for search results
};
```

### Cache Invalidation

```javascript
// When product is updated
await cacheDel('products:*');              // All product list caches
await cacheDel(`product:${productId}`);    // Specific product cache
await cacheDel('featured:*');              // Featured products
await cacheDel(`category:${categoryId}:*`);// Category products

// Cache invalidation is triggered on:
// - Product CREATE/UPDATE/DELETE
// - Category changes
// - Sale status changes
// - Review additions/deletions
```

---

## Error Handling

### Error Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Data retrieved successfully |
| 201 | Created | Resource created |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Access denied (role) |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected error |

### Global Error Handler

```javascript
// index.js - Global error handler

app.use((err, req, res, next) => {
  console.error('❌ Error:', err);

  // Multer file upload errors
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});
```

---

## Security Measures

### 1. Helmet (Security Headers)

```javascript
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false  // Disabled for API
}));

// Adds headers:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - X-XSS-Protection: 1; mode=block
// - Strict-Transport-Security
```

### 2. Rate Limiting

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 1000,                  // 1000 requests per window
  message: { 
    success: false, 
    message: 'Too many requests' 
  },
  skip: (req) => req.path.startsWith('/api/webhook')
});

app.use('/api/', limiter);
```

### 3. CORS Configuration

```javascript
const allowedOrigins = [
  'http://localhost:5173',    // Vite dev
  'http://localhost:3000',    // Alternative dev
  process.env.FRONTEND_URL    // Production
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));
```

### 4. Input Validation

```javascript
// middleware/validator.js

export const RegisterValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be 6+ characters'),
  body('username')
    .isLength({ min: 2 })
    .withMessage('Username required')
];
```

### 5. SQL Injection Prevention

```javascript
// Using parameterized queries (pg library)
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]  // Parameters are safely escaped
);

// NEVER do this (vulnerable):
// `SELECT * FROM users WHERE email = '${email}'`
```

---

## Database Design

### Entity Relationship Diagram (Simplified)

```
┌──────────┐       ┌──────────────┐       ┌───────────┐
│  users   │───────│   orders     │───────│order_items│
└────┬─────┘       └──────┬───────┘       └───────────┘
     │                    │
     │    ┌───────────────┼───────────────┐
     │    │               │               │
     ▼    ▼               ▼               ▼
┌────────────┐    ┌──────────────┐   ┌──────────┐
│ addresses  │    │  cart_items  │   │ wishlist │
└────────────┘    └──────────────┘   └──────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   products   │◄─────┐
                  └──────┬───────┘      │
                         │              │
         ┌───────────────┼──────────────┤
         │               │              │
         ▼               ▼              ▼
┌────────────────┐ ┌───────────┐ ┌────────────────┐
│product_variants│ │product_   │ │product_reviews │
│                │ │images     │ │                │
└────────────────┘ └───────────┘ └────────────────┘
```

### Key Tables Summary

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | id, email, password, role |
| `products` | Product catalog | id, name, price, category_id |
| `product_variants` | Size/color combos | id, product_id, size, color, stock |
| `product_images` | Product photos | id, product_id, image_url, is_primary |
| `categories` | Product categories | id, name, parent_id |
| `orders` | Customer orders | id, user_id, total, status |
| `order_items` | Order line items | id, order_id, product_id, quantity |
| `cart_items` | Shopping cart | id, user_id, product_id, variant_id |
| `sales` | Promotions/discounts | id, discount_type, discount_value |

---

## File Structure

```
backend_shagung/
├── index.js                 # Main entry point, server setup
├── addTables.js             # Database initialization script
├── package.json             # Dependencies and scripts
├── .env                     # Environment variables
│
├── config/
│   ├── dbconfig.js          # PostgreSQL connection pool
│   ├── cloudinary.js        # Cloudinary setup
│   └── cashfree.js          # Cashfree payment gateway
│
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── cache.js             # Response caching
│   └── validator.js         # Request validation
│
├── router/
│   ├── auth.js              # /api/auth routes
│   ├── productRoutes.js     # /api/products routes
│   ├── orderRoutes.js       # /api/orders routes
│   ├── cartRoutes.js        # /api/cart routes
│   ├── categoryRoutes.js    # /api/categories routes
│   ├── adminRoutes.js       # /api/admin routes
│   ├── salesRoutes.js       # /api/sales routes
│   ├── heroRoutes.js        # /api/hero routes
│   ├── blogRoutes.js        # /api/blogs routes
│   ├── careersRoutes.js     # /api/careers routes
│   └── ...                  # Other route files
│
├── controller/
│   ├── auth.js              # Authentication logic
│   ├── productController.js # Product CRUD logic
│   ├── orderController.js   # Order processing
│   ├── cartController.js    # Cart operations
│   ├── adminController.js   # Admin operations
│   └── ...                  # Other controllers
│
├── utils/
│   ├── cacheService.js      # Cache utilities
│   ├── cachePublisher.js    # Cache invalidation
│   └── emailService.js      # Email sending
│
├── workers/
│   ├── cacheWorker.js       # Background cache tasks
│   └── emailWorker.js       # Email queue processing
│
└── api_docs/
    ├── README.md            # This documentation
    ├── AUTHENTICATION.md    # Auth details
    ├── ENDPOINTS.md         # API endpoints
    └── postman_*.json       # Postman collections
```

---

## Next Steps

- See [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed auth flows
- See [ENDPOINTS.md](./ENDPOINTS.md) for complete endpoint reference
- See [DATABASE.md](./DATABASE.md) for database schema details
- Import Postman collections for testing
