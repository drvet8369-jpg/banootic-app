
import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/sonner";
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { AuthProvider } from '@/components/providers/auth-provider';


const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'بانوتیک',
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
