'use client';

/**
 * Onboarding Page
 * Multi-step onboarding flow with progress tracking
 * Steps: Welcome → Goal Selection → Dashboard Setup → Complete
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { SuccessModal } from '@/components/auth/SuccessModal';
import {
  GraduationCap,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
} from 'lucide-react';

type OnboardingStep = 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [selectedGoal, setSelectedGoal] = useState<'learn' | 'manage' | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);

      // Check if onboarding already completed
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed, onboarding_step, preferred_dashboard')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push(
          profile.preferred_dashboard === 'card'
            ? '/card-dashboard'
            : '/learn-dashboard'
        );
        return;
      }

      if (profile?.onboarding_step) {
        setCurrentStep(profile.onboarding_step as OnboardingStep);
      }
    };

    getUser();
  }, [router]);

  const updateOnboardingStep = async (step: OnboardingStep) => {
    if (!userId) return;

    const supabase = createClient();
    await supabase
      .from('user_profiles')
      .update({ onboarding_step: step })
      .eq('id', userId);
  };

  const handleNext = async () => {
    const nextStep = (currentStep + 1) as OnboardingStep;
    setCurrentStep(nextStep);
    await updateOnboardingStep(nextStep);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      const prevStep = (currentStep - 1) as OnboardingStep;
      setCurrentStep(prevStep);
      updateOnboardingStep(prevStep);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleComplete = async () => {
    if (!userId || !selectedGoal) return;

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Update user profile with completion status and preferred dashboard
      await supabase
        .from('user_profiles')
        .update({
          onboarding_completed: true,
          onboarding_step: 4,
          preferred_dashboard: selectedGoal === 'learn' ? 'learning' : 'card',
        })
        .eq('id', userId);

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsLoading(false);
    }
  };

  const steps = [
    {
      number: 1,
      title: 'Welcome to Creduman',
      subtitle: "Let's get you started on your credit journey",
    },
    {
      number: 2,
      title: 'What brings you here?',
      subtitle: 'Choose your primary goal',
    },
    {
      number: 3,
      title: 'Your Dashboard Awaits',
      subtitle: 'Here\'s what you can expect',
    },
    {
      number: 4,
      title: 'All Set!',
      subtitle: "You're ready to begin",
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-brand/10">
              <Sparkles className="h-10 w-10 text-brand" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome to Creduman!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                We're excited to help you master credit management and build a
                strong financial future in Canada.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto pt-6">
              <div className="p-4 rounded-lg border bg-card">
                <GraduationCap className="h-8 w-8 text-brand mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Learn</h3>
                <p className="text-sm text-muted-foreground">
                  Interactive credit education
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <CreditCard className="h-8 w-8 text-brand mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Manage</h3>
                <p className="text-sm text-muted-foreground">
                  Track all your cards
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <Sparkles className="h-8 w-8 text-brand mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Grow</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered insights
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">What's your main goal?</h2>
              <p className="text-muted-foreground">
                Don't worry, you can access everything later
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => setSelectedGoal('learn')}
                className={`p-6 rounded-lg border-2 text-left transition-all ${
                  selectedGoal === 'learn'
                    ? 'border-brand bg-brand/5'
                    : 'border-border hover:border-brand/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10">
                    <GraduationCap className="h-6 w-6 text-brand" />
                  </div>
                  {selectedGoal === 'learn' && (
                    <Check className="h-6 w-6 text-brand" />
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Learn About Credit
                </h3>
                <p className="text-muted-foreground">
                  I'm new to credit and want to understand how it works in
                  Canada
                </p>
              </button>

              <button
                onClick={() => setSelectedGoal('manage')}
                className={`p-6 rounded-lg border-2 text-left transition-all ${
                  selectedGoal === 'manage'
                    ? 'border-brand bg-brand/5'
                    : 'border-border hover:border-brand/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10">
                    <CreditCard className="h-6 w-6 text-brand" />
                  </div>
                  {selectedGoal === 'manage' && (
                    <Check className="h-6 w-6 text-brand" />
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-2">Manage My Cards</h3>
                <p className="text-muted-foreground">
                  I have credit cards and want to track them in one place
                </p>
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">
                {selectedGoal === 'learn'
                  ? 'Your Learning Dashboard'
                  : 'Your Card Management Dashboard'}
              </h2>
              <p className="text-muted-foreground">
                Here's what you'll find in your dashboard
              </p>
            </div>

            {selectedGoal === 'learn' ? (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
                    <span className="text-brand font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Interactive Learning Modules
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Step-by-step lessons covering credit basics, building
                      credit, and smart card usage
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
                    <span className="text-brand font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Track Your Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      See how far you've come and what's next on your learning
                      journey
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
                    <span className="text-brand font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Multilingual Support
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Learn in English, French, or Arabic - switch anytime
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
                    <span className="text-brand font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Connect Your Credit Cards
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Securely link cards from any Canadian bank with
                      bank-level encryption
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
                    <span className="text-brand font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Real-Time Insights
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      See balances, utilization, and payment due dates all in
                      one place
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
                    <span className="text-brand font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      AI-Powered Recommendations
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Get personalized tips to optimize payments and improve
                      your credit score
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">You're All Set!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your account is ready. Let's start building your financial
                future together.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-sm text-muted-foreground mb-4">
                Quick Tip: You can always switch between learning and card
                management dashboards from the navigation menu.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Logo */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700" />
            <span className="text-xl font-bold">Creduman</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                        currentStep >= step.number
                          ? 'border-brand bg-brand text-white'
                          : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-bold">
                          {step.number}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-center hidden sm:block">
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-2 transition-colors ${
                        currentStep > step.number ? 'bg-brand' : 'bg-border'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-12 min-h-[400px]">{renderStepContent()}</div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <Button
              onClick={handleBack}
              variant="outline"
              disabled={currentStep === 1}
              className="min-w-[100px]"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              Back
            </Button>

            <div className="flex space-x-3">
              {currentStep < 4 && currentStep !== 2 && (
                <Button onClick={handleSkip} variant="ghost">
                  Skip
                </Button>
              )}

              {currentStep < 4 ? (
                <Button
                  onClick={handleNext}
                  disabled={currentStep === 2 && !selectedGoal}
                  className="min-w-[100px]"
                >
                  Next
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  isLoading={isLoading}
                  className="min-w-[120px]"
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Welcome to Creduman!"
        message="Taking you to your dashboard..."
        redirectTo={
          selectedGoal === 'learn' ? '/learn-dashboard' : '/card-dashboard'
        }
      />
    </div>
  );
}
