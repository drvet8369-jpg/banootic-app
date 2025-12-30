import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/header';
import { Toaster } from "@/components/ui/sonner";
import ClientUtils from '@/components/layout/client-utils';
import ClientProviders from '@/components/providers/client-providers';

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata = {
  title: 'بانوتیک',
  description: 'بازاری برای خدمات خانگی بانوان هنرمند',
  manifest: '/manifest.json',
};

// Force dynamic rendering for all routes to ensure server components can access cookies.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
          <ClientUtils />
          <div className="relative flex min-h-screen flex-col">
            <Header /> 
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
              {children}
            </main>
          </div>
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  );
}
