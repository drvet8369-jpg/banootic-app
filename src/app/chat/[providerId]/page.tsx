
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
import { collection, query, onSnapshot, orderBy, Timestamp, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Provider } from '@/lib/types';


interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
}

interface OtherPersonDetails {
    name: string;
    phone: string;
    portfolio?: { src: string }[];
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

  const chatId = user && otherPersonDetails ? [user.phone, otherPersonDetails.phone].sort().join('_') : null;
  
  const getInitials = (name: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1 && names[1]) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }

  useEffect(() => {
      // If provider ID is '99', it's the test AI assistant chat
      if (otherPersonIdOrProviderId === '99') {
          setOtherPersonDetails({ 
              name: "دستیار هوشمند تستی", 
              phone: "AI_ASSISTANT_99", // A unique identifier for the AI
              portfolio: [] 
          });
          return;
      }

      // Find by provider ID (number)
      const providerById = providers.find(p => p.id.toString() === otherPersonIdOrProviderId);
      if (providerById) {
          setOtherPersonDetails(providerById);
          return;
      }

      // Find by provider phone (string)
      const providerByPhone = providers.find(p => p.phone === otherPersonIdOrProviderId);
      if (providerByPhone) {
          setOtherPersonDetails(providerByPhone);
          return;
      }
      
      // If not found, it must be a customer
      setOtherPersonDetails({ 
          name: `مشتری ${otherPersonIdOrProviderId.slice(-4)}`, 
          phone: otherPersonIdOrProviderId, 
          portfolio: [] 
      });

  }, [otherPersonIdOrProviderId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!chatId) {
       // We can't load messages until we have both users' info to form the chatId
       setIsLoading(true); // Keep loading until chatId is available
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

  if (isLoading && messages.length === 0) {
     return (
        <div className="flex flex-col items-center justify-center h-full py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">در حال بارگذاری گفتگو...</p>
        </div>
    );
  }
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || isSending || !otherPersonDetails || !user) return;

    setIsSending(true);
    
    try {
        const chatDocRef = doc(db, 'chats', chatId);
        const messagesColRef = collection(chatDocRef, 'messages');
        
        // Use the correct receiverId from the details object.
        const receiverId = otherPersonDetails.phone;

        // Add the message to the subcollection
        await addDoc(messagesColRef, {
            text: newMessage,
            senderId: user.phone,
            receiverId: receiverId, 
            createdAt: serverTimestamp(),
        });
        
        // Update the last message and timestamp on the main chat document
        await setDoc(chatDocRef, {
            members: [user.phone, receiverId],
            lastMessage: newMessage,
            updatedAt: serverTimestamp(),
        }, { merge: true });

        setNewMessage('');

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
            {otherPersonDetails?.portfolio && otherPersonDetails.portfolio.length > 0 ? (
                <AvatarImage src={otherPersonDetails.portfolio[0].src} alt={otherPersonDetails.name} />
            ) : null }
            <AvatarFallback>{getInitials(otherPersonDetails?.name ?? '')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{otherPersonDetails?.name}</CardTitle>
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
                          {otherPersonDetails?.portfolio && otherPersonDetails.portfolio.length > 0 ? (
                              <AvatarImage src={otherPersonDetails.portfolio[0].src} alt={otherPersonDetails.name} />
                          ) : null }
                          <AvatarFallback>{getInitials(otherPersonDetails?.name ?? '')}</AvatarFallback>
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
