
'use client';

import { providers } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
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

interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
}

// Simple cache for provider details to avoid repeated lookups
// In a real app, this might be part of a context or a more robust data fetching layer
const providerDetailsCache = new Map<string, { name: string; portfolioSrc?: string }>();

providers.forEach(p => {
    providerDetailsCache.set(p.id.toString(), { name: p.name, portfolioSrc: p.portfolio?.[0]?.src });
});


export default function ChatPage() {
  const params = useParams<{ providerId: string }>();
  const providerId = params.providerId as string;
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [providerDetails, setProviderDetails] = useState<{ name: string; portfolioSrc?: string } | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Derive a unique and consistent chat ID.
  // The chat ID is between the current user and the providerId from the URL.
  const chatId = user ? [user.phone, providerId].sort().join('_') : null;
  
  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }

  useEffect(() => {
    // Determine whose details we need to show at the top of the chat.
    // It's always the *other* person in the chat.
    if (user) {
        // If the logged-in user is a provider, the chat is with a customer.
        // We need to fetch the customer's details.
        if (user.phone === providerId) {
             // This case should ideally not happen from the UI, but handle it gracefully.
             // You can't chat with yourself.
             // For now, let's assume the providerId is always the other person.
        } else {
             const details = providerDetailsCache.get(providerId);
             if (details) {
                setProviderDetails(details);
             } else {
                // In a real app, you might fetch this from a 'users' collection
                setProviderDetails({ name: `مشتری ${providerId.slice(-4)}` });
             }
        }
    }
  }, [user, providerId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!chatId) return;
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

  if (!providerId || !providerDetails) {
     return (
        <div className="flex justify-center items-center h-full py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
    );
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || isSending) return;

    setIsSending(true);
    
    try {
        const result = await sendMessage({
            chatId: chatId,
            text: newMessage,
            senderId: user.phone,
            receiverId: providerId,
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
           <Link href={user.accountType === 'provider' ? '/inbox' : `/provider/${providerId}`}>
             <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5"/>
             </Button>
           </Link>
           <Avatar>
            {providerDetails.portfolioSrc ? (
                <AvatarImage src={providerDetails.portfolioSrc} alt={providerDetails.name} />
            ) : null }
            <AvatarFallback>{getInitials(providerDetails.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{providerDetails.name}</CardTitle>
            <CardDescription>گفتگوی مستقیم</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-6 space-y-4 overflow-y-auto">
            {isLoading && (
                 <div className="flex justify-center items-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            )}
            {!isLoading && messages.length === 0 && (
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
                          {providerDetails.portfolioSrc ? (
                              <AvatarImage src={providerDetails.portfolioSrc} alt={providerDetails.name} />
                          ) : null }
                          <AvatarFallback>{getInitials(providerDetails.name)}</AvatarFallback>
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
