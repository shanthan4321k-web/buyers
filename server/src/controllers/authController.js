import { supabaseAdmin } from '../config/supabase.js';
import { buyerProfileService } from '../services/buyerProfileService.js';

export const authController = {
  async register(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
      }

      if (!supabaseAdmin) {
        return res.status(503).json({
          success: false,
          error: 'Database connection is not configured on the server. Please check SUPABASE_URL and SUPABASE_SECRET_KEY in server/.env',
        });
      }

      // Try signing up or creating user via admin
      let user = null;
      let token = null;

      // 1. First try creating user directly with email pre-confirmed
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) {
        // If user already registered, or admin call rejected, try regular signIn or signUp
        if (createError.message.includes('already registered') || createError.message.includes('already exists')) {
          return res.status(400).json({
            success: false,
            error: 'An account with this email already exists. Please sign in instead.',
          });
        }
        
        // Fallback to signUp
        const { data: signData, error: signError } = await supabaseAdmin.auth.signUp({
          email,
          password,
        });

        if (signError) {
          return res.status(400).json({
            success: false,
            error: signError.message,
          });
        }

        user = signData.user;
        token = signData.session?.access_token;
      } else {
        user = createData.user;
      }

      // If token not yet obtained, sign in to retrieve access token
      let refreshToken = null;
      if (!token && user) {
        const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });
        if (!loginError && loginData.session) {
          token = loginData.session.access_token;
          refreshToken = loginData.session.refresh_token;
          user = loginData.user;
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        user,
        token,
        refreshToken,
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
      }

      if (!supabaseAdmin) {
        return res.status(503).json({
          success: false,
          error: 'Database connection is not configured on the server. Please check SUPABASE_URL and SUPABASE_SECRET_KEY in server/.env',
        });
      }

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        return res.status(401).json({
          success: false,
          error: error?.message || 'Invalid email or password',
        });
      }

      const profile = await buyerProfileService.getProfile(data.user.id, supabaseAdmin);
      const isComplete = Boolean(profile && (profile.is_profile_complete || profile.business_name));

      return res.json({
        success: true,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: data.user,
        profile,
        isComplete,
      });
    } catch (err) {
      next(err);
    }
  },

  async refreshSession(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
      }

      if (!supabaseAdmin) {
        return res.status(503).json({
          success: false,
          error: 'Database connection is not configured on the server.',
        });
      }

      const { data, error } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        return res.status(401).json({
          success: false,
          error: error?.message || 'Session expired. Please sign in again.',
        });
      }

      const profile = await buyerProfileService.getProfile(data.user.id, supabaseAdmin);
      const isComplete = Boolean(profile && (profile.is_profile_complete || profile.business_name));

      return res.json({
        success: true,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
        user: data.user,
        profile,
        isComplete,
      });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const profile = await buyerProfileService.getProfile(req.user.id, supabaseAdmin);
      const isComplete = Boolean(profile && (profile.is_profile_complete || profile.business_name));
      return res.json({
        success: true,
        user: req.user,
        profile,
        isComplete,
      });
    } catch (err) {
      next(err);
    }
  },
};
