/**
 * Quiz Storage - Database Implementation
 * Handles quiz attempts and results using Supabase database
 * Replaces in-memory storage for production use
 */

import { createClient } from '@/lib/supabase/server';

export interface QuizAttemptRecord {
  id: string;
  lessonId: string;
  userId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  answers: Record<string, number>;
  timeSpent: number;
  completedAt: Date;
  attemptNumber: number;
  createdAt: Date;
}

/**
 * Add a new quiz attempt to the database
 * Returns the created record with database-generated ID
 */
export async function addQuizAttempt(attempt: QuizAttemptRecord): Promise<QuizAttemptRecord> {
  try {
    console.log('[Quiz Storage] Starting addQuizAttempt:', {
      lessonId: attempt.lessonId,
      userId: attempt.userId,
      attemptNumber: attempt.attemptNumber,
    });

    const supabase = await createClient();

    console.log('[Quiz Storage] Supabase client created, attempting insert...');

    // Don't include 'id' - let the database generate the UUID
    const insertData = {
      user_id: attempt.userId,
      lesson_id: attempt.lessonId,
      score: attempt.score,
      correct_answers: attempt.correctAnswers,
      total_questions: attempt.totalQuestions,
      answers: attempt.answers,
      time_spent: attempt.timeSpent,
      completed_at: attempt.completedAt.toISOString(),
      attempt_number: attempt.attemptNumber,
    };

    console.log('[Quiz Storage] Insert data:', insertData);

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('[Quiz Storage] Database error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw new Error(`Database error: ${error.message} (${error.code})`);
    }

    console.log('[Quiz Storage] Successfully added attempt:', data);

    // Return the complete record with database-generated ID
    return {
      id: data.id,
      lessonId: data.lesson_id,
      userId: data.user_id,
      score: data.score,
      correctAnswers: data.correct_answers,
      totalQuestions: data.total_questions,
      answers: data.answers,
      timeSpent: data.time_spent,
      completedAt: new Date(data.completed_at),
      attemptNumber: data.attempt_number,
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    console.error('[Quiz Storage] Failed to add quiz attempt:', error);
    throw error;
  }
}

/**
 * Get all quiz attempts for a specific lesson and user
 */
export async function getQuizAttemptsByLesson(
  lessonId: string,
  userId: string
): Promise<QuizAttemptRecord[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('[Quiz Storage] Error fetching quiz attempts:', error);
      throw error;
    }

    // Transform database records to match QuizAttemptRecord interface
    const attempts: QuizAttemptRecord[] = (data || []).map((record) => ({
      id: record.id,
      lessonId: record.lesson_id,
      userId: record.user_id,
      score: record.score,
      correctAnswers: record.correct_answers,
      totalQuestions: record.total_questions,
      answers: record.answers,
      timeSpent: record.time_spent,
      completedAt: new Date(record.completed_at),
      attemptNumber: record.attempt_number,
      createdAt: new Date(record.created_at),
    }));

    console.log(`[Quiz Storage] Retrieved ${attempts.length} attempts for lesson ${lessonId}, user ${userId}`);
    return attempts;
  } catch (error) {
    console.error('[Quiz Storage] Failed to fetch quiz attempts:', error);
    return [];
  }
}

/**
 * Get all quiz attempts for the authenticated user
 */
export async function getAllQuizAttempts(): Promise<QuizAttemptRecord[]> {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('[Quiz Storage] No authenticated user found');
      return [];
    }

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('[Quiz Storage] Error fetching all quiz attempts:', error);
      throw error;
    }

    // Transform database records to match QuizAttemptRecord interface
    const attempts: QuizAttemptRecord[] = (data || []).map((record) => ({
      id: record.id,
      lessonId: record.lesson_id,
      userId: record.user_id,
      score: record.score,
      correctAnswers: record.correct_answers,
      totalQuestions: record.total_questions,
      answers: record.answers,
      timeSpent: record.time_spent,
      completedAt: new Date(record.completed_at),
      attemptNumber: record.attempt_number,
      createdAt: new Date(record.created_at),
    }));

    console.log(`[Quiz Storage] Retrieved ${attempts.length} total attempts`);
    return attempts;
  } catch (error) {
    console.error('[Quiz Storage] Failed to fetch all quiz attempts:', error);
    return [];
  }
}

/**
 * Get the next attempt number for a user/lesson combination
 */
export async function getNextAttemptNumber(lessonId: string, userId: string): Promise<number> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('get_next_attempt_number', {
        p_user_id: userId,
        p_lesson_id: lessonId,
      });

    if (error) {
      console.error('[Quiz Storage] Error getting next attempt number:', error);
      // Fallback: query manually
      const attempts = await getQuizAttemptsByLesson(lessonId, userId);
      return attempts.length + 1;
    }

    return data || 1;
  } catch (error) {
    console.error('[Quiz Storage] Failed to get next attempt number:', error);
    // Fallback: return 1
    return 1;
  }
}

/**
 * Get the best score for a user on a specific lesson
 */
export async function getBestQuizScore(lessonId: string, userId: string): Promise<number> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .rpc('get_best_quiz_score', {
        p_user_id: userId,
        p_lesson_id: lessonId,
      });

    if (error) {
      console.error('[Quiz Storage] Error getting best quiz score:', error);
      // Fallback: query manually
      const attempts = await getQuizAttemptsByLesson(lessonId, userId);
      return attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : 0;
    }

    return data || 0;
  } catch (error) {
    console.error('[Quiz Storage] Failed to get best quiz score:', error);
    return 0;
  }
}

