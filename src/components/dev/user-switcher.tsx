
'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { User, Users, GripVertical } from 'lucide-react';
import React, from 'react';

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
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const { login, logout, user } = useAuth();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 20, y: 20 });
  const relPosRef = React.useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const savedPosition = localStorage.getItem('user-switcher-position');
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    } else {
       const defaultX = window.innerWidth - 380;
       const defaultY = window.innerHeight - 200;
       setPosition({ x: defaultX > 20 ? defaultX : 20, y: defaultY > 20 ? defaultY : 20 });
    }
  }, []);

  React.useEffect(() => {
    localStorage.setItem('user-switcher-position', JSON.stringify(position));
  }, [position]);

  const onDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!panelRef.current) return;
    setIsDragging(true);

    let pageX, pageY;
    if ('touches' in e) {
        pageX = e.touches[0].pageX;
        pageY = e.touches[0].pageY;
    } else {
        if (e.button !== 0) return;
        pageX = e.pageX;
        pageY = e.pageY;
    }

    const { top, left } = panelRef.current.getBoundingClientRect();
    relPosRef.current = {
      x: pageX - left,
      y: pageY - top,
    };
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };
  
  const onDragMove = React.useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    let pageX, pageY;
    if ('touches' in e) {
        pageX = e.touches[0].pageX;
        pageY = e.touches[0].pageY;
    } else {
        pageX = e.pageX;
        pageY = e.pageY;
    }

    setPosition({
      x: pageX - relPosRef.current.x,
      y: pageY - relPosRef.current.y,
    });

  }, [isDragging]);


  React.useEffect(() => {
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove);
    document.addEventListener('touchend', onDragEnd);

    return () => {
      document.removeEventListener('mousemove', onDragMove);
      document.removeEventListener('mouseup', onDragEnd);
      document.removeEventListener('touchmove', onDragMove);
      document.removeEventListener('touchend', onDragEnd);
    };
  }, [onDragMove]);

  return (
    <div
      ref={panelRef}
      className="fixed bg-yellow-300/90 backdrop-blur-sm p-4 border border-yellow-400 z-[100] shadow-lg rounded-lg w-[360px] touch-none"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div
        className="flex items-center justify-between cursor-move pb-3 border-b border-yellow-400/50"
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
      >
        <h4 className="font-bold text-sm text-yellow-900 select-none">پنل تست توسعه‌دهنده</h4>
        <GripVertical className="h-5 w-5 text-yellow-800" />
      </div>

      <div className="pt-3">
        <div className="text-center sm:text-right mb-4">
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
            className="bg-white/80 border-yellow-500 text-yellow-900 hover:bg-white w-full"
            onClick={() => login(TEST_CUSTOMER)}
          >
            <User className="ml-2 h-4 w-4" />
            ورود (مشتری)
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-white/80 border-yellow-500 text-yellow-900 hover:bg-white w-full"
            onClick={() => login(TEST_PROVIDER)}
          >
            <Users className="ml-2 h-4 w-4" />
            ورود (هنرمند)
          </Button>
        </div>
        <Button
            size="sm"
            variant="ghost"
            className="text-yellow-900 hover:bg-yellow-400/50 w-full mt-2"
            onClick={() => logout()}
          >
            خروج
          </Button>
      </div>
    </div>
  );
}
