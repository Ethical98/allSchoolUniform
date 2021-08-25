import express from 'express';
import {
  addAnnouncement,
  addCarouselImages,
  deleteAnnouncement,
  deleteCarouselImages,
  getAnnouncement,
  getCarouselImages,
  getHeaderBackground,
  getStatistics,
  updateAnnouncement,
  updateCarouselImages,
  updateHeaderBackground,
  updateStatistics,
} from '../controllers/homeController.js';
import { isAdmin, protect } from '../Middleware/authMiddleware.js';

const router = express.Router();

router
  .route('/carousel')
  .get(getCarouselImages)
  .put(protect, isAdmin, updateCarouselImages)
  .post(protect, isAdmin, addCarouselImages);

router.route('/carousel/:id').delete(protect, isAdmin, deleteCarouselImages);
router
  .route('/statistics')
  .get(getStatistics)
  .put(protect, isAdmin, updateStatistics);

router
  .route('/header')
  .get(getHeaderBackground)
  .put(protect, isAdmin, updateHeaderBackground);

router
  .route('/announcement')
  .get(getAnnouncement)
  .put(protect, isAdmin, updateAnnouncement)
  .post(protect, isAdmin, addAnnouncement);
router.route('/announcement/:id').delete(protect, isAdmin, deleteAnnouncement);

export default router;
