
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Inbox, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Chat {
  id: string;
  otherMemberName: string;
  otherMemberId: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}


export default function InboxPage() {
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthLoading) {
        setIsLoading(true);
        return;
    }
    
    if (!user?.phone) {
      setChats([]);
      setIsLoading(false);
      return;
    }

    // Since localStorage logic is removed, we just show an empty list for now.
    setChats([]);
    setIsLoading(false);

  }, [user?.phone, isAuthLoading]);


  if (isLoading || isAuthLoading) {
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
  
  if (chats.length === 0 && !isLoading && !error) {
     return (
       <div className="max-w-4xl mx-auto py-12">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">صندوق ورودی پیام‌ها</CardTitle>
                 <CardDescription>
                    {user.accountType === 'provider' 
                        ? 'آخرین گفتگوهای خود با مشتریان را در اینجا مشاهده کنید.' 
                        : 'آخرین گفتگوهای خود با هنرمندان را در اینجا مشاهده کنید.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <Inbox className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-bold text-xl">صندوق ورودی شما خالی است</h3>
                    <p className="text-muted-foreground mt-2">
                        {user.accountType === 'provider'
                            ? 'وقتی پیامی از مشتریان دریافت کنید، در اینجا نمایش داده می‌شود.'
                            : 'برای شروع، یک هنرمند را پیدا کرده و به او پیام دهید.'}
                    </p>
                </div>
            </CardContent>
        </Card>
       </div>
     )
  }

  // This part is now effectively unreachable as chats state starts and stays as an empty array
  // but it's kept here for future re-integration with Supabase.
  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">صندوق ورودی پیام‌ها</CardTitle>
          <CardDescription>آخرین گفتگوهای خود را در اینجا مشاهده کنید.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* List rendering logic will be re-activated when connected to Supabase */}
        </CardContent>
      </Card>
    </div>
  );
}
