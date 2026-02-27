import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import ToastProvider from '@/components/ToastProvider';
import Chatbot from '@/components/Chatbot';
import GlobalAlert from '@/components/GlobalAlert';

const inter = Inter({ subsets: ['latin'] });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sentinel AI – Smart Community Safety Platform',
  description: 'AI-powered disaster and emergency monitoring system with live map visualization, real-time alerts, and intelligent analysis.',
  keywords: 'disaster monitoring, emergency response, AI analysis, community safety, real-time map',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <AuthProvider>
          <Navbar />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
          <ToastProvider />
          <Chatbot />
          <GlobalAlert />
        </AuthProvider>
      </body>
    </html>
  );
}
