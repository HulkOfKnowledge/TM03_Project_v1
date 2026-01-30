'use client';

/**
 * Email Confirmation Modal
 * Full-screen modal overlay shown across all pages when user's email is not confirmed
 * Blurs background content and prevents interaction until email is confirmed
 */

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function EmailConfirmationModal() {
  const [show, setShow] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const checkEmailConfirmation = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setShow(false);
        return;
      }

      // Check if email is confirmed
      const emailConfirmed = user.email_confirmed_at !== null;
      
      setShow(!emailConfirmed);
      setUserEmail(user.email || '');
    };

    checkEmailConfirmation();

    // Set up real-time listener for auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const user = session?.user;
          if (user) {
            const emailConfirmed = user.email_confirmed_at !== null;
            setShow(!emailConfirmed);
            setUserEmail(user.email || '');
          }
        } else if (event === 'SIGNED_OUT') {
          setShow(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendMessage('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) throw error;

      setResendMessage('Confirmation email sent! Check your inbox.');
    } catch (error) {
      setResendMessage('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verify Your Email
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              We sent a confirmation link to
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {userEmail}
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Please check your inbox and click the confirmation link to continue.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
              <p className="font-medium text-gray-900 dark:text-white">
                What to do:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Check your email inbox</li>
                <li>Look for an email from Creduman</li>
                <li>Click the confirmation link</li>
                <li>Return to this page - it will update automatically</li>
              </ol>
            </div>
          </div>

          {/* Resend Message */}
          {resendMessage && (
            <div className={`text-center text-sm ${
              resendMessage.includes('✓') 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {resendMessage}
            </div>
          )}

          {/* Resend Button */}
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resend Confirmation Email
              </>
            )}
          </Button>

          {/* Help Text */}
          <p className="text-xs text-center text-gray-500 dark:text-gray-500">
            Didn&apos;t receive the email? Check your spam folder or click resend.
          </p>
        </div>
      </div>
    </div>
  );
}
