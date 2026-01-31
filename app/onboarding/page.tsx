'use client';

/**
 * Onboarding Page - Multi-stage Form
 * Flow: Personal Details → Account Setup → Finish
 * Collects comprehensive user information for personalized experience
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { SuccessModal } from '@/components/auth/SuccessModal';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';

type OnboardingStage = 'personal' | 'account' | 'finish';

interface PersonalDetails {
  surname: string;
  firstName: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface AccountSetup {
  statusInCanada: 'new_immigrant' | 'permanent_resident' | 'canadian_citizen' | '';
  province: string;
  primaryGoal: 'build_credit' | 'manage_debt' | 'learn_credit' | 'improve_score' | '';
  creditProducts: string[]; // Array of: 'no_credit', 'secured_card', 'regular_card', 'phone_plan', 'auto_loan'
  immigrationStatus?: 'new_immigrant' | 'permanent_resident' | 'canadian_citizen' | '';
  creditKnowledge?: 'no_knowledge' | 'beginner' | 'intermediate' | 'advanced' | '';
  currentSituation?: string[]; // Array of current credit situations
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState<OnboardingStage>('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails>({
    surname: '',
    firstName: '',
    mobileNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [accountSetup, setAccountSetup] = useState<AccountSetup>({
    statusInCanada: '',
    province: '',
    primaryGoal: '',
    creditProducts: [],
    immigrationStatus: '',
    creditKnowledge: '',
    currentSituation: [],
  });

  useEffect(() => {
    // Get current user and check if onboarding is already completed
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        setPersonalDetails((prev) => ({ ...prev, email: user.email || '' }));

        // Check if onboarding already completed
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed, preferred_dashboard')
          .eq('id', user.id)
          .single();

        if (profile?.onboarding_completed) {
          router.push(
            profile.preferred_dashboard === 'card'
              ? '/card-dashboard'
              : '/learn-dashboard'
          );
        }
      }
    };

    getUser();
  }, [router]);

  const validatePersonalDetails = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!personalDetails.surname.trim()) {
      newErrors.surname = 'Surname is required';
    }
    if (!personalDetails.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!personalDetails.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^\+?[1-9]\d{9,14}$/.test(personalDetails.mobileNumber.replace(/\s/g, ''))) {
      newErrors.mobileNumber = 'Please enter a valid mobile number';
    }
    if (!personalDetails.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalDetails.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (personalDetails.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (personalDetails.password !== personalDetails.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAccountSetup = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!accountSetup.statusInCanada) {
      newErrors.statusInCanada = 'Please select your status in Canada';
    }
    if (!accountSetup.province) {
      newErrors.province = 'Please select your province';
    }
    if (!accountSetup.primaryGoal) {
      newErrors.primaryGoal = 'Please select your primary goal';
    }
    if (accountSetup.creditProducts.length === 0) {
      newErrors.creditProducts = 'Please select at least one option';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStage === 'personal') {
      if (validatePersonalDetails()) {
        setCurrentStage('account');
        setErrors({});
      }
    } else if (currentStage === 'account') {
      if (validateAccountSetup()) {
        setCurrentStage('finish');
        setErrors({});
      }
    }
  };

  const handleBack = () => {
    if (currentStage === 'account') {
      setCurrentStage('personal');
    } else if (currentStage === 'finish') {
      setCurrentStage('account');
    }
    setErrors({});
  };

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Determine preferred dashboard based on primary goal
      const preferredDashboard =
        accountSetup.primaryGoal === 'learn_credit' ? 'learn' : 'card';

      // Update user profile with all collected data
      await supabase
        .from('user_profiles')
        .update({
          onboarding_completed: true,
          first_name: personalDetails.firstName,
          last_name: personalDetails.surname,
          mobile_number: personalDetails.mobileNumber,
          status_in_canada: accountSetup.statusInCanada,
          province: accountSetup.province,
          primary_goal: accountSetup.primaryGoal,
          credit_products: accountSetup.creditProducts,
          immigration_status: accountSetup.immigrationStatus,
          credit_knowledge: accountSetup.creditKnowledge,
          current_situation: accountSetup.currentSituation,
          preferred_dashboard: preferredDashboard,
        })
        .eq('id', userId);

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsLoading(false);
    }
  };

  const canadianProvinces = [
    'Alberta',
    'British Columbia',
    'Manitoba',
    'New Brunswick',
    'Newfoundland and Labrador',
    'Northwest Territories',
    'Nova Scotia',
    'Nunavut',
    'Ontario',
    'Prince Edward Island',
    'Quebec',
    'Saskatchewan',
    'Yukon',
  ];

  const renderStageContent = () => {
    switch (currentStage) {
      case 'personal':
        return (
          <div className="space-y-6">
            {/* Surname */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Surname
              </label>
              <input
                type="text"
                value={personalDetails.surname}
                onChange={(e) =>
                  setPersonalDetails({ ...personalDetails, surname: e.target.value })
                }
                placeholder="e.g Doe"
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.surname ? 'border-red-500' : 'border-border'
                } bg-background focus:outline-none focus:ring-2 focus:ring-brand`}
              />
              {errors.surname && (
                <p className="text-red-500 text-sm mt-1">{errors.surname}</p>
              )}
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                First Name
              </label>
              <input
                type="text"
                value={personalDetails.firstName}
                onChange={(e) =>
                  setPersonalDetails({ ...personalDetails, firstName: e.target.value })
                }
                placeholder="e.g John"
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.firstName ? 'border-red-500' : 'border-border'
                } bg-background focus:outline-none focus:ring-2 focus:ring-brand`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                value={personalDetails.mobileNumber}
                onChange={(e) =>
                  setPersonalDetails({
                    ...personalDetails,
                    mobileNumber: e.target.value,
                  })
                }
                placeholder="e.g +1xxxxxxxxx"
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.mobileNumber ? 'border-red-500' : 'border-border'
                } bg-background focus:outline-none focus:ring-2 focus:ring-brand`}
              />
              {errors.mobileNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.mobileNumber}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={personalDetails.email}
                onChange={(e) =>
                  setPersonalDetails({ ...personalDetails, email: e.target.value })
                }
                placeholder="e.g johndoe@gmail.com"
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-border'
                } bg-background focus:outline-none focus:ring-2 focus:ring-brand`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={personalDetails.password}
                  onChange={(e) =>
                    setPersonalDetails({ ...personalDetails, password: e.target.value })
                  }
                  placeholder="8 or more characters"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.password ? 'border-red-500' : 'border-border'
                  } bg-background focus:outline-none focus:ring-2 focus:ring-brand pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Retype Password */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Retype Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={personalDetails.confirmPassword}
                  onChange={(e) =>
                    setPersonalDetails({
                      ...personalDetails,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="8 or more characters"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-border'
                  } bg-background focus:outline-none focus:ring-2 focus:ring-brand pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <Button onClick={handleNext} className="w-full" size="lg">
              Next
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              I have an account?{' '}
              <a href="/login" className="text-brand hover:underline">
                Login
              </a>
            </p>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            {/* Status in Canada */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Status in Canada
              </label>
              <select
                value={accountSetup.statusInCanada}
                onChange={(e) =>
                  setAccountSetup({
                    ...accountSetup,
                    statusInCanada: e.target.value as any,
                  })
                }
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.statusInCanada ? 'border-red-500' : 'border-border'
                } bg-background focus:outline-none focus:ring-2 focus:ring-brand appearance-none`}
              >
                <option value="">Select one</option>
                <option value="new_immigrant">New Immigrant</option>
                <option value="permanent_resident">Permanent Resident</option>
                <option value="canadian_citizen">Canadian Citizen</option>
              </select>
              {errors.statusInCanada && (
                <p className="text-red-500 text-sm mt-1">{errors.statusInCanada}</p>
              )}
            </div>

            {/* Province */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Which province do you live in?
              </label>
              <select
                value={accountSetup.province}
                onChange={(e) =>
                  setAccountSetup({ ...accountSetup, province: e.target.value })
                }
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.province ? 'border-red-500' : 'border-border'
                } bg-background focus:outline-none focus:ring-2 focus:ring-brand appearance-none`}
              >
                <option value="">Choose province</option>
                {canadianProvinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
              {errors.province && (
                <p className="text-red-500 text-sm mt-1">{errors.province}</p>
              )}
            </div>

            {/* Primary Goal */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                What's your primary goal?
              </label>
              <select
                value={accountSetup.primaryGoal}
                onChange={(e) =>
                  setAccountSetup({
                    ...accountSetup,
                    primaryGoal: e.target.value as any,
                  })
                }
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.primaryGoal ? 'border-red-500' : 'border-border'
                } bg-background focus:outline-none focus:ring-2 focus:ring-brand appearance-none`}
              >
                <option value="">Choose one</option>
                <option value="build_credit">Build credit from scratch</option>
                <option value="manage_debt">Manage existing debt</option>
                <option value="learn_credit">Learn about credit</option>
                <option value="improve_score">Improve credit score</option>
              </select>
              {errors.primaryGoal && (
                <p className="text-red-500 text-sm mt-1">{errors.primaryGoal}</p>
              )}
            </div>

            {/* Credit Products */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Which credit products do you own?
              </label>
              <div className="space-y-3">
                {[
                  { value: 'no_credit', label: 'No credit yet' },
                  { value: 'secured_card', label: 'Secured credit card' },
                  { value: 'regular_card', label: 'Regular credit card' },
                  { value: 'phone_plan', label: 'Phone plan on contract' },
                  { value: 'auto_loan', label: 'Auto loan' },
                ].map((product) => (
                  <label
                    key={product.value}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={accountSetup.creditProducts.includes(product.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAccountSetup({
                            ...accountSetup,
                            creditProducts: [
                              ...accountSetup.creditProducts,
                              product.value,
                            ],
                          });
                        } else {
                          setAccountSetup({
                            ...accountSetup,
                            creditProducts: accountSetup.creditProducts.filter(
                              (p) => p !== product.value
                            ),
                          });
                        }
                      }}
                      className="h-5 w-5 rounded border-border text-brand focus:ring-brand"
                    />
                    <span className="text-foreground">{product.label}</span>
                  </label>
                ))}
              </div>
              {errors.creditProducts && (
                <p className="text-red-500 text-sm mt-1">{errors.creditProducts}</p>
              )}
            </div>

            <Button onClick={handleNext} className="w-full" size="lg">
              Next
            </Button>
          </div>
        );

      case 'finish':
        return (
          <div className="space-y-8">
            {/* Immigration Status */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Immigration Status</h3>
              <p className="text-sm text-muted-foreground mb-4">
                What best describes your status in Canada?
              </p>
              <div className="space-y-3">
                {[
                  { value: 'new_immigrant', label: 'New Immigrant' },
                  { value: 'permanent_resident', label: 'Permanent Resident' },
                  { value: 'canadian_citizen', label: 'Canadian Citizen' },
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() =>
                      setAccountSetup({
                        ...accountSetup,
                        immigrationStatus: status.value as any,
                      })
                    }
                    className={`w-full px-6 py-4 rounded-lg border-2 text-left transition-all ${
                      accountSetup.immigrationStatus === status.value
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-border hover:border-brand/50'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Credit Knowledge Level */}
            <div>
              <h3 className="text-xl font-semibold mb-2">Credit Knowledge Level</h3>
              <p className="text-sm text-muted-foreground mb-4">
                How familiar are you with the Canadian credit system?
              </p>
              <div className="space-y-3">
                {[
                  { value: 'no_knowledge', label: "What's a credit score? (No knowledge)" },
                  {
                    value: 'beginner',
                    label: "I've heard about it but don't really understand (Beginner)",
                  },
                  {
                    value: 'intermediate',
                    label: 'I understand the basics (Intermediate)',
                  },
                  {
                    value: 'advanced',
                    label: "I'm pretty knowledgeable (Advanced)",
                  },
                ].map((level) => (
                  <button
                    key={level.value}
                    onClick={() =>
                      setAccountSetup({
                        ...accountSetup,
                        creditKnowledge: level.value as any,
                      })
                    }
                    className={`w-full px-6 py-4 rounded-lg border-2 text-left transition-all ${
                      accountSetup.creditKnowledge === level.value
                        ? 'border-brand bg-brand/5 text-brand'
                        : 'border-border hover:border-brand/50'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Credit Situation */}
            <div>
              <h3 className="text-xl font-semibold mb-2">
                What's your current credit situation
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This helps us understand where you are on your credit journey so we can
                give you the right guidance. You can select all the options that apply to
                you.
              </p>
              <div className="space-y-3">
                {[
                  'No credit history in Canada yet',
                  'I have 1 credit card',
                  'I have more than 1 credit card',
                  'I have credit cards, loans, line of credit',
                  "I'm currently in debt and struggling",
                  "I've had credit problems (missed payments, collections, bankruptcy)",
                  'I have good credit but want to improve',
                ].map((situation) => (
                  <label
                    key={situation}
                    className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-border hover:border-brand/50 transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={accountSetup.currentSituation?.includes(situation)}
                      onChange={(e) => {
                        const current = accountSetup.currentSituation || [];
                        if (e.target.checked) {
                          setAccountSetup({
                            ...accountSetup,
                            currentSituation: [...current, situation],
                          });
                        } else {
                          setAccountSetup({
                            ...accountSetup,
                            currentSituation: current.filter((s) => s !== situation),
                          });
                        }
                      }}
                      className="h-5 w-5 rounded border-border text-brand focus:ring-brand"
                    />
                    <span className="text-foreground flex-1">{situation}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleComplete}
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              Next
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const stages: Array<{ stage: OnboardingStage; label: string; step: number }> = [
    { stage: 'personal', label: 'Personal details', step: 1 },
    { stage: 'account', label: 'Account setup', step: 2 },
    { stage: 'finish', label: 'Finish', step: 3 },
  ];

  const currentStepNumber = stages.find((s) => s.stage === currentStage)?.step || 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-[#1a1a1a] dark:bg-[#1a1a1a]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700" />
            <span className="text-xl font-bold text-white">Creduman</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-[300px,1fr] gap-8">
            {/* Left Sidebar */}
            <div className="space-y-8">
              {/* Back Button - Only show if not on first step */}
              {currentStage !== 'personal' && (
                <button
                  onClick={handleBack}
                  className="flex items-center justify-center h-12 w-12 rounded-full border border-border hover:border-brand transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-brand">
                  Let's get Started!
                </h1>
                <p className="text-muted-foreground">
                  We are glad to have you, fill out the information
                </p>
              </div>

              {/* Progress Steps */}
              <div className="relative">
                {stages.map((step, index) => {
                  const isActive = currentStage === step.stage;
                  const isCompleted = currentStepNumber > step.step;
                  
                  // Line should be purple only if current step is beyond this one
                  const shouldLineBeColored = currentStepNumber > step.step;

                  return (
                    <div key={step.stage} className="relative flex items-start pb-8 last:pb-0">
                      {/* Vertical Line - Only show if not the last item */}
                      {index < stages.length - 1 && (
                        <div
                          className={`absolute left-[3px] top-2 bottom-0 w-0.5 ${
                            shouldLineBeColored ? 'bg-brand' : 'bg-muted'
                          }`}
                        />
                      )}

                      {/* Step Indicator */}
                      <div className="relative z-10 flex items-center space-x-3">
                        <div
                          className={`h-2 w-2 rounded-full flex-shrink-0 ${
                            isActive || isCompleted
                              ? 'bg-brand'
                              : 'bg-muted'
                          }`}
                        />
                        <span
                          className={`text-base ${
                            isActive || isCompleted
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Content Area */}
            <div className="bg-card rounded-2xl border border-border p-8 lg:p-12">
              {renderStageContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Welcome to Creduman!"
        message="Your account is all set up. Taking you to your dashboard..."
        redirectTo={
          accountSetup.primaryGoal === 'learn_credit'
            ? '/learn-dashboard'
            : '/card-dashboard'
        }
      />
    </div>
  );
}