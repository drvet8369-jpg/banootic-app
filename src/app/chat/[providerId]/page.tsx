'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowUp, Loader2, User, Edit, Save, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormEvent, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Message as MessageType } from '@/lib/types';
import { getProviderByPhone } from '@/lib/actions';
// Local storage has been completely removed in favor of a server-side solution.
// The chat functionality will be re-implemented later using a real-time database.

interface OtherPersonDetails {
    id: string;
    name: string;
    phone: string;
    profileImage?: { src: string; aiHint?: string };
}

export default function ChatPage() {
  const params = useParams();
  const otherPersonPhone = params.providerId as string;
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [otherPersonDetails, setOtherPersonDetails] = useState<OtherPersonDetails | null>(null);
  
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchOtherPersonDetails = async () => {
        const provider = await getProviderByPhone(otherPersonPhone);
        if (provider) {
            setOtherPersonDetails(provider);
        } else {
            // This is a chat with a customer. We'll get their name from the chat document later.
            setOtherPersonDetails({ id: otherPersonPhone, name: `مشتری ${otherPersonPhone.slice(-4)}`, phone: otherPersonPhone });
        }
    };
    fetchOtherPersonDetails();
  }, [otherPersonPhone, isLoggedIn]);


  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }
  
  const headerLink = user?.accountType === 'provider' ? '/inbox' : '/';
  
  if (isAuthLoading) {
     return (
        <div className="flex flex-col items-center justify-center h-full py-20 flex-grow">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-20 flex-grow">
            <User className="w-16 h-16 text-muted-foreground mb-4" />
            <h1 className="font-headline text-2xl">لطفا وارد شوید</h1>
            <p className="text-muted-foreground mt-2">برای ارسال پیام باید وارد حساب کاربری خود شوید.</p>
            <Button asChild className="mt-6">
                <Link href="/login">ورود به حساب کاربری</Link>
            </Button>
        </div>
    );
  }
  

  return (
    <div className="flex flex-col h-full py-4">
      <Card className="flex-1 flex flex-col w-full">
        <CardHeader className="flex flex-row items-center gap-4 border-b shrink-0">
           <Link href={headerLink}>
             <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5"/>
             </Button>
           </Link>
           <Avatar>
            {otherPersonDetails?.profileImage?.src ? (
                <AvatarImage src={otherPersonDetails.profileImage.src} alt={otherPersonDetails.name} />
            ) : null }
            <AvatarFallback>{getInitials(otherPersonDetails?.name ?? '?')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{otherPersonDetails?.name}</CardTitle>
            <CardDescription>{'چت (غیرفعال)'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 space-y-4 overflow-y-auto">
            <div className="text-center text-muted-foreground p-8">
              <p>قابلیت چت در حال حاضر در دست توسعه است.</p>
              <p className="text-xs mt-2">ما در حال انتقال به یک زیرساخت جدید برای ارائه یک تجربه گفتگوی پایدار و آنی هستیم.</p>
            </div>
        </CardContent>
        <div className="p-4 border-t bg-background shrink-0">
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2">
              <Input 
                type="text" 
                placeholder="چت غیرفعال است" 
                className="flex-1"
                disabled
              />
              <Button size="icon" type="submit" className="h-10 w-10 shrink-0" disabled>
                  <ArrowUp className="w-5 h-5" />
              </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
