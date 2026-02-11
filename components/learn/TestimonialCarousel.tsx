/**
 * Testimonial Carousel Component
 * Displays testimonials with navigation controls
 */

'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
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

  const nextTestimonial = () => {
    setCurrentIndex((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1
    );
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl overflow-hidden">
      <div className="grid lg:grid-cols-2">
        {/* Content Side */}
        <div className="pl-2 pr-8 flex flex-col justify-between">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Testimonials
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-brand mb-6">
              {currentTestimonial.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {currentTestimonial.description}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <button 
              onClick={() => currentTestimonial.videoUrl && window.open(currentTestimonial.videoUrl, '_blank')}
              className="px-6 py-3 rounded-xl border-2 border-brand text-brand font-medium hover:bg-brand hover:text-white transition-colors"
            >
              Watch Now
            </button>

            {/* Carousel Controls */}
            <div className="flex items-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-brand w-8'
                      : 'bg-gray-300 dark:bg-gray-600 w-2'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
              <button
                onClick={nextTestimonial}
                className="ml-2 h-8 w-8 rounded-full bg-brand text-white hover:bg-[#5558E3] transition-colors flex items-center justify-center"
                aria-label="Next testimonial"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Image Side */}
        <div className="relative aspect-[4/3] lg:aspect-auto">
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
