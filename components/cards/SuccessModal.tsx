/**
 * Success Modal
 * Shows completion message after card connection
 */

'use client';

import { Check } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewDashboard: () => void;
}

export function SuccessModal({ isOpen, onClose, onViewDashboard }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-950 rounded-2xl max-w-md w-full p-8 shadow-2xl text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <Check className="h-8 w-8 text-white" strokeWidth={3} />
          </div>
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Completed</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          All set, you can proceed to your dashboard
        </p>

        {/* Button */}
        <button
          onClick={onViewDashboard}
          className="w-full px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          View Dashboard
        </button>
      </div>
    </div>
  );
}
