import express from 'express';
const router = express.Router();
import {
  authUser,
  getOtp,
  getUserProfile,
  verifyOtp,
  registerUser,
  authUserByPhone,
  updateUserProfile,
  getUserPhone,
  authUserByOTP,
} from '../controllers/userController.js';
import { protect } from '../Middleware/authMiddleware.js';

router.route('/').post(registerUser);
router.post('/loginByPhone', authUserByPhone);
router.post('/getUserPhone', getUserPhone);
router.post('/login', authUser);
router.post('/getOtp', getOtp);
router.post('/verifyOtp', verifyOtp);
router.post('/loginByOtp', authUserByOTP);

router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

export default router;
