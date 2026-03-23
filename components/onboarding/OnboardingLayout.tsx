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
    <div className="md:container mx-auto md:px-6 md:py-8">
      <div className="">
        <div className="grid lg:grid-cols-[500px,1fr] gap-8">
          {/* Left Sidebar */}
          <div className="space-y-8">
            {/* Back Button */}
            {showBack && onBack && (
              <button
                onClick={onBack}
                className="flex items-center justify-center md:h-12 md:w-12 h-8 w-8 rounded-full border border-border hover:border-brand transition-colors"
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
              {/* Mobile: Horizontal stepper with label under each dot */}
              <div className="lg:hidden p-2">
                <div className="relative">
                  {/* Full-width base line */}
                  <div className="absolute left-0 right-0 top-1 h-0.5 bg-muted" />

                  {/* Colored progress line */}
                  <div
                    className="absolute left-0 top-1 h-0.5 bg-brand transition-all"
                    style={{
                      width:
                        stages.length > 1
                          ? `${((currentStepNumber - 1) / (stages.length - 1)) * 100}%`
                          : '0%',
                    }}
                  />

                  <div className="relative z-10 grid grid-cols-3">
                    {stages.map((step, index) => {
                      const isActive = currentStage === step.stage;
                      const isCompleted = currentStepNumber > step.step;
                      const alignmentClass =
                        index === 0
                          ? 'items-start text-left'
                          : index === stages.length - 1
                            ? 'items-end text-right'
                            : 'items-center text-center';

                      return (
                        <div key={step.stage} className={`flex flex-col ${alignmentClass}`}>
                          {/* Step indicator */}
                          <div
                            className={`h-2 w-2 rounded-full ${
                              isActive || isCompleted ? 'bg-brand' : 'bg-muted'
                            }`}
                          />

                          <span
                            className={`mt-2 text-xs leading-tight ${
                              isActive || isCompleted
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Desktop: Vertical stepper */}
              <div className="hidden lg:block">
                {stages.map((step, index) => {
                  const isActive = currentStage === step.stage;
                  const isCompleted = currentStepNumber > step.step;
                  const shouldLineBeColored = currentStepNumber > step.step;

                  return (
                    <div key={step.stage} className="relative flex items-start pb-8 last:pb-0">
                      {/* Vertical line */}
                      {index < stages.length - 1 && (
                        <div
                          className={`absolute left-[3px] top-2 bottom-0 w-0.5 ${
                            shouldLineBeColored ? 'bg-brand' : 'bg-muted'
                          }`}
                        />
                      )}

                      {/* Step indicator */}
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
          </div>

          {/* Right Content Area */}
          <div className="bg-card rounded-xl border border-border p-3 md:p-8 lg:p-12">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
