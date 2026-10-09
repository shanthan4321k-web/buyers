import { dashboardService } from '../services/dashboardService.js';

export const dashboardController = {
  async getDashboardSummary(req, res, next) {
    try {
      const summary = await dashboardService.getDashboardSummary(
        req.user.id,
        req.scopedSupabase
      );
      res.json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  },
};
