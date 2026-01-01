import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import SearchBar from '@/components/ui/search-bar';
import { Toaster } from "@/components/ui/sonner";
import { unstable_noStore as noStore } from 'next/cache';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-sans',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔴 این خط کلیدی است
  noStore();

  return (
    <html lang="fa" dir="rtl">
      <head>
        <title>بانوتیک</title>
        <meta name="description" content="بازاری برای خدمات خانگی بانوان هنرمند" />
        <meta name="theme-color" content="#A3BEA6" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          vazirmatn.variable
        )}
      >
        <div className="relative flex min-h-screen flex-col">
          <Header />
          <SearchBar />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
            {children}
          </main>
          <Footer />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
