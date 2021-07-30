import express from 'express';
import { getClasses } from '../controllers/classController.js';
const router = express.Router();

router.route('/').get(getClasses);
export default router;
