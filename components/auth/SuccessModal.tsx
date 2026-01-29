'use client';

/**
 * Success Modal Component
 * Shows success message after signin/signup
 */

import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  redirectTo?: string;
  redirectDelay?: number;
}

export function SuccessModal({
  isOpen,
  onClose,
  title,
  message,
  redirectTo,
  redirectDelay = 2000,
}: SuccessModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen && redirectTo) {
      const timer = setTimeout(() => {
        router.push(redirectTo);
      }, redirectDelay);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, redirectTo, redirectDelay, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4 bg-background rounded-lg shadow-lg p-6 animate-in fade-in zoom-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>

          <h3 className="mb-2 text-2xl font-bold">{title}</h3>
          <p className="text-muted-foreground mb-4">{message}</p>

          {redirectTo && (
            <p className="text-sm text-muted-foreground">
              Redirecting you now...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
