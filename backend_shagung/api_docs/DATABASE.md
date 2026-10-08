# Database Schema Documentation

> Complete database schema for Shagung E-commerce Backend

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Tables Reference](#tables-reference)
4. [Relationships](#relationships)
5. [Indexes](#indexes)
6. [Data Types](#data-types)

---

## Overview

The database uses **PostgreSQL** (hosted on Neon) with the following characteristics:

- **Total Tables:** 27
- **Primary Key:** All tables use `SERIAL` (auto-increment) for `id`
- **Timestamps:** Most tables include `created_at` and `updated_at`
- **Soft Delete:** Not implemented (hard delete used)
- **Foreign Keys:** Cascade delete enabled for child records

---

## Entity Relationship Diagram

```
                                    ┌─────────────────┐
                                    │      users      │
                                    │─────────────────│
                                    │ id (PK)         │
                                    │ username        │
                                    │ email           │
                                    │ password        │
                                    │ role            │
                                    │ is_verified     │
                                    └────────┬────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
    ┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
    │    addresses    │            │   cart_items    │            │    wishlist     │
    │─────────────────│            │─────────────────│            │─────────────────│
    │ id (PK)         │            │ id (PK)         │            │ id (PK)         │
    │ user_id (FK)    │            │ user_id (FK)    │            │ user_id (FK)    │
    │ name            │            │ product_id (FK) │            │ product_id (FK) │
    │ address_line1   │            │ variant_id (FK) │            └─────────────────┘
    │ city, state     │            │ quantity        │
    │ postal_code     │            └─────────────────┘
    │ is_default      │
    └─────────────────┘

              │                              │
              │                              │
              ▼                              ▼
    ┌─────────────────┐            ┌─────────────────┐
    │     orders      │            │    products     │◄──────────────────────────────┐
    │─────────────────│            │─────────────────│                               │
    │ id (PK)         │            │ id (PK)         │                               │
    │ user_id (FK)    │            │ name            │                               │
    │ address_id (FK) │            │ slug            │                               │
    │ order_number    │            │ description     │                               │
    │ total           │            │ price           │                               │
    │ status          │            │ category_id(FK) │                               │
    │ payment_status  │            │ is_featured     │                               │
    └────────┬────────┘            └────────┬────────┘                               │
             │                              │                                         │
             │                   ┌──────────┴──────────┐                             │
             ▼                   ▼                     ▼                             │
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │  order_items    │  │product_variants │  │ product_images  │  │ product_reviews │
    │─────────────────│  │─────────────────│  │─────────────────│  │─────────────────│
    │ id (PK)         │  │ id (PK)         │  │ id (PK)         │  │ id (PK)         │
    │ order_id (FK)   │  │ product_id (FK) │  │ product_id (FK) │  │ product_id (FK) │
    │ product_id (FK) │  │ size            │  │ image_url       │  │ user_id (FK)    │
    │ variant_id (FK) │  │ color           │  │ is_primary      │  │ rating          │
    │ quantity        │  │ color_code      │  │ color           │  │ comment         │
    │ price           │  │ sku             │  │ position        │  └─────────────────┘
    └─────────────────┘  │ stock           │  └─────────────────┘
                         │ price           │
                         └─────────────────┘


    ┌─────────────────┐            ┌─────────────────┐
    │   categories    │◄───────────│   categories    │ (self-reference for hierarchy)
    │─────────────────│            │─────────────────│
    │ id (PK)         │            │ parent_id (FK)  │
    │ name            │            └─────────────────┘
    │ slug            │
    │ parent_id (FK)  │
    │ image_url       │
    │ is_featured     │
    └─────────────────┘


    ┌─────────────────┐            ┌─────────────────┐
    │     sales       │            │  product_sales  │
    │─────────────────│            │─────────────────│
    │ id (PK)         │◄──────────►│ sale_id (FK)    │
    │ name            │            │ product_id (FK) │
    │ discount_type   │            │ custom_discount │
    │ discount_value  │            └─────────────────┘
    │ starts_at       │
    │ ends_at         │
    └─────────────────┘


    ┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
    │ blog_categories │            │     blogs       │            │   blog_tags     │
    │─────────────────│            │─────────────────│            │─────────────────│
    │ id (PK)         │◄───────────│ id (PK)         │───────────►│ blog_id (FK)    │
    │ name            │            │ title           │            │ tag_id (FK)     │
    │ slug            │            │ slug            │            └─────────────────┘
    └─────────────────┘            │ content         │                     │
                                   │ category_id(FK) │                     ▼
                                   │ author_id (FK)  │            ┌─────────────────┐
                                   │ is_published    │            │      tags       │
                                   └─────────────────┘            │─────────────────│
                                                                  │ id (PK)         │
                                                                  │ name            │
                                                                  │ slug            │
                                                                  └─────────────────┘
```

---

## Tables Reference

### 1. users

User accounts and authentication.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    password VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'customer',  -- 'customer' | 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `username` | VARCHAR(200) | Display name |
| `email` | VARCHAR(200) | Unique email |
| `password` | VARCHAR(200) | Bcrypt hashed |
| `phone` | VARCHAR(20) | Phone number |
| `avatar_url` | TEXT | Profile picture URL |
| `is_verified` | BOOLEAN | Email verified |
| `role` | VARCHAR(50) | User role |

---

### 2. email_verifications

Email verification and password reset tokens.

```sql
CREATE TABLE email_verifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'verify',  -- 'verify' | 'reset'
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 3. addresses

User shipping/billing addresses.

```sql
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    address_type VARCHAR(50) DEFAULT 'home',  -- 'home' | 'work' | 'other'
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 4. categories

Product categories with hierarchical structure.

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Hierarchy Levels:**
- Level 1: Main categories (parent_id = NULL)
- Level 2: Subcategories (parent_id = Level 1 id)
- Level 3: Sub-subcategories (parent_id = Level 2 id)

---

### 5. products

Product catalog.

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    compare_at_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    brand VARCHAR(200),
    material VARCHAR(200),
    weight DECIMAL(10, 2),
    dimensions VARCHAR(100),
    care_instructions TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    is_new_arrival BOOLEAN DEFAULT FALSE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 6. product_variants

Size/color combinations with stock.

```sql
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(50),
    color VARCHAR(100),
    color_code VARCHAR(20),  -- Hex color code (#FF0000)
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    price DECIMAL(10, 2),
    compare_at_price DECIMAL(10, 2),
    cost_price DECIMAL(10, 2),
    stock INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    weight DECIMAL(10, 2),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 7. product_images

Product images with color association.

```sql
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(300),
    is_primary BOOLEAN DEFAULT FALSE,
    position INTEGER DEFAULT 0,
    color VARCHAR(100),
    color_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 8. product_reviews

Customer reviews and ratings.

```sql
CREATE TABLE product_reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images TEXT[],
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 9. cart_items

Shopping cart items.

```sql
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, variant_id)
);
```

---

### 10. wishlist

User wishlists.

```sql
CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);
```

---

### 11. coupons

Discount coupons.

```sql
CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,  -- 'percentage' | 'fixed'
    discount_value DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2),
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    applicable_products INTEGER[],
    applicable_categories INTEGER[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 12. orders

Customer orders.

```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, confirmed, processing, shipped, delivered, cancelled
    subtotal DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    coupon_code VARCHAR(50),
    coupon_discount DECIMAL(10, 2) DEFAULT 0,
    payment_method VARCHAR(50),  -- 'cod' | 'online'
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_id VARCHAR(255),
    shipping_name VARCHAR(200),
    shipping_phone VARCHAR(20),
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100) DEFAULT 'India',
    tracking_number VARCHAR(100),
    tracking_url TEXT,
    notes TEXT,
    cancelled_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Order Status Flow:**
```
pending → confirmed → processing → shipped → delivered
           ↓
        cancelled
```

---

### 13. order_items

Order line items.

```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name VARCHAR(500),
    variant_info VARCHAR(200),
    price DECIMAL(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 14. order_history

Order status tracking.

```sql
CREATE TABLE order_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 15. sales

Sale/promotion events.

```sql
CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,  -- 'percentage' | 'fixed'
    discount_value DECIMAL(10, 2) NOT NULL,
    banner_image TEXT,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 16. product_sales

Products in sales (many-to-many).

```sql
CREATE TABLE product_sales (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
    custom_discount DECIMAL(10, 2),  -- Override sale discount
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, sale_id)
);
```

---

### 17. newsletter_subscriptions

Newsletter subscribers.

```sql
CREATE TABLE newsletter_subscriptions (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP
);
```

---

### 18. delivery_areas

Serviceable pincodes.

```sql
CREATE TABLE delivery_areas (
    id SERIAL PRIMARY KEY,
    pincode VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    is_serviceable BOOLEAN DEFAULT TRUE,
    delivery_days INTEGER DEFAULT 5,
    cod_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 19. hero_slides

Homepage banner slides.

```sql
CREATE TABLE hero_slides (
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
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 20. hero_settings

Homepage configuration.

```sql
CREATE TABLE hero_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 21. jobs

Career job listings.

```sql
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    location VARCHAR(255) DEFAULT 'Remote',
    employment_type VARCHAR(50) DEFAULT 'Full-time',
    experience_level VARCHAR(50),
    salary_min DECIMAL(10, 2),
    salary_max DECIMAL(10, 2),
    description TEXT NOT NULL,
    requirements TEXT,
    responsibilities TEXT,
    benefits TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    application_deadline DATE,
    positions_available INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 22. job_applications

Job applications.

```sql
CREATE TABLE job_applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    resume_url TEXT,
    cover_letter TEXT,
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    years_of_experience INTEGER,
    current_company VARCHAR(255),
    expected_salary DECIMAL(10, 2),
    notice_period VARCHAR(50),
    status VARCHAR(50) DEFAULT 'pending',
    -- pending, reviewed, shortlisted, interviewed, hired, rejected
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 23. blog_categories

Blog categories.

```sql
CREATE TABLE blog_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(50) DEFAULT '#f43f5e',
    icon VARCHAR(50) DEFAULT '📝',
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 24. blogs

Blog posts.

```sql
CREATE TABLE blogs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    video_url TEXT,
    background_image TEXT,
    background_color VARCHAR(100),
    gradient VARCHAR(255),
    category_id INTEGER REFERENCES blog_categories(id) ON DELETE SET NULL,
    author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    views INTEGER DEFAULT 0,
    reading_time INTEGER DEFAULT 1,
    meta_title VARCHAR(255),
    meta_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 25. tags

Content tags.

```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 26. blog_tags

Blog-tag associations (junction table).

```sql
CREATE TABLE blog_tags (
    blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_id, tag_id)
);
```

---

### 27. related_products

Product relationships.

```sql
CREATE TABLE related_products (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    related_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, related_product_id)
);
```

---

## Relationships

### One-to-Many Relationships

| Parent | Child | Description |
|--------|-------|-------------|
| `users` → `addresses` | One user has many addresses |
| `users` → `orders` | One user has many orders |
| `users` → `cart_items` | One user has many cart items |
| `users` → `wishlist` | One user has many wishlist items |
| `users` → `product_reviews` | One user has many reviews |
| `products` → `product_variants` | One product has many variants |
| `products` → `product_images` | One product has many images |
| `products` → `product_reviews` | One product has many reviews |
| `categories` → `products` | One category has many products |
| `categories` → `categories` | Self-reference for hierarchy |
| `orders` → `order_items` | One order has many items |
| `orders` → `order_history` | One order has many status changes |
| `sales` → `product_sales` | One sale has many products |
| `jobs` → `job_applications` | One job has many applications |
| `blog_categories` → `blogs` | One category has many blogs |

### Many-to-Many Relationships

| Table 1 | Junction | Table 2 | Description |
|---------|----------|---------|-------------|
| `products` | `product_sales` | `sales` | Products in sales |
| `blogs` | `blog_tags` | `tags` | Blog tags |
| `products` | `related_products` | `products` | Related products |

---

## Indexes

Key indexes for query performance:

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Products
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_published ON products(is_published);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

-- Product Variants
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);

-- Product Images
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_is_primary ON product_images(is_primary);

-- Orders
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Cart Items
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);

-- Categories
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Sales
CREATE INDEX idx_sales_is_active ON sales(is_active);
CREATE INDEX idx_sales_dates ON sales(starts_at, ends_at);

-- Blogs
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_is_published ON blogs(is_published);
CREATE INDEX idx_blogs_created_at ON blogs(created_at DESC);
```

---

## Data Types

| PostgreSQL Type | Usage |
|-----------------|-------|
| `SERIAL` | Auto-increment primary keys |
| `VARCHAR(n)` | Variable-length strings |
| `TEXT` | Long text content |
| `INTEGER` | Whole numbers |
| `DECIMAL(10, 2)` | Prices and monetary values |
| `BOOLEAN` | True/false flags |
| `TIMESTAMP` | Date and time |
| `DATE` | Date only |
| `TEXT[]` | Array of strings |
| `INTEGER[]` | Array of integers |

---

## Database Initialization

Run the initialization script:

```bash
cd backend_shagung
node addTables.js
```

This creates all tables with proper indexes and constraints.
