/**
 * Learn Navigation Utilities
 * Shared utilities for navigating to learning content pages
 */

import type { LearningContent } from '@/types/learn.types';

/**
 * Generate URL for learning content
 * @param content - Learning content object
 * @returns URL string in format: /learn/[category]/[topic]/[type]/[id]
 */
export function getContentUrl(content: LearningContent): string {
  // Create a slug from the title for the topic parameter
  const topicSlug = content.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Normalize category to lowercase (beginner, intermediate, advanced)
  const categorySlug = content.category.toLowerCase();
  
  // Get content type (default to 'video' if not specified)
  const contentType = content.type || 'video';
  
  // Construct the URL: /learn/[category]/[topic]/[type]/[id]
  return `/learn/${categorySlug}/${topicSlug}/${contentType}/${content.id}`;
}

/**
 * Create a navigation handler for learning content
 * @param router - Next.js router instance
 * @param onBeforeNavigate - Optional callback before navigation (e.g., for tracking)
 * @returns Navigation handler function
 */
export function createContentNavigationHandler(
  router: { push: (url: string) => void },
  onBeforeNavigate?: (content: LearningContent) => Promise<void> | void
) {
  return async (content: LearningContent) => {
    // Call optional pre-navigation callback
    if (onBeforeNavigate) {
      await onBeforeNavigate(content);
    }
    
    // Get the URL and navigate
    const url = getContentUrl(content);
    router.push(url);
  };
}
