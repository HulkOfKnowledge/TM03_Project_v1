/**
 * Learn Service
 * Handles learning content, testimonials, and user progress
 */

import type {
  LearningContent,
  ChecklistItem,
  Testimonial,
} from '@/types/learn.types';

export class LearnService {
  private async fetchDashboardData(): Promise<{
    learningPath: LearningContent[];
    recommendedContent: LearningContent[];
    checklistItems: ChecklistItem[];
    testimonials: Testimonial[];
  }> {
    const response = await fetch('/api/learn/dashboard', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to load learning dashboard data');
    }

    const result = await response.json();
    return {
      learningPath: result?.data?.learningPath ?? [],
      recommendedContent: result?.data?.recommendedContent ?? [],
      checklistItems: result?.data?.checklistItems ?? [],
      testimonials: result?.data?.testimonials ?? [],
    };
  }

  async getDashboardData() {
    return this.fetchDashboardData();
  }

  /**
   * Get learning path content (featured/beginner content)
   */
  async getLearningPath(): Promise<LearningContent[]> {
    const data = await this.fetchDashboardData();
    return data.learningPath;
  }

  /**
   * Get recommended content for user
   */
  async getRecommendedContent(): Promise<LearningContent[]> {
    const data = await this.fetchDashboardData();
    return data.recommendedContent;
  }

  /**
   * Get beginner's checklist items
   */
  async getChecklist(_userId: string): Promise<ChecklistItem[]> {
    const data = await this.fetchDashboardData();
    return data.checklistItems;
  }

  /**
   * Get testimonials
   */
  async getTestimonials(): Promise<Testimonial[]> {
    const data = await this.fetchDashboardData();
    return data.testimonials;
  }

  /**
   * Get all articles (content type: 'article')
   */
  async getArticles(): Promise<LearningContent[]> {
    const data = await this.fetchDashboardData();
    const allContent = [...data.learningPath, ...data.recommendedContent];
    return allContent.filter(content => content.type === 'article');
  }

  /**
   * Update checklist item completion
   */
  async updateChecklistItem(
    _userId: string,
    _itemId: string,
    _completed: boolean
  ): Promise<void> {
    // TODO: Implement API call to update user progress
    // const supabase = createClient();
    // await supabase.from('user_progress').upsert({
    //   user_id: userId,
    //   checklist_item_id: itemId,
    //   completed,
    //   completed_at: completed ? new Date().toISOString() : null,
    // });
  }

  /**
   * Mark content as accessed/completed
   */
  async markContentCompleted(
    _userId: string,
    _contentId: string
  ): Promise<void> {
    // TODO: Implement API call to track content completion
    // const supabase = createClient();
    // await supabase.from('content_progress').insert({
    //   user_id: userId,
    //   content_id: contentId,
    //   completed_at: new Date().toISOString(),
    // });
  }
}

export const learnService = new LearnService();
