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
  private cache: {
    learningPath: LearningContent[];
    recommendedContent: LearningContent[];
    checklistItems: ChecklistItem[];
    testimonials: Testimonial[];
  } | null = null;
  private cacheTimestamp: number = 0;
  private inFlightRequest: Promise<{
    learningPath: LearningContent[];
    recommendedContent: LearningContent[];
    checklistItems: ChecklistItem[];
    testimonials: Testimonial[];
  }> | null = null;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  private async fetchDashboardData(forceRefresh: boolean = false): Promise<{
    learningPath: LearningContent[];
    recommendedContent: LearningContent[];
    checklistItems: ChecklistItem[];
    testimonials: Testimonial[];
  }> {
    const now = Date.now();

    // Return cached data if available and fresh
    if (!forceRefresh && this.cache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.cache;
    }

    // If there's already a request in flight, wait for it
    if (this.inFlightRequest) {
      return this.inFlightRequest;
    }

    this.inFlightRequest = (async () => {
      const response = await fetch('/api/learn/dashboard', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to load learning dashboard data');
      }

      const result = await response.json();
      const data = {
        learningPath: result?.data?.learningPath ?? [],
        recommendedContent: result?.data?.recommendedContent ?? [],
        checklistItems: result?.data?.checklistItems ?? [],
        testimonials: result?.data?.testimonials ?? [],
      };

      // Update cache
      this.cache = data;
      this.cacheTimestamp = Date.now();
      
      return data;
    })();

    try {
      const data = await this.inFlightRequest;
      return data;
    } finally {
      this.inFlightRequest = null;
    }
  }

  /**
   * Clear the dashboard data cache
   */
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
    this.inFlightRequest = null;
  }

  async getDashboardData(forceRefresh: boolean = false) {
    return this.fetchDashboardData(forceRefresh);
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
   * Get all videos (content type: 'video')
   */
  async getVideos(): Promise<LearningContent[]> {
    const data = await this.fetchDashboardData();
    const allContent = [...data.learningPath, ...data.recommendedContent];
    return allContent.filter(content => content.type === 'video');
  }

  /**
   * Get resources (mix of videos and documents for learning)
   */
  async getResources(): Promise<LearningContent[]> {
    const data = await this.fetchDashboardData();
    // Return recommended content as resources
    return data.recommendedContent;
  }

  /**
   * Get content by ID
   */
  async getContentById(contentId: string): Promise<LearningContent | null> {
    const data = await this.fetchDashboardData();
    const allContent = [...data.learningPath, ...data.recommendedContent];
    const content = allContent.find(content => content.id === contentId);
    
    if (!content) {
      return null;
    }
    
    // Fetch detailed content information
    try {
      const detailsResponse = await fetch(`/api/learn/content/${contentId}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (detailsResponse.ok) {
        const detailsResult = await detailsResponse.json();
        const details = detailsResult?.data;
        
        // Merge details with basic content info
        return {
          ...content,
          chapters: details?.chapters,
          transcript: details?.transcript,
          resources: details?.resources,
          relatedContent: details?.relatedContent,
          learningPoints: details?.learningPoints,
        };
      }
    } catch (error) {
      console.error('Error fetching content details:', error);
    }
    
    return content;
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

  /**
   * Get user's learning history
   */
  async getLearningHistory(): Promise<any[]> {
    try {
      const response = await fetch('/api/learn/history', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to load learning history');
      }

      const result = await response.json();
      return result?.data ?? [];
    } catch (error) {
      console.error('Error fetching learning history:', error);
      return [];
    }
  }
}

export const learnService = new LearnService();
