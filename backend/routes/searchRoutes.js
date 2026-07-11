import express from 'express';
import {
    universalSearch,
    getSearchSuggestions,
} from '../controllers/searchController.js';

const router = express.Router();

// Public search endpoints
router.route('/').get(universalSearch);
router.route('/suggestions').get(getSearchSuggestions);

export default router;
