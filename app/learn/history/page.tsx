/**
 * Learning History Page
 * Track user's learning progress and completed content
 */

'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';
import { Search, SlidersHorizontal } from 'lucide-react';
import { TestimonialCarousel } from '@/components/learn/TestimonialCarousel';
import { learnService } from '@/services/learn.service';
import type { Testimonial } from '@/types/learn.types';

interface LearningHistoryItem {
  id: string;
  title: string;
  subtitle: string;
  type: '3-step guide' | 'video' | 'article';
  progress: number;
  status: 'complete' | 'in-progress';
  imageUrl?: string;
  completedAt?: Date;
}

// Sample data - replace with actual API call
const sampleHistory: LearningHistoryItem[] = [
  {
    id: '1',
    title: 'Guide to Adding Your First Credit Card',
    subtitle: 'No jargon. No pressure. Just clarity.',
    type: '3-step guide',
    progress: 100,
    status: 'complete',
    completedAt: new Date('2024-02-10')
  },
  {
    id: '2',
    title: 'Guide to Adding Your First Credit Card',
    subtitle: 'No jargon. No pressure. Just clarity.',
    type: '3-step guide',
    progress: 0,
    status: 'in-progress'
  },
  {
    id: '3',
    title: 'Guide to Adding Your First Credit Card',
    subtitle: 'No jargon. No pressure. Just clarity.',
    type: '3-step guide',
    progress: 21,
    status: 'in-progress'
  }
];

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [historyItems] = useState<LearningHistoryItem[]>(sampleHistory);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      const data = await learnService.getDashboardData();
      setTestimonials(data.testimonials || []);
    } catch (error) {
      console.error('Error loading page data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = historyItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Learning History
          </h1>

          {/* Search and Filter */}
          <div className="flex gap-3 mb-8">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-4 pr-12 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <button className="h-12 px-5 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2">
              <span className="hidden sm:inline">Filter</span>
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-white/10 mb-8" />

          {/* Learning History List */}
          <div className="space-y-6 mb-16">
            {filteredItems.length === 0 ? (
              <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">No learning history found</p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <HistoryCard key={item.id} item={item} />
              ))
            )}
          </div>

          {/* Testimonials Section */}
          {!loading && testimonials.length > 0 && (
            <section className="mb-16">
              <TestimonialCarousel testimonials={testimonials} />
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// History Card Component
interface HistoryCardProps {
  item: LearningHistoryItem;
}

function HistoryCard({ item }: HistoryCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black p-4 hover:border-brand/50 cursor-pointer md:flex-row md:items-center md:justify-between md:p-6">
      {/* Left Section - Image and Content */}
      <div className="flex flex-1 gap-3 md:gap-4">
        {/* Thumbnail Placeholder */}
        <div className="h-16 w-16 shrink-0 rounded-lg bg-[linear-gradient(45deg,#f0f0f0_25%,transparent_25%,transparent_75%,#f0f0f0_75%,#f0f0f0),linear-gradient(45deg,#f0f0f0_25%,transparent_25%,transparent_75%,#f0f0f0_75%,#f0f0f0)] bg-[length:20px_20px] bg-[position:0_0,10px_10px] dark:bg-[linear-gradient(45deg,#2a2a2a_25%,transparent_25%,transparent_75%,#2a2a2a_75%,#2a2a2a),linear-gradient(45deg,#2a2a2a_25%,transparent_25%,transparent_75%,#2a2a2a_75%,#2a2a2a)] md:h-20 md:w-20" />

        {/* Content */}
        <div className="flex flex-1 flex-col justify-center min-w-0">
          <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white md:text-base lg:text-lg line-clamp-2">
            {item.title}
          </h3>
          <p className="mb-2 text-xs text-gray-600 dark:text-gray-400 md:text-sm md:mb-3 line-clamp-1">
            {item.subtitle}
          </p>

          {/* Progress Bar */}
          <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10 md:h-2 md:max-w-xs">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${item.progress}%` }}
            />
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 md:gap-2 md:text-xs">
            <span className="truncate">{item.type}</span>
            <span className="h-1 w-1 shrink-0 rounded-full bg-gray-400 dark:bg-gray-600" />
            <span className="truncate">{item.status === 'complete' ? 'Complete' : `${item.progress}% Complete`}</span>
          </div>
        </div>
      </div>

      {/* Right Section - Knowledge Level */}
      <div className="flex items-center justify-between border-t border-gray-200 dark:border-white/10 pt-4 md:border-t-0 md:pt-0 md:flex-col md:items-end md:justify-center md:gap-1 md:min-w-[100px] md:shrink-0">
        <span className="text-xs text-gray-500 dark:text-gray-400 md:hidden">Knowledge Level</span>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white md:text-4xl lg:text-5xl">
            {item.progress}%
          </div>
          <div className="hidden text-sm text-gray-500 dark:text-gray-400 md:block">
            Knowledge Level
          </div>
        </div>
      </div>
    </div>
  );
}
