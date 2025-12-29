
// This component is a Server Component, which is more performant.
// It gets the user session directly from Supabase on the server.

import Link from 'next/link';
import { Logo } from './logo';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { logout as logoutAction } from './actions';
import { UserRound, LogOut, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { InboxBadge } from './inbox-badge';
import { unstable_noStore as noStore } from 'next/cache';
import type { Profile } from '@/lib/types';


const getInitials = (name: string | null) => {
  if (!name) return '..';
  const names = name.split(' ');
  if (names.length > 1 && names[1]) {
    return `${names[0][0]}${names[1][0]}`;
  }
  return name.substring(0, 2);
}

function MobileNav({ userProfile, isLoggedIn }: { userProfile: Profile | null, isLoggedIn: boolean }) {
  if (!userProfile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
            <span className="sr-only">باز کردن منو</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="p-0 w-[300px] sm:w-[340px]">
          <div className="p-4 border-b">
            <SheetClose asChild>
              <Link href="/" className="flex items-center gap-2">
                <Logo className="h-8 w-8 text-primary-foreground" />
                <span className="font-display text-2xl font-bold">بانوتیک</span>
              </Link>
            </SheetClose>
          </div>
          <nav className="flex-grow p-4 space-y-2">
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
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
          <span className="sr-only">باز کردن منو</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0 w-[300px] sm:w-[340px]">
        <div className="flex flex-col h-full">
            <div className="p-4 border-b">
                <SheetClose asChild>
                    <Link href="/" className="flex items-center gap-2">
                    <Logo className="h-8 w-8 text-primary-foreground" />
                    <span className="font-display text-2xl font-bold">بانوتیک</span>
                    </Link>
                </SheetClose>
            </div>
            <nav className="flex-grow p-4 space-y-2">
                {isLoggedIn && userProfile ? (
                <>
                    {userProfile?.account_type === 'provider' && (
                        <SheetClose asChild>
                        <Link href="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted">
                            <UserRound className="h-5 w-5" />
                            پروفایل من
                        </Link>
                        </SheetClose>
                    )}
                    <SheetClose asChild>
                    <Link href="/inbox" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                        <span>صندوق ورودی</span>
                        <InboxBadge />
                    </Link>
                    </SheetClose>
                </>
                ) : null}
            </nav>
            {isLoggedIn && userProfile && (
                <div className="mt-auto p-4 border-t">
                    <div className="flex items-center gap-3 mb-4">
                    <Avatar>
                        <AvatarFallback>{getInitials(userProfile.full_name || '')}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-medium">{userProfile.full_name}</span>
                        <span className="text-xs text-muted-foreground">{userProfile.phone}</span>
                    </div>
                    </div>
                    <form action={logoutAction}>
                        <Button type="submit" variant="ghost" className="w-full justify-start">
                            <LogOut className="ml-2 h-5 w-5" />
                            خروج
                        </Button>
                     </form>
                </div>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}


export default async function Header() {
  noStore(); // Ensure the header is always dynamic and not cached
  const supabase = createClient();
  const { data: { user: sessionUser } } = await supabase.auth.getUser();
  
  let userProfile: Profile | null = null;
  if (sessionUser) {
    const { data } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).single();
    if(data) {
        userProfile = data;
    }
  }

  // A user is fully logged in only if they have a session AND a complete profile
  const isLoggedIn = !!sessionUser && !!userProfile?.full_name;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Left Side: Actions */}
        <div className="flex items-center gap-2">
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
                {isLoggedIn && userProfile ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar>
                        <AvatarFallback>{getInitials(userProfile.full_name)}</AvatarFallback>
                        </Avatar>
                        <InboxBadge isMenu />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userProfile.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{userProfile.phone}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userProfile.account_type === 'provider' && (
                        <DropdownMenuItem asChild>
                        <Link href="/profile">
                            <UserRound className="ml-2 h-4 w-4" />
                            <span>پروفایل من</span>
                        </Link>                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <Link href="/inbox" className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                            <span>صندوق ورودی</span>
                            <InboxBadge />
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <form action={logoutAction}>
                        <DropdownMenuItem asChild>
                            <button type="submit" className="w-full flex items-center cursor-pointer">
                                <LogOut className="ml-2 h-4 w-4" />
                                <span>خروج</span>
                            </button>
                        </DropdownMenuItem>
                    </form>
                    </DropdownMenuContent>
                </DropdownMenu>
                ) : (
                <>
                    <Button asChild>
                      <Link href="/login">ورود / ثبت‌نام</Link>
                    </Button>
                </>
                )}
            </nav>
            {/* Mobile Nav Trigger */}
            <div className="md:hidden">
                <MobileNav userProfile={userProfile} isLoggedIn={isLoggedIn} />
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
