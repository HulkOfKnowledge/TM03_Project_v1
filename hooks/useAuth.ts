/**
 * Custom Authentication Hooks
 * Centralized user and auth state management
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import { fetchAuthMe } from '@/lib/api/auth-client';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  surname: string | null;
  mobile_number: string | null;
  avatar_url?: string | null;
  preferred_language: string;
  preferred_dashboard: 'learn' | 'card' | null;
  onboarding_completed: boolean;
  status_in_canada: string | null;
  province: string | null;
  primary_goal: string | null;
  credit_knowledge: string | null;
}

interface UseUserReturn {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
}

// Cache to avoid unnecessary refetches
let cachedUser: User | null = null;
let cachedProfile: UserProfile | null = null;
let isInitialized = false;

/**
 * Hook to get current user and profile from Supabase
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile);
  const [loading, setLoading] = useState(!isInitialized);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAndProfile = useCallback(async () => {
    try {
      const { user: nextUser, profile: nextProfile } = await fetchAuthMe();

      cachedUser = nextUser;
      cachedProfile = nextProfile;
      setUser(nextUser);
      setProfile(nextProfile);
      return nextProfile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    await fetchUserAndProfile();
    setLoading(false);
  }, [fetchUserAndProfile]);

  useEffect(() => {
    let mounted = true;

    const initializeUser = async () => {
      try {
        // Only fetch if not already initialized
        if (!isInitialized) {
          setLoading(true);
          await fetchUserAndProfile();
          if (mounted) {
            isInitialized = true;
            setLoading(false);
          }
        }
      } catch (err) {
        if (mounted) {
          console.error('Error initializing user:', err);
          setError(err instanceof Error ? err.message : 'Failed to initialize user');
          setLoading(false);
        }
      }
    };

    initializeUser();

    return () => {
      mounted = false;
    };
  }, [fetchUserAndProfile]);

  return { user, profile, loading, error, refreshProfile };
}

/**
 * Hook to handle form submission with loading and error states
 */
export function useFormSubmit<T>(
  submitFn: (data: T) => Promise<void>
): {
  isLoading: boolean;
  error: string | null;
  handleSubmit: (data: T) => Promise<void>;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: T) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await submitFn(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, handleSubmit };
}

/**
 * Hook to debounce a value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
