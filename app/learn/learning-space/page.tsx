/**
 * Learning Space Page
 * Interactive learning environment for credit education
 */

'use client';

import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';

export default function LearningSpacePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-brand mb-6">Learning Space</h1>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This page will contain:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Interactive learning modules organized by topics</li>
              <li>Progress tracking for each module</li>
              <li>Video lessons, quizzes, and interactive content</li>
              <li>Personalized learning paths based on user goals</li>
              <li>Certificate badges and achievements</li>
              <li>Recommended next steps</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
