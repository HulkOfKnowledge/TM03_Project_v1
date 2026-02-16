/**
 * Related Lessons Section Component
 * Displays grouped related lessons by category
 * Reusable for both mobile and desktop layouts
 */

'use client';

import { RelatedLessonCard } from './RelatedLessonCard';
import type { RelatedLesson } from '@/types/learn.types';

interface RelatedLessonsSectionProps {
  lessons: RelatedLesson[];
  categories: string[];
}

export function RelatedLessonsSection({ lessons, categories }: RelatedLessonsSectionProps) {
  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryLessons = lessons.filter((lesson) => lesson.category === category);
        
        if (categoryLessons.length === 0) return null;
        
        return (
          <div key={category}>
            <h4 className="mb-3 text-base font-bold text-foreground">
              {category}
            </h4>
            <div className="space-y-3">
              {categoryLessons.map((lesson) => (
                <RelatedLessonCard
                  key={lesson.id}
                  id={lesson.id}
                  title={lesson.title}
                  duration={lesson.duration}
                  category={lesson.category}
                  thumbnailUrl={lesson.thumbnailUrl}
                  type={lesson.type}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
