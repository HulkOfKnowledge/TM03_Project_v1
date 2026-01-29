/**
 * Home Page - Modern Landing Page
 * Features: Hero section, features, how it works, CTA
 * Supports light/dark mode with brand colors
 */

import Link from 'next/link';
import {
  CreditCard,
  GraduationCap,
  TrendingUp,
  Shield,
  Globe,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Navigation } from '@/components/landing/Navigation';
import { Section, SectionHeader } from '@/components/landing/Section';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { GradientText } from '@/components/landing/GradientText';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <Section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-sm">
            <Sparkles className="mr-2 h-4 w-4 text-brand" />
            <span>Welcome to Canada&apos;s Credit Education Platform</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl max-w-4xl">
            Master Your Credit,{' '}
            <GradientText>Build Your Future</GradientText>
          </h1>

          <p className="mb-8 text-lg text-muted-foreground max-w-2xl">
            Creduman helps Canadian newcomers understand credit, manage cards
            effectively, and build a strong financial foundation with AI-powered
            insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-brand px-8 py-3 text-base font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Start Learning Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center rounded-lg border border-border px-8 py-3 text-base font-medium hover:bg-accent transition-colors"
            >
              Explore Features
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl">
            <div>
              <div className="text-3xl font-bold text-brand">100+</div>
              <div className="text-sm text-muted-foreground">
                Learning Modules
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand">3</div>
              <div className="text-sm text-muted-foreground">Languages</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-brand">24/7</div>
              <div className="text-sm text-muted-foreground">
                AI Insights
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Features Section */}
      <Section id="features" className="bg-muted/50">
        <SectionHeader
          title="Everything You Need to Succeed"
          subtitle="Comprehensive tools and education designed specifically for newcomers to Canada"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<GraduationCap className="h-6 w-6" />}
            title="Interactive Learning"
            description="Master credit fundamentals through engaging modules in English, French, or Arabic."
          />
          <FeatureCard
            icon={<CreditCard className="h-6 w-6" />}
            title="Card Management"
            description="Connect and track all your credit cards in one secure dashboard with real-time data."
          />
          <FeatureCard
            icon={<TrendingUp className="h-6 w-6" />}
            title="AI-Powered Insights"
            description="Get personalized recommendations to improve your credit score and save on interest."
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6" />}
            title="Bank-Level Security"
            description="Your data is protected with enterprise-grade encryption and security measures."
          />
          <FeatureCard
            icon={<Globe className="h-6 w-6" />}
            title="Multilingual Support"
            description="Access all features in English, French, or Arabic to learn in your preferred language."
          />
          <FeatureCard
            icon={<Sparkles className="h-6 w-6" />}
            title="Smart Automation"
            description="Automatic credit monitoring and alerts to help you stay on top of your finances."
          />
        </div>
      </Section>

      {/* How It Works Section */}
      <Section id="how-it-works">
        <SectionHeader
          title="How Creduman Works"
          subtitle="Get started in minutes and take control of your credit journey"
        />

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white font-bold text-xl mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2">Sign Up Free</h3>
            <p className="text-muted-foreground">
              Create your account in seconds. No credit card required to start
              learning.
            </p>
          </div>

          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white font-bold text-xl mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect Your Cards</h3>
            <p className="text-muted-foreground">
              Securely link your credit cards to get real-time insights and
              personalized recommendations.
            </p>
          </div>

          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white font-bold text-xl mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2">Build Your Future</h3>
            <p className="text-muted-foreground">
              Follow AI-powered recommendations and learn as you go to achieve
              your financial goals.
            </p>
          </div>
        </div>
      </Section>

      {/* Benefits Section */}
      <Section className="bg-muted/50" id="about">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              Why Choose <GradientText>Creduman</GradientText>?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              We understand the challenges newcomers face when navigating
              Canada&apos;s credit system. Creduman was built to bridge that gap
              with education, tools, and support in your language.
            </p>

            <div className="space-y-4">
              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-brand mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">
                    Designed for Newcomers
                  </h4>
                  <p className="text-muted-foreground">
                    Content tailored specifically for those new to the Canadian
                    credit system
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-brand mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">
                    Free Educational Content
                  </h4>
                  <p className="text-muted-foreground">
                    Access comprehensive learning modules at no cost
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-brand mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Smart Recommendations</h4>
                  <p className="text-muted-foreground">
                    AI-powered insights help you make better financial decisions
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="h-6 w-6 text-brand mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-1">Your Language, Your Way</h4>
                  <p className="text-muted-foreground">
                    Available in English, French, and Arabic
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-8 flex items-center justify-center">
              <div className="text-center text-white">
                <CreditCard className="h-24 w-24 mx-auto mb-4 opacity-80" />
                <p className="text-xl font-semibold">
                  Your Credit Journey Starts Here
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6">
            Ready to Take Control of Your Credit?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of newcomers who are building their financial future
            with Creduman.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-brand px-8 py-4 text-lg font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-brand-500 to-brand-700" />
              <span className="font-semibold">Creduman</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2026 Creduman. Empowering newcomers to build credit confidence.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
