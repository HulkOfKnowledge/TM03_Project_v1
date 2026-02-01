/**
 * Learn Dashboard Page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CreditCard, X } from 'lucide-react';
import { Footer } from '@/components/landing/Footer';
import { Navigation } from '@/components/dashboard/Navigation';
import { LearningCarousel } from '@/components/learn/LearningCarousel';
import { ChecklistItem } from '@/components/learn/ChecklistItem';
import { TestimonialCarousel } from '@/components/learn/TestimonialCarousel';
import { learnService } from '@/services/learn.service';
import { useUser } from '@/hooks/useAuth';
import type {
  LearningContent,
  ChecklistItem as ChecklistItemType,
  Testimonial,
} from '@/types/learn.types';

// ==================== Main Page Component ====================
export default function LearnDashboard() {
  const { user, profile } = useUser();
  const [checklistOpen, setChecklistOpen] = useState(true);
  const [learningPath, setLearningPath] = useState<LearningContent[]>([]);
  const [recommendedContent, setRecommendedContent] = useState<LearningContent[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemType[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [path, recommended, checklist, testimonialsList] = await Promise.all([
        learnService.getLearningPath(),
        learnService.getRecommendedContent(),
        learnService.getChecklist(user?.id || ''),
        learnService.getTestimonials(),
      ]);

      setLearningPath(path);
      setRecommendedContent(recommended);
      setChecklistItems(checklist);
      setTestimonials(testimonialsList);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentClick = async (content: LearningContent) => {
    // TODO: Navigate to content detail page or open modal
    console.log('Opening content:', content);
    if (user?.id) {
      await learnService.markContentCompleted(user.id, content.id);
    }
  };

  const userName = profile?.first_name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-brand mb-3">
              Welcome back, {userName} 👋
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Here's your financial path today. We're guiding you step by step.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-600 dark:text-gray-400">Loading your learning path...</div>
            </div>
          ) : (
            <>
              {/* Learning Path Section */}
              {learningPath.length > 0 && (
                <section className="mb-16">
                  <div className="bg-gradient-to-b from-gray-100 to-white dark:from-white/5 dark:to-transparent rounded-[32px] p-8 md:p-12">
                    <LearningCarousel
                      items={learningPath}
                      onItemClick={handleContentClick}
                    />
                  </div>
                </section>
              )}

              {/* Beginner's Checklist */}
              {checklistOpen && checklistItems.length > 0 && (
                <section className="mb-16">
                  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 md:p-10 relative">
                    <button
                      onClick={() => setChecklistOpen(false)}
                      className="absolute top-6 right-6 h-10 w-10 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 flex items-center justify-center transition-colors"
                      aria-label="Close checklist"
                    >
                      <X className="h-5 w-5 text-gray-700 dark:text-white" />
                    </button>

                    <div className="grid lg:grid-cols-[1fr,400px] gap-8">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-brand mb-3">
                          Beginner's Checklist
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                          Here's your financial path today. We're guiding you step by step.
                        </p>

                        <div className="space-y-6">
                          {checklistItems.map((item) => (
                            <ChecklistItem key={item.id} item={item} />
                          ))}
                        </div>
                      </div>

                      {/* Decorative Element */}
                      <div className="hidden lg:flex items-center justify-center">
                        <div className="w-full h-full bg-gray-200 dark:bg-white/5 rounded-3xl" />
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Card Overview Section */}
              <section className="mb-16">
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 md:p-12">
                  <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-brand mb-2">
                      Card Overview
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Understand your card breakdowns at a glance
                    </p>
                  </div>

                  <div className="border-t border-gray-200 dark:border-white/10 pt-12">
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-24 h-24 rounded-full bg-black/70 dark:bg-white/10 flex items-center justify-center mb-6">
                        <CreditCard className="h-12 w-12 text-white" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-2 text-center">
                        You haven't added any credit card yet,<br/>
                        <Link
                        href="/card-dashboard"
                        className="text-brand hover:text-[#5558E3] font-medium underline transition-colors"
                      >
                        click here
                      </Link>
                      
                      
                      <span className="text-gray-600 dark:text-gray-400"> to add a card</span>
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recommended for you */}
              {recommendedContent.length > 0 && (
                <section className="mb-16">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-brand mb-2">
                        Recommended for you
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        Learn all you need to know about Credit in Canada
                      </p>
                    </div>
                    <Link
                      href="/learn/all"
                      className="px-6 py-2.5 rounded-xl bg-white dark:bg-gray-800 text-black dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      View all
                    </Link>
                  </div>

                  <LearningCarousel
                    items={recommendedContent}
                    onItemClick={handleContentClick}
                  />
                </section>
              )}

              {/* Testimonials Section */}
              {testimonials.length > 0 && (
                <section className="mb-16">
                  <TestimonialCarousel testimonials={testimonials} />
                </section>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
