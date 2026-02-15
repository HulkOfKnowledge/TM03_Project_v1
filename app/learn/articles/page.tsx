/**
 * Articles & Guides Page
 * Credit education articles and comprehensive guides
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadArticlesData();
  }, []);

  useEffect(() => {
    filterArticles();
  }, [searchQuery, selectedCategory, articles]);

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

  const filterArticles = () => {
    let filtered = [...articles];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (article) => article.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.description.toLowerCase().includes(query)
      );
    }

    setFilteredArticles(filtered);
  };

  const categories = ['all', 'beginner', 'intermediate', 'advanced'];

  const handleArticleClick = (article: LearningContent) => {
    const url = getContentUrl(article);
    router.push(url);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Header */}
          <div className="mb-8 mt-8">
            <h1 className="text-3xl md:text-4xl font-bold text-brand mb-3">
              Articles & Guides
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Comprehensive guides and articles to help you understand credit better
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-4 pr-12 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-brand text-white'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Articles Grid */}
          <div className="mb-16">
            {loading ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="aspect-video w-full bg-gray-200 dark:bg-gray-800 rounded-lg mb-4"></div>
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                    <div className="h-6 w-full bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-3"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {searchQuery || selectedCategory !== 'all'
                    ? 'No articles found matching your criteria'
                    : 'No articles available yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredArticles.map((article) => (
                  <button
                    key={article.id}
                    onClick={() => handleArticleClick(article)}
                    className="group overflow-hidden rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black transition-all hover:shadow-lg text-left"
                  >
                    {/* Article Thumbnail */}
                    <div className="aspect-video w-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
                      {article.thumbnailUrl ? (
                        <img
                          src={article.thumbnailUrl}
                          alt={article.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-brand/20 to-brand/5"></div>
                      )}
                    </div>

                    {/* Article Info */}
                    <div className="p-4 md:p-5">
                      <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide md:text-sm">
                        {article.category}
                      </div>
                      <h3 className="mb-2 text-base font-semibold leading-snug text-gray-900 dark:text-white transition-colors group-hover:text-brand md:text-lg line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {article.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 md:text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 md:h-4 md:w-4" />
                          <span>{article.duration}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
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
