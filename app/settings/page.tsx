/**
 * Settings Page
 * Application settings and preferences
 */

'use client';

import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Main Content */}
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-brand mb-6">Settings</h1>
          
          <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-white/10">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This page will contain:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
              <li>Theme preferences (light/dark/system)</li>
              <li>Email notification settings</li>
              <li>Push notification preferences</li>
              <li>Default dashboard selection (learn/cards)</li>
              <li>Privacy settings</li>
              <li>Data sharing preferences</li>
              <li>Connected services management</li>
              <li>Password change</li>
              <li>Two-factor authentication</li>
              <li>Delete account option</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
