import { supabaseAdmin } from '../config/supabase.js';

export const sellingLotsService = {
  async getLots({
    crop,
    variety,
    state,
    district,
    minQty,
    maxQty,
    minPrice,
    maxPrice,
    qualityGrade,
    search,
    sortBy = 'created_at',
    sortOrder = 'desc',
    page = 1,
    limit = 12,
  }, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = client
      .from('selling_lots')
      .select(`
        id,
        farmer_id,
        plot_id,
        crop_name,
        variety,
        total_quantity,
        available_quantity,
        unit,
        asking_price_per_unit,
        price_unit,
        is_open_to_offers,
        approx_location,
        state,
        district,
        expected_availability_date,
        quality_grade,
        quality_details,
        images,
        status,
        created_at,
        profiles:farmer_id (
          id,
          full_name,
          state,
          district
        )
      `, { count: 'exact' })
      .eq('status', 'ACTIVE')
      .gt('available_quantity', 0);

    if (crop) {
      query = query.ilike('crop_name', `%${crop}%`);
    }

    if (variety) {
      query = query.ilike('variety', `%${variety}%`);
    }

    if (state) {
      query = query.eq('state', state);
    }

    if (district) {
      query = query.ilike('district', `%${district}%`);
    }

    if (qualityGrade) {
      query = query.eq('quality_grade', qualityGrade);
    }

    if (minQty) {
      query = query.gte('available_quantity', Number(minQty));
    }

    if (maxQty) {
      query = query.lte('available_quantity', Number(maxQty));
    }

    if (minPrice) {
      query = query.gte('asking_price_per_unit', Number(minPrice));
    }

    if (maxPrice) {
      query = query.lte('asking_price_per_unit', Number(maxPrice));
    }

    if (search) {
      query = query.or(`crop_name.ilike.%${search}%,variety.ilike.%${search}%,approx_location.ilike.%${search}%,district.ilike.%${search}%`);
    }

    const validSortFields = ['created_at', 'asking_price_per_unit', 'available_quantity', 'expected_availability_date'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder === 'asc';

    query = query.order(sortField, { ascending, nullsFirst: false }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch selling lots: ${error.message}`);
    }

    return {
      lots: data || [],
      pagination: {
        total: count || 0,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  },

  async getLotById(id, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    const { data, error } = await client
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
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch selling lot details: ${error.message}`);
    }

    return data;
  },

  async getDistinctCrops(client = supabaseAdmin) {
    if (!client) return [];
    const { data, error } = await client
      .from('selling_lots')
      .select('crop_name')
      .eq('status', 'ACTIVE')
      .gt('available_quantity', 0);

    if (error) return [];
    const unique = [...new Set(data.map((item) => item.crop_name).filter(Boolean))];
    return unique.sort();
  },
};
