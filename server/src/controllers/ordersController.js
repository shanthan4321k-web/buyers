import { ordersService } from '../services/ordersService.js';
import { orderUpdateSchema } from '../validators/schemas.js';

export const ordersController = {
  async getOrders(req, res, next) {
    try {
      const { status } = req.query;
      const orders = await ordersService.getOrdersForBuyer(
        req.user.id,
        status,
        req.scopedSupabase
      );
      res.json({
        success: true,
        data: orders,
      });
    } catch (err) {
      next(err);
    }
  },

  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await ordersService.getOrderById(
        id,
        req.user.id,
        req.scopedSupabase
      );
      res.json({
        success: true,
        data: order,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateOrderTracking(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = orderUpdateSchema.parse(req.body);
      const order = await ordersService.updateOrderTracking(
        id,
        req.user.id,
        validatedData,
        req.scopedSupabase
      );
      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  },
};
