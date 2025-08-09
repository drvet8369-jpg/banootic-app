'use client';

import { useAuth } from '@/context/AuthContext';
import dynamic from 'next/dynamic';

const Logo = dynamic(() => import('@/components/layout/logo').then(mod => mod.Logo), { ssr: false });
const CustomerDashboard = dynamic(() => import('@/components/dashboard/customer-dashboard'), { ssr: false });
const ProviderDashboard = dynamic(() => import('@/components/dashboard/provider-dashboard'), { ssr: false });

export default function Home() {
  const { isLoggedIn, user } = useAuth();

  const LandingPage = () => (
    <div className="flex flex-col items-center justify-center text-center py-20 lg:py-24 w-full">
      <Logo className="mx-auto mb-6 h-32 w-32 text-primary-foreground" />
      <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary-foreground to-accent-foreground/80">
        هنربانو
      </h1>
      <p className="mt-4 font-headline text-xl md:text-2xl text-primary-foreground">
        با دستان هنرمندت بدرخش
      </p>
      <p className="mt-4 text-lg md:text-xl text-primary-foreground max-w-2xl mx-auto">
        بانوان هنرمندی که خدمات خانگی در محله شما ارائه می‌دهند را کشف و حمایت کنید. از غذاهای خانگی خوشمزه تا صنایع دستی زیبا، بهترین هنرمندان محلی را اینجا پیدا کنید.
      </p>
    </div>
  );

  return (
    <div className="w-full py-8">
      {!isLoggedIn ? <LandingPage /> : (
        user?.accountType === 'provider' ? <ProviderDashboard /> : <CustomerDashboard />
      )}
    </div>
  );
}
