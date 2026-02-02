'use client';

/**
 * Signup Page
 * Single-stage signup form with social auth
 * Fields: First Name, Surname, Mobile Number, Email, Password, Confirm Password
 * After successful signup, redirects to onboarding flow
 */

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { FormHeader, FormSection, FormDivider, FormFooter } from '@/components/auth/FormComponents';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { SuccessModal } from '@/components/auth/SuccessModal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { signupSchema } from '@/lib/validations';
import { Check } from 'lucide-react';
import { signupWithEmail, startOAuth } from '@/lib/api/auth-client';

export default function SignupPage() {
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSocialAuth = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(true);
      setErrors({});

      const redirectUrl = `${window.location.origin}/api/auth/callback?next=/onboarding`;
      const url = await startOAuth(provider, redirectUrl);
      if (url) window.location.href = url;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Social authentication failed';
      setErrors({ general: message });
      setIsLoading(false);
    }
  };

  const passwordRequirements = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8,
    },
    {
      label: 'Contains uppercase letter (A-Z)',
      met: /[A-Z]/.test(password),
    },
    {
      label: 'Contains lowercase letter (a-z)',
      met: /[a-z]/.test(password),
    },
    {
      label: 'Contains number (0-9)',
      met: /[0-9]/.test(password),
    },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (!agreedToTerms) {
      setErrors({ terms: 'You must agree to the terms and conditions' });
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      setIsLoading(false);
      return;
    }

    try {
      // Validate all form data
      const validatedData = signupSchema.parse({
        first_name: firstName,
        surname,
        mobile_number: mobileNumber,
        email,
        password,
      });

      const { response, result } = await signupWithEmail({
        ...validatedData,
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
      });

      if (!response.ok) {
        const message = result?.error?.message || 'Signup failed. Please try again.';
        if (result?.error?.code === 'EMAIL_EXISTS') {
          setErrors({ email: message });
        } else {
          setErrors({ general: message });
        }
        setIsLoading(false);
        return;
      }

      // Success - redirect to onboarding immediately
      // Email confirmation modal will be shown if email is not confirmed
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
        const message = error instanceof Error ? error.message : 'Signup failed. Please try again.';
        setErrors({ general: message });
      }
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <FormHeader
          title="Create Account"
          subtitle="Start your credit education journey today"
        />

        {/* General Error */}
        {errors.general && (
          <div className={`rounded-lg p-3 sm:p-4 text-xs sm:text-sm ${
            errors.general.includes('check your email') 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}>
            {errors.general}
          </div>
        )}

        {/* Social Auth Buttons */}
        <FormSection>
          <SocialAuthButtons
            onGoogleClick={() => handleSocialAuth('google')}
            onFacebookClick={() => handleSocialAuth('facebook')}
            isLoading={isLoading}
            actionText="Sign up with"
          />
        </FormSection>

        <FormDivider text="Or" />

        {/* Email Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <FormSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                error={errors.first_name}
                required
              />
              <Input
                label="Surname"
                type="text"
                placeholder="Doe"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                error={errors.surname}
                required
              />
            </div>

            <Input
              label="Mobile Number"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              error={errors.mobile_number}
              required
            />
          </FormSection>

          {/* Account Information */}
          <FormSection>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                showPasswordToggle
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
                showPasswordToggle
                required
              />
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                {passwordRequirements.map((requirement, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 text-xs sm:text-sm transition-colors ${
                      requirement.met
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    <div className={`flex items-center justify-center h-4 w-4 rounded-full border transition-colors ${
                      requirement.met
                        ? 'bg-green-600 border-green-600 dark:bg-green-500 dark:border-green-500'
                        : 'border-muted-foreground'
                    }`}>
                      {requirement.met && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                    <span>{requirement.label}</span>
                  </div>
                ))}
              </div>
            )}
          </FormSection>

          {/* Terms and Conditions */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand flex-shrink-0"
              />
              <label htmlFor="terms" className="text-xs sm:text-sm text-muted-foreground">
                I agree to the{' '}
                <Link href="/terms" className="text-brand hover:underline font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-brand hover:underline font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.terms && (
              <p className="text-xs sm:text-sm text-red-500">{errors.terms}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={isLoading}
          >
            <span className="text-sm sm:text-base">Create Account</span>
          </Button>
        </form>

        <FormFooter
          text="Already have an account?"
          linkText="Sign in"
          linkHref="/login"
        />
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Account Created!"
        message="Welcome to Creduman! Let's get you set up..."
        redirectTo="/onboarding"
      />
    </AuthLayout>
  );
}
