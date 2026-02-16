/**
 * Resources Page
 * Collection of helpful credit-related resources
 */

'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';
import { ResourceCard, type Resource } from '@/components/learn/ResourceCard';
import { FAQAccordion, type FAQItem } from '@/components/learn/FAQAccordion';
import { TestimonialCarousel } from '@/components/learn/TestimonialCarousel';
import { TestimonialSkeleton } from '@/components/learn/TestimonialSkeleton';
import { learnService } from '@/services/learn.service';
import type { Testimonial } from '@/types/learn.types';

// Sample resources data
const resourcesData: Resource[] = [
  {
    id: '1',
    title: 'Materials for First 3 Months',
    type: 'document',
    category: 'Documents',
  },
  {
    id: '2',
    title: 'Materials for Months 4-6',
    type: 'document',
    category: 'Documents',
  },
  {
    id: '3',
    title: 'Materials for Months 7-12',
    type: 'document',
    category: 'Documents',
  },
  {
    id: '4',
    title: 'Articles & Quick Reads',
    type: 'document',
    category: 'Documents',
  },
  {
    id: '5',
    title: 'Canadian Newcomer Essentials',
    type: 'document',
    category: 'Documents',
  },
  {
    id: '6',
    title: "Immigrant's Success Stories",
    type: 'video',
    category: 'Videos',
  },
];

// Sample FAQ data
const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'Does checking my score lower it?',
    answer: 'Week one introduces users to the Canadian credit system in the simplest, calmest way possible. They learn what credit is, why it matters, and how their credit card affects everything. The content focuses on clarity: no stress, no deep theory, just the basics that every newcomer needs to stop feeling lost.',
  },
  {
    id: '2',
    question: 'Do I need multiple cards to build credit?',
    answer: "No, you don't need multiple cards to build credit. A single credit card, used responsibly with on-time payments and low utilization, is sufficient to establish and build your credit history. However, having multiple types of credit accounts (credit mix) can benefit your score over time.",
  },
  {
    id: '3',
    question: 'What happens if I miss a payment?',
    answer: 'Missing a payment can negatively impact your credit score, especially if the payment is more than 30 days late. Payment history is the most important factor in your credit score. If you miss a payment, contact your creditor immediately to discuss your options and set up a payment plan if needed.',
  },
  {
    id: '4',
    question: 'Should I carry a balance to build credit?',
    answer: "No, carrying a balance is not necessary to build credit. Paying your full balance each month is actually better because it helps you avoid interest charges while still building a positive payment history. The myth that you need to carry a balance is false and can cost you money in interest.",
  },
  {
    id: '5',
    question: 'Should I carry a balance to build credit?',
    answer: "No, carrying a balance is not necessary to build credit. Paying your full balance each month is actually better because it helps you avoid interest charges while still building a positive payment history. The myth that you need to carry a balance is false and can cost you money in interest.",
  },
  {
    id: '6',
    question: 'Should I carry a balance to build credit?',
    answer: "No, carrying a balance is not necessary to build credit. Paying your full balance each month is actually better because it helps you avoid interest charges while still building a positive payment history. The myth that you need to carry a balance is false and can cost you money in interest.",
  },
  {
    id: '7',
    question: 'Should I carry a balance to build credit?',
    answer: "No, carrying a balance is not necessary to build credit. Paying your full balance each month is actually better because it helps you avoid interest charges while still building a positive payment history. The myth that you need to carry a balance is false and can cost you money in interest.",
  },
  {
    id: '8',
    question: 'Should I carry a balance to build credit?',
    answer: "No, carrying a balance is not necessary to build credit. Paying your full balance each month is actually better because it helps you avoid interest charges while still building a positive payment history. The myth that you need to carry a balance is false and can cost you money in interest.",
  },
];

export default function ResourcesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'newest'>('recommended');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>('1');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const data = await learnService.getDashboardData();
      setTestimonials(data.testimonials);
    } catch (error) {
      console.error('Error loading testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFAQClick = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleResourceClick = (resource: Resource) => {
    // Navigate to detailed resource view
    console.log('Resource clicked:', resource);
  };

  const filteredResources = resourcesData.filter((resource) =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-brand mb-3">
              Resources
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl">
              When you learn with Creduman, we'll be right by your side. Explore all the resources we've developed to help you to learn faster.
            </p>
          </div>

          {/* Search and Sort Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent dark:border-gray-800 dark:bg-black dark:text-white dark:placeholder:text-gray-500"
              />
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
              <button
                onClick={() => setSortBy('recommended')}
                className={`text-sm font-medium transition-colors ${
                  sortBy === 'recommended'
                    ? 'text-brand underline'
                    : 'text-gray-600 dark:text-gray-400 hover:text-brand'
                }`}
              >
                Recommended
              </button>
              <button
                onClick={() => setSortBy('newest')}
                className={`text-sm font-medium transition-colors ${
                  sortBy === 'newest'
                    ? 'text-brand underline'
                    : 'text-gray-600 dark:text-gray-400 hover:text-brand'
                }`}
              >
                Newest
              </button>
            </div>
          </div>

          {/* Resources Grid */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onClick={() => handleResourceClick(resource)}
                />
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-brand mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqData.map((faq) => (
                <FAQAccordion
                  key={faq.id}
                  faq={faq}
                  isExpanded={expandedFAQ === faq.id}
                  onClick={handleFAQClick}
                />
              ))}
            </div>
          </section>

          {/* Testimonials Section */}
          <section className="mb-16">
            {loading ? <TestimonialSkeleton /> : <TestimonialCarousel testimonials={testimonials} />}
          </section>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
