import { sellingLotsService } from '../services/sellingLotsService.js';

export const sellingLotsController = {
  async getLots(req, res, next) {
    try {
      const {
        crop,
        variety,
        state,
        district,
        minQty,
        maxQty,
        minPrice,
        maxPrice,
        qualityGrade,
        search,
        sortBy,
        sortOrder,
        page,
        limit,
      } = req.query;

      const result = await sellingLotsService.getLots({
        crop,
        variety,
        state,
        district,
        minQty,
        maxQty,
        minPrice,
        maxPrice,
        qualityGrade,
        search,
        sortBy,
        sortOrder,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 12,
      }, req.scopedSupabase);

      res.json({
        success: true,
        data: result.lots,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  },

  async getLotById(req, res, next) {
    try {
      const { id } = req.params;
      const lot = await sellingLotsService.getLotById(id, req.scopedSupabase);
      res.json({
        success: true,
        data: lot,
      });
    } catch (err) {
      next(err);
    }
  },

  async getDistinctCrops(req, res, next) {
    try {
      const crops = await sellingLotsService.getDistinctCrops(req.scopedSupabase);
      res.json({
        success: true,
        data: crops,
      });
    } catch (err) {
      next(err);
    }
  },
};
