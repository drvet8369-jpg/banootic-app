'use client';

import Link from 'next/link';
import { Logo } from './logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { isLoggedIn, user, dispatch } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    router.push('/');
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Left Side: Actions */}
        <div className="flex items-center gap-2">
            {isLoggedIn ? (
                 <div className="flex items-center gap-4">
                    <span className="text-sm font-medium hidden sm:inline">خوش آمدید، {user?.name}</span>
                    <Button onClick={handleLogout} variant="outline" size="sm">خروج</Button>
                </div>
            ) : (
                 <div className="flex items-center gap-2">
                    <Button asChild>
                        <Link href="/login">ورود</Link>
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href="/register">ثبت‌نام</Link>
                    </Button>
                </div>
            )}
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
