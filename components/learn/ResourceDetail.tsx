/**
 * Resource Detail View
 * Shows individual resource with downloadable files
 */

'use client';

import { useState } from 'react';
import { ArrowLeft, Search, FileText } from 'lucide-react';
import type { Resource } from './ResourceCard';

interface ResourceFile {
  id: string;
  name: string;
  size: string;
  url: string;
  thumbnailUrl?: string;
}

interface ResourceDetailProps {
  resource: Resource;
  onBack: () => void;
}

// Sample files data - replace with actual data from your backend
const sampleFiles: ResourceFile[] = [
  {
    id: '1',
    name: 'Canadian Financial Laws. pdf',
    size: '12 mb',
    url: '#',
  },
  {
    id: '2',
    name: 'Canadian Financial Laws. pdf',
    size: '12 mb',
    url: '#',
  },
  {
    id: '3',
    name: 'Canadian Financial Laws. pdf',
    size: '12 mb',
    url: '#',
  },
  {
    id: '4',
    name: 'Canadian Financial Laws. pdf',
    size: '12 mb',
    url: '#',
  },
  {
    id: '5',
    name: 'Canadian Financial Laws. pdf',
    size: '12 mb',
    url: '#',
  },
  {
    id: '6',
    name: 'Canadian Financial Laws. pdf',
    size: '12 mb',
    url: '#',
  },
];

export function ResourceDetail({ resource, onBack }: ResourceDetailProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'newest'>('recommended');

  const filteredFiles = sampleFiles.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (file: ResourceFile) => {
    // Implement download logic
    window.open(file.url, '_blank');
  };

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-600 dark:text-indigo-500 mb-8">
          {resource.title}
        </h1>

        {/* Search and Sort */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search.."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 transition-shadow"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
            <button
              onClick={() => setSortBy('recommended')}
              className={`text-sm font-medium transition-colors ${
                sortBy === 'recommended'
                  ? 'text-indigo-600 dark:text-indigo-500 underline underline-offset-4'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-500'
              }`}
            >
              Recommended
            </button>
            <button
              onClick={() => setSortBy('newest')}
              className={`text-sm font-medium transition-colors ${
                sortBy === 'newest'
                  ? 'text-indigo-600 dark:text-indigo-500 underline underline-offset-4'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-500'
              }`}
            >
              Newest
            </button>
          </div>
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className="group rounded-2xl bg-gray-50 dark:bg-gray-900 overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            {/* Thumbnail with rounded corners */}
            <div className="p-6 pb-4">
              <div className="aspect-square bg-white dark:bg-gray-950 rounded-2xl flex items-center justify-center relative overflow-hidden mb-6 h-20">
                {file.thumbnailUrl ? (
                  <img
                    src={file.thumbnailUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.02)_25%,rgba(0,0,0,0.02)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.02)_75%)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_25%,rgba(255,255,255,0.02)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.02)_75%)] bg-[length:20px_20px]" />
                )}
              </div>

              {/* File Info */}
              <div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 leading-tight">
                  {file.name}
                </h3>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm">{file.size}</span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-700">|</span>
                  <button
                    onClick={() => handleDownload(file)}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-500 underline underline-offset-2 transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No files found matching your search.</p>
        </div>
      )}
    </div>
  );
}
