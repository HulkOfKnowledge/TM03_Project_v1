/**
 * Auth Layout Component
 * Two-section layout: Left image, Right form
 * Supports light/dark mode
 */

import Image from 'next/image';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Section - Image with Logo */}
      <div className="hidden lg:flex relative overflow-hidden">
        <Image
          src="/auth.svg"
          alt="Creduman Authentication"
          width={1200}
          height={1200}
          className="w-full h-full object-cover"
          priority
        />
        {/* Logo Overlay */}
        <div className="absolute top-8 left-8">
          <Link href="/" className="inline-block">
            <Image
              src={"Logo-dark.svg"}
              alt="Creduman Logo"
              width={140}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>
      </div>

      {/* Right Section - Form with Logo */}
      <div className="flex flex-col min-h-screen bg-background">
        {/* Logo Header - Mobile Only */}
        <div className="p-6 sm:p-8 lg:hidden">
          <Link href="/" className="inline-block">
            <Image
              src={"Logo-dark.svg"}
              alt="Creduman Logo"
              width={140}
              height={40}
              className="h-8 w-auto sm:h-10"
              priority
            />
          </Link>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center sm:px-8 md:px-12 pb-12">
          <div className="w-[82%]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
