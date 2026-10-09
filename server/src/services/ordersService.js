import { supabaseAdmin } from '../config/supabase.js';

export const ordersService = {
  async getOrdersForBuyer(buyerId, statusFilter = null, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    let query = client
      .from('orders')
      .select(`
        *,
        selling_lots (
          id,
          crop_name,
          variety,
          unit,
          approx_location,
          state,
          district,
          quality_grade
        ),
        profiles:farmer_id (
          id,
          full_name,
          state,
          district
        ),
        offers (
          id,
          payment_terms,
          transport_responsibility,
          pickup_delivery_preference
        )
      `)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('order_status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    return data || [];
  },

  async getOrderById(id, buyerId, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        selling_lots (
          id,
          crop_name,
          variety,
          unit,
          approx_location,
          state,
          district,
          quality_grade,
          quality_details
        ),
        profiles:farmer_id (
          id,
          full_name,
          state,
          district
        ),
        offers (
          id,
          payment_terms,
          transport_responsibility,
          pickup_delivery_preference,
          message
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
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    return data;
  },

  async updateOrderTracking(id, buyerId, updateData, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    // Verify ownership
    const { data: order, error: checkErr } = await client
      .from('orders')
      .select('id, buyer_id')
      .eq('id', id)
      .eq('buyer_id', buyerId)
      .single();

    if (checkErr || !order) {
      throw new Error('Order not found or unauthorized');
    }

    const payload = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('orders')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update order tracking: ${error.message}`);
    }

    return data;
  },
};
