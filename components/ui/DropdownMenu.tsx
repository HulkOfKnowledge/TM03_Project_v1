'use client';

import { useRef, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({
  isOpen,
  onClose,
  trigger,
  children,
  align = 'right',
  className,
}: DropdownMenuProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={dropdownRef}>
      {trigger}
      {isOpen && (
        <div
          className={cn(
            'absolute mt-2 min-w-[200px] rounded-lg border bg-popover shadow-lg z-50',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownMenuItemProps {
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'danger';
  className?: string;
}

export function DropdownMenuItem({
  onClick,
  icon,
  children,
  variant = 'default',
  className,
}: DropdownMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent',
        variant === 'danger' && 'text-red-600 dark:text-red-400',
        variant === 'default' && 'text-foreground',
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

interface DropdownMenuHeaderProps {
  children: ReactNode;
  className?: string;
}

export function DropdownMenuHeader({
  children,
  className,
}: DropdownMenuHeaderProps) {
  return (
    <div className={cn('px-4 py-3 border-b', className)}>
      {children}
    </div>
  );
}

interface DropdownMenuSectionProps {
  children: ReactNode;
  className?: string;
}

export function DropdownMenuSection({
  children,
  className,
}: DropdownMenuSectionProps) {
  return <div className={cn('py-1', className)}>{children}</div>;
}
