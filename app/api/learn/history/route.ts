/**
 * API Route: GET /api/learn/history
 * Returns user's learning history with progress
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import { getAllQuizAttempts } from '@/lib/api/quiz-storage';

interface LearningHistoryItem {
  id: string;
  title: string;
  subtitle: string;
  type: '3-step guide' | 'video' | 'article';
  progress: number;
  status: 'complete' | 'in-progress';
  category: string;
  topic: string;
  imageUrl?: string;
  completedAt?: Date;
}

// Sample content data (in production, fetch from database)
const contentMap: Record<string, { title: string; subtitle: string; type: LearningHistoryItem['type']; category: string; topic: string }> = {
  '1': {
    title: 'Understanding Credit Basics',
    subtitle: 'Learn the fundamentals of credit scores and credit history',
    type: 'video',
    category: 'beginner',
    topic: 'credit-basics',
  },
  '2': {
    title: 'Building Your Credit History',
    subtitle: 'Practical steps to establish credit as a newcomer',
    type: 'video',
    category: 'beginner',
    topic: 'credit-building',
  },
  '3': {
    title: 'Credit Cards 101',
    subtitle: 'Everything you need to know about credit cards',
    type: 'article',
    category: 'intermediate',
    topic: 'credit-cards',
  },
  '4': {
    title: 'Managing Credit Utilization',
    subtitle: 'How to optimize your credit card usage',
    type: '3-step guide',
    category: 'intermediate',
    topic: 'credit-management',
  },
  '5': {
    title: 'Avoiding Common Credit Mistakes',
    subtitle: 'Pitfalls to avoid when building credit',
    type: 'video',
    category: 'advanced',
    topic: 'credit-mistakes',
  },
};

export async function GET() {
  try {
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
    
    console.log(`[Learning History API] Fetching history for user ${userId}`);

    // Get all quiz attempts for the user (now returns only user's attempts)
    const userAttempts = await getAllQuizAttempts();
    console.log(`[Learning History API] User attempts: ${userAttempts.length}`);

    // Group attempts by lesson ID and get the latest/best attempt
    const lessonAttempts = new Map<string, typeof userAttempts[0]>();
    
    userAttempts.forEach((attempt) => {
      const existing = lessonAttempts.get(attempt.lessonId);
      if (!existing || attempt.score > existing.score) {
        lessonAttempts.set(attempt.lessonId, attempt);
      }
    });

    // Convert to learning history items
    const historyItems: LearningHistoryItem[] = Array.from(lessonAttempts.values()).map((attempt) => {
      const content = contentMap[attempt.lessonId] || {
        title: `Lesson ${attempt.lessonId}`,
        subtitle: 'Credit education content',
        type: 'video' as const,
        category: 'beginner',
        topic: 'general',
      };

      return {
        id: attempt.lessonId,
        title: content.title,
        subtitle: content.subtitle,
        type: content.type,
        category: content.category,
        topic: content.topic,
        progress: attempt.score,
        status: attempt.score >= 70 ? 'complete' : 'in-progress',
        completedAt: new Date(attempt.completedAt),
      };
    });

    // Sort by most recent first
    historyItems.sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json(
      createSuccessResponse(historyItems),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching learning history:', error);
    return NextResponse.json(
      createErrorResponse('SERVER_ERROR', 'Failed to fetch learning history'),
      { status: 500 }
    );
  }
}
