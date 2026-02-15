/**
 * Article Layout Component
 * Displays article content with rich text, images, and related articles
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { TestimonialCarousel } from '@/components/learn/TestimonialCarousel';
import { learnService } from '@/services/learn.service';
import { getContentUrl } from '@/lib/learn-navigation';
import type { Testimonial, LearningContent } from '@/types/learn.types';

interface ArticleLayoutProps {
  id: string;
  category: string;
  topic: string;
}

// Sample article data - Replace with actual API calls
const getSampleArticleData = (_id: string, _topic: string) => ({
  category: 'Credit Knowledge',
  title: 'How I was able to get my credit back up',
  readTime: '5 mins read',
  postedDate: 'Posted 2 months ago',
  author: 'James Doe',
  quote: '"Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit..."',
  quoteSubtext: '"There is no one who loves pain itself, who seeks after it and wants to have it, simply because it is pain..."',
  content: `Lorem ipsum dolor sit amet, consectetur adipisicing elit. Cupiditate id duis tincidunt, venenatis iaculis at. Aenean massa augue eget tellus tempor, vitae eleifend arcu maximus. Praesent id amet nunc sapien. Sed mattis purus eget purus lobortis, ut hendrerit justo iaculis. Sed metus mauris, tempus quis turpis. Sed placerat lacus erat id ornare. Phasellus molestique in metus et laoreet. Praesent dictum cursus ultrices. Suspendisse non velit nec tristique pretium cursus. Donec ex neque, efficitur ac arcu sit amet, rutrum rhoncus justo. Etiam tincidunt mi non ante tempus, consectetur imperdiet tortor lectus, nec ornare elementum sit amet. Phasellus lorem quam odio placerat tempor. Nulla pharetra consequat lobortis. Nunc vitae commodo tellus.`,
  contentContinued: `Integer eget eleifend mauris. Nullam lobortis dui eu faucibus pharetra. Nulla placerat mi aliquet eu molestie viverra. Quisque euismod, libero in pretium tristique, neque lacus accumsan dui. Quisque pellentesque odio, a faucibus nisl. Vivamus vulputate in metus sed iaculis. Duis maximus felis nisl. Cras ultrices nisl turpis, ut ultrices purus efficitur vitae. Fusce fermentum lorem sem. Nullam quis elit eu.

In hac habitasse platea dictumst. Maecenas ullamcorper vestibulum suscipit. Donec facilisis nec leo et tincidunt ex scelerisque at. Nulla facilisis. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Fusce erat urna, venenatis ut porta mauris, pretium at amet massa. Aenean ac diam, lacinia nec. Donec quis, euismod vel sapien. Purus quis consectetur elit. Etiam fermentum magna sed lacinia blandit. Nullam nam mi. Iaculis eu nibh nec, interdum commodo felis. Mauris at risus lorem, ut gravida tellus. Donec ut mi imperdiet ut mollis lectus. Gravida lorem varius et amet. Consectetur volutpat mauris nec, consectetur dui. Proin id mollis eget, sit amet. Vivamus ultrices ipsum vel erat. Vestibulum venenatis, odio nec fringilla aliquam, dolor tellus sagittis ipsum, quis laoreet justo ipsum eu lacus.`,
});

const sampleRelatedArticles = [
  {
    id: '1',
    category: 'Credit Knowledge',
    title: 'How I was able to get my credit back up',
    readTime: '3 mins read',
    postedDate: 'Posted 2 months ago',
    imageUrl: '/article-thumb.jpg',
  },
  {
    id: '2',
    category: 'Credit Knowledge',
    title: 'How I was able to get my credit back up',
    readTime: '5 mins read',
    postedDate: 'Posted 2 months ago',
    imageUrl: '/article-thumb.jpg',
  },
  {
    id: '3',
    category: 'Credit Knowledge',
    title: 'How I was able to get my credit back up',
    readTime: '5 mins read',
    postedDate: 'Posted 2 months ago',
    imageUrl: '/article-thumb.jpg',
  },
];

export function ArticleLayout({ id, category: _category, topic: _topic }: ArticleLayoutProps) {
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<LearningContent[]>([]);

  useEffect(() => {
    loadArticleData();
  }, [id]);

  const loadArticleData = async () => {
    try {
      setLoading(true);
      const data = await learnService.getDashboardData();
      setTestimonials(data.testimonials || []);
      
      // Get articles for related content
      const articles = await learnService.getArticles();
      // Filter out current article and take first 3
      const related = articles.filter(a => a.id !== id).slice(0, 3);
      setRelatedArticles(related);
    } catch (error) {
      console.error('Error loading article data:', error);
    } finally {
      setLoading(false);
    }
  };

  const articleData = getSampleArticleData(id, _topic);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
          <div className="h-8 w-32 animate-pulse rounded bg-muted"></div>
          <div className="mt-6 h-10 w-3/4 animate-pulse rounded bg-muted"></div>
          <div className="mt-4 h-4 w-48 animate-pulse rounded bg-muted"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">

      <div className="mx-auto px-4 md:px-6">
        {/* Back Button */}
        <div className="pt-6 md:pt-8">
          <Link
            href="/learn/articles"
            className="group inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground transition-colors hover:bg-accent"
            aria-label="Back to articles"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 md:h-5 md:w-5" />
          </Link>
        </div>

        {/* Article Header */}
        <article className="mt-6 md:mt-8">
          {/* Category Badge */}
          <div className="mb-4 text-center md:mb-6">
            <span className="inline-block text-sm font-medium text-muted-foreground md:text-base">
              {articleData.category}
            </span>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-center text-2xl font-bold leading-tight text-foreground md:mb-6 md:text-3xl lg:text-4xl">
            {articleData.title}
          </h1>

          {/* Meta Information */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground md:mb-8 md:gap-4 md:text-base">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{articleData.readTime}</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>{articleData.postedDate}</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              <span>{articleData.author}</span>
            </div>
          </div>

          {/* Quote Section */}
          <div className="mb-8 border-l-4 border-brand pl-4 md:mb-12 md:pl-6">
            <blockquote className="space-y-2">
              <p className="text-base font-medium italic text-foreground md:text-lg">
                {articleData.quote}
              </p>
              <p className="text-sm italic text-muted-foreground md:text-base">
                {articleData.quoteSubtext}
              </p>
            </blockquote>
          </div>

          {/* Article Content */}
          <div className="prose prose-sm max-w-none dark:prose-invert md:prose-base">
            <p className="mb-6 leading-relaxed text-muted-foreground">
              {articleData.content}
            </p>

            {/* Featured Image Placeholder */}
            <div className="my-8 md:my-12">
              <div className="aspect-video w-full rounded-lg bg-muted/50"></div>
            </div>

            <div className="space-y-4 leading-relaxed text-muted-foreground">
              {articleData.contentContinued.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </article>

        {/* Recommended Articles Section */}

        {/* Testimonials Section */}
        <section className="mb-12 mt-16 md:mb-16 md:mt-24">
          <TestimonialCarousel testimonials={testimonials} />
        </section>
      </div>
    </div>
  );
}
