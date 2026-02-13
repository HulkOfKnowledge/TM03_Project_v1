import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        clash: ['var(--font-clash-grotesk)', 'system-ui', '-apple-system', 'sans-serif'],
        sf: ['var(--font-sf-pro)', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['var(--font-sf-pro)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'h1': ['30px', { lineHeight: '1.2', fontWeight: '500' }],
        'h2': ['24px', { lineHeight: '1.3', fontWeight: '500' }],
        'h3': ['20px', { lineHeight: '1.4', fontWeight: '500' }],
        'title': ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        'subtitle': ['16px', { lineHeight: '1.5', fontWeight: '500' }],
        'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        brand: {
          DEFAULT: '#6045f4',
          50: '#f5f3ff',
          100: '#ede9ff',
          200: '#ddd6fe',
          300: '#c3b5fd',
          400: '#a78bfa',
          500: '#6045f4',
          600: '#5638d6',
          700: '#4c2fb8',
          800: '#3d2594',
          900: '#2e1b70',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      spacing: {
        '40': '10rem',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
