import type { ReactNode } from 'react';
import '@/styles/globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
});

export const metadata = {
  title: 'BlockBlueprint',
  description: 'AI-powered Minecraft building assistant for premium blueprint creation.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-[#0D0D0D] font-sans text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
