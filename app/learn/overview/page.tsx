/**
 * Credit Platform Overview Page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';
import { PhoneMockup } from '@/components/learn/PhoneMockup';
import { CreditTermAccordion, type CreditTerm } from '@/components/learn/CreditTermAccordion';
import { LearningCarousel } from '@/components/learn/LearningCarousel';
import { TestimonialCarousel } from '@/components/learn/TestimonialCarousel';
import { learnService } from '@/services/learn.service';
import type { LearningContent, Testimonial } from '@/types/learn.types';

// Credit term definitions - Only items that appear in the phone interface
const creditTerms: CreditTerm[] = [
  {
    id: 'credit-available',
    title: 'Credit Available',
    description: 'This is how much room you have left before you reach your limit. This is the amount you can spend right now without going over.',
    proTip: {
      title: 'Pro Tip',
      content: 'Use this amount wisely to avoid going over your limit.'
    },
    lessonLink: '/learn/credit-available'
  },
  {
    id: 'pending',
    title: 'Pending',
    description: 'These are transactions that have been authorized but haven\'t been fully processed yet. The money is reserved but not yet deducted from your available credit.',
    proTip: {
      title: 'Pro Tip',
      content: 'Monitor pending transactions to avoid overspending.'
    },
    lessonLink: '/learn/pending'
  },
  {
    id: 'credit-limit',
    title: 'Credit Limit',
    description: 'This is the maximum amount of money you can borrow on your credit card. It\'s set by your credit card issuer based on your creditworthiness.',
    proTip: {
      title: 'Pro Tip',
      content: 'Never max out your credit limit - keep it under 30%.'
    },
    lessonLink: '/learn/credit-limit'
  },
  {
    id: 'statement-date',
    title: 'Statement Date',
    description: 'This is the date when your billing cycle ends and your credit card statement is generated. It shows all transactions made during that period.',
    proTip: {
      title: 'Pro Tip',
      content: 'Mark this date on your calendar to track your spending cycle.'
    },
    lessonLink: '/learn/statement-date'
  },
  {
    id: 'amount-due',
    title: 'Amount Due',
    description: 'This is the total amount you need to pay by the due date to avoid interest charges and late fees.',
    proTip: {
      title: 'Pro Tip',
      content: 'Always pay the full amount due to avoid interest charges.'
    },
    lessonLink: '/learn/amount-due'
  },
  {
    id: 'minimum-payment',
    title: 'Minimum Payment',
    description: 'This is the smallest amount you can pay to keep your account in good standing. Paying only the minimum will result in interest charges on the remaining balance.',
    proTip: {
      title: 'Pro Tip',
      content: 'Pay more than the minimum to reduce interest charges faster.'
    },
    lessonLink: '/learn/minimum-payment'
  },
  {
    id: 'due-date',
    title: 'Due Date',
    description: 'This is the deadline to make your payment. Missing this date can result in late fees and damage to your credit score.',
    proTip: {
      title: 'Pro Tip',
      content: 'Set up payment reminders or auto-pay to never miss this date.'
    },
    lessonLink: '/learn/due-date'
  },
  {
    id: 'last-payment-amount',
    title: 'Last Payment Amount',
    description: 'This shows how much you paid in your most recent payment toward your credit card balance.',
    proTip: {
      title: 'Pro Tip',
      content: 'Track your payment history to manage your budget better.'
    },
    lessonLink: '/learn/last-payment-amount'
  },
  {
    id: 'last-payment-date',
    title: 'Last Payment Date',
    description: 'This is the date when your last payment was processed and applied to your account.',
    proTip: {
      title: 'Pro Tip',
      content: 'Keep records of payment dates for your financial records.'
    },
    lessonLink: '/learn/last-payment-date'
  },
  {
    id: 'transactions',
    title: 'Transactions',
    description: 'These are all the purchases and payments made on your credit card during a specific billing period.',
    proTip: {
      title: 'Pro Tip',
      content: 'Keep records of payment dates for your financial records.'
    },
    lessonLink: '/learn/transactions'
  }
];

export default function OverviewPage() {
  const [activeView, setActiveView] = useState<'credit-app' | 'credit-card'>('credit-app');
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);
  const [clickedPhoneItem, setClickedPhoneItem] = useState<string | null>(null);
  const [recommendedContent, setRecommendedContent] = useState<LearningContent[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      const data = await learnService.getDashboardData();
      setRecommendedContent(data.recommendedContent || []);
      setTestimonials(data.testimonials || []);
    } catch (error) {
      console.error('Error loading page data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneItemClick = (termId: string) => {
    const newClickedState = clickedPhoneItem === termId ? null : termId;
    setClickedPhoneItem(newClickedState);
    setExpandedTerm(newClickedState);
    
    // Scroll to the accordion item
    if (newClickedState) {
      setTimeout(() => {
        const element = document.getElementById(`accordion-${termId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  const handleAccordionClick = (termId: string) => {
    const newExpandedState = expandedTerm === termId ? null : termId;
    setExpandedTerm(newExpandedState);
    setClickedPhoneItem(newExpandedState);
    
    // Scroll to the phone item
    if (newExpandedState) {
      setTimeout(() => {
        const phoneItem = document.getElementById(`phone-item-${termId}`);
        if (phoneItem) {
          phoneItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-brand mb-3">
              Credit Platform Overview
            </h1>
            <p className="text-base text-muted-foreground">
              Learn what each heading in your credit card and credit app means and manage yours with confidence
            </p>
          </div>

          {/* View Toggle */}
          <div className="mb-8 inline-flex gap-2 rounded-lg bg-muted p-1">
            <button
              onClick={() => setActiveView('credit-app')}
              className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors md:px-6 ${
                activeView === 'credit-app'
                  ? 'bg-brand text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Credit App
            </button>
            <button
              onClick={() => setActiveView('credit-card')}
              className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors md:px-6 ${
                activeView === 'credit-card'
                  ? 'bg-brand text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Credit Card
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[500px_1fr] lg:gap-8">
            {/* Left Column - Interactive Phone Mockup */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <PhoneMockup
                clickedItemId={clickedPhoneItem}
                onItemClick={handlePhoneItemClick}
              />
            </div>

            {/* Right Column - Accordion List */}
            <div className="space-y-2">
              {creditTerms.map((term) => (
                <CreditTermAccordion
                  key={term.id}
                  term={term}
                  isExpanded={expandedTerm === term.id}
                  onClick={handleAccordionClick}
                />
              ))}
            </div>
          </div>

          {/* Recommended for you Section */}
          <section className="mb-16 mt-16 lg:mt-24">
            <div className="flex flex-col items-start justify-between gap-4 mb-8 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-brand mb-2">
                  Recommended for you
                </h2>
                <p className="text-muted-foreground">
                  Learn all you need to know about Credit in Canada
                </p>
              </div>
              <Link
                href="/learn/all"
                className="inline-flex px-5 py-2.5 rounded-xl bg-card border border-border text-foreground font-medium hover:bg-muted transition-colors md:px-6"
              >
                View all
              </Link>
            </div>

            <div className="border-t border-border pt-8 md:pt-12" />

            <LearningCarousel
              items={recommendedContent}
              onItemClick={(content) => {
                // Handle navigation
                window.location.href = `/learn/${content.category}/${content.id}`;
              }}
              isLoading={loading}
              skeletonCount={3}
            />
          </section>

          {/* Testimonials Section */}
          <section className="mb-16">
            {!loading && testimonials.length > 0 && (
              <TestimonialCarousel testimonials={testimonials} />
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
