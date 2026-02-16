/**
 * Lesson Preview Card Component
 * Reusable two-column layout for lesson previews
 * Used in both VideoLayout and QuizContent for consistency
 */

'use client';

import { ReactNode } from 'react';
import { Play } from 'lucide-react';
import Image from 'next/image';

interface LessonPreviewCardProps {
  lessonNumber: string;
  lessonTitle: string;
  subtitle?: string;
  leftAction?: ReactNode;
  leftVariant?: 'video' | 'quiz';
  rightContent?: 'placeholder' | 'image';
  rightImageUrl?: string;
  rightImageAlt?: string;
}

export function LessonPreviewCard({
  lessonNumber,
  lessonTitle,
  subtitle = 'Understanding Credit Without Fear',
  leftAction,
  leftVariant = 'video',
  rightContent = 'placeholder',
  rightImageUrl,
  rightImageAlt = 'Lesson preview',
}: LessonPreviewCardProps) {
  return (
    <div className="grid items-stretch gap-5 md:grid-cols-2 lg:h-[420px] lg:grid-cols-[30%_70%]">
      {/* Left Column - Lesson Info Card */}
      <div className="min-h-[280px] md:h-full">
        <div className={`group relative h-full min-h-[280px] transform overflow-hidden rounded-2xl ${
          leftVariant === 'video' ? 'bg-brand' : 'bg-gray-300'
        }`}>
          <div className={`flex h-full flex-col justify-end p-6 md:p-8 ${
            leftVariant === 'video' ? 'text-white' : 'text-foreground'
          }`}>
            <div>
              <p className={`mb-2 text-xs tracking-wide md:text-sm ${
                leftVariant === 'video' 
                  ? 'uppercase opacity-90' 
                  : 'text-foreground/60'
              }`}>
                {leftVariant === 'video' ? lessonNumber : subtitle}
              </p>
              <h2 className="mb-8 pr-4 text-xl leading-tight md:text-2xl lg:text-3xl">
                {leftVariant === 'video' 
                  ? lessonTitle 
                  : `Test Your Knowledge Level For ${lessonNumber}`}
              </h2>
            </div>
            {leftAction}
          </div>
        </div>
      </div>

      {/* Right Column - Preview/Placeholder */}
      <div className="relative min-h-[200px] overflow-hidden rounded-2xl bg-muted md:h-full md:min-h-[280px]">
        {rightContent === 'image' && rightImageUrl ? (
          <Image
            src={rightImageUrl}
            alt={rightImageAlt}
            fill
            className="object-cover"
          />
        ) : (
          // Default placeholder
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-8 text-center opacity-20">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-brand/10" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
