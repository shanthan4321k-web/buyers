import express from 'express';
import { ordersController } from '../controllers/ordersController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', ordersController.getOrders);
router.get('/:id', ordersController.getOrderById);
router.patch('/:id/tracking', ordersController.updateOrderTracking);

export default router;
