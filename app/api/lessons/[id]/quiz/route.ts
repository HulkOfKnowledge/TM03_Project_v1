/**
 * API Route: GET /api/lessons/[id]/quiz
 * Returns quiz questions for a specific lesson
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type { QuizQuestion, QuizSettings } from '@/types/quiz.types';

// Sample quiz questions by lesson ID
// In production, replace with database queries
const questionSets: Record<string, QuizQuestion[]> = {
  '1': [
    {
      id: 'q1',
      question: 'What is the recommended credit utilization ratio?',
      options: ['Under 10%', 'Under 30%', 'Under 50%', 'Under 70%'],
      correctAnswer: 1,
      explanation:
        'Keeping your credit utilization under 30% is recommended for maintaining a healthy credit score.',
    },
    {
      id: 'q2',
      question: 'Why do newcomers to Canada start with no credit file?',
      options: [
        'They have bad credit from their home country',
        "Canadian credit bureaus don't track international credit history",
        'They need to apply for citizenship first',
        "It's a requirement by law",
      ],
      correctAnswer: 1,
      explanation:
        'Canadian credit bureaus only track credit activity within Canada.',
    },
    {
      id: 'q3',
      question: 'What does "hard inquiry" mean in credit terms?',
      options: [
        'A difficult question about your credit',
        'When you check your own credit score',
        'When a lender checks your credit for a loan decision',
        'When your credit card company reviews your account',
      ],
      correctAnswer: 2,
      explanation:
        'A hard inquiry occurs when a financial institution checks your credit report to make a lending decision. It can temporarily lower your credit score.',
    },
    {
      id: 'q4',
      question: 'Which payment method helps build credit history in Canada?',
      options: [
        'Using cash only',
        'Using a debit card',
        'Using a secured credit card',
        'Using a prepaid card',
      ],
      correctAnswer: 2,
      explanation:
        'Secured credit cards are an excellent tool for newcomers to build credit history as they report to credit bureaus.',
    },
    {
      id: 'q5',
      question: 'How long does it typically take to establish a credit score in Canada?',
      options: [
        '1-2 weeks',
        '1-2 months',
        '3-6 months',
        '1-2 years',
      ],
      correctAnswer: 2,
      explanation:
        'It typically takes 3-6 months of credit activity to establish a credit score in Canada.',
    },
  ],
};

// Default quiz settings
const getDefaultSettings = (): QuizSettings => ({
  showExplanations: true,
  allowReview: true,
  shuffleQuestions: false,
  shuffleOptions: false,
  showProgressBar: true,
  enableTimer: true,
  timeLimit: 300, // 5 minutes in seconds
  passingScore: 70,
  maxAttempts: undefined,
});

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;

    // Get questions for this lesson (or use default set)
    let questions = questionSets[lessonId] || questionSets['1'];
    const settings = getDefaultSettings();

    // Optionally randomize questions if setting is enabled
    if (settings.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    // Use all available questions for this lesson
    const limitedQuestions = questions;

    const responseData = {
      questions: limitedQuestions,
      settings,
    };

    return NextResponse.json(
      createSuccessResponse(responseData),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    return NextResponse.json(
      createErrorResponse('SERVER_ERROR', 'Failed to fetch quiz questions'),
      { status: 500 }
    );
  }
}
