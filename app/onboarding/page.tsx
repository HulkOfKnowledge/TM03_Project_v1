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
import { Input } from '@/components/ui/Input';
import { SuccessModal } from '@/components/auth/SuccessModal';
import { OnboardingLayout } from '@/components/onboarding/OnboardingLayout';
import { SelectInput } from '@/components/onboarding/SelectInput';
import { CheckboxGrid } from '@/components/onboarding/CheckboxGrid';
import { RadioList } from '@/components/onboarding/RadioList';
import { CheckboxList } from '@/components/onboarding/CheckboxList';
import { Navigation } from '@/components/dashboard/Navigation';

type OnboardingStage = 'personal' | 'account' | 'finish';
type FinishSubStep = 'immigration' | 'knowledge' | 'situation';

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
  const [finishSubStep, setFinishSubStep] = useState<FinishSubStep>('immigration');
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
        setFinishSubStep('immigration');
        setErrors({});
      }
    } else if (currentStage === 'finish') {
      // Navigate through finish substeps
      if (finishSubStep === 'immigration') {
        setFinishSubStep('knowledge');
      } else if (finishSubStep === 'knowledge') {
        setFinishSubStep('situation');
      } else if (finishSubStep === 'situation') {
        // Last substep - submit
        handleComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStage === 'account') {
      setCurrentStage('personal');
    } else if (currentStage === 'finish') {
      // Navigate back through finish substeps
      if (finishSubStep === 'immigration') {
        setCurrentStage('account');
      } else if (finishSubStep === 'knowledge') {
        setFinishSubStep('immigration');
      } else if (finishSubStep === 'situation') {
        setFinishSubStep('knowledge');
      }
    }
    setErrors({});
  };

  const handleDotNavigation = (subStep: FinishSubStep) => {
    if (currentStage === 'finish') {
      setFinishSubStep(subStep);
    }
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
            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Surname"
                type="text"
                value={personalDetails.surname}
                onChange={(e) =>
                  setPersonalDetails({ ...personalDetails, surname: e.target.value })
                }
                placeholder="e.g Doe"
                error={errors.surname}
              />

              <Input
                label="First Name"
                type="text"
                value={personalDetails.firstName}
                onChange={(e) =>
                  setPersonalDetails({ ...personalDetails, firstName: e.target.value })
                }
                placeholder="e.g John"
                error={errors.firstName}
              />
            </div>

            {/* Mobile Number */}
            <Input
              label="Mobile Number"
              type="tel"
              value={personalDetails.mobileNumber}
              onChange={(e) =>
                setPersonalDetails({
                  ...personalDetails,
                  mobileNumber: e.target.value,
                })
              }
              placeholder="e.g +1xxxxxxxxx"
              error={errors.mobileNumber}
            />

            {/* Email Address */}
            <Input
              label="Email Address"
              type="email"
              value={personalDetails.email}
              onChange={(e) =>
                setPersonalDetails({ ...personalDetails, email: e.target.value })
              }
              placeholder="e.g johndoe@gmail.com"
              error={errors.email}
            />

            {/* Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                value={personalDetails.password}
                onChange={(e) =>
                  setPersonalDetails({ ...personalDetails, password: e.target.value })
                }
                placeholder="8 or more characters"
                error={errors.password}
                showPasswordToggle
              />

              <Input
                label="Retype Password"
                type="password"
                value={personalDetails.confirmPassword}
                onChange={(e) =>
                  setPersonalDetails({
                    ...personalDetails,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="8 or more characters"
                error={errors.confirmPassword}
                showPasswordToggle
              />
            </div>

            <Button onClick={handleNext} className="w-full" size="lg">
              Next
            </Button>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-6">
            {/* Status in Canada */}
            <SelectInput
              label="Status in Canada"
              value={accountSetup.statusInCanada}
              onChange={(value) =>
                setAccountSetup({
                  ...accountSetup,
                  statusInCanada: value as any,
                })
              }
              options={[
                { value: 'new_immigrant', label: 'New Immigrant' },
                { value: 'permanent_resident', label: 'Permanent Resident' },
                { value: 'canadian_citizen', label: 'Canadian Citizen' },
              ]}
              error={errors.statusInCanada}
            />

            {/* Province */}
            <SelectInput
              label="Which province do you live in?"
              value={accountSetup.province}
              onChange={(value) =>
                setAccountSetup({ ...accountSetup, province: value })
              }
              options={canadianProvinces.map((province) => ({
                value: province,
                label: province,
              }))}
              placeholder="Choose province"
              error={errors.province}
            />

            {/* Primary Goal */}
            <SelectInput
              label="What's your primary goal?"
              value={accountSetup.primaryGoal}
              onChange={(value) =>
                setAccountSetup({
                  ...accountSetup,
                  primaryGoal: value as any,
                })
              }
              options={[
                { value: 'build_credit', label: 'Build credit from scratch' },
                { value: 'manage_debt', label: 'Manage existing debt' },
                { value: 'learn_credit', label: 'Learn about credit' },
                { value: 'improve_score', label: 'Improve credit score' },
              ]}
              placeholder="Choose one"
              error={errors.primaryGoal}
            />

            {/* Credit Products */}
            <CheckboxGrid
              label="Which credit products do you own?"
              options={[
                { value: 'no_credit', label: 'No credit yet' },
                { value: 'secured_card', label: 'Secured credit card' },
                { value: 'regular_card', label: 'Regular credit card' },
                { value: 'phone_plan', label: 'Phone plan on contract' },
                { value: 'auto_loan', label: 'Auto loan' },
              ]}
              selectedValues={accountSetup.creditProducts}
              onChange={(values) =>
                setAccountSetup({ ...accountSetup, creditProducts: values })
              }
              columns={3}
              error={errors.creditProducts}
            />

            <Button onClick={handleNext} className="w-full" size="lg">
              Next
            </Button>
          </div>
        );

      case 'finish':
        const finishSubSteps: FinishSubStep[] = ['immigration', 'knowledge', 'situation'];
        const currentSubStepIndex = finishSubSteps.indexOf(finishSubStep);

        return (
          <div className="space-y-8">
            {/* Immigration Status */}
            {finishSubStep === 'immigration' && (
              <RadioList
                title="Immigration Status"
                description="What best describes your status in Canada?"
                options={[
                  { value: 'new_immigrant', label: 'New Immigrant' },
                  { value: 'permanent_resident', label: 'Permanent Resident' },
                  { value: 'canadian_citizen', label: 'Canadian Citizen' },
                ]}
                selectedValue={accountSetup.immigrationStatus || ''}
                onChange={(value) =>
                  setAccountSetup({
                    ...accountSetup,
                    immigrationStatus: value as any,
                  })
                }
              />
            )}

            {/* Credit Knowledge Level */}
            {finishSubStep === 'knowledge' && (
              <RadioList
                title="Credit Knowledge Level"
                description="How familiar are you with the Canadian credit system?"
                options={[
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
                ]}
                selectedValue={accountSetup.creditKnowledge || ''}
                onChange={(value) =>
                  setAccountSetup({
                    ...accountSetup,
                    creditKnowledge: value as any,
                  })
                }
              />
            )}

            {/* Current Credit Situation */}
            {finishSubStep === 'situation' && (
              <CheckboxList
                title="What's your current credit situation"
                description="This helps us understand where you are on your credit journey so we can give you the right guidance. You can select all the options that apply to you."
                options={[
                  'No credit history in Canada yet',
                  'I have 1 credit card',
                  'I have more than 1 credit card',
                  'I have credit cards, loans, line of credit',
                  "I'm currently in debt and struggling",
                  "I've had credit problems (missed payments, collections, bankruptcy)",
                  'I have good credit but want to improve',
                ]}
                selectedValues={accountSetup.currentSituation || []}
                onChange={(values) =>
                  setAccountSetup({
                    ...accountSetup,
                    currentSituation: values,
                  })
                }
              />
            )}

            {/* Carousel Navigation Dots */}
            <div className="flex justify-center items-center space-x-2">
              {finishSubSteps.map((step, index) => (
                <button
                  key={step}
                  onClick={() => handleDotNavigation(step)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentSubStepIndex ? 'bg-brand' : 'bg-muted'
                  }`}
                  aria-label={`Go to ${step} step`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              isLoading={isLoading && finishSubStep === 'situation'}
              className="w-full"
              size="lg"
            >
              {finishSubStep === 'situation' ? 'Submit' : 'Next'}
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

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className="pt-24 pb-8 px-4">
        <OnboardingLayout
          currentStage={currentStage}
          stages={stages}
          onBack={handleBack}
          showBack={currentStage !== 'personal'}
        >
          {renderStageContent()}
        </OnboardingLayout>
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