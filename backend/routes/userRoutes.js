import express from 'express';
const router = express.Router();
import {
  saveUserShippingAddress,
  authUser,
  // getOtp,
  getUserProfile,
  // verifyOtp,
  registerUser,
  authUserByPhone,
  updateUserProfile,
  getUserPhone,
  authUserByOTP,
  getShipppingAddress,
} from '../controllers/userController.js';
import { protect } from '../Middleware/authMiddleware.js';

router.route('/').post(registerUser);
router.post('/loginByPhone', authUserByPhone);
router.post('/getUserPhone', getUserPhone);
router.post('/login', authUser);
// router.post('/getOtp', getOtp);
// router.post('/verifyOtp', verifyOtp);
router.post('/loginByOtp', authUserByOTP);
router
  .route('/shippingAddress')
  .get(protect, getShipppingAddress)
  .post(protect, saveUserShippingAddress);
// router.route('/saveShippingAddress')().
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;
