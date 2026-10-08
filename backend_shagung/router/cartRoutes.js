import express from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartCount,
    applyCoupon,
    getAvailableCoupons,
} from '../controller/cartController.js';
import { RequireAuth } from '../middleware/auth.js';

const cartRouter = express.Router();

cartRouter.get('/coupons', getAvailableCoupons);

// All other cart routes require authentication
cartRouter.use(RequireAuth);

cartRouter.get('/', getCart);
cartRouter.post('/', addToCart);
cartRouter.get('/count', getCartCount);
cartRouter.post('/coupon', applyCoupon);
cartRouter.put('/:itemId', updateCartItem);
cartRouter.delete('/:itemId', removeFromCart);
cartRouter.delete('/', clearCart);

export default cartRouter;
