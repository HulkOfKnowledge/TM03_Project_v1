/**
 * DEBUG ENDPOINT - Remove in production
 * Shows current state of quiz storage
 */

import { NextResponse } from 'next/server';
import { getAllQuizAttempts } from '@/lib/api/quiz-storage';

export async function GET() {
  const allAttempts = getAllQuizAttempts();
  
  return NextResponse.json({
    totalAttempts: allAttempts.length,
    attempts: allAttempts.map(a => ({
      id: a.id,
      lessonId: a.lessonId,
      userId: a.userId,
      score: a.score,
      attemptNumber: a.attemptNumber,
      completedAt: a.completedAt,
      createdAt: a.createdAt,
    })),
  });
}
