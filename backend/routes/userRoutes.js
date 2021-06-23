import express from 'express';
const router = express.Router();
import {
  saveUserShippingAddress,
  authUser,
  getUserProfile,
  registerUser,
  authUserByPhone,
  updateUserProfile,
  getUserPhone,
  authUserByOTP,
  getShipppingAddress,
  forgotPassword,
  resetPassword,
} from '../controllers/userController.js';
import { protect } from '../Middleware/authMiddleware.js';

router.route('/').post(registerUser);
router.post('/loginByPhone', authUserByPhone);
router.post('/getUserPhone', getUserPhone);
router.post('/login', authUser);
router.post('/forgotPassword', forgotPassword);
router.post('/resetPassword', resetPassword);

router.post('/loginByOtp', authUserByOTP);
router
  .route('/shippingAddress')
  .get(protect, getShipppingAddress)
  .post(protect, saveUserShippingAddress);

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;
