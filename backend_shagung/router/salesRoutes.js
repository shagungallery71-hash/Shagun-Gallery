// =============================================================================
// SALES ROUTES
// =============================================================================

import express from 'express';
import {
    getAllSales,
    getActiveSales,
    getSaleById,
    createSale,
    updateSale,
    deleteSale,
    getSaleProducts,
    addProductToSale,
    removeProductFromSale,
    getProductSaleStatus,
    bulkAddProductsToSale
} from '../controller/salesController.js';
import { PermissionAdmin } from '../middleware/auth.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// =============================================================================
// PUBLIC ROUTES (with 1 hour caching for home page performance)
// =============================================================================

/**
 * @route   GET /api/sales/active
 * @desc    Get all active sales (for public display)
 * @access  Public
 */
router.get('/active', cacheMiddleware(3600), getActiveSales);

/**
 * @route   GET /api/sales/products
 * @desc    Get products on sale
 * @access  Public
 */
router.get('/products', cacheMiddleware(3600), getSaleProducts);

/**
 * @route   GET /api/sales/product/:product_id/status
 * @desc    Check if a product is on sale
 * @access  Public
 */
router.get('/product/:product_id/status', cacheMiddleware(3600), getProductSaleStatus);

/**
 * @route   GET /api/sales/:id
 * @desc    Get sale by ID or slug
 * @access  Public
 */
router.get('/:id', cacheMiddleware(3600), getSaleById);

// =============================================================================
// ADMIN ROUTES (Protected)
// =============================================================================

/**
 * @route   GET /api/sales
 * @desc    Get all sales (admin view)
 * @access  Admin
 */
router.get('/', PermissionAdmin, getAllSales);

/**
 * @route   POST /api/sales
 * @desc    Create a new sale
 * @access  Admin
 */
router.post('/', PermissionAdmin, createSale);

/**
 * @route   PUT /api/sales/:id
 * @desc    Update a sale
 * @access  Admin
 */
router.put('/:id', PermissionAdmin, updateSale);

/**
 * @route   DELETE /api/sales/:id
 * @desc    Delete a sale
 * @access  Admin
 */
router.delete('/:id', PermissionAdmin, deleteSale);

/**
 * @route   POST /api/sales/products/add
 * @desc    Add a product to a sale
 * @access  Admin
 */
router.post('/products/add', PermissionAdmin, addProductToSale);

/**
 * @route   POST /api/sales/products/remove
 * @desc    Remove a product from a sale
 * @access  Admin
 */
router.post('/products/remove', PermissionAdmin, removeProductFromSale);

/**
 * @route   POST /api/sales/products/bulk-add
 * @desc    Bulk add products to a sale
 * @access  Admin
 */
router.post('/products/bulk-add', PermissionAdmin, bulkAddProductsToSale);

export default router;
