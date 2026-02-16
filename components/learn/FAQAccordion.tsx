/**
 * FAQ Accordion Component
 * Displays frequently asked questions in an expandable accordion format
 */

'use client';

import { ChevronDown } from 'lucide-react';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faq: FAQItem;
  isExpanded: boolean;
  onClick: (id: string) => void;
}

export function FAQAccordion({ faq, isExpanded, onClick }: FAQAccordionProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-sm dark:border-gray-800 dark:bg-black">
      {/* Accordion Header */}
      <button
        onClick={() => onClick(faq.id)}
        className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50 md:px-5"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 flex-1">
          <ChevronDown
            className={`h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white md:text-base">
            {faq.question}
          </span>
        </div>
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-4 pb-5 pt-4 md:px-5 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 md:text-base pl-8">
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  );
}
