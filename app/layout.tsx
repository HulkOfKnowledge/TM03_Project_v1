import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { EmailConfirmationModal } from '@/components/auth/EmailConfirmationModal';

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
    <html lang="en">
      <body className={inter.className}>
        {children}
        <EmailConfirmationModal />
      </body>
    </html>
  );
}
