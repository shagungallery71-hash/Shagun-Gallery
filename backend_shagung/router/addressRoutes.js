import express from 'express';
import {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} from '../controller/addressController.js';
import { RequireAuth } from '../middleware/auth.js';

const addressRouter = express.Router();

// All address routes require authentication
addressRouter.use(RequireAuth);

addressRouter.get('/', getAddresses);
addressRouter.post('/', addAddress);
addressRouter.put('/:addressId', updateAddress);
addressRouter.delete('/:addressId', deleteAddress);
addressRouter.patch('/:addressId/default', setDefaultAddress);
addressRouter.put('/:addressId/default', setDefaultAddress);

export default addressRouter;
