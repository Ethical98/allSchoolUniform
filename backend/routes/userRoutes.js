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
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
} from '../controllers/userController.js';
import { protect, isAdmin } from '../Middleware/authMiddleware.js';

router.route('/').post(registerUser).get(protect, isAdmin, getUsers);
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

router
  .route('/:id')
  .delete(protect, isAdmin, deleteUser)
  .get(protect, isAdmin, getUserById)
  .put(protect, isAdmin, updateUser);

export default router;
