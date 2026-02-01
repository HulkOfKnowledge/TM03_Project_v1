/**
 * Auth Layout Component
 * Two-section layout: Left image, Right form
 * Supports light/dark mode
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {

  return (
    <div className="h-screen flex flex-col">
      {/* Navigation Bar*/}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg lg:bg-transparent lg:backdrop-blur-none lg:border-b-0">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo - Visible on all screen sizes */}
            <Link href="/" className="flex items-center">
              <Image 
                src="/Logo-dark.svg"
                alt="Creduman Logo" 
                width={120} 
                height={32}
                className="h-6 w-auto sm:h-8"
                priority
              />
            </Link>

            {/* Back Button */}
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 grid lg:grid-cols-2">
        {/* Left Section - Full Image */}
        <div className="hidden lg:flex relative overflow-hidden">
          <Image
            src="/auth.svg"
            alt="Creduman Authentication"
            width={1200}
            height={1200}
            className="w-full h-full object-cover"
            priority
          />
        </div>

        {/* Right Section - Form */}
        <div className="flex flex-col h-full bg-background overflow-y-auto pt-16">
          {/* Form Content with Modern Mobile Styling */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 md:px-12 py-8 sm:py-12">
            <div className="w-full max-w-md">
              {/* Mobile: Add subtle card effect */}
              <div className="lg:contents">
                <div className="lg:contents bg-card/50 lg:bg-transparent rounded-2xl lg:rounded-none p-6 sm:p-8 lg:p-0 shadow-lg lg:shadow-none border lg:border-0">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
