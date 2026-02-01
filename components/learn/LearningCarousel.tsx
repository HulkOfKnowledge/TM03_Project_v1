/**
 * Learning Carousel Component
 * Reusable carousel for learning content with navigation
 */

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LearningCard } from './LearningCard';
import type { LearningContent } from '@/types/learn.types';

interface LearningCarouselProps {
  items: LearningContent[];
  itemsPerPage?: number;
  onItemClick?: (item: LearningContent) => void;
}

export function LearningCarousel({ 
  items, 
  itemsPerPage = 3, 
  onItemClick 
}: LearningCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const slideBy = 1;

  const displayedItems = items.slice(
    currentPage,
    currentPage + itemsPerPage
  );

  const nextPage = () => {
    setCurrentPage((prev) =>
      prev + slideBy >= items.length - itemsPerPage + 1 
        ? 0 
        : prev + slideBy
    );
  };

  const prevPage = () => {
    setCurrentPage((prev) =>
      prev === 0 
        ? items.length - itemsPerPage 
        : prev - slideBy
    );
  };

  return (
    <div>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {displayedItems.map((content) => (
          <LearningCard
            key={content.id}
            content={content}
            onClick={() => onItemClick?.(content)}
          />
        ))}
      </div>

      {/* Carousel Navigation */}
      {items.length > itemsPerPage && (
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={prevPage}
            className="h-14 w-14 rounded-full bg-brand text-white hover:bg-[#5558E3] transition-colors flex items-center justify-center"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextPage}
            className="h-14 w-14 rounded-full bg-gray-300 dark:bg-gray-800 text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}
