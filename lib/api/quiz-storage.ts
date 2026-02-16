/**
 * Shared Quiz Storage
 * In-memory storage for quiz attempts and results (demo purposes)
 * In production, replace with database operations
 * 
 * Uses global storage to persist across Next.js HMR in development
 */

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

// Use global storage to persist across Next.js HMR in development
declare global {
  // eslint-disable-next-line no-var
  var quizAttempts: QuizAttemptRecord[] | undefined;
}

// Initialize storage on global object to persist across module reloads
if (!global.quizAttempts) {
  global.quizAttempts = [];
}

const quizAttempts = global.quizAttempts;

export function addQuizAttempt(attempt: QuizAttemptRecord): void {
  quizAttempts.push(attempt);
  console.log(`[Quiz Storage] Added attempt for lesson ${attempt.lessonId}, total attempts: ${quizAttempts.length}`);
}

export function getQuizAttemptsByLesson(lessonId: string, userId: string): QuizAttemptRecord[] {
  const attempts = quizAttempts.filter(
    (attempt) => attempt.lessonId === lessonId && attempt.userId === userId
  );
  console.log(`[Quiz Storage] Retrieved ${attempts.length} attempts for lesson ${lessonId}, user ${userId}`);
  return attempts;
}

export function getAllQuizAttempts(): QuizAttemptRecord[] {
  console.log(`[Quiz Storage] Retrieved all attempts, total: ${quizAttempts.length}`);
  return quizAttempts;
}
