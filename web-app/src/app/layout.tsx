import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FIRE ARENA MAX',
  description: 'Real Money Esports Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en" className={inter.className}>
        <body className="bg-[#0a0a0a] text-white antialiased">{children}</body>
      </html>
    </AuthProvider>
  );
}
