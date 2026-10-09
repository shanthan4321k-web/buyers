import { supabaseAdmin } from '../config/supabase.js';

export const buyingRequirementsService = {
  async getRequirementsForBuyer(buyerId, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    const { data, error } = await client
      .from('buying_requirements')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch buying requirements: ${error.message}`);
    }

    return data || [];
  },

  async getRequirementById(id, buyerId, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    const { data, error } = await client
      .from('buying_requirements')
      .select('*')
      .eq('id', id)
      .eq('buyer_id', buyerId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch requirement: ${error.message}`);
    }

    return data;
  },

  async createRequirement(buyerId, requirementData, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    const payload = {
      ...requirementData,
      buyer_id: buyerId,
      fulfilled_quantity: 0,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('buying_requirements')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create buying requirement: ${error.message}`);
    }

    return data;
  },

  async updateRequirement(id, buyerId, updateData, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    const payload = {
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('buying_requirements')
      .update(payload)
      .eq('id', id)
      .eq('buyer_id', buyerId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update requirement: ${error.message}`);
    }

    return data;
  },

  async updateStatus(id, buyerId, status, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    const validStatuses = ['ACTIVE', 'PAUSED', 'CANCELLED', 'FULFILLED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }

    const { data, error } = await client
      .from('buying_requirements')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('buyer_id', buyerId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update requirement status: ${error.message}`);
    }

    return data;
  },
};
