
'use client';

import { getProviderByPhone, getOrCreateConversation, getMessages, markMessagesAsRead } from '@/lib/api';
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
import type { Message, Provider, Conversation } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

export default function ChatPage() {
  const params = useParams();
  const otherPersonPhone = params.providerId as string;
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [providerDetails, setProviderDetails] = useState<Provider | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) return `${names[0][0]}${names[1][0]}`;
    return name.substring(0, 2);
  };
  
  // Setup conversation and fetch initial messages
  const setupConversation = useCallback(async () => {
    if (!user || !providerDetails) return;
    setIsLoading(true);
    try {
      const conv = await getOrCreateConversation(user.id, providerDetails.user_id);
      setConversation(conv);
      if (conv) {
        const initialMessages = await getMessages(conv.id);
        setMessages(initialMessages);
        await markMessagesAsRead(conv.id, user.id);
      }
    } catch(e) {
      toast({ title: "خطا", description: "امکان راه‌اندازی گفتگو وجود ندارد.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [user, providerDetails, toast]);


  // Effect to load provider details first
  useEffect(() => {
    const fetchProvider = async () => {
        if (!isLoggedIn || !user) { return; }
        try {
            const provider = await getProviderByPhone(otherPersonPhone);
            if (provider) {
                setProviderDetails(provider);
            } else {
                toast({ title: "خطا", description: "هنرمند مورد نظر یافت نشد.", variant: "destructive"});
            }
        } catch (error) {
            toast({ title: "خطا", description: "امکان بارگذاری اطلاعات کاربر وجود ندارد.", variant: "destructive"});
        }
    };
    if (!isAuthLoading) {
        fetchProvider();
    }
  }, [otherPersonPhone, isLoggedIn, user, toast, isAuthLoading]);

  // Effect to setup conversation once provider details are available
  useEffect(() => {
    if (providerDetails) {
        setupConversation();
    }
  }, [providerDetails, setupConversation]);


  // Realtime subscription for new messages
  useEffect(() => {
    if (!conversation || !user) return;
    
    const channel = supabase.channel(`chat_${conversation.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversation.id}`
       }, 
       async (payload) => {
         const newMessage = payload.new as Message;
         // Only add message if it's from the other person
         if (newMessage.sender_id !== user.id) {
           setMessages((currentMessages) => [...currentMessages, newMessage]);
           // Mark as read immediately upon receiving
           await markMessagesAsRead(conversation.id, user.id);
         }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation, supabase, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || isSending || !providerDetails || !user || !conversation) return;

    setIsSending(true);
    
    const tempUiMessage: Message = {
      id: Date.now().toString(), // Temporary ID for UI rendering
      conversation_id: conversation.id,
      sender_id: user.id,
      receiver_id: providerDetails.user_id,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages((currentMessages) => [...currentMessages, tempUiMessage]);
    setNewMessage('');
    
    try {
        const { error } = await supabase.from('messages').insert({
            conversation_id: conversation.id,
            sender_id: user.id,
            receiver_id: providerDetails.user_id,
            content,
        });

        if (error) throw error;
        
    } catch(error) {
        toast({ title: 'خطا در ارسال', description: 'پیام شما ارسال نشد. لطفاً دوباره تلاش کنید.', variant: 'destructive'});
        // Rollback UI change on failure
        setMessages((currentMessages) => currentMessages.filter(m => m.id !== tempUiMessage.id));
        setNewMessage(content); 
    } finally {
        setIsSending(false);
    }
  };

  const getHeaderLink = () => user?.account_type === 'provider' ? '/inbox' : '/';

  if (isAuthLoading || !providerDetails) {
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
            {providerDetails?.profile_image?.src ? <AvatarImage src={providerDetails.profile_image.src} alt={providerDetails.name} /> : null }
            <AvatarFallback>{getInitials(providerDetails?.name ?? '')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{providerDetails?.name}</CardTitle>
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
              const senderIsUser = message.sender_id === user.id;
              return (
                <div key={message.id} className={`flex items-end gap-2 group ${senderIsUser ? 'justify-end' : 'justify-start'}`}>
                  {!senderIsUser && (
                    <Avatar className="h-8 w-8 select-none">
                      {providerDetails?.profile_image?.src ? <AvatarImage src={providerDetails.profile_image.src} alt={providerDetails.name} /> : null }
                      <AvatarFallback>{getInitials(providerDetails?.name ?? '')}</AvatarFallback>
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
            <Input type="text" placeholder="پیام خود را بنویسید..." className="flex-1" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={isSending || isLoading || !providerDetails} />
            <Button size="icon" type="submit" className="h-10 w-10 shrink-0" disabled={isSending || !newMessage.trim() || isLoading || !providerDetails}>
              {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
