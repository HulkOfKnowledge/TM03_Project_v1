/**
 * API Route: POST /api/quiz/results
 * Saves quiz results for a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type { SaveQuizResultsRequest, SaveQuizResultsResponse } from '@/types/quiz.types';
import { addQuizAttempt, getQuizAttemptsByLesson, type QuizAttemptRecord } from '@/lib/api/quiz-storage';

export async function POST(request: NextRequest) {
  try {
    const body: SaveQuizResultsRequest = await request.json();

    // Validate required fields
    if (!body.lessonId || body.score === undefined || !body.answers) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Missing required fields'),
        { status: 400 }
      );
    }

    // In production, get userId from authenticated session
    // For now, use a demo user ID
    const userId = 'demo-user';

    // Get existing attempts for this lesson and user
    const userLessonAttempts = getQuizAttemptsByLesson(body.lessonId, userId);

    const attemptNumber = userLessonAttempts.length + 1;
    const bestScore = userLessonAttempts.length > 0
      ? Math.max(...userLessonAttempts.map((a) => a.score), body.score)
      : body.score;
    const newBestScore = body.score >= bestScore;

    // Create quiz result record
    const quizResult: QuizAttemptRecord = {
      id: `quiz-result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      lessonId: body.lessonId,
      score: body.score,
      correctAnswers: body.correctAnswers,
      totalQuestions: body.totalQuestions,
      answers: body.answers,
      timeSpent: body.timeSpent || 0,
      completedAt: new Date(body.completedAt),
      attemptNumber,
      createdAt: new Date(),
    };

    // Store the result
    addQuizAttempt(quizResult);
    
    console.log(`[Quiz Results API] Saved quiz result:`, {
      id: quizResult.id,
      lessonId: quizResult.lessonId,
      userId: quizResult.userId,
      score: quizResult.score,
      attemptNumber: quizResult.attemptNumber,
    });

    // Check if user earned a certificate (score >= 80%)
    const certificateEarned = body.score >= 80;

    const response: SaveQuizResultsResponse = {
      success: true,
      data: {
        quizResultId: quizResult.id,
        newBestScore,
        certificateEarned,
      },
    };

    return NextResponse.json(createSuccessResponse(response.data!), { status: 201 });
  } catch (error) {
    console.error('Error saving quiz results:', error);
    return NextResponse.json(
      createErrorResponse('SERVER_ERROR', 'Failed to save quiz results'),
      { status: 500 }
    );
  }
}
