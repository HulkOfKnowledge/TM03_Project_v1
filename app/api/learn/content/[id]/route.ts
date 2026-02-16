/**
 * API Route: GET /api/learn/content/[id]
 * Returns detailed learning content including chapters, transcript, and resources
 */

import { NextResponse } from 'next/server';
import { createSuccessResponse } from '@/types/api.types';
import type { VideoChapter, TranscriptEntry, ResourceItem, RelatedLesson } from '@/types/learn.types';

// Sample data - Replace with database queries in production
const getVideoChapters = (contentId: string): VideoChapter[] => {
  // Default chapters for demo purposes (timestamps for a ~8 minute video)
  return [
    {
      id: `${contentId}-ch1`,
      number: '1',
      title: 'Introduction',
      duration: '1:30',
      timestamp: 0,
    },
    {
      id: `${contentId}-ch2`,
      number: '2',
      title: 'Key Concepts',
      duration: '2:15',
      timestamp: 90,
    },
    {
      id: `${contentId}-ch3`,
      number: '3',
      title: 'Practical Examples',
      duration: '2:45',
      timestamp: 225,
    },
    {
      id: `${contentId}-ch4`,
      number: '4',
      title: 'In-Depth Explanation',
      duration: '1:30',
      timestamp: 390,
    },
    {
      id: `${contentId}-ch5`,
      number: '5',
      title: 'Summary & Next Steps',
      duration: '1:00',
      timestamp: 480,
    },
  ];
};

const getTranscript = (_contentId: string): TranscriptEntry[] => {
  // Sample transcript
  return [
    {
      timestamp: '0:00',
      content: 'Welcome to this lesson on credit fundamentals. Today we\'ll explore the core concepts that every credit user should understand.',
    },
    {
      timestamp: '0:45',
      content: 'Credit is essentially borrowed money that you promise to pay back. Understanding how it works is crucial for your financial health.',
    },
    {
      timestamp: '1:30',
      content: 'Your credit score is a three-digit number that represents your creditworthiness to lenders. It typically ranges from 300 to 900 in Canada.',
    },
    {
      timestamp: '2:15',
      content: 'The most important factor in your credit score is your payment history. Making payments on time accounts for about 35% of your score.',
    },
    {
      timestamp: '3:00',
      content: 'Credit utilization is another key factor. This is the ratio of your credit card balances to your credit limits. Keeping it below 30% is ideal.',
    },
    {
      timestamp: '4:00',
      content: 'Let\'s look at some practical examples of how these concepts apply in real-world situations.',
    },
  ];
};

const getResources = (contentId: string): ResourceItem[] => {
  // Sample resources - linking to actual article content from the dashboard
  // These IDs correspond to articles in the learningPath, not recommended content
  return [
    {
      id: `${contentId}-res1`,
      title: 'Understanding Credit Reports',
      size: '245 KB',
      type: 'pdf',
      url: '/resources/credit-reports.pdf',
      articleId: '2', // Links to "Understanding Credit Reports" article
    },
    {
      id: `${contentId}-res2`,
      title: 'Why Your Credit Score Matters',
      size: '180 KB',
      type: 'doc',
      url: '/resources/credit-score.docx',
      articleId: '3', // Links to "Why Your Credit Score Matters" article
    },
    {
      id: `${contentId}-res3`,
      title: 'Managing Multiple Credit Cards',
      size: '320 KB',
      type: 'pdf',
      url: '/resources/multiple-cards.pdf',
      articleId: '6', // Links to "Managing Multiple Credit Cards" article
    },
    {
      id: `${contentId}-res4`,
      title: 'Credit Card Interest Rates Guide',
      size: '1.2 MB',
      type: 'slide',
      url: '/resources/interest-rates-slides.pptx',
      articleId: '7', // Links to "Credit Card Interest Rates 101" article
    },
  ];
};

const getRelatedContent = (_contentId: string): RelatedLesson[] => {
  // Sample related content matching the new category structure
  return [
    {
      id: '17',
      title: 'Understanding Credit Without Fear',
      duration: '12 min',
      category: 'First 1-3 Months',
      type: 'video',
      thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
    },
    {
      id: '18',
      title: 'Overview of Canadian Credit',
      duration: '15 min',
      category: 'First 1-3 Months',
      type: 'video',
      thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
    },
    {
      id: '19',
      title: 'How Payment History Impacts Your Score',
      duration: '8 min',
      category: 'First 1-3 Months',
      type: 'video',
      thumbnailUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
    },
    {
      id: '21',
      title: 'Building Credit History',
      duration: '14 min',
      category: 'Next 4-6 Months',
      type: 'video',
      thumbnailUrl: 'https://images.unsplash.com/photo-1450101215322-bf5cd27642fc?w=800&q=80',
    },
    {
      id: '22',
      title: 'Store vs Financial Credits',
      duration: '11 min',
      category: 'Next 4-6 Months',
      type: 'video',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    },
    {
      id: '25',
      title: 'Credit Limit Optimization',
      duration: '12 min',
      category: '7+ Months',
      type: 'video',
      thumbnailUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
    },
  ];
};

const getLearningPoints = (_contentId: string): string[] => {
  return [
    'A simple explanation of how the credit system works and why newcomers start with no credit file',
    'How limits, balances, and spending behavior shape your credit growth',
    'What a credit limit actually is, how to check it, and how it affects your risk level',
    'Why staying under 30% utilization is the safest way to grow your credit score',
    'What triggers red flags: high usage, near-limit spending, and missed payments',
    'How to track your progress and avoid costly mistakes',
  ];
};

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // In production, fetch this from your database
    // For now, we'll return structured sample data
    const contentDetails = {
      chapters: getVideoChapters(id),
      transcript: getTranscript(id),
      resources: getResources(id),
      relatedContent: getRelatedContent(id),
      learningPoints: getLearningPoints(id),
    };

    return NextResponse.json(createSuccessResponse(contentDetails));
  } catch (error) {
    console.error('Error fetching content details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load content details' },
      { status: 500 }
    );
  }
}
