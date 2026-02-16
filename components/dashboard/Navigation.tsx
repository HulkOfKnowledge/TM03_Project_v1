'use client';

/**
 * Navigation Component
 * Navigation for authenticated app pages with tabbed subnav system
 * Features theme support and full mobile responsiveness
 */

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, 
  BookOpen, 
  CreditCard, 
  User, 
  Bell,
  LogOut,
  Settings,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { handleLogout } from '@/lib/auth';
import { useIsDarkMode } from '@/hooks/useTheme';
import { useUser } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuHeader,
  DropdownMenuSection,
} from '@/components/ui/DropdownMenu';
import { Submenu, SubmenuItem } from '@/components/ui/Submenu';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface SubNavItem {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: any;
  active: boolean;
  subNav?: SubNavItem[];
}

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeSubmenu, setShowThemeSubmenu] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null);
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);
  const isDark = useIsDarkMode();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const subNavTimeoutRef = useRef<NodeJS.Timeout>();

  const onLogout = async () => {
    setShowUserMenu(false);
    handleLogout();
  };

  // Define subnav items for each main nav
  const learnSubNav: SubNavItem[] = [
    { label: 'Learning Space', href: '/learn/learning-space' },
    { label: 'Resources', href: '/learn/resources' },
    { label: 'Articles & Guides', href: '/learn/articles' },
    { label: 'Credit Platform Overview', href: '/learn/overview' },
    { label: 'Learning History', href: '/learn/history' },
  ];

  const cardSubNav: SubNavItem[] = [
    { label: 'Card Dashboard', href: '/cards' },
    { label: 'Credit Analysis', href: '/cards/analysis' },
  ];

  // Navigation items - only shown after onboarding
  const navItems: NavItem[] = [
    { 
      label: 'Home', 
      href: '/learn', 
      icon: Home,
      active: pathname === '/learn'
    },
    { 
      label: 'Learn', 
      href: '#', 
      icon: BookOpen,
      active: pathname?.startsWith('/learn/'),
      subNav: learnSubNav
    },
    { 
      label: 'Cards & Accounts', 
      href: '#', 
      icon: CreditCard,
      active: pathname === '/cards' || pathname?.startsWith('/cards'),
      subNav: cardSubNav
    },
    { 
      label: 'Profile', 
      href: '/profile', 
      icon: User,
      active: pathname === '/profile' || pathname?.startsWith('/profile')
    },
  ];

  // Show navigation items only if onboarding is completed
  const showNavItems = profile?.onboarding_completed;

  // Get user display name
  const getUserDisplayName = () => {
    if (profile?.first_name) {
      return `${profile.first_name} ${profile.surname || ''}`.trim();
    }
    return user?.user_metadata?.full_name || 'User';
  };

  // Copy referrer code to clipboard
  const copyReferrerCode = async () => {
    try {
      await navigator.clipboard.writeText('ID234CR25');
      alert('Referrer code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle theme change
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    if (theme === 'system') {
      localStorage.removeItem('theme');
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', systemTheme === 'dark');
    } else {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    setShowThemeSubmenu(false);
  };

  // Determine which nav item should show subnav
  const currentSubNavItem = hoveredNavItem;
  const currentNavItem = navItems.find(item => item.label === currentSubNavItem);
  const showSubNav = currentNavItem?.subNav && currentNavItem.subNav.length > 0;

  // Handle mouse enter on nav item
  const handleNavMouseEnter = (label: string) => {
    if (subNavTimeoutRef.current) {
      clearTimeout(subNavTimeoutRef.current);
    }
    setHoveredNavItem(label);
  };

  // Handle mouse leave from nav item
  const handleNavMouseLeave = () => {
    subNavTimeoutRef.current = setTimeout(() => {
      setHoveredNavItem(null);
    }, 150);
  };

  // Handle mouse enter on subnav
  const handleSubNavMouseEnter = () => {
    if (subNavTimeoutRef.current) {
      clearTimeout(subNavTimeoutRef.current);
    }
  };

  // Handle mouse leave from subnav
  const handleSubNavMouseLeave = () => {
    setHoveredNavItem(null);
  };

  // Set active nav item based on current pathname
  useEffect(() => {
    const activeItem = navItems.find(item => item.active);
    if (activeItem && activeItem.subNav) {
      setActiveNavItem(activeItem.label);
    } else {
      setActiveNavItem(null);
    }
  }, [pathname]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (subNavTimeoutRef.current) {
        clearTimeout(subNavTimeoutRef.current);
      }
    };
  }, []);

  // Check if subnav item is active
  const isSubNavActive = (href: string) => {
    return pathname === href;
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href={showNavItems ? '/learn' : '/'} className="flex items-center">
              <Image
                src={isDark ? '/Logo.svg' : '/Logo-dark.svg'}
                alt="Creduman Logo"
                width={120}
                height={32}
                className="h-6 w-auto sm:h-8"
                priority
              />
            </Link>

            {/* Center Navigation - Only show after onboarding */}
            {showNavItems && (
              <div 
                ref={navRef}
                className="hidden lg:flex items-center space-x-1"
              >
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        item.active
                          ? 'text-brand'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                      onMouseEnter={() => handleNavMouseEnter(item.label)}
                      onMouseLeave={handleNavMouseLeave}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center space-x-1">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowUserMenu(false);
                    setShowThemeSubmenu(false);
                  }}
                  className="relative p-2 rounded-full bg-brand hover:bg-brand/90 transition-colors"
                >
                  <Bell className="h-5 w-5 text-white" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowNotifications(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-semibold">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        <div className="p-8 text-center text-muted-foreground">
                          <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No new notifications</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Profile Menu */}
              {user && (
                <DropdownMenu
                  isOpen={showUserMenu}
                  onClose={() => {
                    setShowUserMenu(false);
                    setShowThemeSubmenu(false);
                  }}
                  trigger={
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(!showUserMenu);
                          setShowNotifications(false);
                          if (!showUserMenu) {
                            setShowThemeSubmenu(false);
                          }
                        }}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent/50 transition-colors"
                      >
                        <div className="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden border-2 border-foreground">
                          {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                            <Image
                              src={user.user_metadata.avatar_url || user.user_metadata.picture}
                              alt="User profile"
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          ) : (
                            <Image
                              src="/user.svg"
                              alt="User profile"
                              width={40}
                              height={40}
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="hidden md:block text-left">
                          <p className="text-sm font-medium leading-tight">
                            {getUserDisplayName()}
                          </p>
                          <div className="flex items-center gap-1 bg-foreground px-2 py-0.5 rounded mt-0.5">
                            <p className="text-xs text-gray-200 dark:text-brand leading-tight">#ID234CR25</p>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                copyReferrerCode();
                              }}
                              className="inline-flex items-center justify-center h-4 w-4 rounded hover:bg-accent transition-colors cursor-pointer"
                              title="Copy referrer code"
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  copyReferrerCode();
                                }
                              }}
                            >
                              <svg
                                className="h-3 w-3 text-gray-200 dark:text-brand"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>
                  }
                >
                  <DropdownMenuHeader>
                    <p className="text-sm font-medium">{getUserDisplayName()}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        copyReferrerCode();
                      }}
                      className="text-xs text-brand hover:text-brand-600 transition-colors flex items-center gap-1 mt-1 cursor-pointer"
                      title="Click to copy referrer code"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          copyReferrerCode();
                        }
                      }}
                    >
                      <span>#ID234CR25</span>
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </DropdownMenuHeader>
                  {showNavItems && (
                    <DropdownMenuSection>
                      {/* Switch Dashboard */}
                      <DropdownMenuItem
                        onClick={() => {
                          const targetDashboard = pathname?.includes('learn') ? '/cards' : '/learn';
                          router.push(targetDashboard);
                          setShowUserMenu(false);
                        }}
                        icon={
                          pathname?.includes('learn') ? 
                          <CreditCard className="h-4 w-4" /> : 
                          <BookOpen className="h-4 w-4" />
                        }
                      >
                        {pathname?.includes('learn') ? 'Card Dashboard' : 'Learn Dashboard'}
                      </DropdownMenuItem>
                    </DropdownMenuSection>
                  )}
                  <DropdownMenuSection>
                    <DropdownMenuItem
                      onClick={() => {
                        router.push('/profile');
                        setShowUserMenu(false);
                      }}
                      icon={<User className="h-4 w-4" />}
                    >
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        router.push('/settings');
                        setShowUserMenu(false);
                      }}
                      icon={<Settings className="h-4 w-4" />}
                    >
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        router.push('/help');
                        setShowUserMenu(false);
                      }}
                      icon={<HelpCircle className="h-4 w-4" />}
                    >
                      Help & Support
                    </DropdownMenuItem>
                    
                    {/* Theme Submenu */}
                    <Submenu
                      isOpen={showThemeSubmenu}
                      onClose={() => setShowThemeSubmenu(false)}
                      width={160}
                      trigger={
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowThemeSubmenu(!showThemeSubmenu);
                          }}
                          onMouseEnter={() => setShowThemeSubmenu(true)}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors rounded-md cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              setShowThemeSubmenu(!showThemeSubmenu);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <span>Theme</span>
                          </div>
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      }
                    >
                      <SubmenuItem
                        onClick={() => handleThemeChange('light')}
                        icon={
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        }
                      >
                        Light
                      </SubmenuItem>
                      <SubmenuItem
                        onClick={() => handleThemeChange('dark')}
                        icon={
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                        }
                      >
                        Dark
                      </SubmenuItem>
                      <SubmenuItem
                        onClick={() => handleThemeChange('system')}
                        icon={
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        }
                      >
                        System
                      </SubmenuItem>
                    </Submenu>
                  </DropdownMenuSection>
                  <DropdownMenuSection>
                    <DropdownMenuItem
                      onClick={onLogout}
                      icon={<LogOut className="h-4 w-4" />}
                      variant="danger"
                    >
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuSection>
                </DropdownMenu>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => {
                  setMobileMenuOpen(!mobileMenuOpen);
                  setShowNotifications(false);
                  setShowUserMenu(false);
                  setShowThemeSubmenu(false);
                }}
                className="lg:hidden rounded-lg p-2 hover:bg-accent"
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

        {/* Sub Navigation Bar - Tabbed UI */}
        {showSubNav && (
          <div 
            className="hidden lg:block border-t bg-[#f5f5f5] dark:bg-background"
            onMouseEnter={handleSubNavMouseEnter}
            onMouseLeave={handleSubNavMouseLeave}
          >
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex items-center justify-center gap-2 h-12 overflow-x-auto scrollbar-hide">
                {currentNavItem.subNav?.map((subItem) => {
                  const isActive = isSubNavActive(subItem.href);
                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={`px-4 py-4 text-sm font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-brand text-white'
                          : 'text-muted-foreground hover:bg-brand hover:text-white'
                      }`}
                    >
                      {subItem.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden bg-background/95 backdrop-blur">
          <div className="fixed top-16 inset-x-0 bottom-0 overflow-y-auto">
            <div className="container mx-auto px-4 py-6 space-y-1">
              {/* Navigation Items */}
              {showNavItems && navItems.map((item) => {
                const Icon = item.icon;
                const hasSubNav = item.subNav && item.subNav.length > 0;
                const isExpanded = expandedMobileMenu === item.label;
                
                return (
                  <div key={item.label} className="space-y-1">
                    {hasSubNav ? (
                      <button
                        onClick={() => setExpandedMobileMenu(isExpanded ? null : item.label)}
                        className={`flex items-center justify-between w-full gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                          item.active
                            ? 'bg-brand text-white'
                            : 'text-foreground hover:bg-accent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown 
                          className={`h-5 w-5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                          item.active
                            ? 'bg-brand text-white'
                            : 'text-foreground hover:bg-accent'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    )}
                    
                    {/* Mobile SubNav */}
                    {hasSubNav && isExpanded && (
                      <div className="ml-4 pl-4 border-l-2 border-border space-y-1">
                        {item?.subNav?.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`block px-4 py-2 text-sm transition-colors ${
                              isSubNavActive(subItem.href)
                                ? 'text-brand font-medium'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                            }`}
                            onClick={() => {
                              setMobileMenuOpen(false);
                              setExpandedMobileMenu(null);
                            }}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Divider */}
              <div className="border-t my-4" />

              {user ? (
                <>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-5 w-5" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Log Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block px-4 py-3 rounded-lg text-base font-medium text-foreground hover:bg-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="block w-full text-center rounded-lg bg-brand px-4 py-3 text-base font-medium text-white hover:bg-brand/90 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}

              {/* Divider */}
              <div className="border-t my-4" />

              {/* Theme Toggle */}
              <ThemeToggle
                isOpen={false}
                onToggle={() => {}}
                mobile
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}