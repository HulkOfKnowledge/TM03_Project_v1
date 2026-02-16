/**
 * Learn Dashboard Types
 * Types for learning content, testimonials, and checklist items
 */

export type LearningCategory = 'Credit Basics' | 'Intermediate' | 'Advanced';

export interface LearningContent {
  id: string;
  title: string;
  description: string;
  category: LearningCategory;
  duration: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  type: 'video' | 'article' | 'guide';
  order: number;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  icon: 'book' | 'card' | 'bell' | 'award';
  completed: boolean;
  actionUrl: string;
  order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  order: number;
}

export interface UserProgress {
  userId: string;
  completedContent: string[];
  checklistProgress: {
    itemId: string;
    completed: boolean;
    completedAt?: string;
  }[];
  lastAccessedAt: string;
}

export interface VideoChapter {
  id: string;
  number: string;
  title: string;
  duration: string;
  timestamp: number;
}

export interface RelatedLesson {
  id: string;
  title: string;
  duration: string;
  category: string;
  thumbnailUrl?: string;
  type?: 'video' | 'article' | 'guide';
}
