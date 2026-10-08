import express from 'express';
import { PermissionAdmin } from '../middleware/auth.js';
import {
    getAllCustomers,
    getCustomer,
    getAllUsers,
    toggleUserVerified,
    updateUserRole,
    getAllReviews,
    approveReview,
    deleteReview,
    getDashboardStats,
    getDatabaseStats,
    clearCache,
    getCacheStats,
    exportDatabase,
    exportRedis,
    runHeroMigration,
} from '../controller/adminController.js';
import { seedDatabase } from '../controller/seedController.js';

const adminRouter = express.Router();

// All admin routes require admin permission
adminRouter.use(PermissionAdmin);

// Dashboard
adminRouter.get('/stats', getDashboardStats);
adminRouter.get('/database-stats', getDatabaseStats);
adminRouter.get('/cache-stats', getCacheStats);
adminRouter.post('/clear-cache', clearCache);

// Export/Backup
adminRouter.get('/export/database', exportDatabase);
adminRouter.get('/export/redis', exportRedis);

// User Management (all users including admins)
adminRouter.get('/users', getAllUsers);
adminRouter.patch('/users/:id/verify', toggleUserVerified);
adminRouter.patch('/users/:id/role', updateUserRole);

// Customers (non-admin users)
adminRouter.get('/customers', getAllCustomers);
adminRouter.get('/customers/:id', getCustomer);

// Reviews
adminRouter.get('/reviews', getAllReviews);
adminRouter.patch('/reviews/:id/approve', approveReview);
adminRouter.delete('/reviews/:id', deleteReview);

// Seed database (admin only) - POST /api/admin/seed
adminRouter.post('/seed', seedDatabase);

// Run hero tables migration - POST /api/admin/migrate-hero
adminRouter.post('/migrate-hero', runHeroMigration);

export default adminRouter;
