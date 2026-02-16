/**
 * Article Layout Component
 * Displays article content with rich text, images, and related articles
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Calendar, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TestimonialCarousel } from '@/components/learn/TestimonialCarousel';
import { learnService } from '@/services/learn.service';
import { getContentUrl } from '@/lib/learn-navigation';
import type { Testimonial, LearningContent } from '@/types/learn.types';
import { LearningCarousel } from './LearningCarousel';

interface ArticleLayoutProps {
  id: string;
  category: string;
  topic: string;
}

export function ArticleLayout({ id, category: _category, topic: _topic }: ArticleLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<LearningContent | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [recommendedContent, setRecommendedContent] = useState<LearningContent[]>([]);

  useEffect(() => {
    loadArticleData();
  }, [id]);

  const loadArticleData = async () => {
    try {
      setLoading(true);
      const [contentData, dashboardData] = await Promise.all([
        learnService.getContentById(id),
        learnService.getDashboardData(),
      ]);
      
      setArticle(contentData);
      setTestimonials(dashboardData.testimonials || []);
      setRecommendedContent(dashboardData.recommendedContent || []);
    } catch (error) {
      console.error('Error loading article data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentClick = (item: LearningContent) => {
    const url = getContentUrl(item);
    router.push(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
          <div className="h-8 w-32 animate-pulse rounded bg-muted"></div>
          <div className="mt-6 h-10 w-3/4 animate-pulse rounded bg-muted"></div>
          <div className="mt-4 h-4 w-48 animate-pulse rounded bg-muted"></div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
          <button
            onClick={() => router.back()}
            className="group inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground transition-colors hover:bg-accent"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 md:h-5 md:w-5" />
          </button>
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">Article not found</h1>
            <p className="mt-2 text-muted-foreground">The article you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  // Format the date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    if (diffMonths === 0) return 'Posted recently';
    if (diffMonths === 1) return 'Posted 1 month ago';
    return `Posted ${diffMonths} months ago`;
  };

  return (
    <div className="min-h-screen pb-12">
      <div className="mx-auto px-4 md:px-6">
        {/* Back Button */}
        <div className="">
          <button
            onClick={() => router.back()}
            className="group inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground transition-colors hover:bg-accent"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 md:h-5 md:w-5" />
          </button>
        </div>

        {/* Article Header */}
        <article className="">
          {/* Category Badge */}
          <div className="mb-3 text-center md:mb-6">
            <span className="inline-block text-sm font-medium text-muted-foreground md:text-base">
              {article.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-3 text-center text-2xl leading-tight text-foreground md:mb-6 md:text-3xl lg:text-4xl">
            {article.title}
          </h1>

          {/* Meta Information */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground md:mb-8 md:gap-4 md:text-base">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{article.duration}</span>
            </div>
            <span className="border-l-4 border-border h-4"></span>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(article.createdAt)}</span>
            </div>
            <span className="border-l-4 border-border h-4"></span>
            <div className="flex items-center gap-1.5">
              <UserCircle className="h-4 w-4" />
              <span>Creduman Team</span>
            </div>
          </div>

          {/* Quote Section - Optional */}
          {article.description && (
            <div className="mb-10">
              <blockquote className="space-y-1 text-center">
                <p className="text-sm font-normal text-muted-foreground md:text-base italic">
                  "{article.description}"
                </p>
              </blockquote>
            </div>
          )}

          {/* Horizontal Divider */}
          <hr className="mb-10 border-t-2 border-border" />

          {/* Article Content */}
          <div className="prose prose-sm max-w-5xl mx-auto dark:prose-invert md:prose-base ">
            <p className="mb-8 text-sm leading-relaxed text-muted-foreground md:mb-10 md:text-base">
              {article.description}
            </p>

            {/* Featured Image */}
            {article.thumbnailUrl && (
              <div className="my-10 md:my-14">
                <img 
                  src={article.thumbnailUrl} 
                  alt={article.title}
                  className="aspect-video w-full rounded-lg object-cover"
                />
              </div>
            )}

            <div className="space-y-5 text-sm leading-relaxed text-muted-foreground md:space-y-6 md:text-base">
              <p>
                This is where the full article content would be displayed. In a production environment,
                this content would be fetched from a content management system or database with rich text formatting.
              </p>
              <p>
                The article would contain detailed information about {article.title.toLowerCase()},
                providing valuable insights and practical tips for managing your credit in Canada.
              </p>
            </div>
          </div>
        </article>

        {/* Recommended for you */}
            <section className="mb-16 mt-20 md:mb-16 md:mt-28">
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
                  className="hidden md:inline-flex px-6 py-2.5 rounded-xl bg-white dark:bg-gray-800 text-black dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  View all
                </Link>
              </div>

              <div className='border-t border-gray-200 dark:border-white/10 pt-12'></div>

              <LearningCarousel
                items={recommendedContent}
                onItemClick={handleContentClick}
                isLoading={loading}
                skeletonCount={3}
              />
            </section>

        {/* Testimonials Section */}
        <section className="mb-12 mt-20 md:mb-16 md:mt-28">
          <TestimonialCarousel testimonials={testimonials} />
        </section>
      </div>
    </div>
  );
}
