import express from 'express';
const router = express.Router();
import {
    authUser,
    getUserProfile,
    registerUser,
    authUserByPhone,
    updateUserProfile,
    getUserPhone,
    authUserByOTP,
    forgotPassword,
    resetPassword,
    getUsers,
    deleteUser,
    getUserById,
    updateUser,
    getShippingAddress,
    saveUserShippingAddress,
    updateShippingAddress,
    deleteShippingAddress,
    getCurrentUser,
    logout,
} from '../controllers/userController.js';
import { protect, isAdmin } from '../Middleware/authMiddleware.js';

// ✅ MAIN ROUTES
router.route('/').post(registerUser).get(protect, isAdmin, getUsers);

// ✅ AUTH ROUTES
router.post('/login', authUser);
router.post('/loginByPhone', authUserByPhone);
router.post('/loginByOtp', authUserByOTP);
router.post('/logout', logout);
router.get('/me', protect, getCurrentUser);
router.post('/getUserPhone', getUserPhone);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);

// ✅ USER PROFILE ROUTES
router
    .route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// ✅ SHIPPING ADDRESS ROUTES - GROUPED TOGETHER
// Base routes (GET all, POST new)
router
    .route('/shippingAddress')
    .get(protect, getShippingAddress)
    .post(protect, saveUserShippingAddress);

// Dynamic routes with ID (PUT update, DELETE remove)
router
    .route('/shippingAddress/:addressId')
    .put(protect, updateShippingAddress)
    .delete(protect, deleteShippingAddress);

// ✅ USER ID ROUTES (MUST BE LAST - CATCH-ALL)
router
    .route('/:id')
    .delete(protect, isAdmin, deleteUser)
    .get(protect, isAdmin, getUserById)
    .put(protect, isAdmin, updateUser);

export default router;
