/**
 * Video Layout Component
 * Displays video content with player, transcript, and notes
 */

'use client';

interface VideoLayoutProps {
  id: string;
  category: string;
  topic: string;
}

export function VideoLayout({ id, category, topic }: VideoLayoutProps) {
   return (
    <div className="space-y-6">
      <p> Video Layout: {id}, {category}, {topic}</p>
    </div>
  );
}
