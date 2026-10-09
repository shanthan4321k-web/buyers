import { supabaseAdmin, supabasePublic, createAuthenticatedSupabaseClient } from '../config/supabase.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or invalid Authorization header. Please log in.',
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Bearer token is empty.',
      });
    }

    const client = supabaseAdmin || supabasePublic;
    if (!client) {
      return res.status(503).json({
        success: false,
        error: 'Database connection is not configured on the server. Please check SUPABASE_URL and keys in .env',
      });
    }

    const { data: { user }, error } = await client.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: error?.message || 'Unauthorized: Invalid or expired access token.',
      });
    }

    req.user = user;
    req.token = token;
    req.scopedSupabase = supabaseAdmin;

    next();
  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal authentication error occurred.',
    });
  }
};
