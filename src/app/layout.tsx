import type { Metadata, Viewport } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import { SerwistProvider } from '@/components/SerwistProvider';
import './globals.css';

const serifFont = Fraunces({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
});

const sansFont = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const APP_NAME = 'Lumen';
const APP_TITLE = 'Lumen — Calm, Time-Aware Personal Planner';
const APP_DESCRIPTION =
  'A local-first personal planner for todos, checklists, reminders, and week planning.';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#D97706',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serifFont.variable} ${sansFont.variable} h-full antialiased`}>
      <body className="min-h-full font-sans bg-amber-50/20 text-stone-800 selection:bg-amber-100 selection:text-amber-900">
        <SerwistProvider>{children}</SerwistProvider>
      </body>
    </html>
  );
}
