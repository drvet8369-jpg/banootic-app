
'use client';

import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/AuthContext';
import { useEffect } from 'react';

// Configure Vazirmatn font with the 'arabic' subset
const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-sans',
});

// This can't be a dynamic export in a client component, 
// so we define it statically here.
// export const metadata: Metadata = {
//   title: 'هنربانو',
//   description: 'بازاری برای خدمات خانگی بانوان هنرمند',
//   manifest: '/manifest.json',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => console.log('Service Worker registered with scope:', registration.scope))
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
