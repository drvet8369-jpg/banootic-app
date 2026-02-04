import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Header from '@/components/layout/Header';
import SearchBar from '@/components/ui/search-bar';
import Footer from '@/components/ui/footer';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import ClientProviders from '@/components/providers/client-providers';

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

  const isSupabaseConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
        {isSupabaseConfigured ? (
            <ClientProviders>
              <div className="relative flex min-h-screen flex-col">
                <Header />
                <SearchBar />
                <main className="flex-grow flex flex-col">
                  {children}
                </main>
                <Footer />
              </div>
              <SonnerToaster />
            </ClientProviders>
        ) : (
          <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center text-card-foreground shadow-sm">
                <h1 className="text-2xl font-bold text-destructive">پیکربندی Supabase یافت نشد</h1>
                <p className="mt-4">
                  پس از پاکسازی اخیر پروژه، لازم است متغیرهای Supabase را مجدداً در فایل 
                  <code className="font-mono text-sm bg-muted p-1 rounded-sm">.env.local</code> 
                  تنظیم کنید.
                </p>
                <div className="mt-6 text-left text-sm text-muted-foreground space-y-2">
                    <p>
                        <code className="font-semibold text-foreground">NEXT_PUBLIC_SUPABASE_URL</code>
                    </p>
                    <p>
                        <code className="font-semibold text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                    </p>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                    این مقادیر را می‌توانید از داشبورد پروژه خود در Supabase پیدا کنید.
                </p>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
