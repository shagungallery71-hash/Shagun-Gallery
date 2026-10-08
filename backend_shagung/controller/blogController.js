// =============================================================================
// BLOG CONTROLLER - Comprehensive Blog Management with Caching & Pagination
// =============================================================================

import pool from "../config/dbconfig.js";
import cloudinary from "../config/cloudnary.js";
import multer from "multer";
import {
    cacheGet,
    cacheSet,
    cacheDel,
    getOrSet,
    invalidateByPatterns,
    CacheTTL,
} from "../utils/cacheService.js";
import { publishCacheInvalidation } from "../utils/cachePublisher.js";

// Multer config for image uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter(req, file, cb) {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed'), false);
        }
    }
});

export const blogUpload = upload.fields([
    { name: 'featured_image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'background_image', maxCount: 1 },
]);

// Helper: Upload buffer to Cloudinary
const uploadToCloudinary = (buffer, mimetype, folder = 'blogs') => {
    return new Promise((resolve, reject) => {
        const resourceType = mimetype.startsWith('video/') ? 'video' : 'image';
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: resourceType },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(buffer);
    });
};

// =============================================================================
// CACHE KEY GENERATORS
// =============================================================================

const BlogCacheKeys = {
    allBlogs: (page, limit, category, sort) =>
        `blogs:list:p${page}:l${limit}:c${category || 'all'}:s${sort || 'recent'}`,
    blogDetail: (id) => `blogs:detail:${id}`,
    blogBySlug: (slug) => `blogs:slug:${slug}`,
    blogCategories: () => `blogs:categories:all`,
    featuredBlogs: () => `blogs:featured`,
    recentBlogs: (limit) => `blogs:recent:${limit}`,
    categoryBlogs: (categoryId, page, limit) =>
        `blogs:category:${categoryId}:p${page}:l${limit}`,
};

// Invalidation patterns
const invalidateBlogCache = async () => {
    try {
        const patterns = [
            'blogs:*',
            'api:/api/blogs*',
        ];
        await invalidateByPatterns(patterns);
        await publishCacheInvalidation('blogs:*');
    } catch (error) {
        console.error('Blog cache invalidation error:', error);
    }
};

// =============================================================================
// PUBLIC ENDPOINTS
// =============================================================================

/**
 * Get all blogs with pagination and filtering
 * GET /api/blogs
 * Query: page, limit, category, sort (recent, popular, oldest), search
 */
export const getAllBlogs = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
        const offset = (page - 1) * limit;
        const category = req.query.category || null;
        const sort = req.query.sort || 'recent';
        const search = req.query.search || '';

        // Try cache first
        const cacheKey = BlogCacheKeys.allBlogs(page, limit, category, sort);
        const cached = await cacheGet(cacheKey);
        if (cached && !search) {
            return res.json({ ...cached, cache: true });
        }

        // Build query conditions
        let conditions = ['b.is_published = true'];
        let values = [];
        let paramIndex = 1;

        if (category) {
            conditions.push(`bc.id = $${paramIndex++}`);
            values.push(parseInt(category));
        }

        if (search) {
            conditions.push(`(b.title ILIKE $${paramIndex} OR b.excerpt ILIKE $${paramIndex} OR b.content ILIKE $${paramIndex})`);
            values.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Sort order
        let orderBy = 'b.created_at DESC';
        if (sort === 'popular') orderBy = 'b.views DESC, b.created_at DESC';
        else if (sort === 'oldest') orderBy = 'b.created_at ASC';

        // Get total count
        const countQuery = `
            SELECT COUNT(DISTINCT b.id) as total
            FROM blogs b
            LEFT JOIN blog_categories bc ON b.category_id = bc.id
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].total);

        // Get blogs - use b.* for safer column access
        const blogsQuery = `
            SELECT 
                b.*,
                bc.id as cat_id, bc.name as category_name, 
                bc.slug as category_slug, bc.color as category_color,
                bc.icon as category_icon,
                u.username as author_name, u.email as author_email
            FROM blogs b
            LEFT JOIN blog_categories bc ON b.category_id = bc.id
            LEFT JOIN users u ON b.author_id = u.id
            ${whereClause}
            ORDER BY ${orderBy}
            LIMIT $${paramIndex++} OFFSET $${paramIndex}
        `;
        values.push(limit, offset);

        const blogsResult = await pool.query(blogsQuery, values);

        // Get tags for all blogs
        const blogIds = blogsResult.rows.map(b => b.id);
        let tagsMap = {};
        if (blogIds.length > 0) {
            const tagsQuery = `
                SELECT bt.blog_id, t.id, t.name, t.slug
                FROM blog_tags bt
                JOIN tags t ON bt.tag_id = t.id
                WHERE bt.blog_id = ANY($1)
            `;
            const tagsResult = await pool.query(tagsQuery, [blogIds]);
            tagsResult.rows.forEach(tag => {
                if (!tagsMap[tag.blog_id]) tagsMap[tag.blog_id] = [];
                tagsMap[tag.blog_id].push({
                    id: tag.id,
                    name: tag.name,
                    slug: tag.slug
                });
            });
        }

        const blogs = blogsResult.rows.map(blog => ({
            id: blog.id,
            title: blog.title,
            slug: blog.slug,
            excerpt: blog.excerpt,
            featured_image: blog.featured_image,
            video_url: blog.video_url,
            background_image: blog.background_image,
            background_color: blog.background_color,
            gradient: blog.gradient,
            views: blog.views || 0,
            reading_time: blog.reading_time || 1,
            is_featured: blog.is_featured || false,
            created_at: blog.created_at,
            updated_at: blog.updated_at,
            category: blog.cat_id ? {
                id: blog.cat_id,
                name: blog.category_name,
                slug: blog.category_slug,
                color: blog.category_color,
                icon: blog.category_icon
            } : null,
            tags: tagsMap[blog.id] || [],
            author: blog.author_name ? {
                name: blog.author_name,
                email: blog.author_email
            } : null
        }));

        const response = {
            success: true,
            blogs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        };

        // Cache if no search query
        if (!search) {
            await cacheSet(cacheKey, response, CacheTTL.MEDIUM);
        }

        res.json({ ...response, cache: false });
    } catch (error) {
        console.error('❌ getAllBlogs error:', error.message);
        console.error('❌ Error details:', error.detail || error.hint || 'No additional details');
        console.error('❌ Full error:', JSON.stringify(error, null, 2));
        res.status(500).json({ success: false, message: 'Failed to fetch blogs', error: error.message });
    }
};

/**
 * Get blog by ID or slug
 * GET /api/blogs/:idOrSlug
 */
export const getBlogDetail = async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        const isId = !isNaN(parseInt(idOrSlug));

        // Try cache
        const cacheKey = isId
            ? BlogCacheKeys.blogDetail(idOrSlug)
            : BlogCacheKeys.blogBySlug(idOrSlug);
        const cached = await cacheGet(cacheKey);
        if (cached) {
            return res.json({ ...cached, cache: true });
        }

        const condition = isId ? 'b.id = $1' : 'b.slug = $1';
        const value = isId ? parseInt(idOrSlug) : idOrSlug;

        const blogQuery = `
            SELECT 
                b.*,
                bc.id as category_id, bc.name as category_name, 
                bc.slug as category_slug, bc.color as category_color,
                bc.icon as category_icon, bc.description as category_description,
                u.id as author_id, u.username as author_name, u.email as author_email
            FROM blogs b
            LEFT JOIN blog_categories bc ON b.category_id = bc.id
            LEFT JOIN users u ON b.author_id = u.id
            WHERE ${condition} AND b.is_published = true
        `;
        const blogResult = await pool.query(blogQuery, [value]);

        if (blogResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        const blog = blogResult.rows[0];

        // Get tags
        const tagsQuery = `
            SELECT t.id, t.name, t.slug
            FROM blog_tags bt
            JOIN tags t ON bt.tag_id = t.id
            WHERE bt.blog_id = $1
        `;
        const tagsResult = await pool.query(tagsQuery, [blog.id]);

        // Get related blogs (same category)
        const relatedQuery = `
            SELECT b.id, b.title, b.slug, b.excerpt, b.featured_image, b.reading_time, b.created_at
            FROM blogs b
            WHERE b.category_id = $1 AND b.id != $2 AND b.is_published = true
            ORDER BY b.created_at DESC
            LIMIT 4
        `;
        const relatedResult = await pool.query(relatedQuery, [blog.category_id, blog.id]);

        // Increment views (don't await)
        pool.query('UPDATE blogs SET views = views + 1 WHERE id = $1', [blog.id]).catch(() => { });

        const response = {
            success: true,
            blog: {
                id: blog.id,
                title: blog.title,
                slug: blog.slug,
                content: blog.content,
                excerpt: blog.excerpt,
                featured_image: blog.featured_image,
                video_url: blog.video_url,
                background_image: blog.background_image,
                background_color: blog.background_color,
                gradient: blog.gradient,
                views: blog.views,
                reading_time: blog.reading_time,
                is_featured: blog.is_featured,
                meta_title: blog.meta_title,
                meta_description: blog.meta_description,
                created_at: blog.created_at,
                updated_at: blog.updated_at,
                category: blog.category_id ? {
                    id: blog.category_id,
                    name: blog.category_name,
                    slug: blog.category_slug,
                    color: blog.category_color,
                    icon: blog.category_icon,
                    description: blog.category_description
                } : null,
                author: blog.author_id ? {
                    id: blog.author_id,
                    name: blog.author_name,
                    email: blog.author_email
                } : null,
                tags: tagsResult.rows,
                relatedBlogs: relatedResult.rows
            }
        };

        await cacheSet(cacheKey, response, CacheTTL.MEDIUM);
        res.json({ ...response, cache: false });
    } catch (error) {
        console.error('❌ getBlogDetail error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch blog' });
    }
};

/**
 * Get all blog categories
 * GET /api/blogs/categories
 */
export const getBlogCategories = async (req, res) => {
    try {
        const cacheKey = BlogCacheKeys.blogCategories();
        const cached = await cacheGet(cacheKey);
        if (cached) {
            return res.json({ ...cached, cache: true });
        }

        const query = `
            SELECT 
                bc.id, bc.name, bc.slug, 
                COALESCE(bc.description, '') as description,
                COALESCE(bc.color, '#f43f5e') as color,
                COALESCE(bc.icon, '📝') as icon,
                COALESCE(bc.position, 0) as position,
                bc.created_at, bc.updated_at,
                COUNT(b.id) FILTER (WHERE b.is_published = true) as blog_count
            FROM blog_categories bc
            LEFT JOIN blogs b ON bc.id = b.category_id
            GROUP BY bc.id, bc.name, bc.slug, bc.description, bc.color, bc.icon, bc.position, bc.created_at, bc.updated_at
            ORDER BY COALESCE(bc.position, 0) ASC, bc.name ASC
        `;
        const result = await pool.query(query);

        const response = {
            success: true,
            categories: result.rows
        };

        await cacheSet(cacheKey, response, CacheTTL.LONG);
        res.json({ ...response, cache: false });
    } catch (error) {
        console.error('❌ getBlogCategories error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
};

/**
 * Get featured blogs
 * GET /api/blogs/featured
 */
export const getFeaturedBlogs = async (req, res) => {
    try {
        const limit = Math.min(10, parseInt(req.query.limit) || 5);
        const cacheKey = BlogCacheKeys.featuredBlogs();
        const cached = await cacheGet(cacheKey);
        if (cached) {
            return res.json({ ...cached, cache: true });
        }

        const query = `
            SELECT 
                b.id, b.title, b.slug, b.excerpt, b.featured_image,
                b.video_url, b.background_image, b.background_color,
                b.gradient, b.views, b.reading_time, b.created_at,
                bc.name as category_name, bc.color as category_color,
                bc.slug as category_slug
            FROM blogs b
            LEFT JOIN blog_categories bc ON b.category_id = bc.id
            WHERE b.is_published = true AND b.is_featured = true
            ORDER BY b.created_at DESC
            LIMIT $1
        `;
        const result = await pool.query(query, [limit]);

        const response = {
            success: true,
            blogs: result.rows.map(b => ({
                ...b,
                category: b.category_name ? {
                    name: b.category_name,
                    color: b.category_color,
                    slug: b.category_slug
                } : null
            }))
        };

        await cacheSet(cacheKey, response, CacheTTL.MEDIUM);
        res.json({ ...response, cache: false });
    } catch (error) {
        console.error('❌ getFeaturedBlogs error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch featured blogs' });
    }
};

/**
 * Get blogs by category
 * GET /api/blogs/category/:categorySlug
 */
export const getBlogsByCategory = async (req, res) => {
    try {
        const { categorySlug } = req.params;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
        const offset = (page - 1) * limit;

        // Get category first
        const categoryResult = await pool.query(
            'SELECT * FROM blog_categories WHERE slug = $1',
            [categorySlug]
        );
        if (categoryResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        const category = categoryResult.rows[0];

        const cacheKey = BlogCacheKeys.categoryBlogs(category.id, page, limit);
        const cached = await cacheGet(cacheKey);
        if (cached) {
            return res.json({ ...cached, cache: true });
        }

        // Get total count
        const countResult = await pool.query(
            'SELECT COUNT(*) as total FROM blogs WHERE category_id = $1 AND is_published = true',
            [category.id]
        );
        const total = parseInt(countResult.rows[0].total);

        // Get blogs
        const blogsQuery = `
            SELECT 
                b.id, b.title, b.slug, b.excerpt, b.featured_image,
                b.video_url, b.views, b.reading_time, b.created_at,
                u.username as author_name
            FROM blogs b
            LEFT JOIN users u ON b.author_id = u.id
            WHERE b.category_id = $1 AND b.is_published = true
            ORDER BY b.created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const blogsResult = await pool.query(blogsQuery, [category.id, limit, offset]);

        const response = {
            success: true,
            category,
            blogs: blogsResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        };

        await cacheSet(cacheKey, response, CacheTTL.MEDIUM);
        res.json({ ...response, cache: false });
    } catch (error) {
        console.error('❌ getBlogsByCategory error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch blogs' });
    }
};

// =============================================================================
// ADMIN ENDPOINTS
// =============================================================================

/**
 * Get all blogs for admin (including drafts)
 * GET /api/blogs/admin/all
 */
export const getAllBlogsAdmin = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const status = req.query.status; // 'published', 'draft', or null for all
        const search = req.query.search || '';

        let conditions = [];
        let values = [];
        let paramIndex = 1;

        if (status === 'published') {
            conditions.push('b.is_published = true');
        } else if (status === 'draft') {
            conditions.push('b.is_published = false');
        }

        if (search) {
            conditions.push(`(b.title ILIKE $${paramIndex} OR b.content ILIKE $${paramIndex})`);
            values.push(`%${search}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Count
        const countQuery = `SELECT COUNT(*) as total FROM blogs b ${whereClause}`;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].total);

        // Get blogs
        const blogsQuery = `
            SELECT 
                b.*,
                bc.name as category_name, bc.slug as category_slug,
                u.username as author_name, u.email as author_email
            FROM blogs b
            LEFT JOIN blog_categories bc ON b.category_id = bc.id
            LEFT JOIN users u ON b.author_id = u.id
            ${whereClause}
            ORDER BY b.updated_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex}
        `;
        values.push(limit, offset);
        const blogsResult = await pool.query(blogsQuery, values);

        res.json({
            success: true,
            blogs: blogsResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total
            }
        });
    } catch (error) {
        console.error('❌ getAllBlogsAdmin error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch blogs' });
    }
};

/**
 * Create a new blog
 * POST /api/blogs/admin
 */
export const createBlog = async (req, res) => {
    try {
        const {
            title, content, excerpt, category_id, is_published = false,
            is_featured = false, background_color, gradient,
            meta_title, meta_description, tags = []
        } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        // Generate slug
        let slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        // Check for duplicate slug
        const slugCheck = await pool.query(
            'SELECT id FROM blogs WHERE slug = $1',
            [slug]
        );
        if (slugCheck.rows.length > 0) {
            slug = `${slug}-${Date.now()}`;
        }

        // Calculate reading time (avg 200 words per minute)
        const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
        const readingTime = Math.max(1, Math.ceil(wordCount / 200));

        // Handle file uploads
        let featuredImage = null;
        let videoUrl = null;
        let backgroundImage = null;

        if (req.files) {
            if (req.files.featured_image?.[0]) {
                const result = await uploadToCloudinary(
                    req.files.featured_image[0].buffer,
                    req.files.featured_image[0].mimetype,
                    'blogs/featured'
                );
                featuredImage = result.secure_url;
            }
            if (req.files.video?.[0]) {
                const result = await uploadToCloudinary(
                    req.files.video[0].buffer,
                    req.files.video[0].mimetype,
                    'blogs/videos'
                );
                videoUrl = result.secure_url;
            }
            if (req.files.background_image?.[0]) {
                const result = await uploadToCloudinary(
                    req.files.background_image[0].buffer,
                    req.files.background_image[0].mimetype,
                    'blogs/backgrounds'
                );
                backgroundImage = result.secure_url;
            }
        }

        // Insert blog
        const insertQuery = `
            INSERT INTO blogs (
                title, slug, content, excerpt, featured_image, video_url,
                background_image, background_color, gradient,
                category_id, author_id, is_published, is_featured,
                reading_time, meta_title, meta_description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        `;
        const result = await pool.query(insertQuery, [
            title, slug, content, excerpt || null, featuredImage, videoUrl,
            backgroundImage, background_color || null, gradient || null,
            category_id || null, req.user.id, is_published, is_featured,
            readingTime, meta_title || title, meta_description || excerpt
        ]);

        const blog = result.rows[0];

        // Handle tags
        // Handle tags
        if (tags.length > 0) {
            for (const tagName of tags) {
                const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

                // First try to find existing tag by name or slug
                let tagResult = await pool.query(
                    'SELECT id FROM tags WHERE name = $1 OR slug = $2',
                    [tagName, tagSlug]
                );

                let tagId;
                if (tagResult.rows.length > 0) {
                    tagId = tagResult.rows[0].id;
                } else {
                    // Try to insert, handle race condition if needed (though unlikely here)
                    try {
                        const createResult = await pool.query(
                            'INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING id',
                            [tagName, tagSlug]
                        );
                        tagId = createResult.rows[0].id;
                    } catch (err) {
                        // If insertion fails (race condition), fetch again
                        const retryResult = await pool.query(
                            'SELECT id FROM tags WHERE name = $1 OR slug = $2',
                            [tagName, tagSlug]
                        );
                        if (retryResult.rows.length > 0) {
                            tagId = retryResult.rows[0].id;
                        }
                    }
                }

                if (tagId) {
                    // Link tag to blog
                    await pool.query(
                        'INSERT INTO blog_tags (blog_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [blog.id, tagId]
                    );
                }
            }
        }

        await invalidateBlogCache();

        res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            blog
        });
    } catch (error) {
        console.error('❌ createBlog error:', error);
        res.status(500).json({ success: false, message: 'Failed to create blog' });
    }
};

/**
 * Update a blog
 * PUT /api/blogs/admin/:id
 */
export const updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, content, excerpt, category_id, is_published,
            is_featured, background_color, gradient,
            meta_title, meta_description, tags = [],
            remove_featured_image, remove_video, remove_background_image
        } = req.body;

        // Check if blog exists
        const existing = await pool.query('SELECT * FROM blogs WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        const blog = existing.rows[0];

        // Handle file uploads
        let featuredImage = blog.featured_image;
        let videoUrl = blog.video_url;
        let backgroundImage = blog.background_image;

        if (remove_featured_image === 'true' || remove_featured_image === true) {
            featuredImage = null;
        }
        if (remove_video === 'true' || remove_video === true) {
            videoUrl = null;
        }
        if (remove_background_image === 'true' || remove_background_image === true) {
            backgroundImage = null;
        }

        if (req.files) {
            if (req.files.featured_image?.[0]) {
                const result = await uploadToCloudinary(
                    req.files.featured_image[0].buffer,
                    req.files.featured_image[0].mimetype,
                    'blogs/featured'
                );
                featuredImage = result.secure_url;
            }
            if (req.files.video?.[0]) {
                const result = await uploadToCloudinary(
                    req.files.video[0].buffer,
                    req.files.video[0].mimetype,
                    'blogs/videos'
                );
                videoUrl = result.secure_url;
            }
            if (req.files.background_image?.[0]) {
                const result = await uploadToCloudinary(
                    req.files.background_image[0].buffer,
                    req.files.background_image[0].mimetype,
                    'blogs/backgrounds'
                );
                backgroundImage = result.secure_url;
            }
        }

        // Calculate reading time if content changed
        let readingTime = blog.reading_time;
        if (content && content !== blog.content) {
            const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
            readingTime = Math.max(1, Math.ceil(wordCount / 200));
        }

        // Update blog
        const updateQuery = `
            UPDATE blogs SET
                title = COALESCE($1, title),
                content = COALESCE($2, content),
                excerpt = COALESCE($3, excerpt),
                featured_image = $4,
                video_url = $5,
                background_image = $6,
                background_color = COALESCE($7, background_color),
                gradient = COALESCE($8, gradient),
                category_id = COALESCE($9, category_id),
                is_published = COALESCE($10, is_published),
                is_featured = COALESCE($11, is_featured),
                reading_time = $12,
                meta_title = COALESCE($13, meta_title),
                meta_description = COALESCE($14, meta_description),
                updated_at = NOW()
            WHERE id = $15
            RETURNING *
        `;
        const result = await pool.query(updateQuery, [
            title, content, excerpt, featuredImage, videoUrl,
            backgroundImage, background_color, gradient, category_id,
            is_published, is_featured, readingTime,
            meta_title, meta_description, id
        ]);

        // Update tags if provided
        if (tags && tags.length > 0) {
            // Remove existing tags
            await pool.query('DELETE FROM blog_tags WHERE blog_id = $1', [id]);

            // Add new tags - support both tag IDs (numbers) and tag names (strings)
            for (const tag of tags) {
                let tagId;

                // Check if tag is a numeric ID or a string name
                const isNumericId = typeof tag === 'number' || (typeof tag === 'string' && !isNaN(parseInt(tag)) && String(parseInt(tag)) === tag);

                if (isNumericId) {
                    // Tag is an ID, verify it exists in the database
                    const numericTagId = typeof tag === 'number' ? tag : parseInt(tag);
                    const existingTag = await pool.query(
                        'SELECT id FROM tags WHERE id = $1',
                        [numericTagId]
                    );
                    if (existingTag.rows.length > 0) {
                        tagId = existingTag.rows[0].id;
                    }
                } else {
                    // Tag is a name, look up or create
                    const tagName = String(tag);
                    const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

                    // First try to find existing tag by name or slug
                    let tagResult = await pool.query(
                        'SELECT id FROM tags WHERE name = $1 OR slug = $2',
                        [tagName, tagSlug]
                    );

                    if (tagResult.rows.length > 0) {
                        tagId = tagResult.rows[0].id;
                    } else {
                        // Try to insert
                        try {
                            const createResult = await pool.query(
                                'INSERT INTO tags (name, slug) VALUES ($1, $2) RETURNING id',
                                [tagName, tagSlug]
                            );
                            tagId = createResult.rows[0].id;
                        } catch (err) {
                            // If insertion fails (race condition or constraint violation), fetch again
                            const retryResult = await pool.query(
                                'SELECT id FROM tags WHERE name = $1 OR slug = $2',
                                [tagName, tagSlug]
                            );
                            if (retryResult.rows.length > 0) {
                                tagId = retryResult.rows[0].id;
                            }
                        }
                    }
                }

                if (tagId) {
                    await pool.query(
                        'INSERT INTO blog_tags (blog_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [id, tagId]
                    );
                }
            }
        }

        await invalidateBlogCache();

        res.json({
            success: true,
            message: 'Blog updated successfully',
            blog: result.rows[0]
        });
    } catch (error) {
        console.error('❌ updateBlog error:', error.message);
        console.error('❌ Error details:', error.detail || error.hint || 'No details');
        console.error('❌ Full error:', JSON.stringify(error, null, 2));
        res.status(500).json({ success: false, message: 'Failed to update blog', error: error.message });
    }
};

/**
 * Delete a blog
 * DELETE /api/blogs/admin/:id
 */
export const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM blogs WHERE id = $1 RETURNING id, title',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        await invalidateBlogCache();

        res.json({
            success: true,
            message: 'Blog deleted successfully',
            deleted: result.rows[0]
        });
    } catch (error) {
        console.error('❌ deleteBlog error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete blog' });
    }
};

/**
 * Toggle blog publish status
 * PATCH /api/blogs/admin/:id/publish
 */
export const togglePublish = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE blogs 
            SET is_published = NOT is_published, updated_at = NOW()
            WHERE id = $1
            RETURNING id, title, is_published
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        await invalidateBlogCache();

        res.json({
            success: true,
            message: result.rows[0].is_published ? 'Blog published' : 'Blog unpublished',
            blog: result.rows[0]
        });
    } catch (error) {
        console.error('❌ togglePublish error:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle publish status' });
    }
};

/**
 * Toggle blog featured status
 * PATCH /api/blogs/admin/:id/featured
 */
export const toggleFeatured = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE blogs 
            SET is_featured = NOT is_featured, updated_at = NOW()
            WHERE id = $1
            RETURNING id, title, is_featured
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        await invalidateBlogCache();

        res.json({
            success: true,
            message: result.rows[0].is_featured ? 'Blog marked as featured' : 'Blog removed from featured',
            blog: result.rows[0]
        });
    } catch (error) {
        console.error('❌ toggleFeatured error:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle featured status' });
    }
};

// =============================================================================
// CATEGORY MANAGEMENT (Admin)
// =============================================================================

/**
 * Create blog category
 * POST /api/blogs/admin/categories
 */
export const createBlogCategory = async (req, res) => {
    try {
        const { name, description, color, icon, position } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const result = await pool.query(`
            INSERT INTO blog_categories (name, slug, description, color, icon, position)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [name, slug, description || null, color || '#f43f5e', icon || '📝', position || 0]);

        await invalidateBlogCache();

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('❌ createBlogCategory error:', error);
        res.status(500).json({ success: false, message: 'Failed to create category' });
    }
};

/**
 * Update blog category
 * PUT /api/blogs/admin/categories/:id
 */
export const updateBlogCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, color, icon, position } = req.body;

        const result = await pool.query(`
            UPDATE blog_categories SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                color = COALESCE($3, color),
                icon = COALESCE($4, icon),
                position = COALESCE($5, position),
                updated_at = NOW()
            WHERE id = $6
            RETURNING *
        `, [name, description, color, icon, position, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await invalidateBlogCache();

        res.json({
            success: true,
            message: 'Category updated successfully',
            category: result.rows[0]
        });
    } catch (error) {
        console.error('❌ updateBlogCategory error:', error);
        res.status(500).json({ success: false, message: 'Failed to update category' });
    }
};

/**
 * Delete blog category
 * DELETE /api/blogs/admin/categories/:id
 */
export const deleteBlogCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category has blogs
        const blogsCheck = await pool.query(
            'SELECT COUNT(*) as count FROM blogs WHERE category_id = $1',
            [id]
        );

        if (parseInt(blogsCheck.rows[0].count) > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with existing blogs. Move or delete blogs first.'
            });
        }

        const result = await pool.query(
            'DELETE FROM blog_categories WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await invalidateBlogCache();

        res.json({
            success: true,
            message: 'Category deleted successfully',
            deleted: result.rows[0]
        });
    } catch (error) {
        console.error('❌ deleteBlogCategory error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete category' });
    }
};

export default {
    blogUpload,
    getAllBlogs,
    getBlogDetail,
    getBlogCategories,
    getFeaturedBlogs,
    getBlogsByCategory,
    getAllBlogsAdmin,
    createBlog,
    updateBlog,
    deleteBlog,
    togglePublish,
    toggleFeatured,
    createBlogCategory,
    updateBlogCategory,
    deleteBlogCategory
};
