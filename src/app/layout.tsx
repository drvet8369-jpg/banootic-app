import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { cn } from '@/lib/utils';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'دستبانو',
  description: 'بازاری برای خدمات خانگی بانوان هنرمند',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className={cn(
          'font-sans antialiased flex flex-col min-h-screen',
          vazirmatn.variable
        )}
      >
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
