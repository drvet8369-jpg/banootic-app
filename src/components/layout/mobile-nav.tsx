
'use client';

import Link from 'next/link';
import { Logo } from './logo';
import { Button } from '@/components/ui/button';
import { logout as logoutAction } from './actions';
import { UserRound, LogOut, Menu, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { Profile } from '@/lib/types';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AgreementBadge } from './agreement-badge';
import { InboxBadge } from './inbox-badge';

const getInitials = (name: string | null) => {
    if (!name) return '..';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
}

export default function MobileNav({ userProfile, isLoggedIn }: { userProfile: Profile | null, isLoggedIn: boolean }) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  if (!isLoggedIn || !userProfile) {
    return (
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">باز کردن منو</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[300px] sm:w-[340px]">
            <SheetHeader>
                <SheetTitle className="sr-only">منوی ناوبری</SheetTitle>
            </SheetHeader>
            <div className="border-b pb-6 mb-6">
              <SheetClose asChild>
                <Link href="/" className="flex items-center gap-2">
                  <Logo className="h-8 w-8 text-primary-foreground" />
                  <span className="font-display text-2xl font-bold">بانوتیک</span>
                </Link>
              </SheetClose>
            </div>
            <nav className="flex-grow space-y-2">
               <SheetClose asChild>
                  <Link href="/login" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
                      ورود / ثبت‌نام
                  </Link>
                </SheetClose>
            </nav>
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
          <span className="sr-only">باز کردن منو</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[340px] flex flex-col">
        <SheetHeader>
            <SheetTitle className="sr-only">منوی ناوبری</SheetTitle>
        </SheetHeader>
        <div className="border-b pb-6">
          <SheetClose asChild>
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-primary-foreground" />
              <span className="font-display text-2xl font-bold">بانوتیک</span>
            </Link>
          </SheetClose>
        </div>
        <nav className="flex-grow mt-6 space-y-2">
          {userProfile?.account_type === 'provider' && (
            <>
                <SheetClose asChild>
                    <Link href="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted">
                        <UserRound className="h-5 w-5" />
                        پروفایل من
                    </Link>
                </SheetClose>
                <SheetClose asChild>
                    <Link href="/agreements" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted relative">
                        <ShieldCheck className="h-5 w-5" />
                        <span>توافق‌ها</span>
                        <AgreementBadge />
                    </Link>
                </SheetClose>
            </>
          )}
          <SheetClose asChild>
            <Link href="/inbox" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
              <span>صندوق ورودی</span>
              <InboxBadge />
            </Link>
          </SheetClose>
        </nav>
        <div className="mt-auto border-t pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarFallback>{getInitials(userProfile.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{userProfile.full_name}</span>
              <span className="text-xs text-muted-foreground">{userProfile.phone}</span>
            </div>
          </div>
          <form action={logoutAction}>
            <SheetClose asChild>
              <Button type="submit" variant="ghost" className="w-full justify-start">
                <LogOut className="ml-2 h-5 w-5" />
                خروج
              </Button>
            </SheetClose>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
