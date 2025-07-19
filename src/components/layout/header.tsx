
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { Menu, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


export default function Header() {
  const { isLoggedIn, user, logout } = useAuth();

  const getInitials = (name: string) => {
    if (!name) return 'کاربر';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="هنربانو لوگو" width={32} height={32} className="h-8 w-8" />
          <span className="font-display text-2xl font-bold whitespace-nowrap">هنربانو</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
          <Link href="/#categories" className="transition-colors hover:text-foreground/80 text-foreground/60">خدمات</Link>
          
          {isLoggedIn && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.phone}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="ml-2 h-4 w-4" />
                  <span>خروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="secondary">
                 <Link href="/register">عضویت و ارائه خدمات</Link>
              </Button>
              <Button asChild>
                 <Link href="/login">ورود</Link>
              </Button>
            </>
          )}

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
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col h-full">
                <div className="p-6 border-b">
                   <Link href="/" className="flex items-center gap-2">
                     <Image src="/logo.png" alt="هنربانو لوگو" width={32} height={32} className="h-8 w-8" />
                    <span className="font-display text-2xl font-bold">هنربانو</span>
                  </Link>
                </div>
                <nav className="grid gap-4 p-6 flex-grow">
                   <SheetClose asChild>
                     <Link href="/#categories" className="py-2 text-lg font-medium">خدمات</Link>
                   </SheetClose>
                  {isLoggedIn && user ? (
                     <SheetClose asChild>
                       <Link href="/register" className="py-2 text-lg font-medium">ارائه خدمات</Link>
                    </SheetClose>
                  ) : (
                    <>
                       <SheetClose asChild>
                         <Link href="/register" className="py-2 text-lg font-medium">عضویت</Link>
                       </SheetClose>
                       <SheetClose asChild>
                        <Link href="/login" className="py-2 text-lg font-medium">ورود</Link>
                       </SheetClose>
                    </>
                  )}
                </nav>
                 {isLoggedIn && (
                  <div className="border-t p-6">
                     <Button onClick={() => {
                        const sheetClose = document.querySelector('[data-radix-dialog-close]');
                        if (sheetClose) {
                          (sheetClose as HTMLElement).click();
                        }
                        logout();
                      }} 
                      variant="ghost" 
                      className="w-full justify-start p-0 text-lg font-medium">
                        <LogOut className="ml-2 h-5 w-5" />
                        خروج
                      </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
