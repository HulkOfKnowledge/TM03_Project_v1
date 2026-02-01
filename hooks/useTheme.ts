import { useState, useEffect } from 'react';

export { useTheme } from '@/components/ThemeProvider';

/**
 * Hook to detect if dark mode is currently active
 * Monitors theme changes in real-time
 */
export function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  return isDark;
}
