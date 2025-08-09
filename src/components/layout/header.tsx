
'use client';

import Link from 'next/link';
import { Logo } from './logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Menu, LogIn, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  const MobileNavMenu = () => (
    <div className="flex flex-col h-full">
       <SheetHeader className="p-4 border-b">
         <SheetTitle className="sr-only">منوی اصلی</SheetTitle>
         <SheetDescription className="sr-only">گزینه‌های ناوبری اصلی سایت</SheetDescription>
         <SheetClose asChild>
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-foreground" />
              <span className="font-display text-2xl font-bold">هنربانو</span>
            </Link>
         </SheetClose>
      </SheetHeader>
      <nav className="flex-grow p-4 space-y-2">
          <SheetClose asChild>
            <Link href="/login" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted">
              <LogIn className="h-5 w-5" />
              ورود
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link href="/register" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-muted">
              <UserPlus className="h-5 w-5" />
              ثبت‌نام
            </Link>
          </SheetClose>
      </nav>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Right Side: Branding */}
        <Link href="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10 text-foreground" />
            <span className="hidden sm:inline-block font-display text-2xl font-bold whitespace-nowrap">هنربانو</span>
        </Link>
        
        {/* Left Side: Actions */}
        <div className="flex items-center gap-2">
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
                <Button asChild>
                  <Link href="/login">ورود</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/register">ثبت‌نام</Link>
                </Button>
            </nav>
            {/* Mobile Nav */}
            <div className="md:hidden">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                     <Menu className="h-6 w-6" />
                    <span className="sr-only">باز کردن منو</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-[300px] sm:w-[340px]">
                    <MobileNavMenu />
                </SheetContent>
                </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
