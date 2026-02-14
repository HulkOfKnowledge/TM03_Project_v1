/**
 * Quiz Service
 * Handles all API calls related to quiz functionality
 */

import {
  QuizQuestion,
  QuizSettings,
  GetQuizQuestionsResponse,
  SaveQuizResultsRequest,
  SaveQuizResultsResponse,
  QuizProgress,
  GetQuizProgressResponse,
  LessonQuizData,
} from '@/types/quiz.types';

class QuizService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
  }

  /**
   * Get quiz questions for a specific lesson
   */
  async getQuizQuestions(lessonId: string): Promise<GetQuizQuestionsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/lessons/${lessonId}/quiz`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz questions');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          questions: this.getFallbackQuestions(lessonId),
          settings: this.getDefaultSettings(),
        },
      };
    }
  }

  /**
   * Save quiz results
   */
  async saveQuizResults(
    data: SaveQuizResultsRequest
  ): Promise<SaveQuizResultsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/quiz/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save quiz results');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving quiz results:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get user's quiz progress for a lesson
   */
  async getQuizProgress(lessonId: string): Promise<GetQuizProgressResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/lessons/${lessonId}/quiz/progress`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch quiz progress');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching quiz progress:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save quiz progress (for resume functionality)
   */
  async saveQuizProgress(progress: QuizProgress): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/quiz/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(progress),
      });

      if (!response.ok) {
        throw new Error('Failed to save quiz progress');
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving quiz progress:', error);
      return { success: false };
    }
  }

  /**
   * Get all quiz attempts for a lesson
   */
  async getQuizAttempts(lessonId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/lessons/${lessonId}/quiz/attempts`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch quiz attempts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get quiz statistics for the user
   */
  async getQuizStatistics() {
    try {
      const response = await fetch(`${this.baseUrl}/quiz/statistics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch quiz statistics');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching quiz statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete quiz progress (reset quiz)
   */
  async resetQuizProgress(lessonId: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/lessons/${lessonId}/quiz/progress`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reset quiz progress');
      }

      return { success: true };
    } catch (error) {
      console.error('Error resetting quiz progress:', error);
      return { success: false };
    }
  }

  /**
   * Get default quiz settings
   */
  private getDefaultSettings(): QuizSettings {
    return {
      showExplanations: true,
      allowReview: true,
      shuffleQuestions: false,
      shuffleOptions: false,
      showProgressBar: true,
      enableTimer: false,
      passingScore: 60,
    };
  }

  /**
   * Fallback questions for offline/error scenarios
   * Replace with actual lesson-specific questions
   */
  private getFallbackQuestions(lessonId: string): QuizQuestion[] {
    // These are example questions - replace with your actual questions
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
      ],
      // Add more lesson-specific question sets
    };

    return questionSets[lessonId] || [];
  }
}

// Export a singleton instance
export const quizService = new QuizService();

// Export the class for testing or custom instances
export default QuizService;