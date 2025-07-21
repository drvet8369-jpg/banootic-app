
'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { User, Users, GripVertical } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

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
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [rel, setRel] = useState({ x: 0, y: 0 }); // relative position of mouse in panel

  // Load position from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('user-switcher-position');
    if (savedPosition) {
      setPosition(JSON.parse(savedPosition));
    } else {
      // Default position if not saved
       const defaultX = window.innerWidth - 380; // Default to right corner
       const defaultY = window.innerHeight - 200;
       setPosition({ x: defaultX > 20 ? defaultX : 20, y: defaultY > 20 ? defaultY : 20 });
    }
  }, []);

  // Save position to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('user-switcher-position', JSON.stringify(position));
  }, [position]);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !panelRef.current) return;
    const { top, left } = panelRef.current.getBoundingClientRect();
    setIsDragging(true);
    setRel({
      x: e.pageX - left,
      y: e.pageY - top,
    });
    e.preventDefault();
  };

  const onMouseUp = (e: MouseEvent) => {
    setIsDragging(false);
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging || !panelRef.current) return;
    setPosition({
      x: e.pageX - rel.x,
      y: e.pageY - rel.y,
    });
    e.preventDefault();
  };
  
  // Touch event handlers for mobile
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!panelRef.current) return;
    const touch = e.touches[0];
    const { top, left } = panelRef.current.getBoundingClientRect();
    setIsDragging(true);
    setRel({
      x: touch.pageX - left,
      y: touch.pageY - top,
    });
  }
  
  const onTouchMove = (e: TouchEvent) => {
    if (!isDragging || !panelRef.current) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.pageX - rel.x,
      y: touch.pageY - rel.y,
    });
  }

  const onTouchEnd = () => {
    setIsDragging(false);
  }


  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);

  return (
    <div
      ref={panelRef}
      className="fixed bg-yellow-300/90 backdrop-blur-sm p-4 border border-yellow-400 z-[100] shadow-lg rounded-lg w-[360px]"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div
        className="flex items-center justify-between cursor-move pb-3 border-b border-yellow-400/50"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
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
