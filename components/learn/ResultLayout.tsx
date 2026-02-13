/**
 * Result Layout Component
 * Displays quiz results with score breakdown and recommendations
 */

'use client';

interface ResultLayoutProps {
  id: string;
  category: string;
  topic: string;
}

export function ResultLayout({ id, category, topic }: ResultLayoutProps) {
   return (
    <div className="space-y-6">
      <p> Result Layout: {id}, {category}, {topic}</p>
    </div>
  );
}
