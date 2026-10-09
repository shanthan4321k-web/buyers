-- =============================================================================
-- AGRIGUIDE SHARED DATABASE SCHEMA — BUYER MARKETPLACE ADDITIVE MIGRATIONS
-- =============================================================================
-- This migration script preserves 100% of the existing farmer platform schema 
-- (profiles, farms, farm_plots, crops, crop_diagnoses, market_prices, etc.) 
-- without dropping or altering any existing columns/tables.
-- It strictly appends the Buyer Domain and Marketplace Integration tables:
--   1. buyer_profiles
--   2. selling_lots
--   3. buying_requirements
--   4. offers
--   5. orders
-- =============================================================================

-- Enable required UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- EXISTING FARMER SCHEMA (PRESERVED & UNTOUCHED)
-- Reference: profiles, farms, farm_plots, crops, crop_observations,
--            crop_diagnoses, crop_diagnosis_images, weather_snapshots,
--            market_prices, alerts, recommendations, completed_actions.
-- =============================================================================


-- =============================================================================
-- 1. Buyer Profiles Table
-- Stores commercial entity and procurement preferences for buyers.
-- =============================================================================
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  buyer_type TEXT NOT NULL CHECK (
    buyer_type IN (
      'Retailer',
      'Wholesaler',
      'Local produce trader',
      'Distributor',
      'Food processor or mill',
      'Restaurant or catering business',
      'Other business buyer'
    )
  ),
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  city_town TEXT NOT NULL,
  business_location TEXT NOT NULL,
  business_address TEXT,
  gstin TEXT,
  preferred_crops TEXT[] DEFAULT '{}',
  typical_quantity_range TEXT,
  preferred_payment_terms TEXT,
  preferred_procurement_radius_km INTEGER DEFAULT 100,
  quality_requirements TEXT,
  is_profile_complete BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at trigger for buyer_profiles
DROP TRIGGER IF EXISTS trg_buyer_profiles_updated_at ON buyer_profiles;
CREATE TRIGGER trg_buyer_profiles_updated_at
  BEFORE UPDATE ON buyer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- 2. Selling Lots Table (Farmer Crop Listings for Marketplace)
-- Links a farmer (profiles.id) and optional plot (farm_plots.id) to published supply.
-- =============================================================================
CREATE TABLE IF NOT EXISTS selling_lots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plot_id UUID REFERENCES farm_plots(id) ON DELETE SET NULL,
  crop_name TEXT NOT NULL,
  variety TEXT,
  total_quantity NUMERIC(12, 2) NOT NULL CHECK (total_quantity > 0),
  available_quantity NUMERIC(12, 2) NOT NULL CHECK (available_quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'quintal', -- 'kg', 'quintal', 'ton', 'crate', 'bag'
  asking_price_per_unit NUMERIC(12, 2) CHECK (asking_price_per_unit IS NULL OR asking_price_per_unit >= 0),
  price_unit TEXT DEFAULT 'INR/quintal',
  is_open_to_offers BOOLEAN DEFAULT TRUE,
  approx_location TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  expected_availability_date DATE NOT NULL,
  quality_grade TEXT, -- e.g. Grade A, Grade B, Premium, FAQ
  quality_details TEXT,
  images TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESERVED', 'SOLD', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at trigger for selling_lots
DROP TRIGGER IF EXISTS trg_selling_lots_updated_at ON selling_lots;
CREATE TRIGGER trg_selling_lots_updated_at
  BEFORE UPDATE ON selling_lots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- 3. Buying Requirements Table (Demand Postings by Buyers)
-- =============================================================================
CREATE TABLE IF NOT EXISTS buying_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  variety TEXT,
  required_quantity NUMERIC(12, 2) NOT NULL CHECK (required_quantity > 0),
  fulfilled_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (fulfilled_quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'quintal',
  max_price_per_unit NUMERIC(12, 2) CHECK (max_price_per_unit IS NULL OR max_price_per_unit >= 0),
  price_type TEXT NOT NULL DEFAULT 'max_willing_to_pay' CHECK (price_type IN ('max_willing_to_pay', 'target_price')),
  price_unit TEXT DEFAULT 'INR/quintal',
  required_by_date DATE NOT NULL,
  delivery_location TEXT NOT NULL,
  delivery_state TEXT NOT NULL,
  delivery_district TEXT NOT NULL,
  preferred_radius_km INTEGER DEFAULT 100,
  quality_requirements TEXT,
  packaging_requirements TEXT,
  transport_preference TEXT NOT NULL DEFAULT 'buyer_arranged' CHECK (transport_preference IN ('buyer_arranged', 'seller_arranged', 'negotiable')),
  payment_preferences TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'FULFILLED', 'CANCELLED', 'EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at trigger for buying_requirements
DROP TRIGGER IF EXISTS trg_buying_requirements_updated_at ON buying_requirements;
CREATE TRIGGER trg_buying_requirements_updated_at
  BEFORE UPDATE ON buying_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- 4. Offers & Negotiations Table (Connects Buyer and Farmer on a Selling Lot)
-- =============================================================================
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  selling_lot_id UUID NOT NULL REFERENCES selling_lots(id) ON DELETE CASCADE,
  buying_requirement_id UUID REFERENCES buying_requirements(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  initiated_by TEXT NOT NULL CHECK (initiated_by IN ('BUYER', 'FARMER')),
  proposed_quantity NUMERIC(12, 2) NOT NULL CHECK (proposed_quantity > 0),
  proposed_price_per_unit NUMERIC(12, 2) NOT NULL CHECK (proposed_price_per_unit >= 0),
  price_unit TEXT NOT NULL DEFAULT 'INR/quintal',
  pickup_delivery_preference TEXT NOT NULL CHECK (pickup_delivery_preference IN ('pickup_at_farm', 'delivery_to_buyer', 'flexible')),
  expected_date DATE,
  transport_responsibility TEXT NOT NULL CHECK (transport_responsibility IN ('buyer', 'farmer', 'shared')),
  payment_terms TEXT NOT NULL,
  message TEXT,
  offer_expiry_date DATE,
  counter_price_per_unit NUMERIC(12, 2) CHECK (counter_price_per_unit IS NULL OR counter_price_per_unit >= 0),
  counter_quantity NUMERIC(12, 2) CHECK (counter_quantity IS NULL OR counter_quantity > 0),
  counter_notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COUNTERED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at trigger for offers
DROP TRIGGER IF EXISTS trg_offers_updated_at ON offers;
CREATE TRIGGER trg_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- 5. Orders Table (Formal Agreed Transactions between Buyer and Farmer)
-- Created strictly when an offer/counteroffer is formally accepted.
-- =============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE RESTRICT,
  selling_lot_id UUID NOT NULL REFERENCES selling_lots(id) ON DELETE RESTRICT,
  buying_requirement_id UUID REFERENCES buying_requirements(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE RESTRICT,
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  agreed_quantity NUMERIC(12, 2) NOT NULL CHECK (agreed_quantity > 0),
  agreed_price_per_unit NUMERIC(12, 2) NOT NULL CHECK (agreed_price_per_unit >= 0),
  total_amount NUMERIC(14, 2) NOT NULL CHECK (total_amount >= 0),
  price_unit TEXT NOT NULL DEFAULT 'INR/quintal',
  unit TEXT NOT NULL DEFAULT 'quintal',
  delivery_terms TEXT,
  transport_responsibility TEXT,
  payment_terms TEXT,
  order_status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (order_status IN ('CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'DISPUTED')),
  weighing_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (weighing_status IN ('PENDING', 'CONFIRMED_AT_FARM', 'CONFIRMED_AT_DELIVERY', 'DISPUTED')),
  actual_weighed_quantity NUMERIC(12, 2),
  payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED')),
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at trigger for orders
DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- =============================================================================
-- PERFORMANCE INDEXES (Marketplace & Matching Queries)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_state_district ON buyer_profiles(state, district);
CREATE INDEX IF NOT EXISTS idx_selling_lots_farmer_id ON selling_lots(farmer_id);
CREATE INDEX IF NOT EXISTS idx_selling_lots_crop_status ON selling_lots(crop_name, status);
CREATE INDEX IF NOT EXISTS idx_selling_lots_state_district ON selling_lots(state, district);
CREATE INDEX IF NOT EXISTS idx_selling_lots_available_qty ON selling_lots(available_quantity);
CREATE INDEX IF NOT EXISTS idx_buying_requirements_buyer_id ON buying_requirements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buying_requirements_crop_status ON buying_requirements(crop_name, status);
CREATE INDEX IF NOT EXISTS idx_offers_selling_lot_id ON offers(selling_lot_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_farmer_id ON offers(farmer_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_farmer_id ON orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);


-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR NEW TABLES
-- =============================================================================

ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE selling_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE buying_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 1. Buyer Profiles RLS
CREATE POLICY "Buyers can view own profile" ON buyer_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Buyers can insert own profile" ON buyer_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Buyers can update own profile" ON buyer_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Selling Lots RLS
CREATE POLICY "Authenticated users can view active selling lots" ON selling_lots
  FOR SELECT USING (status = 'ACTIVE' OR auth.uid() = farmer_id);

CREATE POLICY "Farmers can manage own selling lots" ON selling_lots
  FOR ALL USING (auth.uid() = farmer_id);

-- 3. Buying Requirements RLS
CREATE POLICY "Authenticated users can view active buying requirements" ON buying_requirements
  FOR SELECT USING (status = 'ACTIVE' OR auth.uid() = buyer_id);

CREATE POLICY "Buyers can manage own buying requirements" ON buying_requirements
  FOR ALL USING (auth.uid() = buyer_id);

-- 4. Offers RLS (Only the buyer or the farmer party can view/interact)
CREATE POLICY "Parties can view their offers" ON offers
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);

CREATE POLICY "Buyers can insert offers" ON offers
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Parties can update their offers" ON offers
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);

-- 5. Orders RLS (Only the buyer or farmer party can view/update)
CREATE POLICY "Parties can view their orders" ON orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);

CREATE POLICY "Parties can update their orders" ON orders
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);


-- =============================================================================
-- ROLE PERMISSIONS (Service Role & Authenticated Access)
-- =============================================================================
GRANT ALL ON TABLE buyer_profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE selling_lots TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE buying_requirements TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE offers TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE orders TO postgres, anon, authenticated, service_role;
