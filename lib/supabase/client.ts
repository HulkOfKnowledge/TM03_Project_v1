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

  return createBrowserClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        if (typeof document === 'undefined') return undefined;
        const cookies = document.cookie.split('; ');
        const cookie = cookies.find(c => c.startsWith(`${name}=`));
        return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined;
      },
      set(name: string, value: string, options: any) {
        if (typeof document === 'undefined') return;
        let cookie = `${name}=${encodeURIComponent(value)}`;
        if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
        if (options?.path) cookie += `; path=${options.path}`;
        if (options?.domain) cookie += `; domain=${options.domain}`;
        if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
        if (options?.secure) cookie += '; secure';
        document.cookie = cookie;
      },
      remove(name: string, options: any) {
        if (typeof document === 'undefined') return;
        let cookie = `${name}=; max-age=0`;
        if (options?.path) cookie += `; path=${options.path}`;
        if (options?.domain) cookie += `; domain=${options.domain}`;
        document.cookie = cookie;
      },
    },
  });
}
