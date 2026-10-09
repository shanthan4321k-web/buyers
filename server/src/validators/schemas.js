import { z } from 'zod';

export const buyerProfileSchema = z.object({
  business_name: z.string().trim().min(2, 'Business name must be at least 2 characters'),
  contact_person: z.string().trim().min(2, "Contact person's name is required"),
  mobile_number: z.string().trim().min(10, 'Valid 10-digit mobile number is required'),
  buyer_type: z.enum([
    'Retailer',
    'Wholesaler',
    'Local produce trader',
    'Distributor',
    'Food processor or mill',
    'Restaurant or catering business',
    'Other business buyer',
  ], {
    errorMap: () => ({ message: 'Please select a valid buyer type' }),
  }),
  state: z.string().trim().min(1, 'State is required'),
  district: z.string().trim().min(1, 'District is required'),
  city_town: z.string().trim().min(1, 'City/Town/Village is required'),
  business_location: z.string().trim().min(1, 'Business / Delivery location is required'),
  business_address: z.string().trim().optional().nullable(),
  gstin: z.string().trim().optional().nullable(),
  preferred_crops: z.array(z.string()).default([]),
  typical_quantity_range: z.string().trim().optional().nullable(),
  preferred_payment_terms: z.string().trim().optional().nullable(),
  preferred_procurement_radius_km: z.number().int().positive().optional().nullable().default(100),
  quality_requirements: z.string().trim().optional().nullable(),
});

export const buyingRequirementSchema = z.object({
  crop_name: z.string().trim().min(1, 'Crop name is required'),
  variety: z.string().trim().optional().nullable(),
  required_quantity: z.number().positive('Required quantity must be greater than 0'),
  unit: z.enum(['kg', 'quintal', 'ton', 'crate', 'bag']).default('quintal'),
  max_price_per_unit: z.number().positive('Price must be greater than 0').optional().nullable(),
  price_type: z.enum(['max_willing_to_pay', 'target_price']).default('max_willing_to_pay'),
  price_unit: z.string().default('INR/quintal'),
  required_by_date: z.string().min(1, 'Required by date is required'),
  delivery_location: z.string().trim().min(1, 'Delivery location is required'),
  delivery_state: z.string().trim().min(1, 'Delivery state is required'),
  delivery_district: z.string().trim().min(1, 'Delivery district is required'),
  preferred_radius_km: z.number().int().positive().optional().nullable().default(100),
  quality_requirements: z.string().trim().optional().nullable(),
  packaging_requirements: z.string().trim().optional().nullable(),
  transport_preference: z.enum(['buyer_arranged', 'seller_arranged', 'negotiable']).default('buyer_arranged'),
  payment_preferences: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const offerSchema = z.object({
  selling_lot_id: z.string().uuid('Valid selling lot ID is required'),
  buying_requirement_id: z.string().uuid().optional().nullable(),
  proposed_quantity: z.number().positive('Proposed quantity must be greater than 0'),
  proposed_price_per_unit: z.number().positive('Proposed price per unit must be greater than 0'),
  price_unit: z.string().default('INR/quintal'),
  pickup_delivery_preference: z.enum(['pickup_at_farm', 'delivery_to_buyer', 'flexible']),
  expected_date: z.string().optional().nullable(),
  transport_responsibility: z.enum(['buyer', 'farmer', 'shared']),
  payment_terms: z.string().trim().min(1, 'Payment terms are required (e.g., 50% on pickup, balance on delivery)'),
  message: z.string().trim().optional().nullable(),
  offer_expiry_date: z.string().optional().nullable(),
});

export const counterOfferSchema = z.object({
  counter_price_per_unit: z.number().positive('Counter price must be greater than 0').optional().nullable(),
  counter_quantity: z.number().positive('Counter quantity must be greater than 0').optional().nullable(),
  counter_notes: z.string().trim().min(1, 'Counter notes or explanation is required'),
});

export const orderUpdateSchema = z.object({
  order_status: z.enum(['CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED']).optional(),
  weighing_status: z.enum(['PENDING', 'CONFIRMED_AT_FARM', 'CONFIRMED_AT_DELIVERY', 'DISPUTED']).optional(),
  actual_weighed_quantity: z.number().positive().optional().nullable(),
  payment_status: z.enum(['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED']).optional(),
  payment_reference: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});
