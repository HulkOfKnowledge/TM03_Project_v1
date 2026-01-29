'use client';

/**
 * Signup Page
 * Multi-stage signup form with social auth
 * Stage 1: Name and email
 * Stage 2: Password with strength indicator
 * Stage 3: Language preference
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
import { signupSchema } from '@/lib/validations';
import { Eye, EyeOff, ChevronLeft } from 'lucide-react';

type SignupStage = 1 | 2 | 3;

export default function SignupPage() {
  const [stage, setStage] = useState<SignupStage>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [language, setLanguage] = useState<'en' | 'fr' | 'ar'>('en');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Social authentication failed';
      setErrors({ general: message });
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-emerald-500',
  ];

  const handleNextStage = () => {
    setErrors({});

    if (stage === 1) {
      if (!fullName.trim()) {
        setErrors({ fullName: 'Full name is required' });
        return;
      }
      if (!email.trim()) {
        setErrors({ email: 'Email is required' });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrors({ email: 'Please enter a valid email' });
        return;
      }
    }

    if (stage === 2) {
      if (!password) {
        setErrors({ password: 'Password is required' });
        return;
      }
      if (password.length < 8) {
        setErrors({ password: 'Password must be at least 8 characters' });
        return;
      }
      if (password !== confirmPassword) {
        setErrors({ confirmPassword: 'Passwords do not match' });
        return;
      }
    }

    setStage((prev) => (prev + 1) as SignupStage);
  };

  const handleBackStage = () => {
    setErrors({});
    setStage((prev) => (prev - 1) as SignupStage);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    if (!agreedToTerms) {
      setErrors({ terms: 'You must agree to the terms and conditions' });
      setIsLoading(false);
      return;
    }

    try {
      // Validate all form data
      const validatedData = signupSchema.parse({
        fullName,
        email,
        password,
        language,
      });

      const supabase = createClient();

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', validatedData.email)
        .single();

      if (existingUser) {
        setErrors({ email: 'An account with this email already exists' });
        setStage(1);
        setIsLoading(false);
        return;
      }

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            full_name: validatedData.full_name,
            language: validatedData.preferred_language,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Signup failed - no user returned');
      }

      // Success - show modal and redirect to onboarding
      setShowSuccessModal(true);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error && Array.isArray(error.errors)) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: { path: (string | number)[]; message: string }) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
        setStage(1); // Go back to first stage if validation fails
      } else {
        const message = error instanceof Error ? error.message : 'Signup failed. Please try again.';
        setErrors({ general: message });
      }
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout carousel={<AuthCarousel />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
          <p className="text-muted-foreground">
            Start your credit education journey today
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`h-2 w-16 rounded-full transition-colors ${
                step <= stage ? 'bg-brand' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Social Auth Buttons (only on stage 1) */}
        {stage === 1 && (
          <>
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
                  Or continue with email
                </span>
              </div>
            </div>
          </>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
            {errors.general}
          </div>
        )}

        {/* Multi-Stage Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stage 1: Name and Email */}
          {stage === 1 && (
            <>
              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                required
              />

              <Button
                type="button"
                onClick={handleNextStage}
                className="w-full"
                size="lg"
              >
                Continue
              </Button>
            </>
          )}

          {/* Stage 2: Password */}
          {stage === 2 && (
            <>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
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

                {/* Password Strength Indicator */}
                {password && (
                  <div className="space-y-1">
                    <div className="flex space-x-1">
                      {[0, 1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            level < passwordStrength
                              ? strengthColors[passwordStrength - 1]
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Strength: {strengthLabels[passwordStrength - 1] || 'Too weak'}
                    </p>
                  </div>
                )}
              </div>

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  onClick={handleBackStage}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handleNextStage}
                  className="w-full"
                  size="lg"
                >
                  Continue
                </Button>
              </div>
            </>
          )}

          {/* Stage 3: Language and Terms */}
          {stage === 3 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Preferred Language
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'en', label: 'English' },
                    { value: 'fr', label: 'Français' },
                    { value: 'ar', label: 'العربية' },
                  ].map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => setLanguage(lang.value as 'en' | 'fr' | 'ar')}
                      className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                        language === lang.value
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-border hover:bg-accent'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-border text-brand focus:ring-brand"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground">
                  I agree to the{' '}
                  <Link href="/terms" className="text-brand hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-brand hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-500">{errors.terms}</p>
              )}

              <div className="flex space-x-3">
                <Button
                  type="button"
                  onClick={handleBackStage}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  Create Account
                </Button>
              </div>
            </>
          )}
        </form>

        {/* Sign In Link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-brand font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      {/* Success Modal */}
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
