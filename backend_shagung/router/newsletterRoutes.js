import express from 'express';
import {
    subscribe,
    unsubscribe,
    getSubscribers,
    exportSubscribers,
} from '../controller/newsletterController.js';
import { PermissionAdmin } from '../middleware/auth.js';

const newsletterRouter = express.Router();

// Public routes
newsletterRouter.post('/', subscribe);
newsletterRouter.delete('/', unsubscribe);

// Admin routes
newsletterRouter.get('/subscribers', PermissionAdmin, getSubscribers);
newsletterRouter.get('/export', PermissionAdmin, exportSubscribers);

export default newsletterRouter;
