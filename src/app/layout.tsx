'use client';

import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const AuthProvider = dynamic(
  () => import('@/context/AuthContext').then(mod => mod.AuthProvider),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">در حال بارگذاری...</p>
      </div>
    ),
  }
);
const Header = dynamic(() => import('@/components/layout/header'));
const SearchBar = dynamic(() => import('@/components/ui/search-bar'));
const Footer = dynamic(() => import('@/components/layout/footer'));
const Toaster = dynamic(() => import('@/components/ui/toaster').then(mod => mod.Toaster));

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(error => console.log('Service Worker registration failed:', error));
    }
  }, []);

  return (
    <html lang="fa" dir="rtl">
       <head>
          <title>هنربانو</title>
          <meta name="description" content="بازاری برای خدمات خانگی بانوان هنرمند" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#A3BEA6" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          vazirmatn.variable
        )}
      >
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <SearchBar />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
