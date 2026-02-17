/**
 * Video Layout Component
 * Displays video preview screen with lesson information before video playback
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Play, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { TestimonialCarousel } from '@/components/learn/TestimonialCarousel';
import { VideoChapterItem } from '@/components/learn/VideoChapterItem';
import { RelatedLessonsSection } from '@/components/learn/RelatedLessonsSection';
import { sampleQuizQuestions } from './videoLayoutConstants';
import { VideoPreviewSkeleton } from '@/components/learn/VideoPreviewSkeleton';
import { QuizContent } from '@/components/learn/QuizContent';
import { LessonPreviewCard } from '@/components/learn/LessonPreviewCard';
import { InfoListItem } from '@/components/learn/InfoListItem';
import { VideoPlayer, VideoPlayerRef } from '@/components/learn/VideoPlayer';
import { learnService } from '@/services/learn.service';
import { quizService } from '@/services/quiz.service';
import { getContentUrl } from '@/lib/learn-navigation';
import type { Testimonial, LearningContent } from '@/types/learn.types';

interface VideoLayoutProps {
  id: string;
  category: string;
  topic: string;
}

export function VideoLayout({ id, category: _category, topic: _topic }: VideoLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [showVideo, setShowVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<LearningContent | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [quizActive, setQuizActive] = useState(false);
  const [videoTab, setVideoTab] = useState('overview');
  const [resourceSortBy, setResourceSortBy] = useState('suggested');
  const [showQuizPrompt, setShowQuizPrompt] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);

  // Cache for quiz completion status to prevent unnecessary API calls
  const quizCompletionCacheRef = useRef<Map<string, { completed: boolean; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Handle tab query parameter on mount
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'quiz') {
      setActiveTab('quiz');
    }
  }, [searchParams]);

  useEffect(() => {
    loadLessonData();
  }, [id]);

  const loadLessonData = async () => {
    try {
      setLoading(true);
      const [contentData, dashboardData] = await Promise.all([
        learnService.getContentById(id),
        learnService.getDashboardData(),
      ]);
      
      setVideo(contentData);
      setTestimonials(dashboardData.testimonials || []);
      
      // Check if user has completed the quiz with caching
      const cacheKey = `quiz-completed-${id}`;
      const cached = quizCompletionCacheRef.current.get(cacheKey);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log('[VideoLayout] Using cached quiz completion status');
        setQuizCompleted(cached.completed);
      } else {
        // Fetch fresh data
        try {
          console.log('[VideoLayout] Fetching fresh quiz completion status');
          const quizAttemptsData = await quizService.getQuizAttempts(id);
          const completed = quizAttemptsData.success && quizAttemptsData.data && quizAttemptsData.data.length > 0;
          
          // Cache the result
          quizCompletionCacheRef.current.set(cacheKey, { completed, timestamp: now });
          setQuizCompleted(completed);
        } catch (error) {
          console.log('Quiz attempts not available yet:', error);
          // Cache negative result
          quizCompletionCacheRef.current.set(cacheKey, { completed: false, timestamp: now });
        }
      }
    } catch (error) {
      console.error('Error loading lesson data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load sample data for features not yet in API
  const quizQuestions = sampleQuizQuestions;
  
  // Use real data from API
  const videoChapters = video?.chapters || [];
  const transcript = video?.transcript || [];
  const resources = video?.resources || [];
  const relatedLessons = video?.relatedContent || [];
  const learningPoints = video?.learningPoints || [];
  
  // Extract unique categories from related lessons
  const lessonCategories = Array.from(
    new Set(relatedLessons.map(lesson => lesson.category))
  );

  const handleSeekToTimestamp = (timestamp: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(timestamp);
      videoPlayerRef.current.play();
    }
  };

  const handleVideoEnded = () => {
    // Show quiz prompt if user hasn't completed the quiz
    if (!quizCompleted) {
      setShowQuizPrompt(true);
    }
  };

  const handleTakeQuiz = () => {
    setShowQuizPrompt(false);
    setActiveTab('quiz');
    setShowVideo(false);
  };

  const parseTimestampToSeconds = (timestamp: string | number | undefined): number => {
    if (!timestamp) return 0;
    
    // If already a number, return it
    if (typeof timestamp === 'number') return timestamp;
    
    // Convert to string and parse
    const timestampStr = String(timestamp);
    const parts = timestampStr.split(':').map(Number);
    
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  const handleResourceClick = async (e: React.MouseEvent, resourceArticleId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!resourceArticleId) {
      console.log('No article ID provided');
      return;
    }
    
    try {
      // Fetch the article content to get routing information
      const articleContent = await learnService.getContentById(resourceArticleId);
      if (articleContent) {
        const url = getContentUrl(articleContent);
        router.push(url);
      } else {
        console.error('Article content not found for ID:', resourceArticleId);
      }
    } catch (error) {
      console.error('Error navigating to resource:', error);
    }
  };

  if (loading) {
    return <VideoPreviewSkeleton />;
  }

  if (!video) {
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
            <h1 className="text-2xl font-bold text-foreground">Video not found</h1>
            <p className="mt-2 text-muted-foreground">The video you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  // Generate lesson data from video content
  const lessonData = {
    number: `Lesson ${id}`,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    videoUrl: video.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Default demo video
    duration: video.duration,
    learningPoints: learningPoints.map(point => ({ text: point })),
  };

  // Video Viewing Screen
  if (showVideo) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto px-4 pt-6 md:px-6 md:pt-8">
          {/* Header with Back Button and Title */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => setShowVideo(false)}
              className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-foreground transition-colors hover:bg-accent"
              aria-label="Back to lesson overview"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 md:h-5 md:w-5" />
            </button>
            <h1 className="text-xl font-bold text-foreground md:text-2xl">
              {lessonData.title}
            </h1>
          </div>

          {/* Main Layout: Video + Sidebar */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
            {/* Left Column: Video and Tabs */}
            <div className="min-w-0">
              {/* Video Player */}
              <VideoPlayer
                ref={videoPlayerRef}
                videoUrl={lessonData.videoUrl}
                thumbnailUrl={lessonData.thumbnailUrl}
                onEnded={handleVideoEnded}
              />

              {/* Quiz Call-to-Action Banner */}
              {!quizCompleted && (
                <div className="mt-4 rounded-xl border border-brand/30 bg-gradient-to-r from-brand/5 to-brand/10 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="mb-1 text-sm font-semibold text-foreground md:text-base">
                        Ready to test your knowledge?
                      </h3>
                      <p className="text-xs text-foreground/60 md:text-sm">
                        Take the quiz to reinforce what you've learned
                      </p>
                    </div>
                    <Button
                      onClick={handleTakeQuiz}
                      variant="default"
                      size="sm"
                      className="shrink-0 bg-brand hover:bg-brand/90"
                    >
                      Take Quiz
                    </Button>
                  </div>
                </div>
              )}

              {/* Tabs below video */}
              <div className="mt-6">
                <Tabs value={videoTab} onValueChange={setVideoTab}>
                  <TabsList className="justify-start overflow-x-auto">
                    <TabsTrigger value="overview" className="flex-shrink-0">Lesson Overview</TabsTrigger>
                    <TabsTrigger value="transcript" className="flex-shrink-0">Transcript</TabsTrigger>
                    <TabsTrigger value="resources" className="flex-shrink-0">Resources</TabsTrigger>
                  </TabsList>

                  {/* Lesson Overview Tab */}
                  <TabsContent value="overview" className="mt-4 md:mt-6">
                    {/* Video Chapters */}
                    {videoChapters.length > 0 && (
                      <div className="space-y-2 rounded-xl border border-border bg-card p-3 md:p-4">
                        {[...videoChapters]
                          .sort((a, b) => {
                            // Sort by duration field which contains the timestamp
                            const timeA = parseTimestampToSeconds(a.duration || a.timestamp);
                            const timeB = parseTimestampToSeconds(b.duration || b.timestamp);
                            return timeA - timeB;
                          })
                          .map((chapter, index) => (
                          <VideoChapterItem
                            key={chapter.id}
                            number={String(index + 1)}
                            title={chapter.title}
                            duration={chapter.duration}
                            timestamp={parseTimestampToSeconds(chapter.duration || chapter.timestamp)}
                            onSeek={handleSeekToTimestamp}
                          />
                        ))}
                      </div>
                    )}

                    {/* About This Lesson */}
                    <div className="mt-6 md:mt-8">
                      <h2 className="mb-3 text-lg font-bold text-foreground md:mb-4 md:text-xl">
                        About This Lesson
                      </h2>
                      <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                        {lessonData.description}
                      </p>
                    </div>

                    {/* What You'll Learn */}
                    <div className="mt-6 md:mt-8">
                      <h3 className="mb-3 text-lg font-bold text-foreground md:mb-4 md:text-xl">
                        What you'll learn
                      </h3>
                      <div className="space-y-3">
                        {lessonData.learningPoints.map((point, index) => (
                          <InfoListItem
                            key={index}
                            text={point.text}
                            variant="check"
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Transcript Tab */}
                  <TabsContent value="transcript" className="mt-4 md:mt-6">
                    {transcript.length > 0 ? (
                      <div className="space-y-4 md:space-y-6">
                        {transcript.map((entry, index) => (
                          <button
                            key={index}
                            onClick={() => handleSeekToTimestamp(parseTimestampToSeconds(entry.timestamp))}
                            className="group flex w-full cursor-pointer flex-col gap-2 text-left transition-colors hover:opacity-80 md:flex-row md:gap-4"
                          >
                            <span className="shrink-0 text-sm font-medium text-brand transition-colors group-hover:underline">
                              {entry.timestamp}
                            </span>
                            <span className="text-sm leading-relaxed text-muted-foreground md:text-base">
                              {entry.content}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        Transcript not available for this video.
                      </div>
                    )}
                  </TabsContent>

                  {/* Resources Tab */}
                  <TabsContent value="resources" className="mt-4 md:mt-6">
                    {resources.length > 0 ? (
                      <div className="space-y-4 md:space-y-6">
                        {/* Sort Options */}
                        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-2">
                          <span className="text-sm font-medium text-foreground md:text-base">Sort by:</span>
                          <button
                            onClick={() => setResourceSortBy('suggested')}
                            className={`px-3 py-1.5 text-sm transition-colors md:px-4 md:text-base ${
                              resourceSortBy === 'suggested'
                                ? 'text-foreground underline decoration-2 underline-offset-4'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Suggested
                          </button>
                          <button
                            onClick={() => setResourceSortBy('newest')}
                            className={`px-3 py-1.5 text-sm transition-colors md:px-4 md:text-base ${
                              resourceSortBy === 'newest'
                                ? 'text-foreground underline decoration-2 underline-offset-4'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            Newest
                          </button>
                        </div>

                        {/* Resources Grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
                          {resources.map((resource) => (
                            <button
                              key={resource.id}
                              onClick={(e) => handleResourceClick(e, resource.articleId)}
                              disabled={!resource.articleId}
                              type="button"
                              className="flex flex-col gap-3 rounded-lg bg-muted/50 p-4 text-left transition-all hover:bg-muted hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 md:gap-4 md:p-5"
                            >
                              {/* File Preview with Icon */}
                              <div className="flex h-20 w-20 items-center justify-center rounded-md bg-brand/10 shadow-sm">
                                <FileText className="h-10 w-10 text-brand" />
                              </div>

                              {/* File Info */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-foreground md:text-base">
                                  {resource.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:gap-3 md:text-sm">
                                  <span className="flex items-center gap-1">
                                    <FileText className="h-3 w-3 md:h-4 md:w-4" />
                                    {resource.size}
                                  </span>
                                  {resource.articleId && (
                                    <>
                                      <span className="text-border">|</span>
                                      <span className="font-medium text-brand">
                                        View Article →
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        No resources available for this lesson.
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>

              {/* Mobile Related Lessons - Shows below tabs on mobile only */}
              <div className="mt-8 lg:hidden">
                <h3 className="mb-4 text-base font-semibold text-foreground">
                  Related Lessons
                </h3>
                <RelatedLessonsSection
                  lessons={relatedLessons}
                  categories={lessonCategories}
                />
              </div>
            </div>

            {/* Right Sidebar: Related Lessons - Hidden on mobile, visible on lg+ */}
            <div className="hidden min-w-0 lg:block">
              <div className="sticky top-6 max-h-[calc(100vh-8rem)] overflow-hidden">
                {/* Fixed Header */}
                <h3 className="mb-4 text-base font-semibold text-foreground">
                  Lessons
                </h3>

                {/* Scrollable Content */}
                <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 12rem)' }}>
                  <RelatedLessonsSection
                    lessons={relatedLessons}
                    categories={lessonCategories}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials Section */}
          <section className="mb-12 mt-16 md:mb-16 md:mt-24">
            <TestimonialCarousel testimonials={testimonials} />
          </section>
        </div>

        {/* Quiz Prompt Modal */}
        <Modal
          isOpen={showQuizPrompt}
          onClose={() => setShowQuizPrompt(false)}
          title="Great job completing the video!"
          description="Would you like to test your knowledge with a quiz? It only takes a few minutes."
          size="md"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={() => setShowQuizPrompt(false)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleTakeQuiz}
              variant="default"
              className="w-full sm:w-auto"
            >
              Take Quiz
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="mx-auto px-4 md:px-6">
        {/* Back Navigation + Tabs - Only show when quiz is not active */}
        {!quizActive && (
          <div className="flex items-center gap-3 pt-6 md:gap-4 md:pt-8">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-foreground transition-colors hover:bg-accent"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 md:h-5 md:w-5" />
            </button>

            {/* Tabs */}
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="justify-start">
                  <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>
                  <TabsTrigger value="quiz" className="flex-shrink-0">Take Quiz</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="overview">
            {/* Main Content */}
            <div className="mt-6 md:mt-8">
              <LessonPreviewCard
                lessonNumber={lessonData.number}
                lessonTitle={lessonData.title}
                leftVariant="video"
                rightContent="image"
                rightImageUrl={lessonData.thumbnailUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80'}
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
              <div className="prose prose-sm mt-8 max-w-none md:mt-12 lg:mt-16">
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                  {lessonData.description}
                </p>
              </div>

              {/* What You'll Learn Section */}
              <div className="mt-8 md:mt-12 lg:mt-16">
                <h3 className="mb-4 text-lg font-bold text-foreground md:mb-6 md:text-xl lg:text-2xl">
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
              <div className="mt-6 max-w-3xl pb-12 md:mt-8 md:pb-16 lg:mt-12 lg:pb-24">
                <Button
                  onClick={() => setShowVideo(true)}
                  variant="default"
                  size="lg"
                  className="inline-flex w-full items-center justify-center gap-2 shadow-lg shadow-brand/20 transition-all hover:gap-3 sm:w-auto"
                >
                  Begin Lesson
                </Button>
              </div>

              {/* Testimonials Section */}
              <section className="mb-8 mt-12 md:mb-12 md:mt-16 lg:mb-16 lg:mt-24">
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
