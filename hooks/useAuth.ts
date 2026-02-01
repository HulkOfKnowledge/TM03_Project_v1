/**
 * Custom Authentication Hooks
 * Centralized user and auth state management
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  surname: string | null;
  mobile_number: string | null;
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

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      cachedProfile = data as UserProfile;
      setProfile(cachedProfile);
      return cachedProfile;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      setLoading(true);
      await fetchProfile(user.id);
      setLoading(false);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const initializeUser = async () => {
      try {
        // Only fetch if not already initialized
        if (!isInitialized) {
          setLoading(true);
          const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
          
          if (authError) throw authError;

          if (mounted) {
            cachedUser = authUser;
            setUser(authUser);

            if (authUser) {
              await fetchProfile(authUser.id);
            }

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

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      const newUser = session?.user ?? null;
      
      // Only update if user actually changed
      if (newUser?.id !== cachedUser?.id) {
        cachedUser = newUser;
        setUser(newUser);

        if (newUser) {
          setLoading(true);
          await fetchProfile(newUser.id);
          setLoading(false);
        } else {
          cachedProfile = null;
          setProfile(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

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
