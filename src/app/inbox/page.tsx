'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Inbox, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface Chat {
  id: string;
  otherMemberName: string;
  otherMemberId: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}

const getInitials = (name: string) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length > 1 && names[1] && isNaN(parseInt(names[1]))) {
    return `${names[0][0]}${names[1][0]}`;
  }
  return name.substring(0, 2);
};


export default function InboxPage() {
  const { user, isLoggedIn } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.phone) {
      setChats([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const allChatsData = JSON.parse(localStorage.getItem('inbox_chats') || '{}');
      
      const userChats = Object.values(allChatsData)
        .filter((chat: any) => chat.members?.includes(user.phone))
        .map((chat: any): Chat | null => {
            if (!chat.participants || !chat.members) return null;

            const otherMemberId = chat.members.find((id: string) => id !== user.phone);
            if (!otherMemberId) return null;
            
            const otherMemberInfo = chat.participants[otherMemberId];
            const selfInfo = chat.participants[user.phone];

            const otherMemberName = otherMemberInfo?.name || `کاربر ${otherMemberId.slice(-4)}`;

            return {
                id: chat.id,
                otherMemberId: otherMemberId,
                otherMemberName: otherMemberName,
                lastMessage: chat.lastMessage || '',
                updatedAt: chat.updatedAt,
                unreadCount: selfInfo?.unreadCount || 0,
            };
        })
        .filter((chat): chat is Chat => chat !== null)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
      setChats(userChats);
    } catch (e) {
      console.error("Failed to load chats from localStorage", e);
      setError('خطا در بارگذاری گفتگوهای موقت.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.phone]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!isLoggedIn) {
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
                    {user.accountType === 'customer' && (
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

  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">صندوق ورودی پیام‌ها</CardTitle>
          <CardDescription>آخرین گفتگوهای خود را در اینجا مشاهده کنید. پیام‌ها موقتا در مرورگر شما ذخیره می‌شوند.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-20 text-destructive bg-destructive/10 rounded-lg">
              <p>{error}</p>
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
                                  {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true, locale: faIR })}
                                </p>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-sm text-muted-foreground truncate font-semibold">{chat.lastMessage}</p>
                                {chat.unreadCount > 0 && (
                                    <Badge variant="destructive" className="flex-shrink-0">{chat.unreadCount}</Badge>
                                )}
                            </div>
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
