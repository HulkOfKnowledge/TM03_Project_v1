/**
 * Articles & Guides Page
 * Credit education articles and comprehensive guides
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock } from 'lucide-react';
import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';
import { TestimonialCarousel } from '@/components/learn/TestimonialCarousel';
import { TestimonialSkeleton } from '@/components/learn/TestimonialSkeleton';
import { learnService } from '@/services/learn.service';
import { getContentUrl } from '@/lib/learn-navigation';
import type { LearningContent, Testimonial } from '@/types/learn.types';

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<LearningContent[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<LearningContent[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadArticlesData();
  }, []);

  const loadArticlesData = async () => {
    try {
      setLoading(true);
      const [articlesData, dashboardData] = await Promise.all([
        learnService.getArticles(),
        learnService.getDashboardData(),
      ]);
      setArticles(articlesData);
      setFilteredArticles(articlesData);
      setTestimonials(dashboardData.testimonials || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleArticleClick = (article: LearningContent) => {
    const url = getContentUrl(article);
    router.push(url);
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-4 md:px-6">

          {/* Header with Back Button */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => router.back()}
              className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-foreground transition-colors hover:bg-accent"
              aria-label="Go back"
            >
              <svg
                className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 md:h-5 md:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-brand mb-3">Articles</h1>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 flex flex-col gap-3 md:mb-10 md:flex-row md:items-center md:gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background pl-4 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 md:text-base"
              />
              <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground md:h-5 md:w-5" />
            </div>

            {/* Filter Button */}
            <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent md:text-base">
              <span>Filter</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          </div>

          {/* Articles Grid */}
          <div className="mb-16">
            {loading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="mb-4 aspect-video w-full rounded-lg bg-muted"></div>
                    <div className="mb-2 h-3 w-24 rounded bg-muted"></div>
                    <div className="mb-2 h-5 w-full rounded bg-muted"></div>
                    <div className="mb-3 h-4 w-32 rounded bg-muted"></div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base text-muted-foreground md:text-lg">
                  {searchQuery
                    ? 'No articles found matching your criteria'
                    : 'No articles available yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => handleArticleClick(article)}
                    className="group rounded-lg border border-border bg-card text-left"
                  >
                    {/* Article Thumbnail */}
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      {article.thumbnailUrl ? (
                        <img
                          src={article.thumbnailUrl}
                          alt={article.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted"></div>
                      )}
                    </div>

                    {/* Article Info */}
                    <div className="p-4 md:p-5">
                      <div className="mb-2 text-xs font-medium text-muted-foreground md:text-sm">
                        {article.category}
                      </div>
                      <h3 className="mb-3 line-clamp-2 text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-brand md:text-lg">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground md:gap-3 md:text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 md:h-4 md:w-4" />
                          <span>{article.duration}</span>
                        </div>
                        <span className="text-border">•</span>
                        <span>Posted 2 months ago</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Testimonials Section */}
          <section className="mb-16">
            {loading ? (
              <TestimonialSkeleton />
            ) : (
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
