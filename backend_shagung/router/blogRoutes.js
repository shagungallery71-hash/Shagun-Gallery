// =============================================================================
// BLOG ROUTES - Public & Admin Blog API Routes
// =============================================================================

import express from 'express';
import { PermissionAdmin } from '../middleware/auth.js';
import {
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
} from '../controller/blogController.js';
import { cacheMiddleware, CacheTTL } from '../utils/cacheService.js';

const blogRouter = express.Router();

// =============================================================================
// PUBLIC ROUTES (with caching)
// =============================================================================

// Get all blogs with pagination and filtering
// GET /api/blogs?page=1&limit=12&category=1&sort=recent&search=keyword
blogRouter.get('/', cacheMiddleware(CacheTTL.MEDIUM), getAllBlogs);

// Get blog categories (for navigation/sidebar)
// GET /api/blogs/categories
blogRouter.get('/categories', cacheMiddleware(CacheTTL.LONG), getBlogCategories);

// Get featured blogs
// GET /api/blogs/featured
blogRouter.get('/featured', cacheMiddleware(CacheTTL.MEDIUM), getFeaturedBlogs);

// Get blogs by category slug
// GET /api/blogs/category/:categorySlug
blogRouter.get('/category/:categorySlug', cacheMiddleware(CacheTTL.MEDIUM), getBlogsByCategory);

// Get single blog by ID or slug (must be last to avoid route conflicts)
// GET /api/blogs/:idOrSlug
blogRouter.get('/:idOrSlug', cacheMiddleware(CacheTTL.MEDIUM), getBlogDetail);

// =============================================================================
// ADMIN ROUTES (protected)
// =============================================================================

// Get all blogs for admin (including drafts)
// GET /api/blogs/admin/all
blogRouter.get('/admin/all', PermissionAdmin, getAllBlogsAdmin);

// Create blog
// POST /api/blogs/admin
blogRouter.post('/admin', PermissionAdmin, blogUpload, createBlog);

// Update blog
// PUT /api/blogs/admin/:id
blogRouter.put('/admin/:id', PermissionAdmin, blogUpload, updateBlog);

// Delete blog
// DELETE /api/blogs/admin/:id
blogRouter.delete('/admin/:id', PermissionAdmin, deleteBlog);

// Toggle publish status
// PATCH /api/blogs/admin/:id/publish
blogRouter.patch('/admin/:id/publish', PermissionAdmin, togglePublish);

// Toggle featured status
// PATCH /api/blogs/admin/:id/featured
blogRouter.patch('/admin/:id/featured', PermissionAdmin, toggleFeatured);

// =============================================================================
// CATEGORY MANAGEMENT (Admin)
// =============================================================================

// Create category
// POST /api/blogs/admin/categories
blogRouter.post('/admin/categories', PermissionAdmin, createBlogCategory);

// Update category
// PUT /api/blogs/admin/categories/:id
blogRouter.put('/admin/categories/:id', PermissionAdmin, updateBlogCategory);

// Delete category
// DELETE /api/blogs/admin/categories/:id
blogRouter.delete('/admin/categories/:id', PermissionAdmin, deleteBlogCategory);

export default blogRouter;
