import express from 'express';
import {
    searchProducts,
    searchSuggestions,
    getTrendingSearches,
    clearSearchCache
} from '../controller/searchController.js';
import { PermissionAdmin } from '../middleware/auth.js';

const router = express.Router();

// =============================================================================
// PUBLIC SEARCH ROUTES - No authentication required
// =============================================================================

/**
 * @route   GET /api/search
 * @desc    Search products with filters, pagination, and relevance scoring
 * @query   q (search query), category, minPrice, maxPrice, limit, page
 * @access  Public
 */
router.get('/', searchProducts);

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions for autocomplete
 * @query   q (search query)
 * @access  Public
 */
router.get('/suggestions', searchSuggestions);

/**
 * @route   GET /api/search/trending
 * @desc    Get trending/popular searches
 * @access  Public
 */
router.get('/trending', getTrendingSearches);

// =============================================================================
// ADMIN ROUTES - Authentication required
// =============================================================================

/**
 * @route   POST /api/search/cache/clear
 * @desc    Clear search cache (admin only)
 * @access  Admin
 */
router.post('/cache/clear', PermissionAdmin, clearSearchCache);

export default router;
