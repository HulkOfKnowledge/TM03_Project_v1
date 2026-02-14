/**
 * Video Layout Component
 * Displays video preview screen with lesson information before video playback
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { TestimonialCarousel } from '@/components/learn/TestimonialCarousel';
import { VideoPreviewSkeleton } from '@/components/learn/VideoPreviewSkeleton';
import { QuizContent } from '@/components/learn/QuizContent';
import { LessonPreviewCard } from '@/components/learn/LessonPreviewCard';
import { InfoListItem } from '@/components/learn/InfoListItem';
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
  const [quizActive, setQuizActive] = useState(false); // Track if quiz is in progress

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
    title: _topic,
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

  // Sample quiz questions - replace with actual questions from your backend
  const quizQuestions = [
    {
      id: 'q1',
      question: 'What is the recommended credit utilization ratio to maintain a healthy credit score?',
      options: [
        'Under 10%',
        'Under 30%',
        'Under 50%',
        'Under 70%',
      ],
      correctAnswer: 1,
      explanation: 'Keeping your credit utilization under 30% is recommended as it shows lenders you can manage credit responsibly without maxing out your cards.',
    },
    {
      id: 'q2',
      question: 'Why do newcomers to Canada start with no credit file?',
      options: [
        'They have bad credit from their home country',
        'Canadian credit bureaus don\'t track international credit history',
        'They need to apply for citizenship first',
        'It\'s a requirement by law',
      ],
      correctAnswer: 1,
      explanation: 'Canadian credit bureaus (Equifax and TransUnion) only track credit activity within Canada, so newcomers start fresh regardless of their credit history in other countries.',
    },
    {
      id: 'q3',
      question: 'What is a credit limit?',
      options: [
        'The minimum amount you must spend each month',
        'The maximum amount you can borrow on your credit card',
        'The total amount of debt you owe',
        'The fee charged for using your credit card',
      ],
      correctAnswer: 1,
      explanation: 'A credit limit is the maximum amount of money a lender allows you to borrow on your credit card. It\'s important to stay well below this limit to maintain good credit health.',
    },
    {
      id: 'q4',
      question: 'Which of the following triggers red flags with credit bureaus?',
      options: [
        'Paying your balance in full each month',
        'Keeping utilization under 30%',
        'Near-limit spending and high utilization',
        'Having multiple credit cards',
      ],
      correctAnswer: 2,
      explanation: 'High credit utilization, especially near your credit limit, signals financial stress to lenders and can negatively impact your credit score. Missed payments also trigger major red flags.',
    },
    {
      id: 'q5',
      question: 'How does Creduman help protect your credit score?',
      options: [
        'By automatically paying your bills',
        'By tracking your card and warning you before you get into trouble',
        'By increasing your credit limit',
        'By removing negative marks from your credit report',
      ],
      correctAnswer: 1,
      explanation: 'Creduman monitors your credit card usage in real-time and sends alerts when you\'re approaching dangerous utilization levels or patterns that could harm your credit score, helping you make better decisions.',
    },
  ];

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
        {/* Back Navigation + Tabs - Only show when quiz is not active */}
        {!quizActive && (
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
        )}

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="overview">
            {/* Main Content */}
            <div className="mt-8">
              <LessonPreviewCard
                lessonNumber={lessonData.number}
                lessonTitle={lessonData.title}
                leftVariant="video"
                rightContent="image"
                rightImageUrl="/lesson-preview.jpg"
                rightImageAlt="Lesson preview"
                leftAction={
                  <Button
                    onClick={() => setShowVideo(true)}
                    className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-brand shadow-lg shadow-black/10 transition-all hover:gap-3 hover:bg-gray-50"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    Watch Now
                  </Button>
                }
              />

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
                    <InfoListItem 
                      key={index} 
                      text={point.text}
                      variant="check"
                    />
                  ))}
                </div>
              </div>

              {/* Begin Lesson Button */}
              <div className="mt-8 max-w-3xl md:mt-12 pb-24">
                <Button
                  onClick={() => setShowVideo(true)}
                  variant="default"
                  size="lg"
                  className="inline-flex items-center gap-2 shadow-lg shadow-brand/20 transition-all hover:gap-3"
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
            <QuizContent
              lessonNumber={lessonData.number}
              lessonTitle={lessonData.title}
              questions={quizQuestions}
              onQuizStateChange={setQuizActive}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
