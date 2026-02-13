/**
 * Tabs Component
 * Reusable tabs component
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
  undefined
);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      className={cn(
        'inline-flex gap-2 rounded-lg bg-muted p-1',
        className
      )}
    >
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({
  value: triggerValue,
  children,
  className,
}: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('TabsTrigger must be used within Tabs');
  }

  const { value, onValueChange } = context;
  const isActive = value === triggerValue;

  return (
    <button
      onClick={() => onValueChange(triggerValue)}
      className={cn(
        'rounded-md px-4 py-2 text-sm font-medium transition-all md:px-6',
        isActive
          ? 'bg-brand/20 text-brand shadow-sm'
          : 'text-foreground hover:bg-background/50',
        className
      )}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsContent({
  value: contentValue,
  children,
  className,
}: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('TabsContent must be used within Tabs');
  }

  const { value } = context;

  if (value !== contentValue) {
    return null;
  }

  return <div className={cn('mt-8', className)}>{children}</div>;
}
