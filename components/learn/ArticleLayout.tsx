/**
 * Article Layout Component
 * Displays article content with rich text, images, and related articles
 */

'use client';

interface ArticleLayoutProps {
  id: string;
  category: string;
  topic: string;
}

export function ArticleLayout({ id, category, topic }: ArticleLayoutProps) {
  return (
    <div className="space-y-6">
      <p> Article Layout: {id}, {category}, {topic}</p>
    </div>
  );
}
