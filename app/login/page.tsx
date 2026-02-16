'use client';

/**
 * Login Page
 * Features: Social auth (Google, Facebook), email/password form
 * Two-section layout with carousel and form
 * Success modal with routing to dashboard
 */

import { useState, FormEvent, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormHeader, FormSection, FormDivider, FormFooter } from '@/components/auth/FormComponents';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { SuccessModal } from '@/components/auth/SuccessModal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { loginSchema } from '@/lib/validations';
import { loginWithEmail, resendConfirmationEmail, startOAuth, clearAuthCache } from '@/lib/api/auth-client';
function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redirectTo, setRedirectTo] = useState<string>('');
  const [showResendButton, setShowResendButton] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Check for OAuth errors from callback
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      setErrors({ general: `Authentication failed: ${decodeURIComponent(error)}` });
    }
  }, [searchParams]);

  const handleSocialAuth = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(true);
      setErrors({});

      const redirectUrl = `${window.location.origin}/api/auth/callback`;
      const url = await startOAuth(provider, redirectUrl);
      if (url) window.location.href = url;

      // OAuth redirects to provider, so no success modal here
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Social authentication failed';
      setErrors({ general: message });
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

      const { response, result } = await loginWithEmail(validatedData);

      if (!response.ok) {
        const message = result?.error?.message || 'Login failed. Please check your credentials.';
        if (message.includes('Email not confirmed') || message.includes('email_not_confirmed')) {
          setErrors({
            general: 'Your email address has not been confirmed yet. Please check your inbox for the confirmation email.'
          });
          setShowResendButton(true);
          setIsLoading(false);
          return;
        }
        throw new Error(message);
      }

      // Clear auth cache to force fresh data after login
      clearAuthCache();

      const profile = result?.data?.profile;

      // Determine redirect destination
      let destination = '/learn';
      
      if (!profile?.onboarding_completed) {
        destination = '/onboarding';
      } else if (profile?.preferred_dashboard === 'card') {
        destination = '/cards';
      }

      setRedirectTo(destination);
      setShowSuccessModal(true);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error && Array.isArray(error.errors)) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        const message = error instanceof Error ? error.message : 'Login failed. Please check your credentials.';
        setErrors({ general: message });
      }
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    try {
      setIsLoading(true);
      const ok = await resendConfirmationEmail({
        email,
        redirectTo: `${window.location.origin}/api/auth/callback`,
      });

      if (!ok) throw new Error('Failed to resend email');
      
      setResendSuccess(true);
      setErrors({ general: '✓ Confirmation email sent! Please check your inbox.' });
      setShowResendButton(false);
    } catch (error) {
      setErrors({ general: 'Failed to resend email. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-10">
        <FormHeader
          title="Hello Again!"
          subtitle="Welcome back to Creduman, login to continue"
        />

        {/* Social Auth Buttons */}
        <FormSection>
          <SocialAuthButtons
            onGoogleClick={() => handleSocialAuth('google')}
            onFacebookClick={() => handleSocialAuth('facebook')}
            isLoading={isLoading}
          />
        </FormSection>

        <FormDivider text="Or" />

        {/* General Error */}
        {errors.general && (
          <div className={`rounded-lg p-3 sm:p-4 text-sm ${
            resendSuccess 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}>
            <div className="space-y-2">
              <p>{errors.general}</p>
              {showResendButton && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isLoading}
                  className="text-sm font-medium underline hover:no-underline disabled:opacity-50"
                >
                  Resend Confirmation Email
                </button>
              )}
            </div>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormSection>
            <Input
              label="Email"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="8 or more characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              showPasswordToggle
              required
            />
          </FormSection>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-xs sm:text-sm text-brand hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            <span className="text-sm sm:text-base">Login</span>
          </Button>
        </form>

        <FormFooter
          text="I don't have an account?"
          linkText="Create account"
          linkHref="/signup"
        />
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
        </div>
      </AuthLayout>
    }>
      <LoginForm />
    </Suspense>
  );
}
