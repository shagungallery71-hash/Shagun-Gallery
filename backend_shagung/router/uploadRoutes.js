import express from 'express';
import { upload, uploadImage } from '../controller/uploadController.js';
import { PermissionAdmin } from '../middleware/auth.js';

const uploadRouter = express.Router();

// Upload route (Admin only)
uploadRouter.post('/', PermissionAdmin, upload.single('image'), uploadImage);

export default uploadRouter;
