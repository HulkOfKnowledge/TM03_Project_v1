/**
 * Result Layout Component - Clean & Professional
 * Displays quiz results with score breakdown, correct answers, and explanations
 * Features: Minimalist design, theme-sensitive, mobile-optimized, with caching
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Check, 
  X, 
  RotateCcw, 
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { quizService } from '@/services/quiz.service';
import type { QuizQuestion, QuizResults } from '@/types/quiz.types';

interface ResultLayoutProps {
  id: string;
  category: string;
  topic: string;
}

// Cache for quiz attempts to prevent unnecessary API calls
const quizAttemptsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function ResultLayout({ id, category, topic }: ResultLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  // Memoize cache key to prevent recalculation
  const cacheKey = useMemo(() => `quiz-attempts-${id}`, [id]);

  useEffect(() => {
    loadResults();
  }, [id]);

  const loadResults = async () => {
    try {
      setLoading(true);
      
      // Check cache first
      const cached = quizAttemptsCache.get(cacheKey);
      const now = Date.now();
      
      let attemptsResponse;
      
      if (cached && (now - cached.timestamp) < CACHE_DURATION) {
        console.log('[ResultLayout] Using cached quiz attempts');
        attemptsResponse = cached.data;
      } else {
        console.log('[ResultLayout] Fetching fresh quiz attempts');
        // Get latest quiz attempt
        attemptsResponse = await quizService.getQuizAttempts(id);
        
        // Cache the response
        if (attemptsResponse.success && attemptsResponse.data) {
          quizAttemptsCache.set(cacheKey, { data: attemptsResponse, timestamp: now });
        }
      }
      
      if (!attemptsResponse.success || !attemptsResponse.data || attemptsResponse.data.length === 0) {
        console.error('No quiz attempts found');
        router.push(`/learn/${category}/${topic}/video/${id}`);
        return;
      }

      const latestAttempt = attemptsResponse.data[0];
      
      // Get quiz questions for explanations (also cache these)
      const questionsCacheKey = `quiz-questions-${id}`;
      const cachedQuestions = quizAttemptsCache.get(questionsCacheKey);
      
      let questionsResponse;
      
      if (cachedQuestions && (now - cachedQuestions.timestamp) < CACHE_DURATION) {
        console.log('[ResultLayout] Using cached quiz questions');
        questionsResponse = cachedQuestions.data;
      } else {
        console.log('[ResultLayout] Fetching fresh quiz questions');
        questionsResponse = await quizService.getQuizQuestions(id);
        
        // Cache the questions
        if (questionsResponse.success) {
          quizAttemptsCache.set(questionsCacheKey, { data: questionsResponse, timestamp: now });
        }
      }
      
      if (questionsResponse.success) {
        setQuestions(questionsResponse.data.questions);
      }

      // Convert attempt to results format
      const quizResults: QuizResults = {
        lessonId: id,
        score: latestAttempt.score,
        correctAnswers: latestAttempt.correctAnswers,
        totalQuestions: latestAttempt.totalQuestions,
        answers: latestAttempt.answers,
        timeSpent: latestAttempt.timeSpent,
        completedAt: new Date(latestAttempt.completedAt),
        passed: latestAttempt.score >= 70,
      };

      setResults(quizResults);
    } catch (error) {
      console.error('Error loading quiz results:', error);
      router.push(`/learn/${category}/${topic}/video/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
          <Skeleton className="mb-8 h-10 w-10 rounded-lg" />
          <div className="mb-8 text-center">
            <Skeleton className="mx-auto mb-3 h-10 w-64" />
            <Skeleton className="mx-auto h-5 w-48" />
          </div>
          <div className="mb-8 rounded-2xl border border-border bg-card p-8">
            <Skeleton className="mx-auto mb-4 h-24 w-24" />
            <Skeleton className="mx-auto mb-2 h-6 w-48" />
            <Skeleton className="mx-auto h-4 w-32" />
          </div>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold mb-2">No Results Found</h2>
          <p className="text-muted-foreground mb-6">Unable to load quiz results</p>
          <Button onClick={() => router.back()} size="lg">Go Back</Button>
        </div>
      </div>
    );
  }

  const percentage = results.score;
  const isPassed = results.passed;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
        {/* Header with back button and title */}
        <div className="mb-8 flex items-start gap-3 md:mb-12 md:gap-4">
          <button
            onClick={() => router.push(`/learn/${category}/${topic}/video/${id}`)}
            className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-border transition-colors hover:bg-muted md:h-12 md:w-12"
            aria-label="Back to lesson"
          >
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-xs text-foreground/60 md:text-sm">Quiz Results</p>
            <h1 className="mb-1 text-lg font-bold text-foreground md:text-2xl lg:text-3xl">
              {isPassed ? 'Great Job!' : 'Keep Learning'}
            </h1>
            <p className="text-xs text-foreground/60 md:text-sm">
              {isPassed 
                ? "You've passed this quiz" 
                : "Review the answers below and try again"}
            </p>
          </div>
        </div>

        {/* Score Card */}
        <div className="mb-8 rounded-2xl bg-muted/30 p-6 text-center md:rounded-3xl md:p-10">
          {/* Circular Progress */}
          <div className="relative mx-auto mb-6 h-32 w-32 sm:h-40 sm:w-40">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="8"
                className="stroke-muted"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(percentage / 100) * 251.2} 251.2`}
                className={`transition-all duration-1000 ${
                  isPassed ? 'stroke-brand' : 'stroke-orange-500'
                }`}
              />
            </svg>
            
            {/* Score Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl sm:text-5xl font-bold ${
                isPassed ? 'text-brand' : 'text-orange-500'
              }`}>
                {percentage}%
              </span>
            </div>
          </div>

          <div className="mx-auto mb-6 h-px w-32 bg-border" />

          <p className="text-base text-foreground/70 md:text-lg">
            {isPassed 
              ? "Great job! You've passed this quiz." 
              : "Review the answers below and try again."}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3 md:mb-12">
          <div className="rounded-xl border border-border bg-muted/30 p-5 text-center">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold mb-1">{results.correctAnswers}</div>
            <p className="text-sm text-muted-foreground">Correct</p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-5 text-center">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {results.totalQuestions - results.correctAnswers}
            </div>
            <p className="text-sm text-muted-foreground">Incorrect</p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-5 text-center">
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatTime(results.timeSpent || 0)}
            </div>
            <p className="text-sm text-muted-foreground">Time Spent</p>
          </div>
        </div>

        {/* Answer Review */}
        {questions.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-6 text-xl font-bold md:text-2xl">Review Answers</h2>
            
            <div className="space-y-4">
              {questions.map((question, index) => {
                const userAnswer = results.answers[question.id];
                const isCorrect = userAnswer === question.correctAnswer;

                return (
                  <div
                    key={question.id}
                    className="overflow-hidden rounded-xl border border-border bg-muted/30 md:rounded-2xl"
                  >
                    {/* Question */}
                    <div className="p-5 pb-4 md:p-6">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Question {index + 1}
                        </span>
                        <div className={`flex h-5 w-5 items-center justify-center rounded ${
                          isCorrect 
                            ? 'bg-green-500/20' 
                            : 'bg-red-500/20'
                        }`}>
                          {isCorrect ? (
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                      </div>
                      <p className="text-base font-medium leading-relaxed mb-4 md:text-lg">
                        {question.question}
                      </p>

                      {/* Options */}
                      <div className="space-y-2.5">
                        {question.options.map((option, optionIndex) => {
                          const isUserAnswer = userAnswer === optionIndex;
                          const isCorrectAnswer = question.correctAnswer === optionIndex;
                          const optionLabel = String.fromCharCode(65 + optionIndex);

                          return (
                            <div
                              key={optionIndex}
                              className={`rounded-lg px-4 py-3 text-sm md:text-base ${
                                isCorrectAnswer
                                  ? 'bg-green-500/15 dark:bg-green-500/20 border border-green-500/30'
                                  : isUserAnswer
                                  ? 'bg-red-500/15 dark:bg-red-500/20 border border-red-500/30'
                                  : 'bg-background border border-border'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`font-semibold ${
                                  isCorrectAnswer
                                    ? 'text-green-600 dark:text-green-400'
                                    : isUserAnswer
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-muted-foreground'
                                }`}>
                                  {optionLabel}.
                                </span>
                                <span className="flex-1 leading-relaxed">{option}</span>
                                {isCorrectAnswer && (
                                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="border-t border-border bg-muted/50 px-5 py-4 md:px-6">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          Explanation
                        </p>
                        <p className="text-sm leading-relaxed text-foreground/80">
                          {question.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => {
              // Navigate back to video page with quiz tab - quizzes are shown via tabs, not separate routes
              router.push(`/learn/${category}/${topic}/video/${id}?tab=quiz`);
            }}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Retake Test
          </Button>
          <Button
            onClick={() => router.push('/learn/learning-space')}
            size="lg"
            className="w-full bg-brand text-white hover:bg-brand/90 sm:w-auto"
          >
            Continue Learning
          </Button>
        </div>
      </div>
    </div>
  );
}
