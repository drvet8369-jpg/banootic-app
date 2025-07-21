
'use client';

import { providers } from '@/lib/data';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, User, Bot } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormEvent, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp, addDoc, doc, setDoc, serverTimestamp, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { chat } from '@/ai/flows/chat';
import type { Provider } from '@/lib/types';


interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
}

interface OtherPersonDetails {
    id: string | number;
    name: string;
    phone: string;
    portfolio?: { src: string; aiHint?: string }[];
}


export default function ChatPage() {
  const params = useParams();
  const otherPersonIdOrProviderId = params.providerId as string;
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();

  const [otherPersonDetails, setOtherPersonDetails] = useState<OtherPersonDetails | null>(null);
  const [isAiAssistantChat, setIsAiAssistantChat] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getChatId = useCallback(() => {
    if (!user || !otherPersonDetails || isAiAssistantChat) return null;
    return [user.phone, otherPersonDetails.phone].sort().join('_');
  }, [user, otherPersonDetails, isAiAssistantChat]);
  
  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const isAiChat = otherPersonIdOrProviderId === '99';
    setIsAiAssistantChat(isAiChat);

    let details: OtherPersonDetails | null = null;
    if (isAiChat) {
      details = { id: 99, name: "دستیار هوشمند تستی", phone: "AI_ASSISTANT_99", portfolio: [] };
    } else {
      const provider = providers.find(p => p.id.toString() === otherPersonIdOrProviderId);
      if (provider) {
        details = provider;
      } else {
        // This case might be for a customer's phone number
        const customerPhone = otherPersonIdOrProviderId;
        details = { id: customerPhone, name: `مشتری ${customerPhone.slice(-4)}`, phone: customerPhone, portfolio: [] };
      }
    }
    
    if (!details) {
        setIsLoading(false);
        return;
    }
    setOtherPersonDetails(details);

    if (!isLoggedIn || !user) {
        setIsLoading(false);
        return;
    }

    let unsubscribe: () => void = () => {};
    
    if (isAiChat) {
      // For AI chat, conversation resets on each page load to save data and reduce cost.
      // We fetch only the initial greeting.
      const fetchInitialAiMessage = async () => {
        setIsLoading(true);
        setMessages([]); // Clear previous messages
        try {
          const result = await chat({ providerId: 99, history: [] });
          if (result.reply) {
            const aiMessage: Message = {
                id: 'ai-initial-' + Date.now(),
                text: result.reply,
                senderId: 'AI_ASSISTANT_99',
                createdAt: Timestamp.now(),
            };
            setMessages([aiMessage]);
          } else {
             toast({ title: "خطا", description: result.reply || "پاسخ اولیه از دستیار دریافت نشد.", variant: "destructive" });
          }
        } catch(error) {
            console.error("Error fetching initial AI message:", error);
            toast({ title: "خطا", description: "دستیار هوشمند پاسخگو نیست.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
      };
      fetchInitialAiMessage();
    } else {
        // For human-to-human chat, we fetch last 5 messages from Firestore.
        const chatId = [user.phone, details.phone].sort().join('_');
        const messagesQuery = query(
            collection(db, 'chats', chatId, 'messages'), 
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        
        unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
            const msgs: Message[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(msgs.reverse());
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            toast({ title: "خطا", description: "دریافت پیام‌ها با مشکل مواجه شد.", variant: "destructive" });
            setIsLoading(false);
        });
    }

    return () => unsubscribe();
  }, [otherPersonIdOrProviderId, isLoggedIn, user, toast]);


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
  
  const handleAiSubmit = async (text: string) => {
    if (!user || !otherPersonDetails) return;

    setIsSending(true);

    const userMessage: Message = {
        id: 'user-' + Date.now(),
        text,
        senderId: user.phone,
        createdAt: Timestamp.now()
    };
    
    // Optimistically update the UI with the user's message
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setNewMessage('');
    
    try {
        const historyForAi = currentMessages.map(m => ({
            role: m.senderId === user.phone ? 'user' : 'model',
            content: m.text,
        })).filter(h => h.content); // Ensure no empty content is sent

        const result = await chat({
            providerId: Number(otherPersonDetails.id),
            history: historyForAi
        });
        
        if (result.reply) {
            const aiMessage: Message = {
                id: 'ai-' + Date.now(),
                text: result.reply,
                senderId: 'AI_ASSISTANT_99',
                createdAt: Timestamp.now(),
            };
            setMessages(prev => [...prev, aiMessage]);
        } else {
            // Revert optimistic update if AI fails to reply
            toast({ title: "خطا", description: result.reply || "پاسخ از دستیار هوشمند دریافت نشد.", variant: "destructive" });
            setMessages(messages); 
        }

    } catch (error) {
        console.error("Error in AI response:", error);
        toast({ title: "خطا", description: "پاسخ از دستیار هوشمند دریافت نشد.", variant: "destructive" });
        setMessages(messages); // Revert on error
    } finally {
        setIsSending(false);
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || isSending || !otherPersonDetails || !user) return;
    
    if (isAiAssistantChat) {
      await handleAiSubmit(text);
      return;
    }
    
    const chatId = getChatId();
    if (!chatId) {
        toast({ title: "خطا", description: "امکان شناسایی چت وجود ندارد.", variant: "destructive" });
        return;
    }

    setIsSending(true);
    const textToSend = newMessage;
    setNewMessage('');
    
    try {
        const chatDocRef = doc(db, 'chats', chatId);
        const messagesColRef = collection(chatDocRef, 'messages');
        
        await addDoc(messagesColRef, {
            text: textToSend,
            senderId: user.phone,
            receiverId: otherPersonDetails.phone, 
            createdAt: serverTimestamp(),
        });
        
        await setDoc(chatDocRef, {
            members: [user.phone, otherPersonDetails.phone],
            lastMessage: textToSend,
            updatedAt: serverTimestamp(),
        }, { merge: true });

    } catch(error) {
        console.error("Error in handleSubmit:", error);
        toast({ title: "خطا", description: "یک خطای پیش‌بینی نشده در ارسال پیام رخ داد.", variant: "destructive" });
        setNewMessage(textToSend); // Restore message on failure
    } finally {
        setIsSending(false);
    }
  };

  const getHeaderLink = () => {
    if (isAiAssistantChat) return '/profile';
    if (user.accountType === 'provider') return '/inbox';
    const provider = providers.find(p => p.phone === otherPersonDetails?.phone);
    if(provider) return `/provider/${provider.id}`;
    return '/'; 
  }


  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-2xl mx-auto py-8">
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4 border-b">
           <Link href={getHeaderLink()}>
             <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5"/>
             </Button>
           </Link>
           <Avatar>
            {isAiAssistantChat ? <Bot className="w-full h-full p-2" /> : (
                <>
                    {otherPersonDetails?.portfolio && otherPersonDetails.portfolio.length > 0 ? (
                        <AvatarImage src={otherPersonDetails.portfolio[0].src} alt={otherPersonDetails.name} />
                    ) : null }
                    <AvatarFallback>{getInitials(otherPersonDetails?.name ?? '')}</AvatarFallback>
                </>
            )}
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{otherPersonDetails?.name}</CardTitle>
            <CardDescription>{isAiAssistantChat ? 'دستیار هوشمند' : 'گفتگوی مستقیم'}</CardDescription>
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
                const isSender = message.senderId === user?.phone;
                const isAiMessage = message.senderId === 'AI_ASSISTANT_99';
                const senderIsUser = isSender || (!isAiAssistantChat && message.senderId === user?.phone);

                return (
                  <div 
                    key={message.id} 
                    className={`flex items-end gap-2 ${senderIsUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!senderIsUser && (
                      <Avatar className="h-8 w-8">
                          {isAiAssistantChat ? <Bot className="w-full h-full p-1" /> : (
                            <>
                                {otherPersonDetails?.portfolio && otherPersonDetails.portfolio.length > 0 ? (
                                    <AvatarImage src={otherPersonDetails.portfolio[0].src} alt={otherPersonDetails.name} />
                                ) : null }
                                <AvatarFallback>{getInitials(otherPersonDetails?.name ?? '')}</AvatarFallback>
                            </>
                          )}
                      </Avatar>
                    )}
                    <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${senderIsUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="text-sm">{message.text}</p>
                    </div>
                     {senderIsUser && (
                       <Avatar className="h-8 w-8">
                          <AvatarFallback>شما</AvatarFallback>
                      </Avatar>
                    )}
                </div>
                )
            })}
             {isSending && !isAiAssistantChat && (
                <div className="flex items-end gap-2 justify-end">
                    <div className="p-3 rounded-lg bg-muted">
                        <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                    <Avatar className="h-8 w-8">
                       <AvatarFallback>شما</AvatarFallback>
                   </Avatar>
                </div>
            )}
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
              disabled={isSending || isLoading}
            />
            <Button size="icon" type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isSending || !newMessage.trim() || isLoading}>
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
