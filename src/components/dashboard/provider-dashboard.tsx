'use client';

import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Eye, Loader2, FileCheck2, Hourglass, UserRound, Handshake, Inbox } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  className?: string;
}

const StatItem = ({ icon: Icon, label, value, className }: StatItemProps) => (
  <div className="flex flex-col items-center justify-center p-2 text-center">
    <Icon className={cn("w-7 h-7 mb-2", className)} />
    <p className="text-xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);


export default function ProviderDashboard() {
  const { user, providers, reviews, agreements, isLoading } = useAuth();

  const provider = useMemo(() => {
    if (!user || !providers) return null;
    return providers.find(p => p.phone === user.phone);
  }, [user, providers]);

  const providerReviews = useMemo(() => {
    if (!provider || !reviews) return [];
    return reviews.filter(r => r.providerId === provider.id);
  }, [provider, reviews]);
  
  const uniqueCustomers = useMemo(() => {
    if(!providerReviews) return 0;
    const customerNames = providerReviews.map(r => r.authorName);
    return new Set(customerNames).size;
  }, [providerReviews]);

  const pendingAgreements = useMemo(() => {
    if (!agreements || !user) return 0;
    return agreements.filter(a => a.providerPhone === user.phone && a.status === 'pending').length;
  }, [agreements, user]);

  const confirmedAgreements = useMemo(() => {
    if (!agreements || !user) return 0;
    return agreements.filter(a => a.providerPhone === user.phone && a.status === 'confirmed').length;
  }, [agreements, user]);

  if (isLoading || !provider) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline font-bold">داشبورد هنرمند</h1>
        <p className="mt-2 text-lg text-muted-foreground">خوش آمدید، {provider.name}!</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>آمار کلی</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-2 md:grid-cols-4 items-center justify-around gap-4 text-center p-4 border rounded-lg">
            <div className="col-span-2 md:col-span-1 flex flex-col items-center justify-center p-2 border-b md:border-b-0 md:border-l">
              <StarRating rating={provider.rating} size="default" readOnly />
              <p className="text-2xl font-bold mt-2">{provider.rating.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">({provider.reviewsCount} نظر)</p>
            </div>
             <StatItem icon={Users} label="مشتریان" value={uniqueCustomers} className="text-blue-500" />
             <StatItem icon={FileCheck2} label="تایید شده" value={confirmedAgreements} className="text-green-500" />
             <StatItem icon={Hourglass} label="در انتظار" value={pendingAgreements} className="text-yellow-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>دسترسی سریع</CardTitle>
            <CardDescription>پروفایل، توافق‌ها و پیام‌های خود را مدیریت کنید.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <Button asChild size="lg" variant="outline">
             <Link href="/profile">
              <UserRound className="ml-2 text-primary" />
              مدیریت پروفایل
             </Link>
           </Button>
            <Button asChild size="lg" variant="outline">
             <Link href="/agreements">
              <Handshake className="ml-2 text-green-600" />
              مدیریت توافق‌ها
             </Link>
           </Button>
           <Button asChild size="lg" variant="outline">
             <Link href="/inbox">
              <Inbox className="ml-2 text-accent" />
              صندوق ورودی
             </Link>
           </Button>
        </CardContent>
         <CardFooter className="pt-6 border-t mt-6">
             <Button asChild className="w-full">
                <Link href={`/provider/${provider.id}`}>
                    <Eye className="w-4 h-4 ml-2" />
                    مشاهده پروفایل عمومی
                </Link>
            </Button>
         </CardFooter>
      </Card>
    </div>
  );
}
