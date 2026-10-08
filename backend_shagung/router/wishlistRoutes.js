import express from 'express';
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    checkWishlist,
    moveToCart,
    clearWishlist,
} from '../controller/wishlistController.js';
import { RequireAuth } from '../middleware/auth.js';

const wishlistRouter = express.Router();

// All wishlist routes require authentication
wishlistRouter.use(RequireAuth);

wishlistRouter.get('/', getWishlist);
wishlistRouter.post('/', addToWishlist);
wishlistRouter.post('/toggle', toggleWishlist);
wishlistRouter.post('/move-to-cart', moveToCart);
wishlistRouter.get('/check/:productId', checkWishlist);
wishlistRouter.delete('/:productId', removeFromWishlist);
wishlistRouter.delete('/', clearWishlist);

export default wishlistRouter;
