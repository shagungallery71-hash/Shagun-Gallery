import express from 'express';
import {
    createOrder,
    getUserOrders,
    getOrder,
    getOrderByNumber,
    updateOrderStatus,
    cancelOrder,
    getAllOrders,
    getOrderAdmin,
} from '../controller/orderController.js';
import { RequireAuth, PermissionAdmin } from '../middleware/auth.js';

const orderRouter = express.Router();

// Admin order routes (MUST be before :orderId routes to prevent 'admin' being matched as orderId)
orderRouter.get('/admin/all', PermissionAdmin, getAllOrders);
orderRouter.get('/admin/:orderId', PermissionAdmin, getOrderAdmin);
orderRouter.patch('/admin/:orderId/status', PermissionAdmin, updateOrderStatus);

// Order tracking (public with email verification)
orderRouter.get('/track/:orderNumber', getOrderByNumber);

// User order routes
orderRouter.post('/', RequireAuth, createOrder);
orderRouter.get('/', RequireAuth, getUserOrders);
orderRouter.get('/:orderId', RequireAuth, getOrder);
orderRouter.post('/:orderId/cancel', RequireAuth, cancelOrder);

export default orderRouter;


