# AgriGuide Database Contract & Schema Integration

This document defines the formal database contract between the **AgriGuide Buyer Marketplace** and the shared Supabase PostgreSQL instance.

---

## 1. Architectural Principles

1. **Single Source of Truth**: The shared Supabase database holds both farmer crop cycle/listing records and buyer profiles, buying requirements, offers, and agreements.
2. **Non-Destructive Integration**: All buyer-side tables and extensions are strictly additive. No farmer tables (`farmers`, `farms`, `plots`, `crop_cycles`) are dropped, renamed, or truncated.
3. **No Synthetic Data**: Production tables contain authentic records created through user actions. No fake metrics, placeholder farmers, or simulated transactions are seeded.
4. **Data Isolation via RLS**: Row Level Security (RLS) ensures that buyers only manage their own requirements/offers/orders, while public farmer listing information is selectively exposed without leaking private coordinates, personal numbers, or bank details.

---

## 2. Entity-Relationship Model

```
                    ┌─────────────────────────┐
                    │      auth.users         │
                    └───────────┬─────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌──────────────────┐                           ┌──────────────────┐
│     farmers      │                           │  buyer_profiles  │
└───────┬──────────┘                           └────────┬─────────┘
        │                                               │
        ├──────────────────────┐                        ├──────────────────────────┐
        ▼                      ▼                        ▼                          │
┌──────────────┐       ┌──────────────┐        ┌─────────────────────┐             │
│    farms     │       │ selling_lots │        │ buying_requirements │             │
└───────┬──────┘       └───────┬──────┘        └──────────┬──────────┘             │
        │                      │                          │                        │
        ▼                      │                          │                        │
┌──────────────┐               │                          │                        │
│    plots     │               │                          │                        │
└───────┬──────┘               │                          │                        │
        │                      │                          │                        │
        ▼                      │                          │                        │
┌──────────────┐               │                          │                        │
│ crop_cycles  │               │                          │                        │
└───────┬──────┘               │                          │                        │
        │ (optional ref)       │                          │                        │
        └──────────────────────┼──────────────────────────┼────────────────────────┤
                               │                          │                        │
                               ▼                          ▼                        ▼
                       ┌─────────────────────────────────────────────────────────────┐
                       │                           offers                            │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      │ (on acceptance)
                                                      ▼
                                       ┌─────────────────────────────┐
                                       │           orders            │
                                       │   (agreed transactions)     │
                                       └─────────────────────────────┘
```

---

## 3. Table Definitions & Schemas

### 3.1 `farmers` (Shared Farmer Entity)
- `id` (UUID, PK, references `auth.users(id)` ON DELETE CASCADE)
- `full_name` (TEXT NOT NULL)
- `phone_number` (TEXT NOT NULL)
- `state` (TEXT NOT NULL)
- `district` (TEXT NOT NULL)
- `village` (TEXT)
- `is_verified` (BOOLEAN DEFAULT FALSE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 3.2 `farms` & `plots` & `crop_cycles`
- Represents the farmer's agronomic data.
- `crop_cycles` holds `crop_name`, `variety`, `sowing_date`, `expected_harvest_date`, `estimated_yield`, `unit`.

### 3.3 `selling_lots` (Marketplace Supply)
Active supply published by farmers for buyer discovery.
- `id` (UUID, PK DEFAULT `uuid_generate_v4()`)
- `farmer_id` (UUID NOT NULL, FK `farmers.id`)
- `crop_cycle_id` (UUID NULL, FK `crop_cycles.id`)
- `crop_name` (TEXT NOT NULL)
- `variety` (TEXT NULL)
- `total_quantity` (NUMERIC(12, 2) NOT NULL > 0)
- `available_quantity` (NUMERIC(12, 2) NOT NULL >= 0)
- `unit` (TEXT NOT NULL DEFAULT 'quintal')
- `asking_price_per_unit` (NUMERIC(12, 2) NULL) - *If null, displayed as 'Price not specified' / Open to offers*
- `price_unit` (TEXT DEFAULT 'INR/quintal')
- `is_open_to_offers` (BOOLEAN DEFAULT TRUE)
- `approx_location` (TEXT NOT NULL) - *Regional indicator, protecting exact coordinates*
- `state` (TEXT NOT NULL)
- `district` (TEXT NOT NULL)
- `expected_availability_date` (DATE NOT NULL)
- `quality_grade` (TEXT NULL)
- `quality_details` (TEXT NULL)
- `images` (TEXT[] DEFAULT '{}')
- `status` (TEXT NOT NULL DEFAULT 'ACTIVE' CHECK IN `ACTIVE`, `RESERVED`, `SOLD`, `CANCELLED`)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 3.4 `buyer_profiles` (Buyer Entity)
- `id` (UUID, PK, references `auth.users(id)` ON DELETE CASCADE)
- `business_name` (TEXT NOT NULL)
- `contact_person` (TEXT NOT NULL)
- `mobile_number` (TEXT NOT NULL)
- `buyer_type` (TEXT NOT NULL CHECK IN `'Retailer'`, `'Wholesaler'`, `'Local produce trader'`, `'Distributor'`, `'Food processor or mill'`, `'Restaurant or catering business'`, `'Other business buyer'`)
- `state` (TEXT NOT NULL)
- `district` (TEXT NOT NULL)
- `city_town` (TEXT NOT NULL)
- `business_location` (TEXT NOT NULL)
- `business_address` (TEXT NULL)
- `gstin` (TEXT NULL)
- `preferred_crops` (TEXT[] DEFAULT '{}')
- `typical_quantity_range` (TEXT NULL)
- `preferred_payment_terms` (TEXT NULL)
- `preferred_procurement_radius_km` (INTEGER DEFAULT 100)
- `quality_requirements` (TEXT NULL)
- `is_profile_complete` (BOOLEAN DEFAULT TRUE)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 3.5 `buying_requirements` (Marketplace Demand)
- `id` (UUID, PK DEFAULT `uuid_generate_v4()`)
- `buyer_id` (UUID NOT NULL, FK `buyer_profiles.id`)
- `crop_name` (TEXT NOT NULL)
- `variety` (TEXT NULL)
- `required_quantity` (NUMERIC(12, 2) NOT NULL > 0)
- `fulfilled_quantity` (NUMERIC(12, 2) NOT NULL DEFAULT 0)
- `unit` (TEXT NOT NULL DEFAULT 'quintal')
- `max_price_per_unit` (NUMERIC(12, 2) NULL) - *Clearly labeled as Maximum Budget or Target Price*
- `price_type` (TEXT NOT NULL CHECK IN `'max_willing_to_pay'`, `'target_price'`)
- `price_unit` (TEXT DEFAULT 'INR/quintal')
- `required_by_date` (DATE NOT NULL)
- `delivery_location` (TEXT NOT NULL)
- `delivery_state` (TEXT NOT NULL)
- `delivery_district` (TEXT NOT NULL)
- `preferred_radius_km` (INTEGER DEFAULT 100)
- `quality_requirements` (TEXT NULL)
- `packaging_requirements` (TEXT NULL)
- `transport_preference` (TEXT NOT NULL CHECK IN `'buyer_arranged'`, `'seller_arranged'`, `'negotiable'`)
- `payment_preferences` (TEXT NULL)
- `notes` (TEXT NULL)
- `status` (TEXT NOT NULL DEFAULT 'ACTIVE' CHECK IN `'ACTIVE'`, `'PAUSED'`, `'FULFILLED'`, `'CANCELLED'`, `'EXPIRED'`)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 3.6 `offers` (Negotiation & Proposals)
- `id` (UUID, PK DEFAULT `uuid_generate_v4()`)
- `selling_lot_id` (UUID NOT NULL, FK `selling_lots.id`)
- `buying_requirement_id` (UUID NULL, FK `buying_requirements.id`)
- `buyer_id` (UUID NOT NULL, FK `buyer_profiles.id`)
- `farmer_id` (UUID NOT NULL, FK `farmers.id`)
- `initiated_by` (TEXT NOT NULL CHECK IN `'BUYER'`, `'FARMER'`)
- `proposed_quantity` (NUMERIC(12, 2) NOT NULL > 0)
- `proposed_price_per_unit` (NUMERIC(12, 2) NOT NULL >= 0)
- `price_unit` (TEXT NOT NULL DEFAULT 'INR/quintal')
- `pickup_delivery_preference` (TEXT NOT NULL CHECK IN `'pickup_at_farm'`, `'delivery_to_buyer'`, `'flexible'`)
- `expected_date` (DATE NULL)
- `transport_responsibility` (TEXT NOT NULL CHECK IN `'buyer'`, `'farmer'`, `'shared'`)
- `payment_terms` (TEXT NOT NULL)
- `message` (TEXT NULL)
- `offer_expiry_date` (DATE NULL)
- `counter_price_per_unit` (NUMERIC(12, 2) NULL)
- `counter_quantity` (NUMERIC(12, 2) NULL)
- `counter_notes` (TEXT NULL)
- `status` (TEXT NOT NULL DEFAULT 'PENDING' CHECK IN `'PENDING'`, `'COUNTERED'`, `'ACCEPTED'`, `'REJECTED'`, `'WITHDRAWN'`, `'EXPIRED'`)
- `created_at`, `updated_at` (TIMESTAMPTZ)

### 3.7 `orders` (Formal Agreed Transactions)
Created only after an offer/counteroffer is formally accepted.
- `id` (UUID, PK DEFAULT `uuid_generate_v4()`)
- `offer_id` (UUID NOT NULL, FK `offers.id`)
- `selling_lot_id` (UUID NOT NULL, FK `selling_lots.id`)
- `buying_requirement_id` (UUID NULL, FK `buying_requirements.id`)
- `buyer_id` (UUID NOT NULL, FK `buyer_profiles.id`)
- `farmer_id` (UUID NOT NULL, FK `farmers.id`)
- `agreed_quantity` (NUMERIC(12, 2) NOT NULL > 0)
- `agreed_price_per_unit` (NUMERIC(12, 2) NOT NULL >= 0)
- `total_amount` (NUMERIC(14, 2) NOT NULL >= 0)
- `price_unit` (TEXT NOT NULL DEFAULT 'INR/quintal')
- `unit` (TEXT NOT NULL DEFAULT 'quintal')
- `delivery_terms` (TEXT NULL)
- `transport_responsibility` (TEXT NULL)
- `payment_terms` (TEXT NULL)
- `order_status` (TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK IN `'CONFIRMED'`, `'IN_TRANSIT'`, `'DELIVERED'`, `'COMPLETED'`, `'CANCELLED'`, `'DISPUTED'`)
- `weighing_status` (TEXT NOT NULL DEFAULT 'PENDING' CHECK IN `'PENDING'`, `'CONFIRMED_AT_FARM'`, `'CONFIRMED_AT_DELIVERY'`, `'DISPUTED'`)
- `actual_weighed_quantity` (NUMERIC(12, 2) NULL)
- `payment_status` (TEXT NOT NULL DEFAULT 'UNPAID' CHECK IN `'UNPAID'`, `'PARTIAL'`, `'PAID'`, `'REFUNDED'`)
- `payment_reference` (TEXT NULL)
- `notes` (TEXT NULL)
- `created_at`, `updated_at` (TIMESTAMPTZ)

---

## 4. Deterministic Price & Quantity Rules

| Context | Field Name | Meaning | Validation Rules |
|---|---|---|---|
| **Farmer Listing** | `asking_price_per_unit` | Farmer's desired price (optional) | ≥ 0 or NULL if open to offers |
| **Buyer Demand** | `max_price_per_unit` | Maximum budget willing to pay | Positive number or NULL |
| **Offer** | `proposed_price_per_unit` | Buyer's proposed per-unit rate | Positive number; validated against available lot quantity |
| **Counteroffer** | `counter_price_per_unit` | Farmer/Buyer revised rate | Positive number |
| **Order / Agreement** | `agreed_price_per_unit` | Final locked unit price | Immutable upon agreement creation |
| **Order / Agreement** | `total_amount` | Total contract value | Computed as `agreed_quantity * agreed_price_per_unit` |
