export function ThemeScript() {
  const themeScript = `
    (function() {
      try {
        const theme = localStorage.getItem('theme') || 'system';
        const root = document.documentElement;
        
        if (theme === 'system') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.add(isDark ? 'dark' : 'light');
        } else {
          root.classList.add(theme);
        }
      } catch (e) {
        console.error('Failed to apply theme:', e);
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
      suppressHydrationWarning
    />
  );
}
