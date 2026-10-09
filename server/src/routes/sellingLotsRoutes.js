import express from 'express';
import { sellingLotsController } from '../controllers/sellingLotsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Allow authenticated buyers to browse and filter active selling lots
router.use(requireAuth);

router.get('/', sellingLotsController.getLots);
router.get('/crops/distinct', sellingLotsController.getDistinctCrops);
router.get('/:id', sellingLotsController.getLotById);

export default router;
