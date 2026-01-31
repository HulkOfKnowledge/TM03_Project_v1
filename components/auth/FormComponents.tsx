/**
 * Auth Form Components
 * Reusable components for auth forms following DRY principle
 */

import { ReactNode } from 'react';

interface FormSectionProps {
  children: ReactNode;
  className?: string;
}

export function FormSection({ children, className = '' }: FormSectionProps) {
  return <div className={`space-y-5 ${className}`}>{children}</div>;
}

interface FormHeaderProps {
  title: string;
  subtitle?: string;
}

export function FormHeader({ title, subtitle }: FormHeaderProps) {
  return (
    <div className="space-y-2 mb-8">
      <h1 className="text-2xl sm:text-3xl tracking-tight text-primary">{title}</h1>
      {subtitle && (
        <p className="text-lg font-medium text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}

interface FormDividerProps {
  text: string;
}

export function FormDivider({ text }: FormDividerProps) {
  return (
    <div className="relative flex justify-center text-xs sm:text-sm my-6">
      <span className="relative z-10 bg-background px-2 text-muted-foreground">{text}</span>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t"></div>
      </div>
    </div>
  );
}

interface FormFooterProps {
  text: string;
  linkText: string;
  linkHref: string;
}

export function FormFooter({ text, linkText, linkHref }: FormFooterProps) {
  return (
    <p className="text-left text-sm text-muted-foreground mt-2">
      {text}{' '}
      <a href={linkHref} className="text-brand font-medium hover:underline">
        {linkText}
      </a>
    </p>
  );
}
