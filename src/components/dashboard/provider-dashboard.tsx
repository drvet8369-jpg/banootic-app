'use client';

import { useAuth } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Users, Handshake, Eye, Inbox, UserRound, Loader2, FileCheck2 } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  colorClass: string;
}

const StatCard = ({ icon: Icon, title, value, colorClass }: StatCardProps) => (
  <div className="flex flex-col items-center justify-center p-4 text-center">
    <Icon className={cn("w-8 h-8 mb-2", colorClass)} />
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground">{title}</p>
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
          <CardDescription>نمای کلی از عملکرد شما در پلتفرم.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x">
          <div className="flex flex-col items-center justify-center p-4 text-center">
              <StarRating rating={provider.rating} reviewsCount={provider.reviewsCount} readOnly />
              <p className="text-2xl font-bold mt-2">{provider.rating.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">امتیاز کل</p>
          </div>
          <StatCard icon={Users} title="مشتریان" value={uniqueCustomers} colorClass="text-blue-500" />
          <StatCard icon={FileCheck2} title="توافق‌های تایید شده" value={agreements.filter(a=>a.providerPhone === user?.phone && a.status === 'confirmed').length} colorClass="text-green-500" />
          <StatCard icon={Handshake} title="توافق‌های در انتظار" value={pendingAgreements} colorClass="text-yellow-500" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>میانبرهای مدیریتی</CardTitle>
          <CardDescription>به سرعت به بخش‌های مهم پروفایل خود دسترسی پیدا کنید.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button asChild size="lg" variant="outline">
            <Link href="/profile">
              <UserRound className="ml-2" />
              مدیریت پروفایل
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/agreements">
              <Handshake className="ml-2" />
              مدیریت توافق‌ها
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/inbox">
              <Inbox className="ml-2" />
              صندوق ورودی
            </Link>
          </Button>
        </CardContent>
         <CardFooter className="pt-6">
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