
'use client';

import Link from 'next/link';
import { Logo } from './logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LogOut, LogIn, UserPlus, UserRound, Handshake, FileText, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const InboxBadge = dynamic(() => import('@/components/layout/inbox-badge').then(mod => mod.InboxBadge), { ssr: false });
const AgreementBadge = dynamic(() => import('@/components/layout/agreement-badge').then(mod => mod.AgreementBadge), { ssr: false });


export default function Header() {
  const { isLoggedIn, user, logout } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  const getInitials = (name: string) => {
    if (!name) return '..';
    const names = name.split(' ');
    if (names.length > 1 && names[1] && !isNaN(parseInt(names[1]))) {
        return `${names[0][0]}${names[1][0]}`;
    }
    if(names.length > 1 && names[1]) {
        return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }

  const MobileNavMenu = () => (
    <div className="flex flex-col h-full">
      <SheetHeader className="p-4 border-b text-right">
         <SheetTitle className="sr-only">منوی اصلی</SheetTitle>
         <SheetClose asChild>
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-primary-foreground" />
              <span className="font-display text-2xl font-bold">بانوتیک</span>
            </Link>
         </SheetClose>
      </SheetHeader>
      <nav className="flex-grow p-4 space-y-2">
        <SheetClose asChild>
            <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted">
                <Home className="h-5 w-5" />
                صفحه اصلی
            </Link>
        </SheetClose>
        {isLoggedIn && user ? (
           <>
             {user?.accountType === 'provider' ? (
                <>
                    <SheetClose asChild>
                      <Link href="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted">
                        <UserRound className="h-5 w-5" />
                        پروفایل من
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                        <Link href="/agreements" className="flex items-center justify-between rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted">
                           <div className="flex items-center gap-3">
                             <Handshake className="h-5 w-5" />
                             <span>مدیریت توافق‌ها</span>
                           </div>
                           <AgreementBadge />
                        </Link>
                    </SheetClose>
                </>
             ) : (
                <SheetClose asChild>
                    <Link href="/requests" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted">
                        <FileText className="h-5 w-5" />
                        درخواست‌های من
                    </Link>
                </SheetClose>
             )}
            <SheetClose asChild>
              <Link href="/inbox" className="flex items-center justify-between rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted relative">
                 <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                    <span>صندوق ورودی</span>
                 </div>
                 <InboxBadge />
              </Link>
            </SheetClose>
           </>
        ) : (
          <>
            <SheetClose asChild>
              <Link href="/login" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted">
                <LogIn className="h-5 w-5" />
                ورود
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/register" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted">
                <UserPlus className="h-5 w-5" />
                ثبت‌نام
              </Link>
            </SheetClose>
          </>
        )}
      </nav>
      {isLoggedIn && user && (
        <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-right">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.phone}</span>
              </div>
            </div>
            <SheetClose asChild>
              <Button onClick={logout} variant="ghost" className="w-full justify-start">
                  <LogOut className="ml-2 h-5 w-5" />
                  خروج
              </Button>
            </SheetClose>
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Left Side: Actions */}
        <div className="flex items-center gap-2">
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
                {isLoggedIn && user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar>
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <InboxBadge isMenu />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start" forceMount>
                    <DropdownMenuLabel className="font-normal text-right">
                        <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.phone}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                     {user.accountType === 'provider' ? (
                        <>
                            <DropdownMenuItem asChild>
                                <Link href="/profile" className="flex justify-end">
                                    <span>پروفایل من</span>
                                    <UserRound className="mr-2 h-4 w-4" />
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/agreements" className="flex justify-between items-center w-full">
                                    <AgreementBadge />
                                    <div className="flex items-center justify-end">
                                        <span>مدیریت توافق‌ها</span>
                                        <Handshake className="mr-2 h-4 w-4" />
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        </>
                    ) : (
                        <DropdownMenuItem asChild>
                            <Link href="/requests" className="flex justify-end">
                                <span>درخواست‌های من</span>
                                <FileText className="mr-2 h-4 w-4" />
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <Link href="/inbox" className="relative flex justify-between items-center w-full">
                            <InboxBadge />
                            <div className="flex items-center justify-end">
                                <span>صندوق ورودی</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="flex justify-end">
                        <span>خروج</span>
                        <LogOut className="mr-2 h-4 w-4" />
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                ) : (
                <>
                    <Button asChild variant="secondary">
                    <Link href="/register">ثبت‌نام</Link>
                    </Button>
                    <Button asChild>
                    <Link href="/login">ورود</Link>
                    </Button>
                </>
                )}
            </nav>
            {/* Mobile Nav */}
            <div className="md:hidden">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                      </svg>
                      <span className="sr-only">باز کردن منو</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-[300px] sm:w-[340px]">
                    <MobileNavMenu />
                </SheetContent>
                </Sheet>
            </div>
        </div>

        {/* Right Side: Branding */}
        <Link href="/" className="flex items-center gap-2">
            <span className="hidden sm:inline-block font-display text-2xl font-bold whitespace-nowrap">بانوتیک</span>
            <Logo className="h-10 w-10 text-primary-foreground" />
        </Link>
      </div>
    </header>
  );
}
