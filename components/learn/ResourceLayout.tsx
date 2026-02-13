/**
 * Resource Layout Component
 * Displays downloadable resources, tools, and templates
 */

'use client';

interface ResourceLayoutProps {
  id: string;
  category: string;
  topic: string;
}

export function ResourceLayout({ id, category, topic }: ResourceLayoutProps) {
   return (
    <div className="space-y-6">
      <p> Resource Layout: {id}, {category}, {topic}</p>
    </div>
  );
}
