import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { EmailConfirmationModal } from '@/components/auth/EmailConfirmationModal';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeScript } from '@/components/ThemeScript';

const inter = Inter({ subsets: ['latin'] });

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system">
          {children}
          <EmailConfirmationModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
