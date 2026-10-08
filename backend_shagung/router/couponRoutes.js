import express from 'express';
import { PermissionAdmin } from '../middleware/auth.js';
import {
    getAllCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    getAnalytics,
} from '../controller/couponController.js';

const couponRouter = express.Router();

// All routes require admin permission
couponRouter.use(PermissionAdmin);

// Coupon CRUD
couponRouter.get('/', getAllCoupons);
couponRouter.post('/', createCoupon);
couponRouter.put('/:id', updateCoupon);
couponRouter.delete('/:id', deleteCoupon);
couponRouter.patch('/:id/toggle', toggleCouponStatus);

// Analytics
couponRouter.get('/analytics', getAnalytics);

export default couponRouter;
