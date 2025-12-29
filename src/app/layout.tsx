import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/sonner";
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-sans',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
        <div className="relative flex min-h-screen flex-col">
          <Header />      {/* Server Component - Renders HeaderClient which contains client components */}
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
            {children}
          </main>
          <Footer />      {/* Server Component */}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
