import { Router } from "express";
import {
    UserLoginController,
    UserRegisterController,
    UserVerifyController,
    ForgetPasswordController,
    ResetPasswordController,
    VerifyOtpController, // Added
    DeleteUserController,
    CreateAdminController
} from '../controller/auth.js';
import { RegisterValidation } from "../middleware/validator.js";
import { PermissionAdmin } from './../middleware/auth.js'

const router = Router();

router.post('/login', UserLoginController);
router.post('/register', RegisterValidation, UserRegisterController);
router.get('/verify-email', UserVerifyController);
router.post('/forget-password', ForgetPasswordController);
router.post('/verify-otp', VerifyOtpController); // Added
router.post('/reset-password', ResetPasswordController);

// Admin-only auth routes
router.post('/admin/create', PermissionAdmin, CreateAdminController);
router.delete('/delete/user', PermissionAdmin, DeleteUserController);

export default router;  
