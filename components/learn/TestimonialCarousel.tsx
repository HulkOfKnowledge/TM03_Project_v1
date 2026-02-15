/**
 * Testimonial Carousel Component
 * Displays testimonials with navigation controls
 */

'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { Testimonial } from '@/types/learn.types';

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

export function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  const currentTestimonial = testimonials[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === testimonials.length - 1;

  const nextTestimonial = () => {
    setCurrentIndex((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="bg-[#FAFAFA] dark:bg-[#1A1A1A] rounded-2xl overflow-hidden md:rounded-3xl">
      <div className="grid lg:grid-cols-2">
        {/* Content Side */}
        <div className="p-6 flex flex-col justify-between">
          <div>
            <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-3">
              Testimonials
            </div>
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-brand mb-4 md:mb-6">
              {currentTestimonial.title}
            </h3>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6 md:mb-8">
              {currentTestimonial.description}
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <button 
              onClick={() => currentTestimonial.videoUrl && window.open(currentTestimonial.videoUrl, '_blank')}
              className="w-full md:w-auto px-6 py-3 rounded-xl border-2 border-brand text-brand font-medium hover:bg-brand hover:text-white transition-colors text-sm md:text-base"
            >
              Watch Now
            </button>

            {/* Carousel Controls */}
            <div className="flex items-center justify-center gap-2 md:justify-start">
              {/* Previous Arrow */}
              <button
                onClick={prevTestimonial}
                disabled={isFirst}
                className={`h-8 w-8 rounded-full transition-colors flex items-center justify-center ${
                  isFirst
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-brand hover:text-white'
                }`}
                aria-label="Previous testimonial"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Dots */}
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-brand w-8'
                      : 'bg-gray-300 dark:bg-gray-600 w-2 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}

              {/* Next Arrow */}
              <button
                onClick={nextTestimonial}
                disabled={isLast}
                className={`h-8 w-8 rounded-full transition-colors flex items-center justify-center ${
                  isLast
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-brand hover:text-white'
                }`}
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Image Side */}
        <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[400px]">
          {currentTestimonial.imageUrl ? (
            <img
              src={currentTestimonial.imageUrl}
              alt={currentTestimonial.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900" />
          )}
        </div>
      </div>
    </div>
  );
}
