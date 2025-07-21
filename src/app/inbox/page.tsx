
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Inbox, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { providers } from '@/lib/data';

interface Chat {
  id: string;
  otherMemberName: string;
  otherMemberId: string;
  lastMessage: string;
  updatedAt: Date;
}

const getUserDetails = (phone: string): { name: string } => {
    const provider = providers.find(p => p.phone === phone);
    if (provider) {
        return { name: provider.name };
    }
    // In a real app, you might fetch customer names from a users collection
    return { name: `مشتری ${phone.slice(-4)}` };
};

export default function InboxPage() {
  const { user, isLoggedIn } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getInitials = useCallback((name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[1] && !/^\d+$/.test(names[1])) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !user?.phone) {
      setIsLoading(false);
      setChats([]);
      return;
    }
    
    // Set loading to true only at the beginning of the effect
    setIsLoading(true);

    const chatsQuery = query(
      collection(db, 'chats'), 
      where('members', 'array-contains', user.phone),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, (querySnapshot) => {
      setError(null);
      
      const allChats = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const otherMemberId = data.members.find((id: string) => id !== user.phone) || 'unknown';
          const otherMemberDetails = getUserDetails(otherMemberId);
          const updatedAt = (data.updatedAt as Timestamp)?.toDate() ?? new Date();
          
          return {
              id: doc.id,
              otherMemberId: otherMemberId,
              otherMemberName: otherMemberDetails.name,
              lastMessage: data.lastMessage || '',
              updatedAt: updatedAt,
          };
      });
      setChats(allChats);
      // Set loading to false after the first data fetch
      setIsLoading(false);

    }, (err) => {
      console.error("Error fetching real-time chats:", err);
      setError('یک خطای پیش‌بینی نشده در دریافت گفتگوها رخ داد.');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, isLoggedIn]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!isLoggedIn || !user) {
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
  
   if (user.accountType !== 'provider') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <Inbox className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="font-headline text-2xl">صفحه مخصوص هنرمندان</h1>
        <p className="text-muted-foreground mt-2">این صفحه فقط برای ارائه‌دهندگان خدمات (هنرمندان) در دسترس است. برای مشاهده، لطفاً نقش خود را به هنرمند تغییر دهید.</p>
        <Button asChild className="mt-6">
          <Link href="/">بازگشت به صفحه اصلی</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">صندوق ورودی پیام‌ها</CardTitle>
          <CardDescription>آخرین گفتگوهای خود با مشتریان را در اینجا مشاهده کنید. این صفحه به صورت خودکار به‌روز می‌شود.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-20 text-destructive bg-destructive/10 rounded-lg">
              <p>{error}</p>
            </div>
          )}
          {!error && chats.length === 0 && (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
              <Inbox className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-bold text-xl">صندوق ورودی شما خالی است</h3>
              <p className="text-muted-foreground mt-2">وقتی پیامی از مشتریان دریافت کنید، در اینجا نمایش داده می‌شود.</p>
            </div>
          )}
          {!error && chats.length > 0 && (
            <div className="space-y-4">
              {chats.map((chat) => (
                <Link href={`/chat/${chat.otherMemberId}`} key={chat.id}>
                    <div className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <Avatar className="h-12 w-12 ml-4">
                            <AvatarFallback>{getInitials(chat.otherMemberName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow overflow-hidden">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold">{chat.otherMemberName}</h4>
                                <p className="text-xs text-muted-foreground flex-shrink-0">
                                    {formatDistanceToNow(chat.updatedAt, { addSuffix: true, locale: faIR })}
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                        </div>
                    </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

    