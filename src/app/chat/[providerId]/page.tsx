
'use client';

import { getProviderByPhone, sendMessage, getMessages } from '@/lib/api';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowUp, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormEvent, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Message, Provider } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface OtherPersonDetails {
    id: string | number;
    user_id: string;
    name: string;
    phone: string;
    profile_image?: { src: string; ai_hint?: string };
}

export default function ChatPage() {
  const params = useParams();
  const otherPersonPhone = params.providerId as string;
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [otherPersonDetails, setOtherPersonDetails] = useState<OtherPersonDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const getChatId = useCallback((userPhone?: string, otherPhone?: string) => {
    if (!userPhone || !otherPhone) return null;
    return [userPhone, otherPhone].sort().join('_');
  }, []);

  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) return `${names[0][0]}${names[1][0]}`;
    return name.substring(0, 2);
  };

  const chatId = getChatId(user?.phone, otherPersonPhone);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    try {
        const initialMessages = await getMessages(chatId);
        setMessages(initialMessages);
    } catch(e) {
        toast({ title: "خطا", description: "امکان بارگذاری پیام‌های قبلی وجود ندارد.", variant: "destructive" });
    }
  }, [chatId, toast]);

  useEffect(() => {
    if (chatId) {
      fetchMessages();
    }
  }, [fetchMessages, chatId]);

  useEffect(() => {
    if (!chatId || !user) return;
    
    const channel = supabase.channel(`chat_${chatId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
       }, 
       (payload) => {
         const newMessage = payload.new as Message;
         if (newMessage.sender_phone !== user.phone) {
           setMessages((currentMessages) => [...currentMessages, newMessage]);
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, supabase, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const setupChat = async () => {
      if (!isLoggedIn || !user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const provider = await getProviderByPhone(otherPersonPhone);
        if (provider) {
          setOtherPersonDetails(provider);
        } else {
          // This case handles when a provider messages a customer who isn't a provider themselves
          // We can create a temporary object for display
          setOtherPersonDetails({
            id: otherPersonPhone,
            user_id: '', 
            name: `کاربر ${otherPersonPhone.slice(-4)}`,
            phone: otherPersonPhone
          });
        }
      } catch (error) {
        toast({ title: "خطا", description: "امکان بارگذاری اطلاعات کاربر وجود ندارد.", variant: "destructive"});
      } finally {
        setIsLoading(false);
      }
    };
    if (!isAuthLoading) {
        setupChat();
    }
  }, [otherPersonPhone, isLoggedIn, user, toast, isAuthLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || isSending || !otherPersonDetails || !user || !chatId) return;

    setIsSending(true);
    
    const messagePayload = {
      chat_id: chatId,
      sender_phone: user.phone,
      receiver_phone: otherPersonDetails.phone,
      content,
    };

    // Optimistic UI update
    const tempUiMessage: Message = {
      ...messagePayload,
      id: Date.now().toString(), // Temporary ID
      created_at: new Date().toISOString(),
    };
    setMessages((currentMessages) => [...currentMessages, tempUiMessage]);
    setNewMessage('');
    
    try {
        await sendMessage(messagePayload);
    } catch(error) {
        toast({ title: 'خطا در ارسال', description: 'پیام شما ارسال نشد. لطفاً دوباره تلاش کنید.', variant: 'destructive'});
        // Revert optimistic update on failure
        setMessages((currentMessages) => currentMessages.filter(m => m.id !== tempUiMessage.id));
        setNewMessage(content); // Put message back in input box on error
    } finally {
        setIsSending(false);
    }
  };

  const getHeaderLink = () => user?.accountType === 'provider' ? '/inbox' : '/';

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
        <Button asChild className="mt-6"><Link href="/login">ورود به حساب کاربری</Link></Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full py-4 flex-grow">
      <Card className="flex-1 flex flex-col w-full">
        <CardHeader className="flex flex-row items-center gap-4 border-b shrink-0">
          <Link href={getHeaderLink()}><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5"/></Button></Link>
          <Avatar>
            {otherPersonDetails?.profile_image?.src ? <AvatarImage src={otherPersonDetails.profile_image.src} alt={otherPersonDetails.name} /> : null }
            <AvatarFallback>{getInitials(otherPersonDetails?.name ?? '')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{otherPersonDetails?.name}</CardTitle>
            <CardDescription>{'گفتگوی مستقیم'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 space-y-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              <p>این یک گفتگوی جدید است. اولین پیام را ارسال کنید.</p>
            </div>
          ) : (
            messages.map((message) => {
              const senderIsUser = message.sender_phone === user.phone;
              return (
                <div key={message.id} className={`flex items-end gap-2 group ${senderIsUser ? 'justify-end' : 'justify-start'}`}>
                  {!senderIsUser && (
                    <Avatar className="h-8 w-8 select-none">
                      {otherPersonDetails?.profile_image?.src ? <AvatarImage src={otherPersonDetails.profile_image.src} alt={otherPersonDetails.name} /> : null }
                      <AvatarFallback>{getInitials(otherPersonDetails?.name ?? '')}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`p-3 rounded-lg max-w-xs md:max-w-md relative select-none ${senderIsUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm font-semibold">{message.content}</p>
                  </div>
                  {senderIsUser && (
                    <Avatar className="h-8 w-8 select-none"><AvatarFallback>شما</AvatarFallback></Avatar>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <div className="p-4 border-t bg-background shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <Input type="text" placeholder="پیام خود را بنویسید..." className="flex-1" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={isSending || isLoading} />
            <Button size="icon" type="submit" className="h-10 w-10 shrink-0" disabled={isSending || !newMessage.trim() || isLoading}>
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
