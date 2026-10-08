import express from 'express';
import {
    createPaymentIntent,
    confirmPayment,
    getPaymentStatus,
    handleWebhook,
    createRefund,
    getPaymentMethods,
    getOrCreateCustomer,
    getPaymentServiceStatus,
    getPaymentOffers,
} from '../controller/paymentController.js';
import { RequireAuth, PermissionAdmin } from '../middleware/auth.js';

const paymentRouter = express.Router();

// Cashfree webhook (needs JSON body parsing)
paymentRouter.post('/webhook', handleWebhook);

// Payment service status (public)
paymentRouter.get('/status', getPaymentServiceStatus);

// Public routes (require auth)
paymentRouter.get('/offers', RequireAuth, getPaymentOffers);
paymentRouter.post('/create-intent', RequireAuth, createPaymentIntent);
paymentRouter.post('/verify', RequireAuth, confirmPayment);
paymentRouter.post('/confirm', RequireAuth, confirmPayment); // Alias
paymentRouter.get('/status/:paymentIntentId', RequireAuth, getPaymentStatus);
paymentRouter.get('/methods', RequireAuth, getPaymentMethods);
paymentRouter.post('/customer', RequireAuth, getOrCreateCustomer);

// Admin routes
paymentRouter.post('/refund', PermissionAdmin, createRefund);

export default paymentRouter;
