/**
 * Middleware for Supabase Authentication
 * Refreshes user sessions and protects routes
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

 // Refresh session if expired - Allow users even with unconfirmed emails
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - require authentication (but NOT email confirmation)
  const protectedRoutes = ['/learn', '/cards', '/onboarding'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without authentication
  // Note: We allow unconfirmed users to access protected routes - the modal will handle email confirmation
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check onboarding status for protected routes
  if (user && (request.nextUrl.pathname.startsWith('/onboarding') || 
               request.nextUrl.pathname.startsWith('/learn') ||
               request.nextUrl.pathname.startsWith('/cards'))) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, preferred_dashboard')
      .eq('id', user.id)
      .single();

    // If accessing onboarding when already completed, redirect to dashboard
    if (request.nextUrl.pathname.startsWith('/onboarding') && profile?.onboarding_completed) {
      const destination = profile?.preferred_dashboard === 'card'
        ? '/cards' 
        : '/learn';
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // If accessing dashboards without completing onboarding, redirect to onboarding
    if ((request.nextUrl.pathname.startsWith('/learn') || 
         request.nextUrl.pathname.startsWith('/cards')) && 
        !profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Redirect authenticated users away from auth pages
  const authRoutes = ['/login', '/signup'];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isAuthRoute && user) {
    // Redirect to onboarding if not completed, otherwise to dashboard
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('onboarding_completed, preferred_dashboard')
      .eq('id', user.id)
      .single();

    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    const destination = profile?.preferred_dashboard === 'card' 
      ? '/card-dashboard' 
      : '/learn-dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return response;
}
