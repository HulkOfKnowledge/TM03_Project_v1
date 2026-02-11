/**
 * Dynamic Learning Content Page
 * Displays individual learning content (videos, articles, resources, quizzes, results)
 * Route: /learn/[topic]/[contentType]/[id]
 */

'use client';

import { useParams } from 'next/navigation';
import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';

export default function LearnContentPage() {
  const params = useParams();
  const { topic, contentType, id } = params;

  // Normalize content type for display
  const getContentTypeLabel = (type: string | string[]) => {
    const typeStr = Array.isArray(type) ? type[0] : type;
    const labels: Record<string, string> = {
      video: 'Video Lesson',
      resource: 'Resource',
      article: 'Article',
      quiz: 'Quiz',
      result: 'Quiz Result',
    };
    return labels[typeStr] || typeStr;
  };

  // Normalize topic for display
  const getTopicLabel = (topic: string | string[]) => {
    const topicStr = Array.isArray(topic) ? topic[0] : topic;
    return topicStr
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Learn / {getTopicLabel(topic)} / {getContentTypeLabel(contentType)}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-brand mb-6">
            {getContentTypeLabel(contentType)}: {id}
          </h1>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10">
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                <strong>Topic:</strong> {getTopicLabel(topic)}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                <strong>Content Type:</strong> {getContentTypeLabel(contentType)}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                <strong>Content ID:</strong> {id}
              </p>
            </div>

            <div className="border-t border-gray-200 dark:border-white/10 pt-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This page will render different content based on the type:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                <li><strong>Video:</strong> Video player, transcript, notes, related content</li>
                <li><strong>Article:</strong> Full article text, images, related articles</li>
                <li><strong>Resource:</strong> Downloadable resources, previews, related tools</li>
                <li><strong>Quiz:</strong> Interactive quiz interface, progress tracking</li>
                <li><strong>Result:</strong> Quiz results, score breakdown, recommendations</li>
              </ul>
            </div>

            <div className="mt-8 p-6 bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-white/10">
              <h3 className="text-lg font-semibold mb-4">Additional Features:</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                <li>Progress tracking and completion status</li>
                <li>Bookmark/save for later functionality</li>
                <li>Share content functionality</li>
                <li>Comments and discussion section</li>
                <li>Related content suggestions</li>
                <li>Next/Previous content navigation</li>
                <li>Estimated time to complete</li>
                <li>Difficulty level indicator</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
