'use client';

/**
 * Login Page
 * Features: Social auth (Google, Facebook), email/password form
 * Two-section layout with carousel and form
 * Success modal with routing to dashboard
 */

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { AuthCarousel } from '@/components/auth/AuthCarousel';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { SuccessModal } from '@/components/auth/SuccessModal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { loginSchema } from '@/lib/validations';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string>('');

  const handleSocialAuth = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(true);
      setErrors({});

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) throw error;

      // OAuth redirects to provider, so no success modal here
    } catch (error: any) {
      setErrors({ general: error.message || 'Social authentication failed' });
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = loginSchema.parse({ email, password });

      const supabase = createClient();

      // Sign in with email and password
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password: validatedData.password,
        });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Login failed - no user returned');
      }

      // Fetch user profile to determine preferred dashboard
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('preferred_dashboard, onboarding_completed')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // Determine redirect destination
      let destination = '/learn-dashboard';
      
      if (!profile?.onboarding_completed) {
        destination = '/onboarding';
      } else if (profile?.preferred_dashboard === 'card') {
        destination = '/card-dashboard';
      }

      setRedirectTo(destination);
      setShowSuccessModal(true);
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({
          general: error.message || 'Login failed. Please check your credentials.',
        });
      }
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout carousel={<AuthCarousel />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Hello Again!</h1>
          <p className="text-muted-foreground">
            Welcome back to Creduman, login to continue
          </p>
        </div>

        {/* Social Auth Buttons */}
        <SocialAuthButtons
          onGoogleClick={() => handleSocialAuth('google')}
          onFacebookClick={() => handleSocialAuth('facebook')}
          isLoading={isLoading}
        />

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
            {errors.general}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />

          <div className="space-y-2">
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="8 or more characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-brand hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Login
          </Button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-muted-foreground">
          I don&apos;t have an account?{' '}
          <Link href="/signup" className="text-brand font-medium hover:underline">
            Create account
          </Link>
        </p>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Welcome Back!"
        message="You've successfully signed in. Taking you to your dashboard..."
        redirectTo={redirectTo}
      />
    </AuthLayout>
  );
}
