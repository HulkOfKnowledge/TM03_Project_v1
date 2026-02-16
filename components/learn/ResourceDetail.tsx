/**
 * Resource Detail View
 * Shows individual resource with downloadable files
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, FileText } from 'lucide-react';
import { learnService } from '@/services/learn.service';
import { getContentUrl } from '@/lib/learn-navigation';
import type { LearningContent } from '@/types/learn.types';

interface ResourceCategory {
  id: string;
  title: string;
  type: 'document' | 'video';
  category: string;
}

interface ResourceDetailProps {
  category: ResourceCategory;
  onBack: () => void;
}

export function ResourceDetail({ category, onBack }: ResourceDetailProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recommended' | 'newest'>('recommended');
  const [resources, setResources] = useState<LearningContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, [category.id]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const allResources = await learnService.getResources();
      // Filter resources based on category
      const categoryResources = allResources.filter(
        resource => resource.category === category.category
      );
      setResources(categoryResources);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter((resource) =>
    resource.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleResourceClick = (resource: LearningContent) => {
    // Navigate to video or article layout based on type
    if (resource.type === 'video' || resource.type === 'article') {
      const url = getContentUrl(resource);
      router.push(url);
    }
  };

  const handleDownload = (resource: LearningContent) => {
    // Implement download logic - check if resource has downloadable content
    if (resource.videoUrl) {
      window.open(resource.videoUrl, '_blank');
    } else {
      console.log('No downloadable file available for:', resource.title);
    }
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
          {category.title}
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
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-[240px] rounded-2xl bg-gray-100 dark:bg-gray-900"></div>
            </div>
          ))
        ) : (
          filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="group rounded-2xl bg-gray-50 dark:bg-gray-900 overflow-hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
            >
              {/* Thumbnail with rounded corners */}
              <div className="p-6 pb-4">
                <div 
                  onClick={() => handleResourceClick(resource)}
                  className="aspect-square bg-white dark:bg-gray-950 rounded-2xl flex items-center justify-center relative overflow-hidden mb-6 h-20 cursor-pointer"
                >
                  {resource.thumbnailUrl ? (
                    <img
                      src={resource.thumbnailUrl}
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.02)_25%,rgba(0,0,0,0.02)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.02)_75%)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_25%,rgba(255,255,255,0.02)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.02)_75%)] bg-[length:20px_20px]" />
                  )}
                </div>

                {/* File Info */}
                <div>
                  <h3 
                    onClick={() => handleResourceClick(resource)}
                    className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4 leading-tight cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-500"
                  >
                    {resource.title}
                  </h3>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{resource.duration || resource.type}</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(resource);
                      }}
                      className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-500 underline underline-offset-2 transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Empty State */}
      {!loading && filteredResources.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery
              ? 'No resources found matching your search.'
              : 'No resources available in this category yet.'}
          </p>
        </div>
      )}
    </div>
  );
}
