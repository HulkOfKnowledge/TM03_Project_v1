/**
 * OAuth Callback Handler
 * Handles OAuth authentication callback from Google/Facebook
 * Creates user profile and redirects based on user preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/onboarding';

  if (code) {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables');
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${encodeURIComponent('Server configuration error')}`
        );
      }

      const cookieStore = await cookies();
      const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
              cookieStore.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
              cookieStore.set({ name, value: '', ...options });
            },
          },
        }
      );

      // Exchange the code for a session (works with PKCE flow)
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('Session exchange error:', exchangeError);
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`
        );
      }

      // Get the authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Get user error:', userError);
        return NextResponse.redirect(`${requestUrl.origin}/login?error=no_user`);
      }

      // Check if user profile exists
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('user_profiles')
        .select('id, onboarding_completed, preferred_dashboard')
        .eq('id', user.id)
        .single();

      // If profile doesn't exist, create it
      if (profileCheckError?.code === 'PGRST116' || !existingProfile) {
        // Extract name parts from OAuth metadata
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const surname = nameParts.slice(1).join(' ') || '';

        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email: user.email!,
            first_name: firstName,
            surname: surname,
            mobile_number: null,
            preferred_language: user.user_metadata?.preferred_language || 'en',
            onboarding_completed: false,
            preferred_dashboard: 'learn',
          });

        if (createError) {
          console.error('Profile creation error:', createError);
          // Continue anyway - user is authenticated
        }

        // New user - redirect to onboarding
        return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
      }

      if (profileCheckError) {
        console.error('Profile check error:', profileCheckError);
        // User authenticated but profile check failed - go to onboarding
        return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
      }

      // Existing user - check onboarding status and redirect accordingly
      if (!existingProfile.onboarding_completed) {
        return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
      }

      // Redirect to preferred dashboard
      const dashboard = existingProfile.preferred_dashboard === 'card' 
        ? '/cards' 
        : '/learn';
      
      return NextResponse.redirect(`${requestUrl.origin}${dashboard}`);

    } catch (error) {
      console.error('Callback processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'processing_failed';
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(errorMessage)}`
      );
    }
  }

  // No code present, redirect to the next URL or default
  return NextResponse.redirect(requestUrl.origin + next);
}
