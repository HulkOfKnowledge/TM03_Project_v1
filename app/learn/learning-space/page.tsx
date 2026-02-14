/**
 * Learning Space Page
 * Interactive learning environment with expandable modules
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, ChevronDown, ChevronUp, Star, ChevronRight } from 'lucide-react';
import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';
import { LearningCarousel } from '@/components/learn/LearningCarousel';
import { LearningCard, LearningCardSkeleton } from '@/components/learn/LearningCard';
import { TestimonialCarousel } from '@/components/learn/TestimonialCarousel';
import { TestimonialSkeleton } from '@/components/learn/TestimonialSkeleton';
import { learnService } from '@/services/learn.service';
import { createContentNavigationHandler } from '@/lib/learn-navigation';
import type { LearningContent, Testimonial } from '@/types/learn.types';

// Module data structure
interface LearningModule {
  id: string;
  title: string;
  description: string;
  lessonsCount: number;
  progress: number;
  isExpanded: boolean;
  lessons: LearningContent[];
}

export default function LearningSpacePage() {
  const router = useRouter();
  const [modules, setModules] = useState<LearningModule[]>([
    {
      id: 'module-1',
      title: 'Learning Module 1',
      description: 'Lesson one introduces users to the Canadian credit system in the simplest, calmest way possible. They learn what credit is, why it matters, and how their credit card affects everything. The content focuses on clarity: no stress, no deep theory, just the basics that every newcomer needs to stop feeling lost.',
      lessonsCount: 3,
      progress: 0,
      isExpanded: true,
      lessons: [],
    },
    {
      id: 'module-2',
      title: 'Learning Module 2',
      description: '',
      lessonsCount: 0,
      progress: 0,
      isExpanded: false,
      lessons: [],
    },
    {
      id: 'module-3',
      title: 'Learning Module 3',
      description: '',
      lessonsCount: 0,
      progress: 0,
      isExpanded: false,
      lessons: [],
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = async () => {
    try {
      setLoading(true);
      const data = await learnService.getDashboardData();
      
      // Populate module 1 with actual lessons
      setModules(prev => prev.map(module => {
        if (module.id === 'module-1') {
          return {
            ...module,
            lessons: data.learningPath || [],
            lessonsCount: data.learningPath?.length || 3,
          };
        }
        return module;
      }));

      setTestimonials(data.testimonials || []);
    } catch (error) {
      console.error('Error loading learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setModules(prev =>
      prev.map(module =>
        module.id === moduleId
          ? { ...module, isExpanded: !module.isExpanded }
          : module
      )
    );
  };

  const handleContentClick = createContentNavigationHandler(router);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-brand mb-3">
              Learning Space
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Discover all you need to know about your credit and how to manage and live smart
            </p>
          </div>

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
              <Filter className="h-5 w-5" />
            </button>
          </div>

          {/* Learning Modules */}
          <div className="space-y-6 mb-16">
            {modules.map((module) => (
              <div
                key={module.id}
                className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden"
              >
                {/* Module Header */}
                <div className="px-6 py-5 flex items-center justify-between cursor-pointer" onClick={() => toggleModule(module.id)}>
                  {/* Left: Toggle + Star + Title */}
                  <button
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
                  >
                    <div className="flex items-center justify-center flex-shrink-0">
                      {module.isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                    <Star 
                      className={`h-5 w-5 flex-shrink-0 ${
                        module.id === 'module-1' 
                          ? 'fill-brand text-brand' 
                          : 'text-gray-300 dark:text-gray-600'
                      }`} 
                    />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {module.title}
                    </span>
                  </button>

                  {/* Right: Start Here Button (visible when module is active) */}
                  {module.id === 'module-1' && (
                    <button className="px-6 py-2.5 bg-brand hover:bg-[#5558E3] text-white rounded-lg font-medium transition-colors flex-shrink-0">
                      Start Here
                    </button>
                  )}
                </div>

                {/* Module Content */}
                {module.isExpanded && (
                  <div className="border-t border-gray-200 dark:border-white/10 px-6 py-6">
                    {module.id === 'module-1' ? (
                      <>
                        {/* Start Lesson Button + Progress */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                          <button className="px-6 py-2.5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-900 dark:text-white rounded-lg font-medium transition-colors flex items-center gap-2 self-start">
                            Start Lesson
                            <ChevronRight className="h-4 w-4" />
                          </button>

                          <div className="flex items-center gap-3">
                            <div className="w-48 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand rounded-full transition-all"
                                style={{ width: `${module.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {module.progress} of {module.lessonsCount} Lessons
                            </span>
                          </div>
                        </div>

                        {/* Module Description */}
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8">
                          {module.description}
                        </p>

                        {/* Lessons - Mobile: Carousel, Desktop: Grid */}
                        <div className="md:hidden">
                          <LearningCarousel
                            items={module.lessons}
                            onItemClick={handleContentClick}
                            isLoading={loading}
                            skeletonCount={3}
                          />
                        </div>

                        <div className="hidden md:grid md:grid-cols-3 gap-6">
                          {loading ? (
                            Array.from({ length: 3 }).map((_, index) => (
                              <LearningCardSkeleton key={index} />
                            ))
                          ) : (
                            module.lessons.map((lesson) => (
                              <LearningCard
                                key={lesson.id}
                                content={lesson}
                                onClick={() => handleContentClick(lesson)}
                              />
                            ))
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-600 text-center py-8">
                        Module content coming soon
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

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