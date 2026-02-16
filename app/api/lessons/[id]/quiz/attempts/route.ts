/**
 * API Route: GET /api/lessons/[id]/quiz/attempts
 * Returns all quiz attempts for a specific lesson
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import { getQuizAttemptsByLesson } from '@/lib/api/quiz-storage';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;

    // In production, get userId from authenticated session
    const userId = 'demo-user';
    
    console.log(`[Quiz Attempts API] Fetching attempts for lesson ${lessonId}, user ${userId}`);

    // Get all attempts for this lesson and user
    const userAttempts = getQuizAttemptsByLesson(lessonId, userId);
    
    console.log(`[Quiz Attempts API] Found ${userAttempts.length} attempts`);

    // Sort by most recent first
    const sortedAttempts = userAttempts.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );

    // Format attempts for response
    const formattedAttempts = sortedAttempts.map((attempt) => ({
      id: attempt.id,
      attemptNumber: attempt.attemptNumber,
      score: attempt.score,
      correctAnswers: attempt.correctAnswers,
      totalQuestions: attempt.totalQuestions,
      answers: attempt.answers,
      timeSpent: attempt.timeSpent,
      completedAt: attempt.completedAt,
    }));

    return NextResponse.json(
      createSuccessResponse(formattedAttempts),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return NextResponse.json(
      createErrorResponse('SERVER_ERROR', 'Failed to fetch quiz attempts'),
      { status: 500 }
    );
  }
}
