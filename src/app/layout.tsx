'use client';

import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from "@/components/ui/sonner"
import { Button } from '@/components/ui/button';


const AuthProvider = dynamic(() => import('@/context/AuthContext').then(mod => mod.AuthProvider), { ssr: false });
const Header = dynamic(() => import('@/components/layout/header'), { ssr: false });
const SearchBar = dynamic(() => import('@/components/ui/search-bar'), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/footer'), { ssr: false });


const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-sans',
});

// This can't be a dynamic export in a client component, 
// so we define it statically here.
// export const metadata: Metadata = {
//   title: 'بانوتیک',
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
  
  const handleHardRefresh = () => {
    const randomParam = `cacheBust=${new Date().getTime()}`;
    window.location.href = `/?${randomParam}`;
  };

  return (
    <html lang="fa" dir="rtl">
       <head>
          <title>بانوتیک</title>
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
           <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[101] animate-pulse">
                <Button onClick={handleHardRefresh} variant="destructive" size="sm" className="shadow-lg">
                  رفرش کامل (مخصوص موبایل)
                </Button>
            </div>
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
