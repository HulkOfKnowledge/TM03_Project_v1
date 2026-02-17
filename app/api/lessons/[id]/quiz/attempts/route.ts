/**
 * API Route: GET /api/lessons/[id]/quiz/attempts
 * Returns all quiz attempts for a specific lesson
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import { getQuizAttemptsByLesson } from '@/lib/api/quiz-storage';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lessonId = params.id;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'User not authenticated'),
        { status: 401 }
      );
    }

    const userId = user.id;
    
    console.log(`[Quiz Attempts API] Fetching attempts for lesson ${lessonId}, user ${userId}`);

    // Get all attempts for this lesson and user from database
    const userAttempts = await getQuizAttemptsByLesson(lessonId, userId);
    
    console.log(`[Quiz Attempts API] Found ${userAttempts.length} attempts`);

    // Format attempts for response (already sorted by completed_at DESC from storage function)
    const formattedAttempts = userAttempts.map((attempt) => ({
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
