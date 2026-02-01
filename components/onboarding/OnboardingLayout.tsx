/**
 * Onboarding Layout Component
 */

'use client';

import { ChevronLeft } from 'lucide-react';

interface ProgressStep {
  stage: string;
  label: string;
  step: number;
}

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStage: string;
  stages: ProgressStep[];
  onBack?: () => void;
  showBack?: boolean;
}

export function OnboardingLayout({
  children,
  currentStage,
  stages,
  onBack,
  showBack = false,
}: OnboardingLayoutProps) {
  const currentStepNumber = stages.find((s) => s.stage === currentStage)?.step || 1;

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="">
        <div className="grid lg:grid-cols-[500px,1fr] gap-8">
          {/* Left Sidebar */}
          <div className="space-y-8">
            {/* Back Button */}
            {showBack && onBack && (
              <button
                onClick={onBack}
                className="flex items-center justify-center h-12 w-12 rounded-full border border-border hover:border-brand transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Title - Aligned with logo */}
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
                const shouldLineBeColored = currentStepNumber > step.step;

                return (
                  <div key={step.stage} className="relative flex items-start pb-8 last:pb-0">
                    {/* Vertical Line */}
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
                          isActive || isCompleted ? 'bg-brand' : 'bg-muted'
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
          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 lg:p-12">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
