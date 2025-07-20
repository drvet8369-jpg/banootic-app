
'use client';

import { providers } from '@/lib/data';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormEvent, useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { sendMessage } from '@/ai/flows/sendMessage';
import { useToast } from '@/hooks/use-toast';
import type { Provider } from '@/lib/types';


interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
}

// Helper to build a cache of provider details for quick lookups
const providerDetailsCache = new Map<string, Provider>();
providers.forEach(p => {
    // Store providers by their ID (as string) for easy lookup from URL params
    providerDetailsCache.set(p.id.toString(), p);
    // Also store by phone number for easy lookup from chat members array
    providerDetailsCache.set(p.phone, p);
});


export default function ChatPage() {
  const params = useParams();
  const otherPersonIdOrProviderId = params.providerId as string; // This can be a provider ID or a customer phone number
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [otherPersonDetails, setOtherPersonDetails] = useState<Provider | { name: string, phone: string, portfolio?: { src: string }[] } | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive the other person's phone number and the chat ID
  // This logic is now robust enough to work as soon as `user` is available.
  const otherPersonPhone = otherPersonDetails?.phone ?? otherPersonIdOrProviderId;
  const chatId = user ? [user.phone, otherPersonPhone].sort().join('_') : null;
  
  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }

  useEffect(() => {
    // This effect finds the details of the other person in the chat.
    // It runs whenever the ID from the URL changes.
    const details = providerDetailsCache.get(otherPersonIdOrProviderId);
    if (details) {
      // The other person is a known provider (looked up by ID or phone).
      setOtherPersonDetails(details);
    } else {
      // The other person is a customer. The `otherPersonIdOrProviderId` IS their phone number.
      setOtherPersonDetails({ name: `مشتری ${otherPersonIdOrProviderId.slice(-4)}`, phone: otherPersonIdOrProviderId, portfolio: [] });
    }
  }, [otherPersonIdOrProviderId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // This effect subscribes to message updates from Firestore.
    // It only runs when `chatId` is available.
    if (!chatId) {
       // If we don't have a chatId yet (e.g., user is not logged in), we stop loading.
       setIsLoading(false);
       return;
    };

    setIsLoading(true);
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching messages:", error);
        toast({ title: "خطا", description: "دریافت پیام‌ها با مشکل مواجه شد.", variant: "destructive" });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, toast]);


  if (!isLoggedIn || !user) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-20">
            <User className="w-16 h-16 text-muted-foreground mb-4" />
            <h1 className="font-headline text-2xl">لطفا وارد شوید</h1>
            <p className="text-muted-foreground mt-2">برای ارسال پیام باید وارد حساب کاربری خود شوید.</p>
            <Button asChild className="mt-6">
                <Link href="/login">ورود به حساب کاربری</Link>
            </Button>
        </div>
    );
  }

  if (isLoading) {
     return (
        <div className="flex flex-col items-center justify-center h-full py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">در حال بارگذاری گفتگو...</p>
        </div>
    );
  }
  
  if (!otherPersonDetails) {
     // This state should ideally not be reached if the logic above is correct, but it's a good fallback.
     return (
        <div className="flex flex-col items-center justify-center h-full py-20">
            <User className="w-8 h-8 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">در حال بارگذاری اطلاعات کاربر...</p>
        </div>
    );
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || isSending || !otherPersonDetails) return;

    setIsSending(true);
    
    // The receiverId is always the phone number of the other person.
    const receiverId = otherPersonDetails.phone;

    try {
        const result = await sendMessage({
            chatId: chatId,
            text: newMessage,
            senderId: user.phone,
            receiverId: receiverId,
        });
        
        if(result.success) {
            setNewMessage('');
        } else {
            console.error("Failed to send message:", result.error);
            toast({ title: "خطا", description: `پیام ارسال نشد: ${result.error}`, variant: "destructive" });
        }

    } catch(error) {
        console.error("Error in handleSubmit:", error);
         toast({ title: "خطا", description: "یک خطای پیش‌بینی نشده در ارسال پیام رخ داد.", variant: "destructive" });
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-2xl mx-auto py-8">
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4 border-b">
           <Link href={user.accountType === 'provider' ? '/inbox' : `/provider/${otherPersonIdOrProviderId}`}>
             <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5"/>
             </Button>
           </Link>
           <Avatar>
            {otherPersonDetails.portfolio && otherPersonDetails.portfolio.length > 0 ? (
                <AvatarImage src={otherPersonDetails.portfolio[0].src} alt={otherPersonDetails.name} />
            ) : null }
            <AvatarFallback>{getInitials(otherPersonDetails.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{otherPersonDetails.name}</CardTitle>
            <CardDescription>گفتگوی مستقیم</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-6 space-y-4 overflow-y-auto">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground p-8">
                <p>هنوز پیامی رد و بدل نشده است.</p>
                <p className="text-xs mt-2">شما اولین پیام را ارسال کنید.</p>
              </div>
            )}
            {messages.map((message) => {
                const isSender = message.senderId === user.phone;
                return (
                  <div 
                    key={message.id} 
                    className={`flex items-end gap-2 ${isSender ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isSender && (
                      <Avatar className="h-8 w-8">
                          {otherPersonDetails.portfolio && otherPersonDetails.portfolio.length > 0 ? (
                              <AvatarImage src={otherPersonDetails.portfolio[0].src} alt={otherPersonDetails.name} />
                          ) : null }
                          <AvatarFallback>{getInitials(otherPersonDetails.name)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${isSender ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm">{message.text}</p>
                    </div>
                     {isSender && (
                       <Avatar className="h-8 w-8">
                          <AvatarFallback>شما</AvatarFallback>
                      </Avatar>
                    )}
                </div>
                )
            })}
            <div ref={messagesEndRef} />
        </CardContent>
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="پیام خود را بنویسید..." 
              className="pr-12"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isSending}
            />
            <Button size="icon" type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isSending || !newMessage.trim()}>
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
