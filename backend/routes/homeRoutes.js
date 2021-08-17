import express from 'express';
import { getCarouselImages } from '../controllers/homeController.js';
const router = express.Router();

router.route('/carousel').get(getCarouselImages);

export default router;
