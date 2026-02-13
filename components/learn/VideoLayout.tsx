/**
 * Video Layout Component
 * Displays video preview screen with lesson information before video playback
 */

'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { TestimonialCarousel } from '@/components/learn/TestimonialCarousel';
import { TestimonialSkeleton } from '@/components/learn/TestimonialSkeleton';
import { Testimonial } from '@/types/learn.types';

interface LearningPoint {
  text: string;
}

interface VideoLayoutProps {
  id: string;
  category: string;
  topic: string;
}

export function VideoLayout({ id, category, topic }: VideoLayoutProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  // Sample lesson data - replace with actual data from your backend
  const lessonData = {
    number: `Lesson ${id}`,
    title: 'Understanding Credit Reports: Equifax vs TransUnion',
    description: `Lesson one introduces users to the Canadian credit system in the simplest, calmest way possible. They learn what credit is, why it matters, and how their credit card affects everything. The content focuses on clarity: no stress, no deep theory, just the basics that every newcomer needs to stop feeling lost.

They'll understand how limits, balances, and credit utilization work, why 30% usage matters, and what a "danger zone" really means. You also teach them how Creduman will protect them by tracking their card, warning them before they get into trouble, and showing them the safe way to use their credit card from day one.

By the end of week one, they walk away with a strong, simple foundation: what credit is, how their card impacts their future, and how Creduman keeps them safe so they can build credit confidently.`,
    thumbnailUrl: '/lesson-thumbnail.jpg', // Replace with actual image
    videoUrl: '/videos/lesson-1.mp4', // Replace with actual video URL
    duration: '12:45',
    learningPoints: [
      {
        text: 'A simple explanation of how the system works and why newcomers start with no credit file.',
      },
      {
        text: 'How limits, balances, and spending behavior shape your credit growth.',
      },
      {
        text: 'What a credit limit actually is, how to check it, and how it affects your risk level.',
      },
      {
        text: 'Why staying under 30% is the safest way to grow your credit score.',
      },
      {
        text: 'What triggers red flags: high usage, near-limit spending, missed payments.',
      },
      {
        text: 'How the app tracks your card, warns you early, and keeps you from making costly mistakes.',
      },
    ],
  };

  if (showVideo) {
    // Video player screen will be implemented next
    return (
      <div className="space-y-6">
        <p>Video Player Screen - Coming Next</p>
        <button
          onClick={() => setShowVideo(false)}
          className="rounded-lg bg-brand px-4 py-2 text-white"
        >
          Back to Preview
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background pb-12">
      {/* Back Navigation + Tabs */}
      <div className="mx-auto">
        <div className="flex flex-wrap items-center gap-4">
          {/* Back Button */}
          <Link
            href="/learn/learning-space"
            className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-foreground transition-colors hover:bg-accent"
            aria-label="Back to lessons"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          </Link>

          {/* Tabs */}
          <div className="inline-flex gap-2 rounded-lg bg-muted p-1">
            <button className="rounded-md bg-brand/20 px-4 py-2 text-sm font-medium text-brand shadow-sm md:px-6">
              Overview
            </button>
            <button className="rounded-md px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-background/50 md:px-6">
              Take Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto mt-8">
        <div className="grid items-stretch gap-5 lg:h-[420px] lg:grid-cols-[30%_70%]">
          {/* Left Column - Video Card */}
          <div className="h-full">
            <div className="group relative h-full transform cursor-pointer overflow-hidden rounded-2xl bg-brand">
              {/* Video Thumbnail with Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand to-brand/70 mb-2">
                <div className="flex h-full flex-col justify-end p-6 text-white md:p-8">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wide opacity-90 md:text-sm">
                      {lessonData.number}
                    </p>
                    <h2 className="mb-8 pr-4 text-xl leading-tight md:text-2xl lg:text-3xl">
                      {lessonData.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowVideo(true)}
                    className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-brand shadow-lg shadow-black/10 transition-all hover:gap-3 hover:bg-gray-50"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Watch Now
                  </button>
                </div>
              </div>

              {/* Hover overlay */}
              <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </div>
          </div>

          {/* Right Column - Video Preview Image */}
          <div className="relative h-full overflow-hidden rounded-2xl bg-muted">
            <Image
              src="/lesson-preview.jpg"
              alt="Lesson preview"
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />

            {/* Placeholder if no image */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <div className="p-8 text-center">
                <Play className="mx-auto mb-4 h-16 w-16 text-brand/20" />
                <p className="text-sm text-muted-foreground">Video Preview</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Description */}
        <div className="prose prose-sm mt-12 max-w-none lg:mt-16">
          <p className="text-sm leading-relaxed text-foreground/70 md:text-base">
            {lessonData.description}
          </p>
        </div>
        {/* What You'll Learn Section */}
        <div className="mt-12 lg:mt-16">
          <h3 className="mb-6 text-xl font-bold md:mb-8 md:text-2xl">
            What you'll learn
          </h3>
          <div className="space-y-3 md:space-y-4">
            {lessonData.learningPoints.map((point, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/30 md:gap-4 md:p-0"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand">
                  <Check className="h-4 w-4 text-background" />
                </div>
                <p className="flex-1 text-sm leading-relaxed text-foreground/70 md:text-base">
                  {point.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Begin Lesson Button */}
        <div className="mt-8 max-w-3xl md:mt-12">
          <button
            onClick={() => setShowVideo(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-sm text-white shadow-lg shadow-brand/20 transition-all hover:gap-3 hover:bg-brand/90 hover:shadow-xl hover:shadow-brand/30 md:px-8 md:py-4 md:text-base"
          >
            Begin Lesson
          </button>
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
    </div>
  );
}
