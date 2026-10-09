import { supabaseAdmin } from '../config/supabase.js';

export const matchingService = {
  /**
   * Deterministic matching algorithm between a buying requirement and active selling lots.
   * Computes compatibility score, match reasons, quantity fulfillment ratio, and price alignment.
   */
  async findMatchesForRequirement(requirementId, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    // 1. Fetch requirement
    const { data: requirement, error: reqErr } = await client
      .from('buying_requirements')
      .select('*')
      .eq('id', requirementId)
      .single();

    if (reqErr || !requirement) {
      throw new Error(`Buying requirement not found: ${reqErr?.message || 'Invalid ID'}`);
    }

    // 2. Query active selling lots for the same crop
    const { data: lots, error: lotErr } = await client
      .from('selling_lots')
      .select(`
        *,
        profiles:farmer_id (
          id,
          full_name,
          state,
          district
        )
      `)
      .eq('status', 'ACTIVE')
      .gt('available_quantity', 0)
      .ilike('crop_name', requirement.crop_name.trim());

    if (lotErr) {
      throw new Error(`Failed to query lots for matching: ${lotErr.message}`);
    }

    if (!lots || lots.length === 0) {
      return [];
    }

    const matches = [];

    for (const lot of lots) {
      let score = 0;
      const matchCriteria = [];
      const warnings = [];

      // 1. Crop Match (Base prerequisite)
      const cropExact = lot.crop_name.trim().toLowerCase() === requirement.crop_name.trim().toLowerCase();
      if (!cropExact) continue;
      score += 30;
      matchCriteria.push(`Exact crop match (${lot.crop_name})`);

      // 2. Variety Compatibility
      if (requirement.variety && requirement.variety.trim()) {
        if (lot.variety && lot.variety.trim().toLowerCase() === requirement.variety.trim().toLowerCase()) {
          score += 20;
          matchCriteria.push(`Exact variety match (${lot.variety})`);
        } else if (!lot.variety) {
          score += 10;
          matchCriteria.push('General / unspecified variety');
        } else {
          warnings.push(`Different variety (Farmer: ${lot.variety}, Requested: ${requirement.variety})`);
        }
      } else {
        score += 15;
        matchCriteria.push('Open variety requirement');
      }

      // 3. Location / Region Compatibility
      const stateMatch = lot.state && requirement.delivery_state &&
        lot.state.trim().toLowerCase() === requirement.delivery_state.trim().toLowerCase();
      const districtMatch = lot.district && requirement.delivery_district &&
        lot.district.trim().toLowerCase() === requirement.delivery_district.trim().toLowerCase();

      if (districtMatch) {
        score += 25;
        matchCriteria.push(`Local district match (${lot.district})`);
      } else if (stateMatch) {
        score += 15;
        matchCriteria.push(`Same state match (${lot.state})`);
      } else {
        matchCriteria.push(`Inter-state delivery from ${lot.state || 'nearby'}`);
      }

      // 4. Quantity Fulfillment Calculation
      const reqRemaining = Math.max(0, (requirement.required_quantity || 0) - (requirement.fulfilled_quantity || 0));
      const lotAvailable = Number(lot.available_quantity) || 0;
      const fulfillmentPercentage = reqRemaining > 0
        ? Math.min(100, Math.round((lotAvailable / reqRemaining) * 100))
        : 100;

      if (lotAvailable >= reqRemaining) {
        score += 15;
        matchCriteria.push(`Can fulfill 100% of remaining demand (${lotAvailable} ${lot.unit} available)`);
      } else {
        score += 8;
        matchCriteria.push(`Partial fulfillment: ${fulfillmentPercentage}% (${lotAvailable} of ${reqRemaining} ${requirement.unit})`);
      }

      // 5. Price Compatibility
      let priceMatchStatus = 'negotiable';
      if (lot.asking_price_per_unit && requirement.max_price_per_unit) {
        const farmerAsking = Number(lot.asking_price_per_unit);
        const buyerMax = Number(requirement.max_price_per_unit);

        if (farmerAsking <= buyerMax) {
          score += 10;
          priceMatchStatus = 'within_budget';
          matchCriteria.push(`Within budget: Asking ₹${farmerAsking}/${lot.unit} ≤ Max ₹${buyerMax}/${requirement.unit}`);
        } else {
          priceMatchStatus = 'above_target';
          warnings.push(`Asking ₹${farmerAsking}/${lot.unit} exceeds budget of ₹${buyerMax}/${requirement.unit}`);
        }
      } else if (lot.is_open_to_offers) {
        score += 5;
        priceMatchStatus = 'open_to_offers';
        matchCriteria.push('Farmer is open to price offers');
      }

      // 6. Availability Date Schedule
      if (lot.expected_availability_date && requirement.required_by_date) {
        const lotDate = new Date(lot.expected_availability_date);
        const reqDate = new Date(requirement.required_by_date);

        if (lotDate <= reqDate) {
          matchCriteria.push(`Ready before required date (${lot.expected_availability_date})`);
        } else {
          const diffDays = Math.ceil((lotDate - reqDate) / (1000 * 60 * 60 * 24));
          warnings.push(`Available ${diffDays} day(s) after requested date`);
        }
      }

      matches.push({
        lot,
        score: Math.min(100, score),
        fulfillmentPercentage,
        priceMatchStatus,
        matchCriteria,
        warnings,
      });
    }

    // Sort deterministic matches by score descending
    return matches.sort((a, b) => b.score - a.score);
  },
};
