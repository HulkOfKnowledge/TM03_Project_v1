/**
 * TypeScript Type Definitions for Quiz Components
 */

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  points?: number; // Optional: for weighted scoring
  category?: string; // Optional: for categorizing questions
  difficulty?: 'easy' | 'medium' | 'hard'; // Optional: difficulty level
}

export interface QuizContentProps {
  lessonNumber: string;
  lessonTitle: string;
  questions: QuizQuestion[];
  timeLimit?: number; // Optional: time limit in seconds
  passingScore?: number; // Optional: minimum score to pass (percentage)
  onComplete?: (results: QuizResults) => void; // Optional: callback when quiz completes
  onSave?: (progress: QuizProgress) => void; // Optional: callback to save progress
}

export interface QuizResults {
  lessonId: string;
  score: number; // Percentage
  correctAnswers: number;
  totalQuestions: number;
  answers: Record<string, number>;
  timeSpent?: number; // Time spent in seconds
  completedAt: Date;
  passed: boolean; // Whether the user passed based on passingScore
}

export interface QuizProgress {
  lessonId: string;
  currentQuestionIndex: number;
  answers: Record<string, number>;
  startedAt: Date;
  lastUpdated: Date;
}

export interface QuizState {
  quizStarted: boolean;
  currentQuestionIndex: number;
  selectedAnswers: Record<string, number>;
  answeredQuestions: Set<string>;
  showResults: boolean;
  timeRemaining?: number;
  startTime?: Date;
}

export interface QuizSettings {
  showExplanations: boolean;
  allowReview: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showProgressBar: boolean;
  enableTimer: boolean;
  timeLimit?: number; // in seconds
  passingScore?: number; // percentage (0-100)
  maxAttempts?: number; // maximum number of attempts allowed
}

export interface QuizAttempt {
  attemptNumber: number;
  score: number;
  completedAt: Date;
  timeSpent: number;
  answers: Record<string, number>;
}

export interface LessonQuizData {
  lessonId: string;
  lessonNumber: string;
  lessonTitle: string;
  questions: QuizQuestion[];
  settings: QuizSettings;
  attempts?: QuizAttempt[];
  bestScore?: number;
  lastAttemptDate?: Date;
}

// API Response Types
export interface GetQuizQuestionsResponse {
  success: boolean;
  data: {
    questions: QuizQuestion[];
    settings: QuizSettings;
  };
  error?: string;
}

export interface SaveQuizResultsRequest {
  lessonId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  answers: Record<string, number>;
  timeSpent?: number;
  completedAt: Date;
}

export interface SaveQuizResultsResponse {
  success: boolean;
  data?: {
    quizResultId: string;
    newBestScore: boolean;
    certificateEarned: boolean;
  };
  error?: string;
}

export interface GetQuizProgressResponse {
  success: boolean;
  data?: QuizProgress;
  error?: string;
}

// Component Props Types
export interface QuizPreviewProps {
  lessonNumber: string;
  lessonTitle: string;
  questionCount: number;
  estimatedTime: number; // in minutes
  onStartQuiz: () => void;
}

export interface QuizQuestionProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer?: number;
  isAnswered: boolean;
  onAnswerSelect: (answerIndex: number) => void;
  showExplanation: boolean;
}

export interface QuizResultsProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  userAnswers: Record<string, number>;
  timeSpent?: number;
  onRetake: () => void;
  onContinue: () => void;
}

export interface QuizProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  progress: number; // percentage
}

export interface QuizTimerProps {
  timeRemaining: number; // in seconds
  totalTime: number; // in seconds
  onTimeUp: () => void;
}

// Utility Types
export type QuizStatus = 'not-started' | 'in-progress' | 'completed' | 'paused';

export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 
  | 'multiple-choice' 
  | 'true-false' 
  | 'fill-in-blank' 
  | 'matching';

// Extended Question Type (for future enhancements)
export interface ExtendedQuizQuestion extends QuizQuestion {
  type: QuestionType;
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
  };
  hints?: string[];
  timeLimit?: number; // per-question time limit in seconds
}