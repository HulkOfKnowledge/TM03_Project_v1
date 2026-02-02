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
  /**
   * Get learning path content (featured/beginner content)
   */
  async getLearningPath(): Promise<LearningContent[]> {
    // TODO: Replace with actual API call when backend is ready
    // const supabase = createClient();
    // const { data, error } = await supabase
    //   .from('learning_content')
    //   .select('*')
    //   .eq('featured', true)
    //   .order('order', { ascending: true });
    
    // Mock data for now
    return [
      {
        id: '1',
        title: 'Understanding Credit Applications',
        description: 'Taking the right steps',
        category: 'Credit Basics',
        duration: '2 min',
        type: 'video',
        order: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Understanding Credit Reports',
        description: 'Equifax vs TransUnion',
        category: 'Credit Basics',
        duration: '3-step guide',
        type: 'guide',
        order: 2,
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Why Your Credit Score Matters',
        description: 'Learn what affects your score and what doesn\'t.',
        category: 'Credit Basics',
        duration: '1 min learning card',
        type: 'article',
        order: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: '4',
        title: 'Building Credit History',
        description: 'Start your credit journey right',
        category: 'Credit Basics',
        duration: '5 min',
        type: 'video',
        order: 4,
        createdAt: new Date().toISOString(),
      },
      {
        id: '5',
        title: 'Credit Utilization Explained',
        description: 'Keep your usage in check',
        category: 'Credit Basics',
        duration: '4 min watch',
        type: 'video',
        order: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: '6',
        title: 'Managing Multiple Credit Cards',
        description: 'Balance your credit portfolio',
        category: 'Intermediate',
        duration: '6 min read',
        type: 'article',
        order: 6,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Get recommended content for user
   */
  async getRecommendedContent(): Promise<LearningContent[]> {
    // TODO: Replace with actual API call
    // Could be personalized based on user progress
    
    return [
      {
        id: '7',
        title: 'Soft vs Hard Inquiries',
        description: 'Which ones hurt your score',
        category: 'Credit Basics',
        duration: '20 min watch',
        type: 'video',
        order: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: '8',
        title: 'What is a Credit Score?',
        description: 'Your financial reputation in three digits',
        category: 'Credit Basics',
        duration: '20 min watch',
        type: 'video',
        order: 2,
        createdAt: new Date().toISOString(),
      },
      {
        id: '9',
        title: 'How Payment History Impacts Your Score',
        description: 'Why paying on time matters most',
        category: 'Intermediate',
        duration: '2 min read',
        type: 'article',
        order: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: '10',
        title: 'Credit Card Rewards Programs',
        description: 'Maximize your benefits',
        category: 'Intermediate',
        duration: '8 min read',
        type: 'article',
        order: 4,
        createdAt: new Date().toISOString(),
      },
      {
        id: '11',
        title: 'Dealing with Debt Collectors',
        description: 'Know your rights and options',
        category: 'Advanced',
        duration: '15 min watch',
        type: 'video',
        order: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: '12',
        title: 'Credit Mix and Its Impact',
        description: 'Diversifying your credit profile',
        category: 'Intermediate',
        duration: '5 min read',
        type: 'article',
        order: 6,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Get beginner's checklist items
   */
  async getChecklist(_userId: string): Promise<ChecklistItem[]> {
    // TODO: Replace with actual API call that includes user progress
    
    return [
      {
        id: '1',
        title: 'Complete beginner\'s course',
        description: 'This is your core education module which would teach you all you need to know',
        icon: 'book',
        completed: false,
        actionUrl: '/learn/beginners-course',
        order: 1,
      },
      {
        id: '2',
        title: 'Let Creduman analyse your card',
        description: 'Allow Creduman to monitor your credit limit and advise accordingly',
        icon: 'card',
        completed: false,
        actionUrl: '/card-dashboard',
        order: 2,
      },
      {
        id: '3',
        title: 'Enable payment reminders',
        description: 'Never miss a due date and protect your score effortlessly.',
        icon: 'bell',
        completed: false,
        actionUrl: '/settings/notifications',
        order: 3,
      },
      {
        id: '4',
        title: 'Set usage alerts',
        description: 'Choose when Creduman warns you about high spending.',
        icon: 'bell',
        completed: false,
        actionUrl: '/settings/alerts',
        order: 4,
      },
      {
        id: '5',
        title: 'Share Your Success Story',
        description: 'Share your success story in 3 months from your first card and earn a bonus!',
        icon: 'award',
        completed: false,
        actionUrl: '/testimonials/share',
        order: 5,
      },
    ];
  }

  /**
   * Get testimonials
   */
  async getTestimonials(): Promise<Testimonial[]> {
    // TODO: Replace with actual API call
    
    return [
      {
        id: '1',
        name: 'Jane',
        title: 'Learn how Jane got a good credit limit after moving to Canada',
        description: 'Learn all you need to know about Credit in Canada with Creduman as their credit safety and learning assistant.',
        imageUrl: '/testimonial.svg',
        order: 1,
      },
      {
        id: '2',
        name: 'Michael',
        title: 'How Michael built his credit score from scratch',
        description: 'Discover Michael\'s journey building excellent credit in just 6 months using Creduman\'s guidance.',
        imageUrl: '/testimonial.svg',
        order: 2,
      },
      {
        id: '3',
        name: 'Sarah',
        title: 'Sarah\'s path to financial freedom',
        description: 'From newcomer to credit expert - Sarah shares her success story with Creduman.',
        imageUrl: '/testimonial.svg',
        order: 3,
      },
      {
        id: '4',
        name: 'David',
        title: 'David improved his score by 150 points',
        description: 'See how David transformed his credit with smart strategies and Creduman\'s tools.',
        imageUrl: '/testimonial.svg',
        order: 4,
      },
      {
        id: '5',
        name: 'Emily',
        title: 'Emily\'s credit building success in Canada',
        description: 'A newcomer\'s guide to establishing strong credit with Creduman\'s step-by-step help.',
        imageUrl: '/testimonial.svg',
        order: 5,
      },
    ];
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
