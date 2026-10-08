import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

dotenv.config();

// Import routes
import authRouter from './router/auth.js';
import categoryRouter from './router/categoryRoutes.js';
import productRouter from './router/productRoutes.js';
import orderRouter from './router/orderRoutes.js';
import paymentRouter from './router/paymentRoutes.js';
import cartRouter from './router/cartRoutes.js';
import wishlistRouter from './router/wishlistRoutes.js';
import newsletterRouter from './router/newsletterRoutes.js';
import adminRouter from './router/adminRoutes.js';

import couponRouter from './router/couponRoutes.js';

// Import config
import pool from './config/dbconfig.js';
// Note: connectEmailService removed - using Gmail directly in auth.js
import { connectRabbitMQ } from './utils/cachePublisher.js';
import { startCacheWorker } from './workers/cacheWorker.js';

const PORT = process.env.PORT || 5000;
const app = express();

// =============================================================================
// MIDDLEWARE - Security & Performance
// =============================================================================

// Security headers
app.use(helmet({
     crossOriginResourcePolicy: { policy: "cross-origin" },
     contentSecurityPolicy: false, // Disable for API
}));

// CORS - Must be placed BEFORE rate-limiting and body parsing
app.use(cors({
     origin: true, // Allow any requesting origin dynamically (reflects origin)
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
     allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Cache-Control',
          'Pragma',
          'Accept',
          'Origin'
     ],
     exposedHeaders: ['Content-Range', 'X-Content-Range'],
     maxAge: 86400 // Cache preflight for 24 hours
}));

// Compression for responses
app.use(compression());

// Rate limiting - 1000 requests per 15 minutes per IP
const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 1000,
     message: { success: false, message: 'Too many requests, please try again later.' },
     standardHeaders: true,
     legacyHeaders: false,
     skip: (req) => req.path.startsWith('/api/webhook') || req.method === 'OPTIONS', // Skip for webhooks and preflight
});
app.use('/api/', limiter);
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));


// =============================================================================
// CONNECT SERVICES (with graceful fallbacks)
// =============================================================================

const initializeServices = async () => {
     try {
          // Start cache worker
          startCacheWorker();
          console.log('✅ Cache worker started');
     } catch (err) {
          console.warn('⚠️ Cache worker failed to start:', err.message);
     }

     // Gmail is used directly for emails (no RabbitMQ needed)
     console.log('📧 Email service: Using Gmail directly (GMAIL_USER configured)');

     try {
          // Connect to RabbitMQ for cache invalidation (optional)
          await connectRabbitMQ();
          console.log('✅ Cache invalidation service connected');
     } catch (err) {
          console.warn('⚠️ Cache invalidation service failed (caching still works locally):', err.message);
     }

     // Seed initial coupon if needed
     try {
          const couponsData = [
               { code: 'WELCOME20', description: 'Welcome Discount 20%', type: 'percentage', value: 20, min: 500 },
               { code: 'SAVE50', description: 'Flat ₹50 Off on orders above ₹1000', type: 'fixed', value: 50, min: 1000 },
               { code: 'SUMMER10', description: 'Summer Sale 10%', type: 'percentage', value: 10, min: 0 }
          ];

          for (const coupon of couponsData) {
               const check = await pool.query("SELECT id FROM coupons WHERE code = $1", [coupon.code]);
               if (check.rows.length === 0) {
                    await pool.query(`
                         INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, is_active)
                         VALUES ($1, $2, $3, $4, $5, true)
                    `, [coupon.code, coupon.description, coupon.type, coupon.value, coupon.min]);
                    console.log(`🎟️ Seeded ${coupon.code} coupon`);
               }
          }
     } catch (err) {
          // Ignore table missing errors during initial boot
     }

     // Create hero tables if they don't exist (auto-migration)
     try {
          // Create hero_slides table
          await pool.query(`
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
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
               )
          `);

          // Create hero_settings table
          await pool.query(`
               CREATE TABLE IF NOT EXISTS hero_settings (
                    id SERIAL PRIMARY KEY,
                    setting_key VARCHAR(100) UNIQUE NOT NULL,
                    setting_value TEXT NOT NULL,
                    setting_type VARCHAR(50) DEFAULT 'string',
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
               )
          `);

          // Check if we need to seed default slides
          const existingSlides = await pool.query('SELECT COUNT(*) FROM hero_slides');
          if (parseInt(existingSlides.rows[0].count) === 0) {
               await pool.query(`
                    INSERT INTO hero_slides (title, subtitle, description, image_url, badge_text, gradient, button_text, button_link, secondary_button_text, secondary_button_link, starting_price, price_label, position, is_active) VALUES 
                    ('Festive Glamour', '✨ New Collection 2025', 'Discover exquisite designs that blend tradition with contemporary elegance.', 'https://res.cloudinary.com/dsgktwwae/image/upload/v1766062147/Gemini_Generated_Image_c06zguc06zguc06z_2_vo7pcz.jpg', 'Trending Now', 'from-rose-600 via-pink-500 to-fuchsia-500', 'Shop Now', '/products', 'Sign Up', '/account', 999, 'Starting from', 1, true),
                    ('Bridal Dreams', '👑 Premium Collection', 'Make your special day unforgettable with our handcrafted bridal wear.', 'https://res.cloudinary.com/dsgktwwae/image/upload/v1766062401/Gemini_Generated_Image_ajivycajivycajiv_2_hq3kg2.jpg', 'Exclusive', 'from-purple-600 via-violet-500 to-indigo-500', 'Shop Now', '/products', 'Sign Up', '/account', 1999, 'Starting from', 2, true),
                    ('Ethnic Royale', '🌟 Limited Edition', 'Celebrate heritage with modern sophistication. Premium ethnic wear collection.', 'https://res.cloudinary.com/dsgktwwae/image/upload/v1766062766/fontlogo3_nj8da9.webp', 'Best Seller', 'from-amber-500 via-orange-500 to-red-500', 'Shop Now', '/products', 'Sign Up', '/account', 999, 'Starting from', 3, true)
               `);
               console.log('🎨 Seeded default hero slides');
          }

          // Check if we need to seed default settings
          const existingSettings = await pool.query('SELECT COUNT(*) FROM hero_settings');
          if (parseInt(existingSettings.rows[0].count) === 0) {
               await pool.query(`
                    INSERT INTO hero_settings (setting_key, setting_value, setting_type, description) VALUES
                    ('auto_slide_interval', '5000', 'number', 'Auto slide interval in milliseconds'),
                    ('customer_count_text', '25K+ Happy Customers', 'string', 'Customer count badge text'),
                    ('rating_value', '4.9', 'string', 'Rating value to display'),
                    ('logo_url', 'https://res.cloudinary.com/dsgktwwae/image/upload/v1766060996/IMG-20250807-WA0012_1_h2hkya.jpg', 'string', 'Logo image URL'),
                    ('brand_name', 'Shagun Gallery', 'string', 'Brand name text'),
                    ('brand_tagline', 'Premium Ethnic Wear', 'string', 'Brand tagline text'),
                    ('trust_badge_1_icon', '🚚', 'string', 'First trust badge icon'),
                    ('trust_badge_1_text', 'Free Shipping', 'string', 'First trust badge text'),
                    ('trust_badge_2_icon', '💯', 'string', 'Second trust badge icon'),
                    ('trust_badge_2_text', 'Premium Quality', 'string', 'Second trust badge text'),
                    ('trust_badge_3_icon', '🔒', 'string', 'Third trust badge icon'),
                    ('trust_badge_3_text', 'Secure Pay', 'string', 'Third trust badge text')
               `);
               console.log('⚙️ Seeded default hero settings');
          }

          // Clear any stale hero cache
          try {
               const { cacheDel } = await import('./utils/cacheService.js');
               await cacheDel('hero:slides:all');
               await cacheDel('hero:settings');
               console.log('🧹 Cleared hero cache');
          } catch (cacheErr) {
               // Ignore cache errors
          }

          console.log('🏠 Hero tables initialized');
     } catch (err) {
          console.warn('⚠️ Hero tables migration warning:', err.message);
     }

     // =========================================================================
     // CAREERS TABLES AUTO-MIGRATION
     // =========================================================================
     try {
          // Create jobs table
          await pool.query(`
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
                    is_active BOOLEAN DEFAULT true,
                    is_featured BOOLEAN DEFAULT false,
                    application_deadline DATE,
                    positions_available INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
               )
          `);

          // Create job_applications table
          await pool.query(`
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
          `);

          // Create indexes
          await pool.query('CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active)');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id)');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status)');

          console.log('💼 Careers tables initialized');
     } catch (err) {
          console.warn('⚠️ Careers tables migration warning:', err.message);
     }

     // =========================================================================
     // BLOG TABLES AUTO-MIGRATION
     // =========================================================================
     try {
          // Create blog_categories table
          await pool.query(`
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
          `);

          // Ensure all blog_categories columns exist using DO block for PostgreSQL compatibility
          await pool.query(`
               DO $$ 
               BEGIN
                    BEGIN ALTER TABLE blog_categories ADD COLUMN description TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
                    BEGIN ALTER TABLE blog_categories ADD COLUMN color VARCHAR(50) DEFAULT '#f43f5e'; EXCEPTION WHEN duplicate_column THEN NULL; END;
                    BEGIN ALTER TABLE blog_categories ADD COLUMN icon VARCHAR(50) DEFAULT '📝'; EXCEPTION WHEN duplicate_column THEN NULL; END;
                    BEGIN ALTER TABLE blog_categories ADD COLUMN position INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
               END $$;
          `);

          // Create blogs table
          await pool.query(`
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
                    is_published BOOLEAN DEFAULT false,
                    is_featured BOOLEAN DEFAULT false,
                    views INTEGER DEFAULT 0,
                    reading_time INTEGER DEFAULT 1,
                    meta_title VARCHAR(255),
                    meta_description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
               )
          `);

          // Create tags table
          await pool.query(`
               CREATE TABLE IF NOT EXISTS tags (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    slug VARCHAR(100) NOT NULL UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
               )
          `);

          // Create blog_tags junction table
          await pool.query(`
               CREATE TABLE IF NOT EXISTS blog_tags (
                    blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE,
                    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
                    PRIMARY KEY (blog_id, tag_id)
               )
          `);

          // Create indexes for performance
          await pool.query('CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(is_published)');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(is_featured)');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category_id)');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_blogs_created ON blogs(created_at DESC)');
          await pool.query('CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug)');

          // Ensure all required columns exist (for tables created before full migration)
          await pool.query(`
               DO $$ 
               BEGIN
                    BEGIN ALTER TABLE blogs ADD COLUMN video_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
                    BEGIN ALTER TABLE blogs ADD COLUMN background_image TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
                    BEGIN ALTER TABLE blogs ADD COLUMN background_color VARCHAR(100); EXCEPTION WHEN duplicate_column THEN NULL; END;
                    BEGIN ALTER TABLE blogs ADD COLUMN gradient VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
                    BEGIN ALTER TABLE blogs ADD COLUMN is_featured BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END;
                    BEGIN ALTER TABLE blogs ADD COLUMN reading_time INTEGER DEFAULT 1; EXCEPTION WHEN duplicate_column THEN NULL; END;
                    BEGIN ALTER TABLE blogs ADD COLUMN meta_title VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
                    BEGIN ALTER TABLE blogs ADD COLUMN meta_description TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
               END $$;
          `);

          // Seed default categories if empty
          const existingCategories = await pool.query('SELECT COUNT(*) FROM blog_categories');
          if (parseInt(existingCategories.rows[0].count) === 0) {
               await pool.query(`
                    INSERT INTO blog_categories (name, slug, description, color, icon, position) VALUES
                    ('Fashion & Style', 'fashion-style', 'Latest fashion trends, styling tips, and outfit inspiration', '#ec4899', '👗', 1),
                    ('Beauty Tips', 'beauty-tips', 'Skincare, makeup tutorials, and beauty hacks', '#f43f5e', '💄', 2),
                    ('Wedding & Events', 'wedding-events', 'Bridal wear, wedding planning, and celebration ideas', '#8b5cf6', '💒', 3),
                    ('Culture & Tradition', 'culture-tradition', 'Celebrating Indian heritage and traditional wear', '#f59e0b', '🪔', 4),
                    ('Behind the Scenes', 'behind-scenes', 'Our design process, artisan stories, and brand journey', '#10b981', '🎬', 5),
                    ('News & Updates', 'news-updates', 'Latest collections, store updates, and announcements', '#3b82f6', '📢', 6)
               `);
               console.log('📝 Seeded default blog categories');
          }

          console.log('📝 Blog tables initialized');
     } catch (err) {
          console.warn('⚠️ Blog tables migration warning:', err.message);
     }
};

initializeServices();

// =============================================================================
// HEALTH CHECK & ROOT
// =============================================================================

// Health check endpoint
app.get('/health', async (req, res) => {
     try {
          const dbResult = await pool.query('SELECT NOW()');
          res.json({
               status: 'healthy',
               timestamp: new Date().toISOString(),
               database: 'connected',
               dbTime: dbResult.rows[0].now,
          });
     } catch (err) {
          res.status(503).json({
               status: 'unhealthy',
               timestamp: new Date().toISOString(),
               database: 'disconnected',
               error: err.message,
          });
     }
});



// Root endpoint
app.get('/', async (req, res) => {
     try {
          const result = await pool.query('SELECT NOW()');
          res.json({
               success: true,
               message: 'Shagung E-commerce API',
               version: '2.0.0',
               timestamp: result.rows[0].now,
               documentation: '/api-docs',
          });
     } catch (err) {
          res.status(500).json({
               success: false,
               message: 'Database connection error',
               error: err.message,
          });
     }
});

// =============================================================================
// API ROUTES
// =============================================================================

// Auth routes
app.use('/api/auth', authRouter);

// Category routes
app.use('/api/categories', categoryRouter);

// Product routes  
app.use('/api/products', productRouter);

// Search routes (fast cached search)
import searchRouter from './router/searchRoutes.js';
app.use('/api/search', searchRouter);

// Order routes
app.use('/api/orders', orderRouter);

// Payment routes (Stripe)
app.use('/api/payments', paymentRouter);

// Cart routes
app.use('/api/cart', cartRouter);

// Wishlist routes
app.use('/api/wishlist', wishlistRouter);

import uploadRouter from './router/uploadRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ... (existing imports)

// Coupon routes
app.use('/api/coupons', couponRouter);

// Upload routes
app.use('/api/upload', uploadRouter);

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Newsletter routes
app.use('/api/newsletter', newsletterRouter);

// Admin routes
app.use('/api/admin', adminRouter);

// Address routes
import addressRouter from './router/addressRoutes.js';
app.use('/api/addresses', addressRouter);

// Delivery/Pincode routes
import deliveryRouter from './router/deliveryRoutes.js';
app.use('/api/delivery', deliveryRouter);

// Sales routes
import salesRouter from './router/salesRoutes.js';
app.use('/api/sales', salesRouter);

// Hero routes (homepage banners and settings)
import heroRouter from './router/heroRoutes.js';
app.use('/api/hero', heroRouter);

// Careers routes (job listings and applications)
import careersRouter from './router/careersRoutes.js';
app.use('/api/careers', careersRouter);

// Blog routes (blog posts and categories)
import blogRouter from './router/blogRoutes.js';
app.use('/api/blogs', blogRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((req, res) => {
     res.status(404).json({
          success: false,
          message: `Route ${req.method} ${req.path} not found`,
     });
});

// Global error handler
app.use((err, req, res, next) => {
     console.error('❌ Unhandled error:', err);

     // Handle multer errors (file upload)
     if (err.name === 'MulterError') {
          if (err.code === 'LIMIT_FILE_SIZE') {
               return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 10MB.',
               });
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
               return res.status(400).json({
                    success: false,
                    message: 'Unexpected file field.',
               });
          }
          return res.status(400).json({
               success: false,
               message: `Upload error: ${err.message}`,
          });
     }

     // Handle specific error types
     if (err.name === 'ValidationError') {
          return res.status(400).json({
               success: false,
               message: 'Validation error',
               errors: err.errors,
          });
     }

     if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({
               success: false,
               message: 'Invalid token',
          });
     }

     if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
               success: false,
               message: 'Token expired',
          });
     }

     // Default error response
     res.status(err.status || 500).json({
          success: false,
          message: err.message || 'Internal server error',
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
     });
});

// =============================================================================
// SERVER START
// =============================================================================

app.listen(PORT, () => {
     console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🛒 Shagung E-commerce API Server Started                ║
║                                                           ║
║   📍 Local:    http://localhost:${PORT}                      ║
║   📍 Health:   http://localhost:${PORT}/health               ║
║                                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
     console.log('SIGTERM received. Shutting down gracefully...');
     process.exit(0);
});

process.on('SIGINT', () => {
     console.log('SIGINT received. Shutting down...');
     process.exit(0);
});
