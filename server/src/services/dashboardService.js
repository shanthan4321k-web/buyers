import { supabaseAdmin } from '../config/supabase.js';

export const dashboardService = {
  async getDashboardSummary(buyerId, client = supabaseAdmin) {
    if (!client) throw new Error('Database client not configured');

    // 1. Fetch active requirements count & recent requirements
    const { data: requirements, error: reqErr } = await client
      .from('buying_requirements')
      .select('*')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (reqErr) throw new Error(`Failed to load requirements: ${reqErr.message}`);

    const activeRequirements = (requirements || []).filter((r) => r.status === 'ACTIVE');

    // 2. Fetch offers summary
    const { data: offers, error: offErr } = await client
      .from('offers')
      .select(`
        *,
        selling_lots (
          id,
          crop_name,
          variety,
          unit,
          approx_location
        ),
        profiles:farmer_id (
          id,
          full_name,
          state,
          district
        )
      `)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (offErr) throw new Error(`Failed to load offers: ${offErr.message}`);

    const pendingOffers = (offers || []).filter((o) => o.status === 'PENDING');
    const counteredOffers = (offers || []).filter((o) => o.status === 'COUNTERED');

    // 3. Fetch orders summary
    const { data: orders, error: ordErr } = await client
      .from('orders')
      .select(`
        *,
        selling_lots (
          id,
          crop_name,
          variety,
          unit,
          approx_location
        ),
        profiles:farmer_id (
          id,
          full_name,
          state,
          district
        )
      `)
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (ordErr) throw new Error(`Failed to load orders: ${ordErr.message}`);

    const activeOrders = (orders || []).filter((o) => ['CONFIRMED', 'IN_TRANSIT'].includes(o.order_status));
    const completedOrders = (orders || []).filter((o) => o.order_status === 'COMPLETED' || o.order_status === 'DELIVERED');

    // Compute genuine totals from actual DB records
    const totalProcuredAmount = (orders || [])
      .filter((o) => o.order_status !== 'CANCELLED')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const totalProcuredQuantity = (orders || [])
      .filter((o) => o.order_status !== 'CANCELLED')
      .reduce((sum, o) => sum + Number(o.agreed_quantity || 0), 0);

    // 4. Fetch featured active crop lots (top 6 newest)
    const { data: activeLots } = await client
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
      .order('created_at', { ascending: false })
      .limit(6);

    return {
      metrics: {
        activeRequirementsCount: activeRequirements.length,
        totalRequirementsCount: (requirements || []).length,
        pendingOffersCount: pendingOffers.length,
        counteredOffersCount: counteredOffers.length,
        activeOrdersCount: activeOrders.length,
        completedOrdersCount: completedOrders.length,
        totalProcuredAmount,
        totalProcuredQuantity,
      },
      recentRequirements: (requirements || []).slice(0, 5),
      recentOffers: (offers || []).slice(0, 5),
      recentOrders: (orders || []).slice(0, 5),
      featuredLots: activeLots || [],
    };
  },
};
