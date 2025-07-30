'use client';

import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const AuthProvider = dynamic(() => import('@/context/AuthContext').then(mod => mod.AuthProvider), { ssr: false });
const Header = dynamic(() => import('@/components/layout/header'), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/footer'), { ssr: false });
const Toaster = dynamic(() => import('@/components/ui/toaster').then(mod => mod.Toaster), { ssr: false });

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
