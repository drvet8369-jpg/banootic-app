'use client';

import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/layout/header';
import SearchBar from '@/components/ui/search-bar';
import Footer from '@/components/layout/footer';
import { Toaster } from '@/components/ui/toaster';
import ClientOnly from '@/components/client-only';


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
        <ClientOnly>
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
        </ClientOnly>
      </body>
    </html>
  );
}
