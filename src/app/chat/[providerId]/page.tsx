
'use client';

import { providers } from '@/lib/data';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormEvent, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
// import { db } from '@/lib/firebase';
// import { collection, query, onSnapshot, orderBy, Timestamp, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Provider } from '@/lib/types';


interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Date; // Changed from Timestamp for local state
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

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getChatId = useCallback(() => {
    if (!user || !otherPersonDetails) return null;
    return [user.phone, otherPersonDetails.phone].sort().join('_');
  }, [user, otherPersonDetails]);
  
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
    if (!isLoggedIn || !user) {
        setIsLoading(false);
        return;
    }

    let details: OtherPersonDetails | null = null;
    const provider = providers.find(p => p.id.toString() === otherPersonIdOrProviderId);
    
    if (provider) {
      details = provider;
    } else {
      const customerPhone = otherPersonIdOrProviderId;
      details = { id: customerPhone, name: `مشتری ${customerPhone.slice(-4)}`, phone: customerPhone, portfolio: [] };
    }
    
    if (!details) {
        toast({ title: "خطا", description: "اطلاعات کاربر یا هنرمند یافت نشد.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    setOtherPersonDetails(details);
    setIsLoading(false); // Since we are not fetching from firebase, set loading to false.

    // Firebase Snapshot listener is disabled temporarily
    /*
    const chatId = [user.phone, details.phone].sort().join('_');
    const messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'), 
        orderBy('createdAt', 'asc'),
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        const msgs: Message[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                text: data.text,
                senderId: data.senderId,
                createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
            }
        });
        setMessages(msgs);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching messages:", error);
        toast({ title: "خطا", description: "دریافت پیام‌ها با مشکل مواجه شد.", variant: "destructive" });
        setIsLoading(false);
    });

    return () => unsubscribe();
    */
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
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || isSending || !otherPersonDetails || !user) return;
    
    setIsSending(true);
    
    // Create a temporary message to display immediately in the UI
    const tempUiMessage: Message = {
      id: Date.now().toString(),
      text: text,
      senderId: user.phone,
      createdAt: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, tempUiMessage]);
    setNewMessage(''); // Clear input immediately

    // The logic to send to Firebase is temporarily disabled
    /*
    const chatId = getChatId();
    if (!chatId) {
        toast({ title: "خطا", description: "امکان شناسایی چت وجود ندارد.", variant: "destructive" });
        setIsSending(false);
        return;
    }
    
    try {
        const chatDocRef = doc(db, 'chats', chatId);
        const messagesColRef = collection(chatDocRef, 'messages');
        
        await addDoc(messagesColRef, {
            text: text,
            senderId: user.phone,
            receiverId: otherPersonDetails.phone, 
            createdAt: serverTimestamp(),
        });
        
        await setDoc(chatDocRef, {
            members: [user.phone, otherPersonDetails.phone],
            lastMessage: text,
            updatedAt: serverTimestamp(),
        }, { merge: true });

    } catch(error) {
        console.error("Error in handleSubmit:", error);
        toast({ title: "خطا", description: "یک خطای پیش‌بینی نشده در ارسال پیام رخ داد.", variant: "destructive" });
        setMessages(prev => prev.filter(m => m.id !== tempUiMessage.id)); // Remove optimistic message on error
        setNewMessage(text); // Put the unsent message back
    } finally {
        setIsSending(false);
    }
    */
   
    // Simulate network delay and finish sending state
    setTimeout(() => {
        setIsSending(false);
    }, 500);
  };

  const getHeaderLink = () => {
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
            {otherPersonDetails?.portfolio && otherPersonDetails.portfolio.length > 0 ? (
                <AvatarImage src={otherPersonDetails.portfolio[0].src} alt={otherPersonDetails.name} />
            ) : null }
            <AvatarFallback>{getInitials(otherPersonDetails?.name ?? '')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{otherPersonDetails?.name}</CardTitle>
            <CardDescription>{'گفتگوی مستقیم (حالت نمایشی)'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-6 space-y-4 overflow-y-auto">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground p-8">
                <p>این یک چت نمایشی است. پیام‌ها ذخیره نمی‌شوند.</p>
                <p className="text-xs mt-2">شما اولین پیام را ارسال کنید.</p>
              </div>
            )}
            {messages.map((message) => {
                const senderIsUser = message.senderId === user?.phone;
                
                return (
                  <div 
                    key={message.id} 
                    className={`flex items-end gap-2 ${senderIsUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!senderIsUser && (
                      <Avatar className="h-8 w-8">
                        {otherPersonDetails?.portfolio && otherPersonDetails.portfolio.length > 0 ? (
                            <AvatarImage src={otherPersonDetails.portfolio[0].src} alt={otherPersonDetails.name} />
                        ) : null }
                        <AvatarFallback>{getInitials(otherPersonDetails?.name ?? '')}</AvatarFallback>
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
