/**
 * Video Layout Constants
 * Sample data and mock content for video lessons
 * TODO: Replace with actual API calls to learnService
 */

import type { VideoChapter, RelatedLesson } from '@/types/learn.types';

// Sample lesson data structure
export const getSampleLessonData = (id: string, topic: string) => ({
  number: `Lesson ${id}`,
  title: topic,
  description: `Lesson one introduces users to the Canadian credit system in the simplest, calmest way possible. They learn what credit is, why it matters, and how their credit card affects everything. The content focuses on clarity: no stress, no deep theory, just the basics that every newcomer needs to stop feeling lost.

They'll understand how limits, balances, and credit utilization work, why 30% usage matters, and what a "danger zone" really means. You also teach them how Creduman will protect them by tracking their card, warning them before they get into trouble, and showing them the safe way to use their credit card from day one.

By the end of week one, they walk away with a strong, simple foundation: what credit is, how their card impacts their future, and how Creduman keeps them safe so they can build credit confidently.`,
  thumbnailUrl: '/lesson-thumbnail.jpg',
  videoUrl: '/videos/lesson-1.mp4',
  duration: '12:45',
  learningPoints: [
    {
      text: 'A simple explanation of how the system works and why newcomers start with no credit file.',
    },
    {
      text: 'How limits, balances, and spending behavior shape your credit growth.',
    },
    {
      text: 'What a credit limit actually is, how to check it, and how it affects your risk level.',
    },
    {
      text: 'Why staying under 30% is the safest way to grow your credit score.',
    },
    {
      text: 'What triggers red flags: high usage, near-limit spending, missed payments.',
    },
    {
      text: 'How the app tracks your card, warns you early, and keeps you from making costly mistakes.',
    },
  ],
});

// Video chapters/sections
export const sampleVideoChapters: VideoChapter[] = [
  {
    id: '1',
    number: '1',
    title: 'Intro',
    duration: '2:17',
    timestamp: 0,
  },
  {
    id: '2',
    number: '2',
    title: 'What you need to know',
    duration: '5:17',
    timestamp: 137,
  },
  {
    id: '3',
    number: '3',
    title: 'Short Demo',
    duration: '11:00',
    timestamp: 317,
  },
  {
    id: '4',
    number: '4',
    title: 'Topic Explained',
    duration: '15:46',
    timestamp: 660,
  },
  {
    id: '5',
    number: '5',
    title: 'Conclusion',
    duration: '19:20',
    timestamp: 946,
  },
];

// Related lessons for sidebar
export const sampleRelatedLessons: RelatedLesson[] = [
  {
    id: '1',
    title: 'Understanding Credit Without Fear',
    duration: '24 mins',
    category: 'First 3 months',
  },
  {
    id: '2',
    title: 'Overview of Canadian credit',
    duration: '24 mins',
    category: 'First 3 months',
  },
  {
    id: '3',
    title: 'Credit score vs history',
    duration: '24 mins',
    category: 'First 3 months',
  },
  {
    id: '4',
    title: "Do's and don'ts",
    duration: '24 mins',
    category: 'First 3 months',
  },
  {
    id: '5',
    title: 'Types of credit cards',
    duration: '24 mins',
    category: 'First 3 months',
  },
  {
    id: '6',
    title: 'Building credit history',
    duration: '24 mins',
    category: 'Next: 4 - 6 Months',
  },
  {
    id: '7',
    title: 'Store vs Financial credits',
    duration: '24 mins',
    category: 'Next: 4 - 6 Months',
  },
];

// Sample quiz questions
export const sampleQuizQuestions = [
  {
    id: 'q1',
    question: 'What is the recommended credit utilization ratio to maintain a healthy credit score?',
    options: [
      'Under 10%',
      'Under 30%',
      'Under 50%',
      'Under 70%',
    ],
    correctAnswer: 1,
    explanation: 'Keeping your credit utilization under 30% is recommended as it shows lenders you can manage credit responsibly without maxing out your cards.',
  },
  {
    id: 'q2',
    question: 'Why do newcomers to Canada start with no credit file?',
    options: [
      'They have bad credit from their home country',
      'Canadian credit bureaus don\'t track international credit history',
      'They need to apply for citizenship first',
      'It\'s a requirement by law',
    ],
    correctAnswer: 1,
    explanation: 'Canadian credit bureaus (Equifax and TransUnion) only track credit activity within Canada, so newcomers start fresh regardless of their credit history in other countries.',
  },
  {
    id: 'q3',
    question: 'What is a credit limit?',
    options: [
      'The minimum amount you must spend each month',
      'The maximum amount you can borrow on your credit card',
      'The total amount of debt you owe',
      'The fee charged for using your credit card',
    ],
    correctAnswer: 1,
    explanation: 'A credit limit is the maximum amount of money a lender allows you to borrow on your credit card. It\'s important to stay well below this limit to maintain good credit health.',
  },
  {
    id: 'q4',
    question: 'Which of the following triggers red flags with credit bureaus?',
    options: [
      'Paying your balance in full each month',
      'Keeping utilization under 30%',
      'Near-limit spending and high utilization',
      'Having multiple credit cards',
    ],
    correctAnswer: 2,
    explanation: 'High credit utilization, especially near your credit limit, signals financial stress to lenders and can negatively impact your credit score. Missed payments also trigger major red flags.',
  },
  {
    id: 'q5',
    question: 'How does Creduman help protect your credit score?',
    options: [
      'By automatically paying your bills',
      'By tracking your card and warning you before you get into trouble',
      'By increasing your credit limit',
      'By removing negative marks from your credit report',
    ],
    correctAnswer: 1,
    explanation: 'Creduman monitors your credit card usage in real-time and sends alerts when you\'re approaching dangerous utilization levels or patterns that could harm your credit score, helping you make better decisions.',
  },
];

// Helper to group related lessons by category
export const groupLessonsByCategory = (lessons: RelatedLesson[]) => {
  return lessons.reduce((acc, lesson) => {
    if (!acc[lesson.category]) {
      acc[lesson.category] = [];
    }
    acc[lesson.category].push(lesson);
    return acc;
  }, {} as Record<string, RelatedLesson[]>);
};
