import { buyerProfileService } from '../services/buyerProfileService.js';
import { buyerProfileSchema } from '../validators/schemas.js';

export const buyerProfileController = {
  async getProfile(req, res, next) {
    try {
      const profile = await buyerProfileService.getProfile(req.user.id, req.scopedSupabase);
      res.json({
        success: true,
        data: profile,
        isComplete: Boolean(profile && profile.is_profile_complete),
      });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const validatedData = buyerProfileSchema.parse(req.body);
      const profile = await buyerProfileService.upsertProfile(
        req.user.id,
        validatedData,
        req.scopedSupabase
      );
      res.json({
        success: true,
        message: 'Profile saved successfully',
        data: profile,
      });
    } catch (err) {
      next(err);
    }
  },

  async getStatus(req, res, next) {
    try {
      const status = await buyerProfileService.checkStatus(req.user.id, req.scopedSupabase);
      res.json({
        success: true,
        data: status,
      });
    } catch (err) {
      next(err);
    }
  },
};
