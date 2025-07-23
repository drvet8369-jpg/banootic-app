
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet';
import { Menu, LogOut, Home, LogIn, UserPlus, UserCircle, Briefcase, UserRound, Inbox, RefreshCw, Search, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Logo } from './logo';
import { useState, useMemo, useRef, useEffect } from 'react';
import { providers, services } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { usePathname } from 'next/navigation';


interface SearchResult {
  providers: typeof providers;
  services: typeof services;
}

const SearchBar = ({ onResultClick }: { onResultClick?: () => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchResults: SearchResult = useMemo(() => {
    if (!searchQuery.trim()) {
      return { providers: [], services: [] };
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    const filteredProviders = providers.filter(provider =>
      provider.name.toLowerCase().includes(lowercasedQuery) ||
      provider.service.toLowerCase().includes(lowercasedQuery)
    );
    const filteredServices = services.filter(service =>
      service.name.toLowerCase().includes(lowercasedQuery)
    );
    return { providers: filteredProviders, services: filteredServices };
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onResultClick?.();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const showResults = isFocused && searchQuery.trim().length > 0;

  return (
    <div className="relative w-full md:w-64" ref={searchRef}>
      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="جستجو..."
        className="w-full h-9 pr-10"
        value={searchQuery}
        onChange={handleSearchChange}
        onFocus={() => setIsFocused(true)}
      />
      {showResults && (
        <div className="absolute top-full mt-2 w-full z-50">
          <Card>
            <CardContent className="p-2 max-h-80 overflow-y-auto">
              {(searchResults.providers.length === 0 && searchResults.services.length === 0) ? (
                <p className="p-4 text-center text-sm text-muted-foreground">هیچ نتیجه‌ای یافت نشد.</p>
              ) : (
                <ul className="space-y-1">
                  {searchResults.providers.length > 0 && (
                     <li className="text-xs font-semibold text-muted-foreground px-2 pt-1">هنرمندان</li>
                  )}
                  {searchResults.providers.map(provider => (
                    <li key={`p-${provider.id}`} onClick={clearSearch}>
                      <Link href={`/provider/${provider.id}`}>
                         <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                            <User className="h-4 w-4 text-accent" />
                            <div className="flex-grow">
                                <p className="text-sm font-semibold">{provider.name}</p>
                                <p className="text-xs text-muted-foreground">{provider.service}</p>
                            </div>
                         </div>
                      </Link>
                    </li>
                  ))}
                  {searchResults.services.length > 0 && (
                     <li className="text-xs font-semibold text-muted-foreground px-2 pt-2">خدمات</li>
                  )}
                   {searchResults.services.map(service => (
                    <li key={`s-${service.slug}`} onClick={clearSearch}>
                       <Link href={`/services/${service.categorySlug}/${service.slug}`}>
                         <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                            <Briefcase className="h-4 w-4 text-accent" />
                            <p className="text-sm font-semibold">{service.name}</p>
                         </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};


export default function Header() {
  const { isLoggedIn, user, logout, switchAccountType } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsSheetOpen(false);
  }, [pathname]);

  const getInitials = (name: string) => {
    if (!name) return 'کاربر';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }
  
  const switchRoleText = user?.accountType === 'provider' 
    ? "تغییر به حساب مشتری" 
    : "تغییر به حساب هنرمند";


  const MobileNavMenu = () => (
    <div className="flex flex-col h-full">
       <SheetTitle className="sr-only">منوی اصلی</SheetTitle>
      <div className="p-4 border-b flex flex-col gap-4">
         <Link href="/" className="flex items-center gap-2">
           <Logo className="h-8 w-8 text-primary-foreground" />
           <span className="font-display text-2xl font-bold">هنربانو</span>
        </Link>
        <SearchBar onResultClick={() => setIsSheetOpen(false)} />
      </div>

      <nav className="flex-grow p-4 space-y-2">
        <SheetClose asChild>
          <Link href="/#categories" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted">
            <Briefcase className="h-5 w-5" />
            مشاهده خدمات
          </Link>
        </SheetClose>
        {isLoggedIn && user?.accountType === 'provider' && (
           <>
             <SheetClose asChild>
              <Link href="/profile" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted">
                 <UserRound className="h-5 w-5" />
                 پروفایل من
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link href="/inbox" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary-foreground hover:bg-muted">
                 <Inbox className="h-5 w-5" />
                 صندوق ورودی
              </Link>
            </SheetClose>
           </>
        )}
        {!isLoggedIn && (
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
              <Button onClick={switchAccountType} variant="outline" className="w-full justify-start mb-2">
                  <RefreshCw className="ml-2 h-5 w-5" />
                  {switchRoleText}
              </Button>
            </SheetClose>
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
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary-foreground" />
          <span className="font-display text-2xl font-bold whitespace-nowrap">هنربانو</span>
        </Link>
        
        <div className="flex-1 flex justify-start items-center md:gap-6">
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link href="/#categories" className="transition-colors hover:text-foreground/80 text-foreground/60">خدمات</Link>
            </nav>
            <div className="hidden md:block">
               <SearchBar />
            </div>
        </div>

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
                 {user.accountType === 'provider' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                          <UserRound className="ml-2 h-4 w-4" />
                          <span>پروفایل من</span>
                      </Link>
                    </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                      <Link href="/inbox">
                          <Inbox className="ml-2 h-4 w-4" />
                          <span>صندوق ورودی</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={switchAccountType}>
                  <RefreshCw className="ml-2 h-4 w-4" />
                  <span>{switchRoleText}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
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
    </header>
  );
}
