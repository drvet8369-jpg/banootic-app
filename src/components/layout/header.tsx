import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-headline text-xl font-bold whitespace-nowrap">دستبانو</span>
        </Link>

        <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
          <Link href="/#categories" className="transition-colors hover:text-foreground/80 text-foreground/60">خدمات</Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="transition-colors hover:text-foreground/80 text-foreground/60 px-2">
                ثبت‌نام
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/register-customer">ثبت‌نام مشتری</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/register">ثبت‌نام ارائه‌دهنده</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild variant="ghost">
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
              <div className="grid gap-6 p-6">
                <Link href="/" className="flex items-center gap-2">
                  <span className="font-headline text-xl font-bold">دستبانو</span>
                </Link>
                <nav className="grid gap-4">
                  <Link href="/#categories" className="py-2 text-lg font-medium">خدمات</Link>
                  <Link href="/register-customer" className="py-2 text-lg font-medium">ثبت‌نام مشتری</Link>
                  <Link href="/register" className="py-2 text-lg font-medium">ثبت‌نام ارائه‌دهنده</Link>
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
