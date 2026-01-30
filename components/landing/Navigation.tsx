'use client';

/**
 * Navigation Component
 * Responsive navbar with light/dark mode toggle
 */

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, Moon, Sun, LogOut, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function Navigation() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string; full_name?: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        // Get user profile for full name
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('id', authUser.id)
          .single();

        setUser({
          id: authUser.id,
          email: authUser.email,
          full_name: profile?.full_name || undefined,
        });
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || undefined,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setShowUserMenu(false);
    router.push('/');
  };

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'About', href: '#about' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src={darkMode ? "/Logo-dark.svg" : "/Logo.svg"}
              alt="Creduman Logo" 
              width={120} 
              height={32}
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="rounded-lg p-2 hover:bg-accent"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {user ? (
              // Logged in user menu
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="hidden md:flex items-center space-x-2 rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-medium">
                    {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium">
                    {user.full_name || user.email?.split('@')[0] || 'User'}
                  </span>
                </button>

                {/* Desktop User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-background shadow-lg">
                    <div className="p-3 border-b">
                      <p className="text-sm font-medium">{user.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/learn-dashboard"
                        className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center space-x-2 rounded-md px-3 py-2 text-sm hover:bg-accent text-red-600 dark:text-red-400"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mobile User Button */}
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="md:hidden h-8 w-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-medium"
                >
                  {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </button>
              </div>
            ) : (
              // Logged out buttons
              <>
                <Link
                  href="/login"
                  className="hidden md:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Log In
                </Link>

                <Link
                  href="/signup"
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg p-2 hover:bg-accent"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-base font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  href="/learn-dashboard"
                  className="block text-base font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left text-base font-medium text-red-600 dark:text-red-400"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block text-base font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
