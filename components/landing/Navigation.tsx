'use client';

/**
 * Navigation Component
 * Responsive navbar with light/dark mode toggle
 */

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Moon, Sun } from 'lucide-react';

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
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
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700" />
            <span className="text-xl font-bold">Creduman</span>
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
            <Link
              href="/login"
              className="block text-base font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              Log In
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
