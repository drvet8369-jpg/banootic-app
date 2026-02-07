import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import ClientProviders from '@/components/providers/client-providers';
import Header from '@/components/layout/header';
import SearchBar from '@/components/ui/search-bar';
import Footer from '@/components/layout/footer';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'هنربانو',
  description: 'بازاری برای خدمات خانگی بانوان هنرمند',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
       <head>
          <meta name="theme-color" content="#A3BEA6" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          vazirmatn.variable
        )}
      >
        <ClientProviders>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <SearchBar />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
              {children}
            </main>
            <Footer />
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
