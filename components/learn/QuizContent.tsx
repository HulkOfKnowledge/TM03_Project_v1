/**
 * Quiz Content Component
 * Displays quiz with timer, clean layout matching actual design
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LessonPreviewCard } from '@/components/learn/LessonPreviewCard';
import { InfoListItem } from '@/components/learn/InfoListItem';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizContentProps {
  lessonNumber: string;
  lessonTitle: string;
  questions: QuizQuestion[];
  timeLimit?: number; // in seconds, default 20s per question
  onQuizStateChange?: (isActive: boolean) => void; // Callback to notify parent of quiz state
}

export function QuizContent({ 
  lessonNumber, 
  lessonTitle, 
  questions,
  timeLimit = 20,
  onQuizStateChange 
}: QuizContentProps) {
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;

  // Notify parent when quiz state changes
  useEffect(() => {
    onQuizStateChange?.(quizStarted && !showResults);
  }, [quizStarted, showResults, onQuizStateChange]);

  // Timer logic
  useEffect(() => {
    if (!quizStarted || showResults) return;

    if (timeRemaining <= 0) {
      handleNext();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, showResults, timeRemaining]);

  // Reset timer when question changes
  useEffect(() => {
    setTimeRemaining(timeLimit);
  }, [currentQuestionIndex, timeLimit]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswers[currentQuestion.id] !== undefined) return;
    
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: answerIndex,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return correct;
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setTimeRemaining(timeLimit);
  };

  // Quiz Preview Screen
  if (!quizStarted) {
    return (
      <div className="mt-8">
        <LessonPreviewCard
          lessonNumber={lessonNumber}
          lessonTitle={lessonTitle}
          subtitle="Understanding Credit Without Fear"
          leftVariant="quiz"
          rightContent="placeholder"
        />

        {/* Welcome Message */}
        <div className="prose prose-sm mt-12 max-w-none lg:mt-16">
          <p className="text-sm leading-relaxed text-foreground/70 md:text-base">
            Welcome to this short test, and thank you for agreeing to participate! The activity shouldn't take longer than 10 to 15 minutes to complete. You can find out your knowledge level on the subject and learn about what you know. First page on the next page...
          </p>
        </div>

        {/* Before You Start Section */}
        <div className="mt-12 lg:mt-16">
          <h3 className="mb-6 text-xl font-bold text-foreground md:mb-8 md:text-2xl">
            Before you start
          </h3>
          <div className="space-y-3 md:space-y-4">
            {[
              'Complete the learning session of this lesson for better understanding and a higher score',
              'Make sure you have at least 20 mins to spend concentrated on this, you will be on a timer',
              'This quiz doesn\'t affect your credit score in any way it is just for your to know your knowledge level',
              'Once quiz begins you have to finish it'
            ].map((text, index) => (
              <InfoListItem key={index} text={text} variant="custom" />
            ))}
          </div>
        </div>

        {/* Start Test Button */}
        <div className="mt-8 max-w-3xl md:mt-12">
          <Button
            onClick={() => setQuizStarted(true)}
            variant="default"
            size="lg"
            className="inline-flex items-center gap-2 shadow-lg shadow-brand/20 hover:gap-3"
          >
            Start Test
          </Button>
        </div>
      </div>
    );
  }

  // Results Screen
  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / totalQuestions) * 100);
    
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-16">
          {/* Results Header */}
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-foreground">Test Completed</h2>
            <p className="text-foreground/60">Your Score</p>
          </div>

          {/* Score Card */}
          <div className="mb-8 rounded-3xl bg-muted/30 p-8 text-center md:p-12">
            <p className="mb-6 text-base text-foreground/80">{lessonTitle}</p>
            
            <div className="mb-6">
              <div className="mb-2 text-6xl font-bold text-foreground md:text-7xl">
                {percentage}%
              </div>
              <p className="text-lg text-foreground/80">Knowledge Level</p>
            </div>

            <div className="mx-auto mb-6 h-px w-32 bg-border" />

            <p className="text-foreground/70">
              You answered {score} out of {totalQuestions} questions correctly.{' '}
              <button 
                className="font-medium text-foreground underline hover:no-underline"
                onClick={() => {
                  // This would toggle the answer review section
                }}
              >
                View Answers
              </button>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={resetQuiz}
              variant="outline"
              size="lg"
              className="sm:w-auto"
            >
              Retake Test
            </Button>
            <Button
              onClick={() => {
                // Navigate to next lesson or back to learning space
                window.location.href = '/learn/learning-space';
              }}
              variant="default"
              size="lg"
              className="bg-brand text-white hover:bg-brand/90 sm:w-auto"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Question Screen
  const isAnswered = selectedAnswers[currentQuestion.id] !== undefined;
  const selectedAnswer = selectedAnswers[currentQuestion.id];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header with back button, title, and timer */}
        <div className="mb-12 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                } else {
                  setQuizStarted(false);
                }
              }}
              className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-border transition-colors hover:bg-muted"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="mb-1 text-sm text-foreground/60">{lessonNumber}</p>
              <h1 className="mb-1 text-2xl font-bold text-foreground md:text-3xl">
                {lessonTitle}
              </h1>
              <p className="text-sm text-foreground/60">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-foreground/60" />
            <span className="text-2xl font-semibold text-foreground">
              {timeRemaining}s
            </span>
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-3xl bg-muted/30 p-8 md:p-10">
          {/* Question Text */}
          <div className="mb-8">
            <h2 className="text-lg font-normal text-foreground md:text-xl">
              <span className="font-medium">Question {currentQuestionIndex + 1}</span>{' '}
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-4">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const optionLabel = String.fromCharCode(65 + index); // A, B, C, D

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                  className={`group relative w-full rounded-xl border p-5 text-left transition-all ${
                    isSelected
                      ? 'border-brand bg-brand/5'
                      : 'border-border bg-background hover:border-brand/50'
                  } ${isAnswered ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Option Text - Left side */}
                    <span className="flex-1 text-base text-foreground">
                      {optionLabel}. {option}
                    </span>

                    {/* Checkbox - Right side */}
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                        isSelected
                          ? 'border-brand bg-brand'
                          : 'border-foreground/30'
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Next Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!isAnswered}
            variant="ghost"
            size="lg"
            className="text-sm bg-accent hover:bg-brand hover:text-background"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}