import { supabaseAdmin } from '../config/supabase.js';

export const offersService = {
  async createOffer(buyerId, offerData, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    // 1. Fetch selling lot and verify availability
    const { data: lot, error: lotErr } = await client
      .from('selling_lots')
      .select('*, profiles:farmer_id (id, full_name)')
      .eq('id', offerData.selling_lot_id)
      .single();

    if (lotErr || !lot) {
      throw new Error(`Selling lot not found: ${lotErr?.message || 'Invalid lot ID'}`);
    }

    if (lot.status !== 'ACTIVE') {
      throw new Error(`This crop listing is no longer active (Status: ${lot.status})`);
    }

    const availableQty = Number(lot.available_quantity);
    const proposedQty = Number(offerData.proposed_quantity);

    if (proposedQty <= 0) {
      throw new Error('Proposed quantity must be greater than zero');
    }

    if (proposedQty > availableQty) {
      throw new Error(
        `Requested quantity (${proposedQty} ${lot.unit}) exceeds available stock (${availableQty} ${lot.unit}).`
      );
    }

    // 2. Prepare payload
    const payload = {
      selling_lot_id: lot.id,
      buying_requirement_id: offerData.buying_requirement_id || null,
      buyer_id: buyerId,
      farmer_id: lot.farmer_id,
      initiated_by: 'BUYER',
      proposed_quantity: proposedQty,
      proposed_price_per_unit: Number(offerData.proposed_price_per_unit),
      price_unit: offerData.price_unit || lot.price_unit || 'INR/quintal',
      pickup_delivery_preference: offerData.pickup_delivery_preference,
      expected_date: offerData.expected_date || null,
      transport_responsibility: offerData.transport_responsibility,
      payment_terms: offerData.payment_terms,
      message: offerData.message || null,
      offer_expiry_date: offerData.offer_expiry_date || null,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: offer, error: insertErr } = await client
      .from('offers')
      .insert(payload)
      .select(`
        *,
        selling_lots (
          id,
          crop_name,
          variety,
          unit,
          approx_location,
          state,
          district
        ),
        profiles:farmer_id (
          id,
          full_name,
          state,
          district
        )
      `)
      .single();

    if (insertErr) {
      throw new Error(`Failed to submit offer: ${insertErr.message}`);
    }

    return offer;
  },

  async getOffersForBuyer(buyerId, statusFilter = null, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    let query = client
      .from('offers')
      .select(`
        *,
        selling_lots (
          id,
          crop_name,
          variety,
          unit,
          asking_price_per_unit,
          price_unit,
          available_quantity,
          approx_location,
          state,
          district
        ),
        profiles:farmer_id (
          id,
          full_name,
          state,
          district
        ),
        buying_requirements (
          id,
          crop_name,
          required_quantity,
          unit
        )
      `)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch offers: ${error.message}`);
    }

    return data || [];
  },

  async getOfferById(id, buyerId, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    const { data, error } = await client
      .from('offers')
      .select(`
        *,
        selling_lots (
          id,
          crop_name,
          variety,
          unit,
          asking_price_per_unit,
          price_unit,
          available_quantity,
          approx_location,
          state,
          district
        ),
        profiles:farmer_id (
          id,
          full_name,
          state,
          district
        ),
        buying_requirements (
          id,
          crop_name,
          required_quantity,
          unit
        )
      `)
      .eq('id', id)
      .eq('buyer_id', buyerId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch offer: ${error.message}`);
    }

    return data;
  },

  async withdrawOffer(id, buyerId, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    // Only allow withdrawing pending or countered offers
    const { data: offer, error: fetchErr } = await client
      .from('offers')
      .select('id, status, buyer_id')
      .eq('id', id)
      .eq('buyer_id', buyerId)
      .single();

    if (fetchErr || !offer) {
      throw new Error('Offer not found or unauthorized');
    }

    if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
      throw new Error(`Cannot withdraw an offer with status: ${offer.status}`);
    }

    const { data, error } = await client
      .from('offers')
      .update({
        status: 'WITHDRAWN',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to withdraw offer: ${error.message}`);
    }

    return data;
  },

  async counterOffer(id, buyerId, { counter_price_per_unit, counter_quantity, counter_notes }, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    const { data: offer, error: fetchErr } = await client
      .from('offers')
      .select('*')
      .eq('id', id)
      .eq('buyer_id', buyerId)
      .single();

    if (fetchErr || !offer) {
      throw new Error('Offer not found or unauthorized');
    }

    if (offer.status !== 'COUNTERED' && offer.status !== 'PENDING') {
      throw new Error(`Cannot submit counteroffer on offer with status: ${offer.status}`);
    }

    const updatePayload = {
      status: 'COUNTERED',
      counter_price_per_unit: counter_price_per_unit ? Number(counter_price_per_unit) : offer.counter_price_per_unit,
      counter_quantity: counter_quantity ? Number(counter_quantity) : offer.counter_quantity,
      counter_notes,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('offers')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update counteroffer: ${error.message}`);
    }

    return data;
  },

  async acceptCounterOffer(id, buyerId, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    // 1. Fetch offer
    const { data: offer, error: fetchErr } = await client
      .from('offers')
      .select('*, selling_lots(*)')
      .eq('id', id)
      .eq('buyer_id', buyerId)
      .single();

    if (fetchErr || !offer) {
      throw new Error('Offer not found or unauthorized');
    }

    if (offer.status !== 'COUNTERED' && offer.status !== 'PENDING') {
      throw new Error(`Cannot accept offer with status: ${offer.status}`);
    }

    // Determine agreed figures
    const agreedQuantity = Number(offer.counter_quantity || offer.proposed_quantity);
    const agreedPrice = Number(offer.counter_price_per_unit || offer.proposed_price_per_unit);
    const totalAmount = agreedQuantity * agreedPrice;
    const lot = offer.selling_lots;

    // Check availability
    if (lot) {
      if (Number(lot.available_quantity) < agreedQuantity) {
        throw new Error(`Remaining available quantity (${lot.available_quantity} ${lot.unit}) is less than agreed quantity (${agreedQuantity} ${lot.unit})`);
      }
    }

    // 2. Mark offer accepted
    const { error: offerUpdateErr } = await client
      .from('offers')
      .update({
        status: 'ACCEPTED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (offerUpdateErr) {
      throw new Error(`Failed to mark offer accepted: ${offerUpdateErr.message}`);
    }

    // 3. Create formal order / agreement
    const orderPayload = {
      offer_id: offer.id,
      selling_lot_id: offer.selling_lot_id,
      buying_requirement_id: offer.buying_requirement_id || null,
      buyer_id: offer.buyer_id,
      farmer_id: offer.farmer_id,
      agreed_quantity: agreedQuantity,
      agreed_price_per_unit: agreedPrice,
      total_amount: totalAmount,
      price_unit: offer.price_unit,
      unit: lot?.unit || 'quintal',
      delivery_terms: offer.pickup_delivery_preference,
      transport_responsibility: offer.transport_responsibility,
      payment_terms: offer.payment_terms,
      order_status: 'CONFIRMED',
      weighing_status: 'PENDING',
      payment_status: 'UNPAID',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: order, error: orderErr } = await client
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderErr) {
      throw new Error(`Failed to create order: ${orderErr.message}`);
    }

    // 4. Update lot remaining quantity
    if (lot) {
      const newAvailable = Math.max(0, Number(lot.available_quantity) - agreedQuantity);
      const newLotStatus = newAvailable === 0 ? 'SOLD' : 'ACTIVE';
      await client
        .from('selling_lots')
        .update({
          available_quantity: newAvailable,
          status: newLotStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lot.id);
    }

    // 5. Update requirement fulfilled quantity if attached
    if (offer.buying_requirement_id) {
      const { data: req } = await client
        .from('buying_requirements')
        .select('required_quantity, fulfilled_quantity')
        .eq('id', offer.buying_requirement_id)
        .single();

      if (req) {
        const newFulfilled = Number(req.fulfilled_quantity || 0) + agreedQuantity;
        const newReqStatus = newFulfilled >= Number(req.required_quantity) ? 'FULFILLED' : 'ACTIVE';
        await client
          .from('buying_requirements')
          .update({
            fulfilled_quantity: newFulfilled,
            status: newReqStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', offer.buying_requirement_id);
      }
    }

    return order;
  },

  async rejectOffer(id, buyerId, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    const { data, error } = await client
      .from('offers')
      .update({
        status: 'REJECTED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('buyer_id', buyerId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to reject offer: ${error.message}`);
    }

    return data;
  },
};
