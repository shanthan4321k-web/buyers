import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api.js';

const AuthContext = createContext({});

const SESSION_STORAGE_KEY = 'agriguide_token';
const REFRESH_TOKEN_KEY = 'agriguide_refresh_token';
const SESSION_EXPIRY_KEY = 'agriguide_session_expires_at';
const USER_CACHE_KEY = 'agriguide_user_cache';
const PROFILE_CACHE_KEY = 'agriguide_profile_cache';

// 30 Days session duration in milliseconds
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [profile, setProfile] = useState(() => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [isProfileComplete, setIsProfileComplete] = useState(() => {
    try {
      const cached = localStorage.getItem(PROFILE_CACHE_KEY);
      const parsed = cached ? JSON.parse(cached) : null;
      return Boolean(parsed && (parsed.is_profile_complete || parsed.business_name));
    } catch {
      return false;
    }
  });

  const [loading, setLoading] = useState(true);

  // Helper to persist session for 30 days
  const persistSession = (token, refreshToken, userData, profileData) => {
    const expiresAt = Date.now() + THIRTY_DAYS_MS;

    if (token) localStorage.setItem(SESSION_STORAGE_KEY, token);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(SESSION_EXPIRY_KEY, String(expiresAt));

    if (userData) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
      setUser(userData);
    }

    if (profileData !== undefined) {
      if (profileData) {
        localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profileData));
        setProfile(profileData);
        setIsProfileComplete(Boolean(profileData.is_profile_complete || profileData.business_name));
      } else {
        localStorage.removeItem(PROFILE_CACHE_KEY);
        setProfile(null);
        setIsProfileComplete(false);
      }
    }
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
    localStorage.removeItem(PROFILE_CACHE_KEY);
    setUser(null);
    setProfile(null);
    setIsProfileComplete(false);
  };

  const checkCurrentUser = useCallback(async () => {
    const token = localStorage.getItem(SESSION_STORAGE_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);

    // 1. If no token or 30-day session expired
    if (!token) {
      clearSession();
      setLoading(false);
      return;
    }

    if (expiryStr && Date.now() > Number(expiryStr)) {
      console.info('30-day user session has expired. Prompting for login.');
      clearSession();
      setLoading(false);
      return;
    }

    // 2. Validate current session with backend /auth/me
    try {
      const response = await api.get('/auth/me');
      if (response.data?.success) {
        const { user: fetchedUser, profile: fetchedProfile, isComplete } = response.data;
        setUser(fetchedUser);
        setProfile(fetchedProfile);
        setIsProfileComplete(Boolean(isComplete || (fetchedProfile && fetchedProfile.business_name)));

        if (fetchedUser) localStorage.setItem(USER_CACHE_KEY, JSON.stringify(fetchedUser));
        if (fetchedProfile) {
          localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(fetchedProfile));
        }
      } else {
        throw new Error('Invalid me response');
      }
    } catch (err) {
      // 3. If token expired or rejected, try refreshing if refresh token exists
      if (refreshToken) {
        try {
          const refreshRes = await api.post('/auth/refresh', { refreshToken });
          if (refreshRes.data?.success) {
            const {
              token: newToken,
              refreshToken: newRefresh,
              user: refUser,
              profile: refProfile,
              isComplete,
            } = refreshRes.data;

            persistSession(newToken, newRefresh, refUser, refProfile);
            setIsProfileComplete(Boolean(isComplete || (refProfile && refProfile.business_name)));
            setLoading(false);
            return;
          }
        } catch (refreshErr) {
          console.warn('Session auto-refresh failed:', refreshErr.message);
        }
      }

      // If both fail and no network connection, keep cached user if unexpired
      if (expiryStr && Date.now() <= Number(expiryStr) && user) {
        console.warn('Backend check failed, retaining persistent offline session.');
      } else {
        clearSession();
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const signIn = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      const { token, refreshToken, user: loggedUser, profile: userProfile, isComplete } = res.data;
      persistSession(token, refreshToken, loggedUser, userProfile);
      setIsProfileComplete(Boolean(isComplete || (userProfile && userProfile.business_name)));
      return res.data;
    }
    throw new Error(res.data?.error || 'Login failed');
  };

  const signUp = async (email, password) => {
    const res = await api.post('/auth/register', { email, password });
    if (res.data?.success) {
      const { token, refreshToken, user: newUser } = res.data;
      if (token) {
        persistSession(token, refreshToken, newUser, null);
      }
      return res.data;
    }
    throw new Error(res.data?.error || 'Registration failed');
  };

  const signOut = async () => {
    clearSession();
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem(SESSION_STORAGE_KEY);
    if (token) {
      try {
        const response = await api.get('/auth/me');
        if (response.data?.success) {
          const { user: fetchedUser, profile: fetchedProfile, isComplete } = response.data;
          setUser(fetchedUser);
          setProfile(fetchedProfile);
          setIsProfileComplete(Boolean(isComplete || (fetchedProfile && fetchedProfile.business_name)));
          if (fetchedProfile) {
            localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(fetchedProfile));
          }
        }
      } catch (err) {
        console.warn('Failed to refresh profile data:', err.message);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isProfileComplete,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
