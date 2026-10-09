import { offersService } from '../services/offersService.js';
import { offerSchema, counterOfferSchema } from '../validators/schemas.js';

export const offersController = {
  async getOffers(req, res, next) {
    try {
      const { status } = req.query;
      const offers = await offersService.getOffersForBuyer(
        req.user.id,
        status,
        req.scopedSupabase
      );
      res.json({
        success: true,
        data: offers,
      });
    } catch (err) {
      next(err);
    }
  },

  async getOfferById(req, res, next) {
    try {
      const { id } = req.params;
      const offer = await offersService.getOfferById(
        id,
        req.user.id,
        req.scopedSupabase
      );
      res.json({
        success: true,
        data: offer,
      });
    } catch (err) {
      next(err);
    }
  },

  async createOffer(req, res, next) {
    try {
      const validatedData = offerSchema.parse(req.body);
      const offer = await offersService.createOffer(
        req.user.id,
        validatedData,
        req.scopedSupabase
      );
      res.status(201).json({
        success: true,
        message: 'Offer submitted successfully to farmer',
        data: offer,
      });
    } catch (err) {
      next(err);
    }
  },

  async counterOffer(req, res, next) {
    try {
      const { id } = req.params;
      const validatedData = counterOfferSchema.parse(req.body);
      const offer = await offersService.counterOffer(
        id,
        req.user.id,
        validatedData,
        req.scopedSupabase
      );
      res.json({
        success: true,
        message: 'Counteroffer sent successfully',
        data: offer,
      });
    } catch (err) {
      next(err);
    }
  },

  async acceptOffer(req, res, next) {
    try {
      const { id } = req.params;
      const order = await offersService.acceptCounterOffer(
        id,
        req.user.id,
        req.scopedSupabase
      );
      res.json({
        success: true,
        message: 'Agreement confirmed! A formal order has been created.',
        data: order,
      });
    } catch (err) {
      next(err);
    }
  },

  async rejectOffer(req, res, next) {
    try {
      const { id } = req.params;
      const offer = await offersService.rejectOffer(
        id,
        req.user.id,
        req.scopedSupabase
      );
      res.json({
        success: true,
        message: 'Offer rejected',
        data: offer,
      });
    } catch (err) {
      next(err);
    }
  },

  async withdrawOffer(req, res, next) {
    try {
      const { id } = req.params;
      const offer = await offersService.withdrawOffer(
        id,
        req.user.id,
        req.scopedSupabase
      );
      res.json({
        success: true,
        message: 'Offer withdrawn successfully',
        data: offer,
      });
    } catch (err) {
      next(err);
    }
  },
};
