'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSection,
} from '@/components/ui/DropdownMenu';

interface ThemeToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  mobile?: boolean;
}

export function ThemeToggle({ isOpen, onToggle, mobile = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  const currentTheme = themes.find((t) => t.value === theme) || themes[2];
  const Icon = currentTheme.icon;

  if (mobile) {
    return (
      <div className="py-2">
        <div className="text-sm font-medium text-muted-foreground mb-2">Theme</div>
        <div className="flex gap-2">
          {themes.map(({ value, label, icon: ThemeIcon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                theme === value
                  ? 'bg-brand text-white border-brand'
                  : 'bg-background text-muted-foreground border-border hover:bg-accent'
              }`}
            >
              <ThemeIcon className="h-4 w-4" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu
      isOpen={isOpen}
      onClose={onToggle}
      trigger={
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          aria-label="Toggle theme"
        >
          <Icon className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      }
    >
      <DropdownMenuSection>
        {themes.map(({ value, label, icon: ThemeIcon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => {
              setTheme(value);
              onToggle();
            }}
            icon={<ThemeIcon className="h-4 w-4" />}
            className={theme === value ? 'text-brand font-medium' : ''}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSection>
    </DropdownMenu>
  );
}
