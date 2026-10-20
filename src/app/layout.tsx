import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { WorkspaceProvider } from '@/context/WorkspaceContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'LeetTrack — Developer Problem Tracker & Revision Calendar',
  description:
    'A distraction-free LeetCode solved-problem tracker with a revision calendar and developer-first workflows.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full dark`}
    >
      <body
        suppressHydrationWarning
        className="min-h-full bg-[#0e0e11] text-[#ededf0] antialiased flex flex-col font-sans selection:bg-violet-500/30 selection:text-violet-200"
      >
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </body>
    </html>
  );
}
