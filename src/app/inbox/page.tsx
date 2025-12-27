import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox, User } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';

// This is now a Server Component, which is more secure and efficient.
export default async function InboxPage() {
  noStore(); // Ensures the page is always dynamic and reflects the latest login state.

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If the user is not logged in, show the login prompt.
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="font-headline text-2xl">لطفا وارد شوید</h1>
        <p className="text-muted-foreground mt-2">برای مشاهده صندوق ورودی باید وارد حساب کاربری خود شوید.</p>
        <Button asChild className="mt-6">
          <Link href="/login">ورود به حساب کاربری</Link>
        </Button>
      </div>
    );
  }

  // TODO: Fetch real chat data from the database.
  // For now, we will just show the empty state since localStorage is no longer used.
  const chats: any[] = []; 
  const accountType = (await supabase.from('profiles').select('account_type').eq('id', user.id).single()).data?.account_type || 'customer';


  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">صندوق ورودی پیام‌ها</CardTitle>
          <CardDescription>
            {accountType === 'provider' 
              ? 'آخرین گفتگوهای خود با مشتریان را در اینجا مشاهده کنید.' 
              : 'آخرین گفتگوهای خود با هنرمندان را در اینجا مشاهده کنید.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-20 border-2 border-dashed rounded-lg">
            <Inbox className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold text-xl">صندوق ورودی شما خالی است</h3>
            <p className="text-muted-foreground mt-2">
              {accountType === 'provider'
                ? 'وقتی پیامی از مشتریان دریافت کنید، در اینجا نمایش داده می‌شود.'
                : 'برای شروع، یک هنرمند را پیدا کرده و به او پیام دهید.'}
            </p>
            {accountType === 'customer' && (
              <Button asChild className="mt-6">
                <Link href="/">مشاهده هنرمندان</Link>
              </Button>
            )}
             <p className="text-xs text-muted-foreground mt-8">
                (توجه: سیستم چت در حال حاضر در دست توسعه است و پیام‌های قبلی مبتنی بر حافظه موقت مرورگر بوده‌اند.)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
