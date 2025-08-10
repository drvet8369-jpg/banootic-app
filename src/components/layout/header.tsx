
'use client';

import Link from 'next/link';
import { Logo } from './logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Menu, LogOut, LogIn, UserPlus } from 'lucide-react';
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
import { useRouter } from 'next/navigation';

export default function Header() {
  const { isLoggedIn, user, logout } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return '..';
    const names = name.split(' ');
    if (names.length > 1 && names[1] && !/^\d+$/.test(names[1])) {
        return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }

  const MobileNavMenu = () => (
    <div className="flex flex-col h-full">
      <SheetHeader className="p-4 border-b">
         <SheetClose asChild>
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-8 text-foreground" />
              <span className="font-display text-2xl font-bold">هنربانو</span>
            </Link>
         </SheetClose>
      </SheetHeader>
      <nav className="flex-grow p-4 space-y-2">
        {isLoggedIn && user ? (
           <>
             {/* Mobile nav items for logged in user can be added here */}
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
              <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.phone}</span>
              </div>
            </div>
            <SheetClose asChild>
              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start">
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
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="start" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.phone}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Logged in user menu items */}
                    <DropdownMenuItem asChild>
                      <Link href={user.accountType === 'provider' ? '/profile' : '/requests'}>
                        داشبورد
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <Link href="/inbox">صندوق ورودی</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="ml-2 h-4 w-4" />
                        <span>خروج</span>
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
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">باز کردن منو</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[300px] sm:w-[340px]">
                    <MobileNavMenu />
                </SheetContent>
                </Sheet>
            </div>
        </div>

        {/* Right Side: Branding */}
        <Link href="/" className="flex items-center gap-2">
            <span className="hidden sm:inline-block font-display text-2xl font-bold whitespace-nowrap">هنربانو</span>
            <Logo className="h-10 w-10 text-foreground" />
        </Link>
      </div>
    </header>
  );
}
