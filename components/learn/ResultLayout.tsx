/**
 * Result Layout Component
 * Displays quiz results with score breakdown, correct answers, and explanations
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { quizService } from '@/services/quiz.service';
import type { QuizQuestion, QuizResults } from '@/types/quiz.types';

interface ResultLayoutProps {
  id: string;
  category: string;
  topic: string;
}

export function ResultLayout({ id, category, topic }: ResultLayoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    loadResults();
  }, [id]);

  const loadResults = async () => {
    try {
      setLoading(true);
      
      // Get latest quiz attempt
      const attemptsResponse = await quizService.getQuizAttempts(id);
      if (!attemptsResponse.success || !attemptsResponse.data || attemptsResponse.data.length === 0) {
        console.error('No quiz attempts found');
        router.push(`/learn/${category}/${topic}/video/${id}`);
        return;
      }

      const latestAttempt = attemptsResponse.data[0];
      
      // Get quiz questions for explanations
      const questionsResponse = await quizService.getQuizQuestions(id);
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
      // Redirect back to video page if results cannot be loaded
      router.push(`/learn/${category}/${topic}/video/${id}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
          {/* Back Button Skeleton */}
          <Skeleton className="mb-6 h-10 w-10 rounded-full" />

          {/* Header Skeleton */}
          <div className="mb-8 text-center">
            <Skeleton className="mx-auto mb-2 h-10 w-64" />
            <Skeleton className="mx-auto h-5 w-48" />
          </div>

          {/* Score Card Skeleton */}
          <div className="mb-8 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 p-8 text-center md:p-12">
            <div className="mb-6">
              <Skeleton className="mx-auto mb-2 h-20 w-32" />
              <Skeleton className="mx-auto h-6 w-56" />
            </div>

            <div className="mx-auto mb-6 h-px w-32 bg-border" />

            {/* Stats Skeleton */}
            <div className="grid grid-cols-3 gap-4 md:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="mx-auto mb-2 h-10 w-12" />
                  <Skeleton className="mx-auto h-4 w-16" />
                </div>
              ))}
            </div>
          </div>

          {/* Button Skeleton */}
          <div className="mb-6 flex justify-center">
            <Skeleton variant="button" className="w-full sm:w-64" />
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Skeleton variant="button" className="w-full sm:w-40" />
            <Skeleton variant="button" className="w-full sm:w-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">No results found</h2>
          <p className="text-foreground/60 mb-6">Unable to load quiz results</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const percentage = results.score;
  const isPassed = results.passed;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/learn/${category}/${topic}/video/${id}`)}
          className="group mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground transition-colors hover:bg-accent"
          aria-label="Back to lesson"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5 md:h-5 md:w-5" />
        </button>

        {/* Results Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
            Quiz Completed
          </h1>
          <p className="text-foreground/60">Your Performance Summary</p>
        </div>

        {/* Score Card */}
        <div className="mb-8 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 p-8 text-center md:p-12">
          <div className="mb-6">
            <div className={`mb-2 text-6xl font-bold md:text-7xl ${isPassed ? 'text-green-600 dark:text-green-500' : 'text-orange-600 dark:text-orange-500'}`}>
              {percentage}%
            </div>
            <p className="text-lg text-foreground/80">
              {isPassed ? 'Congratulations! You passed!' : 'Keep practicing!'}
            </p>
          </div>

          <div className="mx-auto mb-6 h-px w-32 bg-border" />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <div>
              <div className="text-2xl font-bold text-foreground md:text-3xl">
                {results.correctAnswers}
              </div>
              <p className="text-sm text-foreground/60">Correct</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground md:text-3xl">
                {results.totalQuestions - results.correctAnswers}
              </div>
              <p className="text-sm text-foreground/60">Incorrect</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground md:text-3xl">
                {results.totalQuestions}
              </div>
              <p className="text-sm text-foreground/60">Total</p>
            </div>
          </div>
        </div>

        {/* Detailed Answers - Always Shown */}
        {questions.length > 0 && (
          <div className="mb-8 space-y-4">
            <h2 className="text-2xl font-bold text-foreground mb-6">Answer Review</h2>
            {questions.map((question, index) => {
              const userAnswer = results.answers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <div
                  key={question.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  {/* Question Header */}
                  <div className={`border-l-4 p-5 ${
                    isCorrect
                      ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/10'
                      : 'border-l-red-500 bg-red-50/50 dark:bg-red-950/10'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {isCorrect ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : (
                          <X className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="mb-1.5 text-sm font-medium text-foreground/60">
                          Question {index + 1}
                        </p>
                        <p className="text-base font-medium leading-relaxed text-foreground">
                          {question.question}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 p-5">
                    {question.options.map((option, optionIndex) => {
                      const isUserAnswer = userAnswer === optionIndex;
                      const isCorrectAnswer = question.correctAnswer === optionIndex;
                      const optionLabel = String.fromCharCode(65 + optionIndex);

                      return (
                        <div
                          key={optionIndex}
                          className={`rounded-lg px-4 py-3 transition-colors ${
                            isCorrectAnswer
                              ? 'bg-green-100 dark:bg-green-950/30'
                              : isUserAnswer
                              ? 'bg-red-100 dark:bg-red-950/30'
                              : 'bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              isCorrectAnswer
                                ? 'bg-green-600 text-white dark:bg-green-500'
                                : isUserAnswer
                                ? 'bg-red-600 text-white dark:bg-red-500'
                                : 'bg-muted text-foreground/60'
                            }`}>
                              {optionLabel}
                            </span>
                            <span className="flex-1 text-sm text-foreground/90">{option}</span>
                            {isCorrectAnswer && (
                              <span className="shrink-0 text-xs font-semibold text-green-600 dark:text-green-400">
                                ✓ Correct
                              </span>
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <span className="shrink-0 text-xs font-semibold text-red-600 dark:text-red-400">
                                Your choice
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {question.explanation && (
                    <div className="border-t border-border bg-muted/20 px-5 py-4">
                      <div className="flex gap-2">
                        <div className="text-sm font-semibold text-foreground/70 shrink-0">
                          💡
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground/70 mb-1">
                            Explanation
                          </p>
                          <p className="text-sm leading-relaxed text-foreground/80">
                            {question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => router.push(`/learn/${category}/${topic}/quiz/${id}`)}
            variant="outline"
            size="lg"
            className="inline-flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Quiz
          </Button>
          <Button
            onClick={() => router.push('/learn/learning-space')}
            variant="default"
            size="lg"
          >
            Continue Learning
          </Button>
        </div>
      </div>
    </div>
  );
}
