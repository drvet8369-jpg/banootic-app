import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="هنربانو لوگو" width={32} height={32} className="h-8 w-8" />
          <span className="font-display text-2xl font-bold whitespace-nowrap">هنربانو</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
          <Link href="/#categories" className="transition-colors hover:text-foreground/80 text-foreground/60">خدمات</Link>
          
          <Button asChild variant="secondary" className="w-48">
             <Link href="/register">عضویت و ارائه خدمات</Link>
          </Button>

          <Button asChild className="w-48">
             <Link href="/login">ورود</Link>
          </Button>

        </nav>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">باز کردن منو</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">منوی اصلی</SheetTitle>
              <div className="grid gap-6 p-6">
                <Link href="/" className="flex items-center gap-2">
                   <Image src="/logo.png" alt="هنربانو لوگو" width={32} height={32} className="h-8 w-8" />
                  <span className="font-display text-2xl font-bold">هنربانو</span>
                </Link>
                <nav className="grid gap-4">
                  <Link href="/#categories" className="py-2 text-lg font-medium">خدمات</Link>
                  <Link href="/register" className="py-2 text-lg font-medium">عضویت</Link>
                  <Link href="/login" className="py-2 text-lg font-medium">ورود</Link>
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
