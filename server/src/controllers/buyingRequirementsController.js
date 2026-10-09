import { buyingRequirementsService } from '../services/buyingRequirementsService.js';
import { matchingService } from '../services/matchingService.js';
import { buyingRequirementSchema } from '../validators/schemas.js';

export const buyingRequirementsController = {
  async getRequirements(req, res, next) {
    try {
      const requirements = await buyingRequirementsService.getRequirementsForBuyer(
        req.user.id,
        req.scopedSupabase
      );
      res.json({
        success: true,
        data: requirements,
      });
    } catch (err) {
      next(err);
    }
  },

  async getRequirementById(req, res, next) {
    try {
      const { id } = req.params;
      const requirement = await buyingRequirementsService.getRequirementById(
        id,
        req.user.id,
        req.scopedSupabase
      );
      res.json({
        success: true,
        data: requirement,
      });
    } catch (err) {
      next(err);
    }
  },

  async createRequirement(req, res, next) {
    try {
      const validatedData = buyingRequirementSchema.parse(req.body);
      const requirement = await buyingRequirementsService.createRequirement(
        req.user.id,
        validatedData,
        req.scopedSupabase
      );
      res.status(201).json({
        success: true,
        message: 'Buying requirement posted successfully',
        data: requirement,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateRequirement(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = buyingRequirementSchema.partial().parse(req.body);
      const requirement = await buyingRequirementsService.updateRequirement(
        id,
        req.user.id,
        validatedData,
        req.scopedSupabase
      );
      res.json({
        success: true,
        message: 'Buying requirement updated successfully',
        data: requirement,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const requirement = await buyingRequirementsService.updateStatus(
        id,
        req.user.id,
        status,
        req.scopedSupabase
      );
      res.json({
        success: true,
        message: `Buying requirement status updated to ${status}`,
        data: requirement,
      });
    } catch (err) {
      next(err);
    }
  },

  async getMatches(req, res, next) {
    try {
      const { id } = req.params;
      const matches = await matchingService.findMatchesForRequirement(id, req.scopedSupabase);
      res.json({
        success: true,
        data: matches,
      });
    } catch (err) {
      next(err);
    }
  },
};
