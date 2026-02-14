/**
 * Clock Icon Component
 * Reusable clock/time icon used across learning components
 */

'use client';

interface ClockIconProps {
  className?: string;
}

export function ClockIcon({ className = 'h-3.5 w-3.5' }: ClockIconProps) {
  return (
    <svg 
      className={className}
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
      <path strokeWidth="2" d="M12 6v6l4 2"/>
    </svg>
  );
}
