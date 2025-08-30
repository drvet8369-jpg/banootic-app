'use client';

import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';

const SearchBar = dynamic(() => import('@/components/ui/search-bar'), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/footer'), { ssr: false });

const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-sans',
});

// These props are passed from the server-side RootLayout to the client-side component
interface ClientRootLayoutProps {
  children: React.ReactNode;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

function ClientRootLayout({ children, supabaseUrl, supabaseAnonKey }: ClientRootLayoutProps) {
  return (
    <html lang="fa" dir="rtl">
       <head>
          <title>بانوتیک</title>
          <meta name="description" content="بازاری برای خدمات و محصولات بانوان هنرمند" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#A3BEA6" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          vazirmatn.variable
        )}
      >
        <AuthProvider supabaseUrl={supabaseUrl} supabaseAnonKey={supabaseAnonKey}>
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


// This is the actual root layout, which is a server component.
// It reads the environment variables on the server and passes them to the client component.
export default function RootLayout({ children }: { children: React.ReactNode }) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return (
        <ClientRootLayout 
            supabaseUrl={supabaseUrl} 
            supabaseAnonKey={supabaseAnonKey}
        >
            {children}
        </ClientRootLayout>
    );
}