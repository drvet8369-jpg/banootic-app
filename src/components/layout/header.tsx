
// This component is now a Server Component by default, which is more performant.
// It gets the user session directly from Supabase on the server.

import Link from 'next/link';
import { Logo } from './logo';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { logout as logoutAction } from './actions';
import { UserRound, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MobileNav } from './mobile-nav'; // Mobile nav is extracted to a client component
import { unstable_noStore as noStore } from 'next/cache';

const getInitials = (name: string) => {
  if (!name) return '..';
  const names = name.split(' ');
  if (names.length > 1 && names[1]) {
    return `${names[0][0]}${names[1][0]}`;
  }
  return name.substring(0, 2);
}

export default async function Header() {
  noStore(); // Ensure the header is always dynamic
  const supabase = createClient();
  const { data: { user: sessionUser } } = await supabase.auth.getUser();
  
  let userProfile = null;
  if (sessionUser) {
    const { data } = await supabase.from('profiles').select('*').eq('id', sessionUser.id).single();
    userProfile = data;
  }

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
                        <AvatarFallback>{getInitials(userProfile.full_name || '')}</AvatarFallback>
                        </Avatar>
                        {/* InboxBadge can be added here later if needed */}
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
