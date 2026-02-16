import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { EmailConfirmationModal } from '@/components/auth/EmailConfirmationModal';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeScript } from '@/components/ThemeScript';
import { AuthProvider } from '@/hooks/useAuth';
import { CardProvider } from '@/contexts/CardContext';

// Clash Grotesk for headers
const clashGrotesk = localFont({
  src: [
    {
      path: '../public/fonts/ClashGrotesk-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-clash-grotesk',
  display: 'swap',
});

// SF Pro for body text and titles
const sfPro = localFont({
  src: [
    {
      path: '../public/fonts/SFPro-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/SFPro-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-sf-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Creduman - Credit Education for Canadian Newcomers',
  description: 'Learn about credit and manage your credit cards effectively',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${clashGrotesk.variable} ${sfPro.variable}`}>
      <head>
        <ThemeScript />
      </head>
      <body className={sfPro.className}>
        <ThemeProvider defaultTheme="system">
            <AuthProvider>
              <CardProvider>
                {children}
                <EmailConfirmationModal />
              </CardProvider>
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
