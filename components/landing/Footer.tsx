/**
 * Footer Component
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, Globe } from 'lucide-react';
import { useIsDarkMode } from '@/hooks/useTheme';

export function Footer() {
  const isDark = useIsDarkMode();
  const footerSections = [
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Team', href: '/team' },
        { label: 'Product', href: '/product' },
        { label: 'How it works', href: '/how-it-works' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
    {
      title: 'Learning',
      links: [
        { label: 'Credit basics', href: '/learn/credit-basics' },
        { label: 'Newcomer essentials', href: '/learn/newcomer-essentials' },
        { label: 'Score Improvement', href: '/learn/score-improvement' },
        { label: 'Learn Danger Zones', href: '/learn/danger-zones' },
        { label: 'Safe Usage Guide', href: '/learn/safe-usage' },
      ],
    },
    {
      title: 'Cards',
      links: [
        { label: 'How to use', href: '/cards/how-to-use' },
        { label: 'Add Card', href: '/cards/add' },
        { label: 'Card Overview', href: '/cards' },
      ],
    },
    {
      title: 'Account',
      links: [
        { label: 'Profile', href: '/profile' },
        { label: 'Settings', href: '/settings' },
        { label: 'Subscriptions', href: '/subscriptions' },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 md:px-6">
        {/* Top Section: Navigation Columns + Language Selector */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
            {/* Navigation Columns */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-foreground mb-4">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Language Selector - 5th column */}
            <div className="col-span-2 md:col-span-1 flex justify-start md:justify-end">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm h-fit">
                <Globe className="h-4 w-4" />
                <span>English</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section: Logo (left) and Social Icons (right) */}
        <div className="border-t border-border py-6">
          <div className="flex flex-row justify-between items-center gap-4">
            {/* Logo - Left */}
            <Link href="/" className="flex items-center">
              <Image
                src={isDark ? '/Logo.svg' : '/Logo-dark.svg'}
                alt="Creduman Logo"
                width={120}
                height={32}
                className="h-6 w-auto sm:h-8"
                priority
              />
            </Link>

            {/* Social Links - Right */}
            <div className="flex items-center gap-4">
              <Link
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </Link>
              <Link
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Website"
              >
                <Globe className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
