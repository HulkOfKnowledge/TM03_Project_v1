/**
 * Credit Term Accordion Component
 * Displays credit term information in an expandable accordion format
 */

'use client';

import { ChevronDown, Info, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export interface CreditTerm {
  id: string;
  title: string;
  description: string;
  proTip?: {
    title: string;
    content: string;
  };
  lessonLink?: string;
}

interface CreditTermAccordionProps {
  term: CreditTerm;
  isExpanded: boolean;
  onClick: (id: string) => void;
}

export function CreditTermAccordion({ term, isExpanded, onClick }: CreditTermAccordionProps) {
  return (
    <div
      id={`accordion-${term.id}`}
      className="overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-sm"
    >
      {/* Accordion Header */}
      <button
        onClick={() => onClick(term.id)}
        className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-muted/50 md:px-5"
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            className={`h-5 w-5 text-muted-foreground transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
          <span className="text-sm font-medium text-foreground md:text-base">{term.title}</span>
        </div>
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="border-t border-border px-4 pb-5 pt-4 md:px-5">
          <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
            {term.description}
          </p>

          {term.lessonLink && (
            <Link
              href="/learn/learning-space"
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              Go to Lesson
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          {term.proTip && (
            <div className="mt-4 rounded-lg bg-brand/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="rounded-full bg-brand/10 p-1">
                  <Info className="h-4 w-4 text-brand" />
                </div>
                <span className="text-sm font-semibold text-brand md:text-base">{term.proTip.title}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {term.proTip.content}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
