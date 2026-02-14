/**
 * Dynamic Learning Content Page
 * Displays individual learning content (videos, articles, resources, quizzes, results)
 * Route: /learn/[category]/[topic]/[type]/[id]
 * 
 * @param category - Difficulty level: beginner, intermediate, advanced
 * @param topic - Learning topic (e.g., credit-basics, budgeting)
 * @param type - Content type: video, article, quiz, resource, result
 * @param id - Unique content identifier
 */

'use client';

import { useParams } from 'next/navigation';
import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';
import { VideoLayout } from '@/components/learn/VideoLayout';
import { ArticleLayout } from '@/components/learn/ArticleLayout';
import { QuizLayout } from '@/components/learn/QuizLayout';
import { ResourceLayout } from '@/components/learn/ResourceLayout';
import { ResultLayout } from '@/components/learn/ResultLayout';

export default function LearnContentPage() {
  const params = useParams();
  const { category, topic, type, id } = params;

  // Normalize values to strings
  const categoryStr = Array.isArray(category) ? category[0] : category;
  const topicStr = Array.isArray(topic) ? topic[0] : topic;
  const typeStr = Array.isArray(type) ? type[0] : type;
  const idStr = Array.isArray(id) ? id[0] : id;

  // Render the appropriate layout based on type
  const renderContent = () => {
    switch (typeStr) {
      case 'video':
        return <VideoLayout id={idStr} category={categoryStr} topic={topicStr} />;
      case 'article':
        return <ArticleLayout id={idStr} category={categoryStr} topic={topicStr} />;
      case 'quiz':
        return <QuizLayout id={idStr} category={categoryStr} topic={topicStr} />;
      case 'resource':
        return <ResourceLayout id={idStr} category={categoryStr} topic={topicStr} />;
      case 'result':
        return <ResultLayout id={idStr} category={categoryStr} topic={topicStr} />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              Unknown content type: {typeStr}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-black">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-1">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
