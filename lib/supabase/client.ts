/**
 * Supabase Client - Client Side
 * Use this in Client Components
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Use default cookie handling from @supabase/ssr
  // This prevents 403 errors and handles sessions correctly
  return createBrowserClient(supabaseUrl, supabaseKey);
}
