'use client';

/**
 * Auth Carousel Component
 * Image/content carousel for auth pages
 */

import { useState, useEffect } from 'react';
import {
  CreditCard,
  GraduationCap,
  TrendingUp,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const slides = [
  {
    icon: GraduationCap,
    title: 'Learn at Your Own Pace',
    description:
      'Master credit fundamentals through interactive modules in English, French, or Arabic.',
  },
  {
    icon: CreditCard,
    title: 'Manage All Your Cards',
    description:
      'Connect and track all your credit cards in one secure dashboard with real-time insights.',
  },
  {
    icon: TrendingUp,
    title: 'AI-Powered Recommendations',
    description:
      'Get personalized suggestions to improve your credit score and save on interest.',
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description:
      'Your data is protected with enterprise-grade encryption and security measures.',
  },
];

export function AuthCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="flex flex-col items-center justify-center p-12 text-white">
      <div className="max-w-lg text-center">
        {/* Icon */}
        <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <CurrentIcon className="h-10 w-10" />
        </div>

        {/* Content */}
        <h2 className="mb-4 text-3xl font-bold">{slides[currentSlide].title}</h2>
        <p className="text-lg text-white/90 mb-8">
          {slides[currentSlide].description}
        </p>

        {/* Navigation */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={prevSlide}
            className="rounded-full p-2 hover:bg-white/20 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Dots */}
          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-white w-8'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="rounded-full p-2 hover:bg-white/20 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
