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

  const totalPages = useMemo(() => {
    if (!items.length) return 1;
    return Math.ceil(items.length / itemsPerPage);
  }, [items.length, itemsPerPage]);

  const pagedItems = useMemo(() => {
    if (!items.length) return [] as LearningContent[][];
    const pages: LearningContent[][] = [];
    for (let i = 0; i < items.length; i += itemsPerPage) {
      pages.push(items.slice(i, i + itemsPerPage));
    }
    return pages;
  }, [items, itemsPerPage]);



  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(0);
    }
  }, [currentPage, totalPages]);

  const nextPage = () => {
    if (!items.length || currentPage >= totalPages - 1) return;
    setCurrentPage((prev) => prev + slideBy);
  };

  const prevPage = () => {
    if (!items.length || currentPage <= 0) return;
    setCurrentPage((prev) => prev - slideBy);
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

  const [mobileScrollState, setMobileScrollState] = useState({ canScrollLeft: false, canScrollRight: true });

  const updateMobileScrollState = () => {
    if (!scrollRef.current) return;
    const maxScroll = scrollRef.current.scrollWidth - scrollRef.current.clientWidth;
    setMobileScrollState({
      canScrollLeft: scrollRef.current.scrollLeft > 0,
      canScrollRight: scrollRef.current.scrollLeft < maxScroll - 10
    });
  };

  useEffect(() => {
    updateMobileScrollState();
  }, [items]);

  if (isLoading) {
    return (
      <div>
        <div className="md:hidden">
          <div className="overflow-x-auto -mx-4 px-4 mb-8 scrollbar-hide">
            <div className="flex gap-4 pb-2">
              {Array.from({ length: skeletonCount }).map((_, index) => (
                <div key={index} className="w-[280px] flex-shrink-0">
                  <LearningCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
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
          onScroll={updateMobileScrollState}
          className="overflow-x-auto -mx-4 px-4 mb-8 scrollbar-hide scroll-smooth snap-x snap-mandatory"
        >
          <div className="flex gap-4 pb-2">
            {items.map((content) => (
              <div key={content.id} className="w-[280px] flex-shrink-0 snap-start">
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
              disabled={!mobileScrollState.canScrollLeft}
              className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-800 text-white hover:bg-brand transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-300 dark:disabled:hover:bg-gray-800"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollMobile('right')}
              disabled={!mobileScrollState.canScrollRight}
              className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-800 text-white hover:bg-brand dark:hover:bg-brand transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-300 dark:disabled:hover:bg-gray-800"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Desktop: Grid with pagination */}
      <div className="hidden md:block">
        <div className="relative overflow-hidden mb-8">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${currentPage * 100}%)` }}
          >
            {pagedItems.map((page, pageIndex) => (
              <div
                key={`page-${pageIndex}`}
                className="grid min-w-full grid-cols-1 gap-6 md:grid-cols-3"
              >
                {page.map((content) => (
                  <LearningCard
                    key={content.id}
                    content={content}
                    onClick={() => onItemClick?.(content)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Navigation */}
        {items.length > itemsPerPage && (
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={prevPage}
              disabled={currentPage <= 0}
              className="h-14 w-14 rounded-full bg-gray-300 dark:bg-gray-800 text-white hover:bg-brand dark:hover:bg-brand transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-300 dark:disabled:hover:bg-gray-800"
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages - 1}
              className="h-14 w-14 rounded-full bg-gray-300 dark:bg-gray-800 text-white hover:bg-brand dark:hover:bg-brand transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-300 dark:disabled:hover:bg-gray-800"
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
