import express from 'express';
import { buyerProfileController } from '../controllers/buyerProfileController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', buyerProfileController.getProfile);
router.post('/', buyerProfileController.updateProfile);
router.put('/', buyerProfileController.updateProfile);
router.get('/status', buyerProfileController.getStatus);

export default router;
