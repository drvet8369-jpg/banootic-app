'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Inbox, User } from 'lucide-react';


export default function InboxPage() {
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  
  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center py-20 flex-grow">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 flex-grow">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="font-headline text-2xl">لطفا وارد شوید</h1>
        <p className="text-muted-foreground mt-2">برای مشاهده صندوق ورودی باید وارد حساب کاربری خود شوید.</p>
        <Button asChild className="mt-6">
          <Link href="/login">ورود به حساب کاربری</Link>
        </Button>
      </div>
    );
  }
  
   return (
     <div className="max-w-4xl mx-auto py-12">
      <Card>
          <CardHeader>
              <CardTitle className="font-headline text-3xl">صندوق ورودی پیام‌ها</CardTitle>
               <CardDescription>
                  این بخش در حال حاضر در دست توسعه است.
              </CardDescription>
          </CardHeader>
          <CardContent>
               <div className="text-center py-20 border-2 border-dashed rounded-lg">
                  <Inbox className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-bold text-xl">صندوق ورودی شما خالی است</h3>
                  <p className="text-muted-foreground mt-2">
                      ما در حال کار بر روی یک سیستم چت جدید و پایدار هستیم.
                  </p>
                   {user?.accountType === 'customer' && (
                      <Button asChild className="mt-6">
                          <Link href="/">مشاهده هنرمندان</Link>
                      </Button>
                  )}
              </div>
          </CardContent>
      </Card>
     </div>
   )
}
