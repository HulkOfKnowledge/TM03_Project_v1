/**
 * Learning Carousel Component
 * Reusable carousel for learning content with navigation
 */

'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LearningCard, LearningCardSkeleton } from './LearningCard';
import type { LearningContent } from '@/types/learn.types';

interface LearningCarouselProps {
  items: LearningContent[];
  itemsPerPage?: number;
  onItemClick?: (item: LearningContent) => void;
  isLoading?: boolean;
  skeletonCount?: number;
}

export function LearningCarousel({
  items,
  itemsPerPage = 3,
  onItemClick,
  isLoading = false,
  skeletonCount = 3,
}: LearningCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const slideBy = 1;
  const scrollRef = useRef<HTMLDivElement>(null);
  const CARD_WIDTH = 280;
  const GAP = 16;
  const ITEM_WIDTH = CARD_WIDTH + GAP;

  const loopItems = useMemo(() => {
    if (!items.length) return [] as LearningContent[];
    return [...items, ...items, ...items];
  }, [items]);

  const displayedItems = useMemo(() => {
    if (!items.length) return [] as LearningContent[];
    const count = Math.min(itemsPerPage, items.length);
    return Array.from({ length: count }, (_, index) => items[(currentPage + index) % items.length]);
  }, [items, itemsPerPage, currentPage]);

  const nextPage = () => {
    if (!items.length) return;
    setCurrentPage((prev) => (prev + slideBy) % items.length);
  };

  const prevPage = () => {
    if (!items.length) return;
    setCurrentPage((prev) => (prev - slideBy + items.length) % items.length);
  };

  const scrollMobile = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = ITEM_WIDTH;
      const newScrollLeft = direction === 'right'
        ? scrollRef.current.scrollLeft + scrollAmount
        : scrollRef.current.scrollLeft - scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (!scrollRef.current || !items.length) return;
    scrollRef.current.scrollLeft = items.length * ITEM_WIDTH;
  }, [items.length]);

  const handleMobileScroll = () => {
    if (!scrollRef.current || !items.length) return;
    const totalWidth = items.length * ITEM_WIDTH;
    const current = scrollRef.current.scrollLeft;

    if (current < totalWidth * 0.5) {
      scrollRef.current.scrollLeft = current + totalWidth;
    } else if (current > totalWidth * 1.5) {
      scrollRef.current.scrollLeft = current - totalWidth;
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="md:hidden">
          <div className="overflow-x-auto -mx-4 px-4 mb-8 scrollbar-hide">
            <div className="flex gap-4 pb-2">
              {Array.from({ length: skeletonCount }).map((_, index) => (
                <div key={index} className="flex-shrink-0 w-[280px]">
                  <LearningCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <LearningCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden">
        <div
          ref={scrollRef}
          onScroll={handleMobileScroll}
          className="overflow-x-auto -mx-4 px-4 mb-8 scrollbar-hide"
        >
          <div className="flex gap-4 pb-2">
            {loopItems.map((content, index) => (
              <div key={`${content.id}-${index}`} className="flex-shrink-0 w-[280px]">
                <LearningCard
                  content={content}
                  onClick={() => onItemClick?.(content)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Navigation */}
        {items.length > 1 && (
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={() => scrollMobile('left')}
              className="h-12 w-12 rounded-full bg-brand text-white hover:bg-[#5558E3] transition-colors flex items-center justify-center"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollMobile('right')}
              className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-800 text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Desktop: Grid with pagination */}
      <div className="hidden md:block">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {displayedItems.map((content) => (
            <LearningCard
              key={content.id}
              content={content}
              onClick={() => onItemClick?.(content)}
            />
          ))}
        </div>

        {/* Desktop Navigation */}
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
    </div>
  );
}
