
'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { User, Users } from 'lucide-react';

const TEST_CUSTOMER = {
  name: 'آقای رضایی (مشتری تستی)',
  phone: '09121112233', 
  accountType: 'customer' as 'customer' | 'provider',
};

const TEST_PROVIDER = {
  name: 'سالن زیبایی سارا (هنرمند تستی)',
  phone: '09353847484', // Phone number of an existing provider
  accountType: 'provider' as 'customer' | 'provider',
};

export default function UserSwitcher() {
  // This component will not be rendered in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const { login, logout, user } = useAuth();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-300/80 backdrop-blur-sm p-2 border-t border-yellow-400 z-[100] shadow-lg">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-right">
          <h4 className="font-bold text-sm text-yellow-900">پنل تست توسعه‌دهنده</h4>
          {user ? (
            <p className="text-xs text-yellow-800">
              شما با حساب <span className="font-semibold">{user.name}</span> وارد شده‌اید.
            </p>
          ) : (
            <p className="text-xs text-yellow-800">شما وارد نشده‌اید.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
           <Button 
                size="sm" 
                variant="outline"
                className="bg-white/80 border-yellow-500 text-yellow-900 hover:bg-white"
                onClick={() => login(TEST_CUSTOMER)}>
                <User className="ml-2 h-4 w-4" />
                ورود (مشتری)
            </Button>
           <Button 
                size="sm" 
                variant="outline"
                className="bg-white/80 border-yellow-500 text-yellow-900 hover:bg-white"
                onClick={() => login(TEST_PROVIDER)}>
                <Users className="ml-2 h-4 w-4" />
                ورود (هنرمند)
            </Button>
             <Button
                size="sm"
                variant="ghost"
                className="text-yellow-900 hover:bg-yellow-400/50"
                onClick={() => logout()}
            >
                خروج
            </Button>
        </div>
      </div>
    </div>
  );
}
