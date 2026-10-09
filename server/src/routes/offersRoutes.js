import express from 'express';
import { offersController } from '../controllers/offersController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', offersController.getOffers);
router.post('/', offersController.createOffer);
router.get('/:id', offersController.getOfferById);
router.post('/:id/counter', offersController.counterOffer);
router.post('/:id/accept', offersController.acceptOffer);
router.post('/:id/reject', offersController.rejectOffer);
router.post('/:id/withdraw', offersController.withdrawOffer);

export default router;
