import express from 'express';
import { buyingRequirementsController } from '../controllers/buyingRequirementsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', buyingRequirementsController.getRequirements);
router.post('/', buyingRequirementsController.createRequirement);
router.get('/:id', buyingRequirementsController.getRequirementById);
router.put('/:id', buyingRequirementsController.updateRequirement);
router.patch('/:id/status', buyingRequirementsController.updateStatus);
router.get('/:id/matches', buyingRequirementsController.getMatches);

export default router;
