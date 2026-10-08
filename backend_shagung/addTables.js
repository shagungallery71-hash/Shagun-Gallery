// =============================================================================
// DATABASE TABLES INITIALIZATION SCRIPT
// Creates all required tables if they don't exist in the Neon PostgreSQL database
// Run: node addTables.js
// =============================================================================
//
// TOTAL TABLES: 27
//
// 1.  users                    - User accounts & authentication
// 2.  email_verifications      - Email verification tokens
// 3.  addresses                - User shipping/billing addresses
// 4.  categories               - Product categories (hierarchical)
// 5.  products                 - Product catalog
// 6.  product_variants         - Size/Color combinations with stock
// 7.  product_images           - Product images with color association
// 8.  product_reviews          - Customer reviews & ratings
// 9.  cart_items               - Shopping cart items
// 10. wishlist                 - User wishlists
// 11. coupons                  - Discount coupons
// 12. orders                   - Customer orders
// 13. order_items              - Order line items
// 14. order_history            - Order status tracking
// 15. sales                    - Sale/promotion events
// 16. product_sales            - Products in sales (many-to-many)
// 17. newsletter_subscriptions - Newsletter subscribers
// 18. delivery_areas           - Serviceable pincodes
// 19. hero_slides              - Homepage banner slides
// 20. hero_settings            - Homepage configuration
// 21. jobs                     - Career job listings
// 22. job_applications         - Job applications
// 23. blog_categories          - Blog categories
// 24. blogs                    - Blog posts
// 25. tags                     - Content tags
// 26. blog_tags                - Blog-tag associations
// 27. related_products         - Product relationships
//
// =============================================================================

import pool from './config/dbconfig.js';

// =============================================================================
// TABLE DEFINITIONS
// =============================================================================

const tables = [
  // -------------------------------------------------------------------------
  // USERS & AUTHENTICATION
  // -------------------------------------------------------------------------
  {
    name: 'users',
    sql: `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(200) NOT NULL,
                email VARCHAR(200) UNIQUE NOT NULL,
                password VARCHAR(200) NOT NULL,
                phone VARCHAR(20),
                avatar_url TEXT,
                is_verified BOOLEAN DEFAULT FALSE,
                role VARCHAR(50) DEFAULT 'customer',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
    ]
  },
  {
    name: 'email_verifications',
    sql: `
            CREATE TABLE IF NOT EXISTS email_verifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                token_hash VARCHAR(255) NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                purpose VARCHAR(50) DEFAULT 'verify',
                attempts INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_email_verifications_token_hash ON email_verifications(token_hash)',
      'CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id)',
    ]
  },

  // -------------------------------------------------------------------------
  // ADDRESSES
  // -------------------------------------------------------------------------
  {
    name: 'addresses',
    sql: `
            CREATE TABLE IF NOT EXISTS addresses (
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
                is_default BOOLEAN DEFAULT FALSE,
                address_type VARCHAR(50) DEFAULT 'home',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id)',
    ]
  },

  // -------------------------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------------------------
  {
    name: 'categories',
    sql: `
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                slug VARCHAR(200) UNIQUE NOT NULL,
                description TEXT,
                image_url TEXT,
                parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                is_featured BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                display_order INTEGER DEFAULT 0,
                meta_title VARCHAR(200),
                meta_description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)',
      'CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)',
      'CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active)',
    ]
  },

  // -------------------------------------------------------------------------
  // PRODUCTS
  // -------------------------------------------------------------------------
  {
    name: 'products',
    sql: `
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(300) NOT NULL,
                slug VARCHAR(300) UNIQUE NOT NULL,
                description TEXT,
                short_description TEXT,
                price DECIMAL(10,2) NOT NULL,
                compare_at_price DECIMAL(10,2),
                cost_price DECIMAL(10,2),
                sku VARCHAR(100) UNIQUE,
                barcode VARCHAR(100),
                category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                brand VARCHAR(200),
                material VARCHAR(200),
                weight DECIMAL(10,2),
                is_featured BOOLEAN DEFAULT FALSE,
                is_published BOOLEAN DEFAULT TRUE,
                is_new BOOLEAN DEFAULT FALSE,
                is_bestseller BOOLEAN DEFAULT FALSE,
                tags TEXT[],
                meta_title VARCHAR(200),
                meta_description TEXT,
                view_count INTEGER DEFAULT 0,
                sold_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)',
      'CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)',
      'CREATE INDEX IF NOT EXISTS idx_products_is_published ON products(is_published)',
      'CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured)',
      'CREATE INDEX IF NOT EXISTS idx_products_price ON products(price)',
      'CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC)',
    ]
  },

  // -------------------------------------------------------------------------
  // PRODUCT VARIANTS (Size, Color combinations)
  // -------------------------------------------------------------------------
  {
    name: 'product_variants',
    sql: `
            CREATE TABLE IF NOT EXISTS product_variants (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                size VARCHAR(50),
                color VARCHAR(100),
                color_code VARCHAR(20),
                sku VARCHAR(100),
                price DECIMAL(10,2),
                compare_at_price DECIMAL(10,2),
                stock INTEGER DEFAULT 0,
                is_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON product_variants(stock)',
    ]
  },

  // -------------------------------------------------------------------------
  // PRODUCT IMAGES
  // -------------------------------------------------------------------------
  {
    name: 'product_images',
    sql: `
            CREATE TABLE IF NOT EXISTS product_images (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                image_url TEXT NOT NULL,
                alt_text VARCHAR(300),
                is_primary BOOLEAN DEFAULT FALSE,
                position INTEGER DEFAULT 0,
                color VARCHAR(100),
                color_code VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary)',
      'CREATE INDEX IF NOT EXISTS idx_product_images_color ON product_images(color)',
    ]
  },

  // -------------------------------------------------------------------------
  // PRODUCT REVIEWS
  // -------------------------------------------------------------------------
  {
    name: 'product_reviews',
    sql: `
            CREATE TABLE IF NOT EXISTS product_reviews (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                title VARCHAR(200),
                comment TEXT,
                is_verified_purchase BOOLEAN DEFAULT FALSE,
                is_approved BOOLEAN DEFAULT FALSE,
                helpful_count INTEGER DEFAULT 0,
                images TEXT[],
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating)',
      'CREATE INDEX IF NOT EXISTS idx_product_reviews_is_approved ON product_reviews(is_approved)',
    ]
  },

  // -------------------------------------------------------------------------
  // CART
  // -------------------------------------------------------------------------
  {
    name: 'cart_items',
    sql: `
            CREATE TABLE IF NOT EXISTS cart_items (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
                quantity INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, product_id, variant_id)
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id)',
    ]
  },

  // -------------------------------------------------------------------------
  // WISHLIST
  // -------------------------------------------------------------------------
  {
    name: 'wishlist',
    sql: `
            CREATE TABLE IF NOT EXISTS wishlist (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, product_id)
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id)',
    ]
  },

  // -------------------------------------------------------------------------
  // COUPONS
  // -------------------------------------------------------------------------
  {
    name: 'coupons',
    sql: `
            CREATE TABLE IF NOT EXISTS coupons (
                id SERIAL PRIMARY KEY,
                code VARCHAR(50) UNIQUE NOT NULL,
                description TEXT,
                discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
                discount_value DECIMAL(10,2) NOT NULL,
                min_order_amount DECIMAL(10,2),
                max_discount DECIMAL(10,2),
                max_uses INTEGER,
                uses_count INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                starts_at TIMESTAMP,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code)',
      'CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active)',
    ]
  },

  // -------------------------------------------------------------------------
  // ORDERS
  // -------------------------------------------------------------------------
  {
    name: 'orders',
    sql: `
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                order_number VARCHAR(50) UNIQUE NOT NULL,
                subtotal DECIMAL(10,2) NOT NULL,
                discount DECIMAL(10,2) DEFAULT 0,
                shipping_cost DECIMAL(10,2) DEFAULT 0,
                tax_amount DECIMAL(10,2) DEFAULT 0,
                total DECIMAL(10,2) NOT NULL,
                shipping_address JSONB NOT NULL,
                billing_address JSONB,
                payment_intent_id VARCHAR(200),
                payment_status VARCHAR(50) DEFAULT 'unpaid',
                status VARCHAR(50) DEFAULT 'pending',
                coupon_code VARCHAR(50),
                notes TEXT,
                tracking_number VARCHAR(100),
                tracking_url TEXT,
                cancellation_reason TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC)',
    ]
  },

  // -------------------------------------------------------------------------
  // ORDER ITEMS
  // -------------------------------------------------------------------------
  {
    name: 'order_items',
    sql: `
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
                variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
                quantity INTEGER NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                total DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)',
    ]
  },

  // -------------------------------------------------------------------------
  // ORDER HISTORY (Status tracking)
  // -------------------------------------------------------------------------
  {
    name: 'order_history',
    sql: `
            CREATE TABLE IF NOT EXISTS order_history (
                id SERIAL PRIMARY KEY,
                order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
                status VARCHAR(50) NOT NULL,
                notes TEXT,
                created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id)',
    ]
  },

  // -------------------------------------------------------------------------
  // SALES / PROMOTIONS
  // -------------------------------------------------------------------------
  {
    name: 'sales',
    sql: `
            CREATE TABLE IF NOT EXISTS sales (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                slug VARCHAR(200) UNIQUE,
                description TEXT,
                discount_type VARCHAR(20) DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
                discount_value DECIMAL(10,2) NOT NULL,
                banner_image TEXT,
                banner_color VARCHAR(20),
                is_active BOOLEAN DEFAULT TRUE,
                starts_at TIMESTAMP NOT NULL,
                ends_at TIMESTAMP NOT NULL,
                priority INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_sales_is_active ON sales(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_sales_dates ON sales(starts_at, ends_at)',
    ]
  },

  // -------------------------------------------------------------------------
  // PRODUCT SALES (Many-to-Many relationship)
  // -------------------------------------------------------------------------
  {
    name: 'product_sales',
    sql: `
            CREATE TABLE IF NOT EXISTS product_sales (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                sale_id INTEGER REFERENCES sales(id) ON DELETE CASCADE,
                custom_discount DECIMAL(10,2),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(product_id, sale_id)
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_product_sales_product_id ON product_sales(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_product_sales_sale_id ON product_sales(sale_id)',
    ]
  },

  // -------------------------------------------------------------------------
  // NEWSLETTER SUBSCRIPTIONS
  // -------------------------------------------------------------------------
  {
    name: 'newsletter_subscriptions',
    sql: `
            CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
                id SERIAL PRIMARY KEY,
                email VARCHAR(200) UNIQUE NOT NULL,
                name VARCHAR(200),
                is_subscribed BOOLEAN DEFAULT TRUE,
                source VARCHAR(100),
                subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                unsubscribed_at TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email)',
    ]
  },

  // -------------------------------------------------------------------------
  // DELIVERY AREAS
  // -------------------------------------------------------------------------
  {
    name: 'delivery_areas',
    sql: `
            CREATE TABLE IF NOT EXISTS delivery_areas (
                id SERIAL PRIMARY KEY,
                pincode VARCHAR(10) NOT NULL,
                city VARCHAR(100),
                state VARCHAR(100),
                is_serviceable BOOLEAN DEFAULT TRUE,
                delivery_days INTEGER DEFAULT 5,
                cod_available BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_delivery_areas_pincode ON delivery_areas(pincode)',
    ]
  },

  // -------------------------------------------------------------------------
  // HERO SLIDES (Homepage Banner)
  // -------------------------------------------------------------------------
  {
    name: 'hero_slides',
    sql: `
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
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_hero_slides_is_active ON hero_slides(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_hero_slides_position ON hero_slides(position)',
    ]
  },

  // -------------------------------------------------------------------------
  // HERO SETTINGS (Homepage Configuration)
  // -------------------------------------------------------------------------
  {
    name: 'hero_settings',
    sql: `
            CREATE TABLE IF NOT EXISTS hero_settings (
                id SERIAL PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value TEXT NOT NULL,
                setting_type VARCHAR(50) DEFAULT 'string',
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_hero_settings_key ON hero_settings(setting_key)',
    ]
  },

  // -------------------------------------------------------------------------
  // JOBS (Career Listings)
  // -------------------------------------------------------------------------
  {
    name: 'jobs',
    sql: `
            CREATE TABLE IF NOT EXISTS jobs (
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
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_jobs_department ON jobs(department)',
      'CREATE INDEX IF NOT EXISTS idx_jobs_is_featured ON jobs(is_featured)',
    ]
  },

  // -------------------------------------------------------------------------
  // JOB APPLICATIONS
  // -------------------------------------------------------------------------
  {
    name: 'job_applications',
    sql: `
            CREATE TABLE IF NOT EXISTS job_applications (
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
                applicant_role VARCHAR(255),
                expected_salary DECIMAL(10, 2),
                notice_period VARCHAR(50),
                status VARCHAR(50) DEFAULT 'pending',
                admin_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id)',
      'CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status)',
      'CREATE INDEX IF NOT EXISTS idx_job_applications_email ON job_applications(email)',
    ]
  },

  // -------------------------------------------------------------------------
  // BLOG CATEGORIES
  // -------------------------------------------------------------------------
  {
    name: 'blog_categories',
    sql: `
            CREATE TABLE IF NOT EXISTS blog_categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                color VARCHAR(50) DEFAULT '#f43f5e',
                icon VARCHAR(50) DEFAULT '📝',
                position INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug)',
    ]
  },

  // -------------------------------------------------------------------------
  // BLOGS
  // -------------------------------------------------------------------------
  {
    name: 'blogs',
    sql: `
            CREATE TABLE IF NOT EXISTS blogs (
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
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug)',
      'CREATE INDEX IF NOT EXISTS idx_blogs_category_id ON blogs(category_id)',
      'CREATE INDEX IF NOT EXISTS idx_blogs_is_published ON blogs(is_published)',
      'CREATE INDEX IF NOT EXISTS idx_blogs_is_featured ON blogs(is_featured)',
      'CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC)',
    ]
  },

  // -------------------------------------------------------------------------
  // TAGS
  // -------------------------------------------------------------------------
  {
    name: 'tags',
    sql: `
            CREATE TABLE IF NOT EXISTS tags (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                slug VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug)',
    ]
  },

  // -------------------------------------------------------------------------
  // BLOG TAGS (Junction Table)
  // -------------------------------------------------------------------------
  {
    name: 'blog_tags',
    sql: `
            CREATE TABLE IF NOT EXISTS blog_tags (
                blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE,
                tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
                PRIMARY KEY (blog_id, tag_id)
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_blog_tags_blog_id ON blog_tags(blog_id)',
      'CREATE INDEX IF NOT EXISTS idx_blog_tags_tag_id ON blog_tags(tag_id)',
    ]
  },

  // -------------------------------------------------------------------------
  // RELATED PRODUCTS
  // -------------------------------------------------------------------------
  {
    name: 'related_products',
    sql: `
            CREATE TABLE IF NOT EXISTS related_products (
                id SERIAL PRIMARY KEY,
                product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                related_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(product_id, related_product_id)
            )
        `,
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_related_products_product_id ON related_products(product_id)',
      'CREATE INDEX IF NOT EXISTS idx_related_products_related_id ON related_products(related_product_id)',
    ]
  },
];

// =============================================================================
// CHECK IF TABLE EXISTS
// =============================================================================
async function tableExists(tableName) {
  const result = await pool.query(`
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
        )
    `, [tableName]);
  return result.rows[0].exists;
}

// =============================================================================
// MAIN INITIALIZATION FUNCTION
// =============================================================================
async function initializeTables() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║       DATABASE TABLES INITIALIZATION - SHAGUNG GALLERY         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const client = await pool.connect();
  let createdCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    for (const table of tables) {
      try {
        const exists = await tableExists(table.name);

        if (exists) {
          console.log(`⏭️  Table "${table.name}" already exists - SKIPPED`);
          skippedCount++;
        } else {
          // Create table
          await client.query(table.sql);
          console.log(`✅ Table "${table.name}" created successfully`);
          createdCount++;
        }

        // Create indexes (IF NOT EXISTS handles duplicates)
        if (table.indexes && table.indexes.length > 0) {
          for (const indexSql of table.indexes) {
            try {
              await client.query(indexSql);
            } catch (indexError) {
              // Ignore index errors (might already exist)
            }
          }
        }
      } catch (tableError) {
        console.error(`❌ Error with table "${table.name}":`, tableError.message);
        errorCount++;
      }
    }

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('                        SUMMARY');
    console.log('════════════════════════════════════════════════════════════════');
    console.log(`  📊 Total tables defined: ${tables.length}`);
    console.log(`  ✅ Tables created:       ${createdCount}`);
    console.log(`  ⏭️  Tables skipped:       ${skippedCount}`);
    console.log(`  ❌ Errors:               ${errorCount}`);
    console.log('════════════════════════════════════════════════════════════════\n');

    if (createdCount === 0 && skippedCount === tables.length) {
      console.log('ℹ️  All tables already exist. Database is ready!\n');
    } else if (createdCount > 0) {
      console.log('🎉 Database initialization complete!\n');
    }

  } catch (error) {
    console.error('❌ Fatal error during initialization:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// =============================================================================
// RUN
// =============================================================================
initializeTables();
