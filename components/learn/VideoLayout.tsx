/**
 * Video Layout Component
 * Displays video preview screen with lesson information before video playback
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Play } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { TestimonialCarousel } from '@/components/learn/TestimonialCarousel';
import { VideoPreviewSkeleton } from '@/components/learn/VideoPreviewSkeleton';
import { learnService } from '@/services/learn.service';
import { Testimonial } from '@/types/learn.types';

interface VideoLayoutProps {
  id: string;
  category: string;
  topic: string;
}

export function VideoLayout({ id, category: _category, topic: _topic }: VideoLayoutProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showVideo, setShowVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    loadLessonData();
  }, [id]);

  const loadLessonData = async () => {
    try {
      setLoading(true);
      // Load testimonials from API
      const data = await learnService.getDashboardData();
      setTestimonials(data.testimonials || []);
    } catch (error) {
      console.error('Error loading lesson data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Show loading skeleton while data is loading
  if (loading) {
    return <VideoPreviewSkeleton />;
  }

  if (showVideo) {
    // Video player screen will be implemented next
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto px-4 pt-8 md:px-6">
          <div className="space-y-6">
            <p className="text-foreground">Video Player Screen - Coming Next</p>
            <Button onClick={() => setShowVideo(false)} variant="default">
              Back to Preview
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="mx-auto md:px-6">
        {/* Back Navigation + Tabs */}
        <div className="flex items-center gap-4 pt-8">
          {/* Back Button */}
          <Link
            href="/learn/learning-space"
            className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-foreground transition-colors hover:bg-accent"
            aria-label="Back to lessons"
          >
            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          </Link>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="quiz">Take Quiz</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="overview">
            {/* Main Content */}
            <div className="mt-8">
              <div className="grid items-stretch gap-5 lg:h-[420px] lg:grid-cols-[30%_70%]">
                {/* Left Column - Video Card */}
                <div className="h-full">
                  <div className="group relative h-full transform cursor-pointer overflow-hidden rounded-2xl bg-brand">
                    {/* Video Thumbnail with Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand to-brand/70">
                      <div className="flex h-full flex-col justify-end p-6 text-white md:p-8">
                        <div>
                          <p className="mb-2 text-xs uppercase tracking-wide opacity-90 md:text-sm">
                            {lessonData.number}
                          </p>
                          <h2 className="mb-8 pr-4 text-xl leading-tight md:text-2xl lg:text-3xl">
                            {lessonData.title}
                          </h2>
                        </div>
                        <Button
                          onClick={() => setShowVideo(true)}
                          className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-brand shadow-lg shadow-black/10 transition-all hover:gap-3 hover:bg-gray-50"
                        >
                          <Play className="h-4 w-4 fill-current" />
                          Watch Now
                        </Button>
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
                      <p className="text-sm text-muted-foreground">
                        Video Preview
                      </p>
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
                <h3 className="mb-6 text-xl font-bold text-foreground md:mb-8 md:text-2xl">
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
              <div className="mt-8 max-w-3xl md:mt-12 pb-24">
                <Button
                  onClick={() => setShowVideo(true)}
                  variant="default"
                  size="lg"
                  className="inline-flex items-center gap-2 shadow-lg shadow-brand/20 transition-all hover:gap-3 hover:shadow-xl hover:shadow-brand/30"
                >
                  Begin Lesson
                </Button>
              </div>

              {/* Testimonials Section */}
              <section className="mb-16 mt-24">
                <TestimonialCarousel testimonials={testimonials} />
              </section>
            </div>
          </TabsContent>

          <TabsContent value="quiz">
            <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
              <p className="text-foreground/70">
                Quiz content coming soon. Complete the lesson to unlock the
                quiz.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
