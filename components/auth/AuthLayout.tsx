/**
 * Auth Layout Component
 * Two-section layout: Left carousel, Right form
 * Supports light/dark mode
 */

interface AuthLayoutProps {
  children: React.ReactNode;
  carousel: React.ReactNode;
}

export function AuthLayout({ children, carousel }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Section - Carousel */}
      <div className="hidden lg:flex relative bg-gradient-to-br from-brand-500 to-brand-700 dark:from-brand-600 dark:to-brand-800">
        {carousel}
      </div>

      {/* Right Section - Form */}
      <div className="flex items-center justify-center p-6 md:p-10 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
