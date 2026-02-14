/**
 * Video Layout Component
 * Displays video preview screen with lesson information before video playback
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { TestimonialCarousel } from '@/components/learn/TestimonialCarousel';
import { VideoChapterItem } from '@/components/learn/VideoChapterItem';
import { RelatedLessonsSection } from '@/components/learn/RelatedLessonsSection';
import {
  getSampleLessonData,
  sampleVideoChapters,
  sampleRelatedLessons,
  sampleQuizQuestions,
} from './videoLayoutConstants';
import { VideoPreviewSkeleton } from '@/components/learn/VideoPreviewSkeleton';
import { QuizContent } from '@/components/learn/QuizContent';
import { LessonPreviewCard } from '@/components/learn/LessonPreviewCard';
import { InfoListItem } from '@/components/learn/InfoListItem';
import { learnService } from '@/services/learn.service';
import type { Testimonial } from '@/types/learn.types';

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
  const [quizActive, setQuizActive] = useState(false);
  const [videoTab, setVideoTab] = useState('overview');
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadLessonData();
  }, [id]);

  const loadLessonData = async () => {
    try {
      setLoading(true);
      const data = await learnService.getDashboardData();
      setTestimonials(data.testimonials || []);
    } catch (error) {
      console.error('Error loading lesson data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Video player controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const seekToChapter = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
      if (!isPlaying) {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Load sample data (TODO: Replace with actual API calls)
  const lessonData = getSampleLessonData(id, _topic);
  const videoChapters = sampleVideoChapters;
  const relatedLessons = sampleRelatedLessons;
  const quizQuestions = sampleQuizQuestions;
  const lessonCategories = ['First 3 months', 'Next: 4 - 6 Months'];

  if (loading) {
    return <VideoPreviewSkeleton />;
  }

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
              <div
                className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-200 shadow-lg"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => isPlaying && setShowControls(false)}
              >
                {/* Placeholder for video - replace with actual video element */}
                <div className="flex h-full w-full items-center justify-center bg-gray-300">
                  <button
                    onClick={togglePlay}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110"
                  >
                    <Play className="h-8 w-8 fill-current text-brand" />
                  </button>
                </div>

                {/* Video Controls Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
                    showControls ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {/* Bottom Controls */}
                  <div className="absolute bottom-0 left-0 right-0 space-y-2 p-4">
                    {/* Progress Bar */}
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    />

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlay}
                          className="text-white"
                          aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                          {isPlaying ? (
                            <Pause className="h-6 w-6" />
                          ) : (
                            <Play className="h-6 w-6" />
                          )}
                        </button>
                        <button
                          onClick={toggleMute}
                          className="text-white"
                          aria-label={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted ? (
                            <VolumeX className="h-6 w-6" />
                          ) : (
                            <Volume2 className="h-6 w-6" />
                          )}
                        </button>
                        <div className="text-sm font-medium text-white">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button className="text-white" aria-label="Settings">
                          <Settings className="h-6 w-6" />
                        </button>
                        <button
                          onClick={toggleFullscreen}
                          className="text-white"
                          aria-label="Fullscreen"
                        >
                          <Maximize className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs below video */}
              <div className="mt-6">
                <Tabs value={videoTab} onValueChange={setVideoTab}>
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="overview">Lesson Overview</TabsTrigger>
                    <TabsTrigger value="transcript">Transcript</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                  </TabsList>

                  {/* Lesson Overview Tab */}
                  <TabsContent value="overview" className="mt-6">
                    {/* Video Chapters */}
                    <div className="space-y-2 rounded-xl border border-border p-4">
                      {videoChapters.map((chapter) => (
                        <VideoChapterItem
                          key={chapter.id}
                          number={chapter.number}
                          title={chapter.title}
                          duration={chapter.duration}
                          timestamp={chapter.timestamp}
                          onSeek={seekToChapter}
                        />
                      ))}
                    </div>

                    {/* About This Lesson */}
                    <div className="mt-8">
                      <h2 className="mb-4 text-xl font-bold text-foreground">
                        About This Lesson
                      </h2>
                      <p className="text-sm leading-relaxed text-foreground/70 md:text-base">
                        {lessonData.description}
                      </p>
                    </div>

                    {/* What You'll Learn */}
                    <div className="mt-8">
                      <h3 className="mb-4 text-xl font-bold text-foreground">
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
                  <TabsContent value="transcript" className="mt-6">
                    <div className="rounded-xl border border-border p-6">
                      <p className="text-sm text-foreground/60">
                        Transcript content will be displayed here...
                      </p>
                    </div>
                  </TabsContent>

                  {/* Resources Tab */}
                  <TabsContent value="resources" className="mt-6">
                    <div className="rounded-xl border border-border p-6">
                      <p className="text-sm text-foreground/60">
                        Additional resources and downloads will be displayed here...
                      </p>
                    </div>
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
            <Link
              href="/learn/learning-space"
              className="group inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-foreground transition-colors hover:bg-accent"
              aria-label="Back to lessons"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 md:h-5 md:w-5" />
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
            <div className="mt-6 md:mt-8">
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
              <div className="mt-8 max-w-3xl pb-16 md:mt-12 md:pb-24">
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
              <section className="mb-12 mt-16 md:mb-16 md:mt-24">
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
