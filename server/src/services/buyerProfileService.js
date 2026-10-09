import { supabaseAdmin } from '../config/supabase.js';

export const buyerProfileService = {
  async getProfile(userId, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    const { data, error } = await client
      .from('buyer_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch buyer profile: ${error.message}`);
    }

    return data;
  },

  async upsertProfile(userId, profileData, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    const payload = {
      ...profileData,
      id: userId,
      is_profile_complete: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('buyer_profiles')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save buyer profile: ${error.message}`);
    }

    return data;
  },

  async checkStatus(userId, client = supabaseAdmin) {
    const profile = await this.getProfile(userId, client);
    if (!profile) {
      return { isComplete: false, profile: null };
    }
    return {
      isComplete: Boolean(profile.is_profile_complete && profile.business_name),
      profile,
    };
  },
};
