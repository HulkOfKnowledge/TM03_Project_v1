"use client";

/**
 * Custom Authentication Hooks
 * Centralized user and auth state management
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<UseUserReturn | undefined>(undefined);

/**
 * Auth Provider
 * Fetches user state once and shares across the app
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlightRequest = useRef<Promise<{ user: User | null; profile: UserProfile | null }> | null>(null);

  const fetchUserAndProfile = useCallback(async () => {
    try {
      if (inFlightRequest.current) {
        const inFlightResult = await inFlightRequest.current;
        setUser(inFlightResult.user);
        setProfile(inFlightResult.profile);
        return;
      }

      inFlightRequest.current = (async () => {
        const { user: nextUser, profile: nextProfile } = await fetchAuthMe();
        return { user: nextUser, profile: nextProfile };
      })();

      const { user: nextUser, profile: nextProfile } = await inFlightRequest.current;
      inFlightRequest.current = null;

      setUser(nextUser);
      setProfile(nextProfile);
    } catch (err) {
      inFlightRequest.current = null;
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    await fetchUserAndProfile();
    setLoading(false);
  }, [fetchUserAndProfile]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (loading) return;

    const isPublicRoute =
      pathname === '/' ||
      pathname?.startsWith('/login') ||
      pathname?.startsWith('/signup');

    if (!user && !isPublicRoute) {
      router.replace('/login');
    }
  }, [loading, user, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to get current user and profile from Supabase
 */
export function useUser(): UseUserReturn {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useUser must be used within AuthProvider');
  }

  const { user, profile, loading, error, refreshProfile } = context;

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
