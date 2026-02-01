'use client';

/**
 * Navigation Component
 * Responsive navbar with improved mobile behavior and unified dropdown menus
 */

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useIsDarkMode } from '@/hooks/useTheme';
import { useUser } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuHeader,
  DropdownMenuSection,
} from '@/components/ui/DropdownMenu';

export function Navigation() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile } = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const isDark = useIsDarkMode();

  // Close one menu when opening another
  const handleUserMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
    setShowThemeMenu(false);
  };

  const handleThemeMenuToggle = () => {
    setShowThemeMenu(!showThemeMenu);
    setShowUserMenu(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
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
              src={isDark ? "/Logo.svg" : "/Logo-dark.svg"}
              alt="Creduman Logo" 
              width={120} 
              height={32}
              className="h-6 w-auto sm:h-8"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-8">
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

          {/* Desktop CTA & Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle
              isOpen={showThemeMenu}
              onToggle={handleThemeMenuToggle}
            />

            {user ? (
              // Logged in user menu
              <DropdownMenu
                isOpen={showUserMenu}
                onClose={() => setShowUserMenu(false)}
                trigger={
                  <button
                    onClick={handleUserMenuToggle}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-brand flex items-center justify-center text-white text-sm font-medium">
                      {profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium">
                      {profile?.first_name || 'User'}
                    </span>
                  </button>
                }
              >
                <DropdownMenuHeader>
                  <p className="text-sm font-medium">
                    {profile?.first_name ? `${profile.first_name} ${profile.surname || ''}`.trim() : 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </DropdownMenuHeader>
                <DropdownMenuSection>
                  <DropdownMenuItem
                    onClick={() => {
                      router.push('/learn-dashboard');
                      setShowUserMenu(false);
                    }}
                    icon={<LayoutDashboard className="h-4 w-4" />}
                  >
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    icon={<LogOut className="h-4 w-4" />}
                    variant="danger"
                  >
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuSection>
              </DropdownMenu>
            ) : (
              // Logged out buttons
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
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
          </div>

          {/* Mobile Actions */}
          <div className="flex lg:hidden items-center gap-2">
            {user && (
              <button
                onClick={handleUserMenuToggle}
                className="h-9 w-9 rounded-full bg-brand flex items-center justify-center text-white text-sm font-medium"
              >
                {profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 hover:bg-accent"
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
        <div className="lg:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-3">
            {/* Navigation Items */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-base font-medium text-muted-foreground hover:text-foreground py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {/* Divider */}
            <div className="border-t my-2" />

            {/* Theme Toggle for Mobile */}
            <ThemeToggle
              isOpen={showThemeMenu}
              onToggle={handleThemeMenuToggle}
              mobile
            />

            {user ? (
              <>
                <Link
                  href="/learn-dashboard"
                  className="flex items-center gap-2 text-base font-medium text-muted-foreground hover:text-foreground py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left text-base font-medium text-red-600 dark:text-red-400 py-2"
                >
                  <LogOut className="h-5 w-5" />
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block text-base font-medium text-muted-foreground hover:text-foreground py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="block w-full text-center rounded-lg bg-brand px-4 py-3 text-base font-medium text-white hover:bg-brand-600 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
