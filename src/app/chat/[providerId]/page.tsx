
'use client';

import { providers } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormEvent, useState, useRef, useEffect } from 'react';
import { chat } from '@/ai/flows/chat';
import type { ChatInput } from '@/ai/flows/chat';
import type { Message as GenkitMessage } from 'genkit';
import { useAuth } from '@/context/AuthContext';
import type { Provider } from '@/lib/types';


interface Message {
  id: string; // Use string for IDs to accommodate Date.now() and other potential sources
  text: string;
  sender: 'user' | 'provider';
}


export default function ChatPage() {
  const params = useParams<{ providerId: string }>();
  const providerId = params.providerId as string;
  const { user, isLoggedIn } = useAuth();
  
  let provider: Provider | undefined | null;

  if (providerId === '99' && isLoggedIn && user?.accountType === 'provider') {
    // This is the mock provider from the profile page
    provider = {
        id: 99,
        name: user.name,
        service: 'خدمات شما (تستی)',
        location: 'مکان شما',
        phone: user.phone,
        bio: 'این یک تست برای دستیار هوشمند شماست.',
        categorySlug: 'beauty',
        serviceSlug: 'makeup',
        rating: 5,
        reviewsCount: 0,
        portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'portfolio preview' }],
    };
  } else {
    provider = providers.find(p => p.id.toString() === providerId);
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Start loading initially for the welcome message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch the initial greeting message from the AI when the component mounts
  useEffect(() => {
    const getInitialGreeting = async () => {
      if (!provider) return;
      setIsLoading(true);
      try {
        const chatInput: ChatInput = {
          providerId: provider.id,
          history: [], // Send empty history to get the initial greeting
        };
        const response = await chat(chatInput);
        const providerMessage: Message = {
          id: `ai-init-${Date.now()}`,
          text: response.reply,
          sender: 'provider',
        };
        setMessages([providerMessage]);
      } catch (error) {
        console.error("Failed to get initial greeting:", error);
        const errorMessage: Message = {
          id: `ai-error-${Date.now()}`,
          text: "سلام! متاسفانه در حال حاضر برای شروع گفتگو مشکلی پیش آمده است. لطفاً صفحه را مجدداً بارگذاری کنید.",
          sender: 'provider',
        };
        setMessages([errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialGreeting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider?.id]);


  if (!provider) {
    notFound();
  }

  // To satisfy TypeScript, create a new variable that is guaranteed to be non-null
  const currentProvider = provider;


  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: newMessage,
      sender: 'user',
    };
    
    // Add user message to state and clear input
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setNewMessage('');
    setIsLoading(true);

    try {
        // Convert the full message history to the format Genkit expects
        const history: GenkitMessage[] = updatedMessages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            content: msg.text,
        }));

        const chatInput: ChatInput = {
            providerId: currentProvider.id,
            history: history,
        };

        const response = await chat(chatInput);

        const providerMessage: Message = {
            id: `ai-response-${Date.now()}`,
            text: response.reply,
            sender: 'provider',
        };
        setMessages(prev => [...prev, providerMessage]);

    } catch(error) {
        console.error("AI chat failed:", error);
        const errorMessage: Message = {
            id: `ai-error-${Date.now()}`,
            text: "متاسفانه مشکلی در ارتباط با دستیار هوشمند پیش آمده است. لطفاً بعدا تلاش کنید.",
            sender: 'provider',
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-2xl mx-auto py-8">
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4 border-b">
           <Link href={currentProvider.id === 99 ? '/profile' : `/provider/${currentProvider.id}`}>
             <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5"/>
             </Button>
           </Link>
           <Avatar>
            {currentProvider.portfolio && currentProvider.portfolio.length > 0 ? (
                <AvatarImage src={currentProvider.portfolio[0].src} alt={currentProvider.name} />
            ) : null }
            <AvatarFallback>{getInitials(currentProvider.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{currentProvider.name}</CardTitle>
            <CardDescription>{currentProvider.service} (دستیار هوشمند)</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-6 space-y-4 overflow-y-auto">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground p-8">
                <p>گفتگو را با ارسال یک پیام شروع کنید.</p>
                <p className="text-xs mt-2">دستیار هوشمند به نمایندگی از هنرمند پاسخ خواهد داد.</p>
              </div>
            )}
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : ''}`}
              >
                {message.sender === 'provider' && (
                  <Avatar className="h-8 w-8">
                      {currentProvider.portfolio && currentProvider.portfolio.length > 0 ? (
                          <AvatarImage src={currentProvider.portfolio[0].src} alt={currentProvider.name} />
                      ) : null }
                      <AvatarFallback>{getInitials(currentProvider.name)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`p-3 rounded-lg max-w-xs md:max-w-md ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm">{message.text}</p>
                </div>
                 {message.sender === 'user' && (
                   <Avatar className="h-8 w-8">
                      <AvatarFallback>شما</AvatarFallback>
                  </Avatar>
                )}
            </div>
            ))}
            {isLoading && (
               <div className="flex items-start gap-2">
                 <Avatar className="h-8 w-8">
                      {currentProvider.portfolio && currentProvider.portfolio.length > 0 ? (
                          <AvatarImage src={currentProvider.portfolio[0].src} alt={currentProvider.name} />
                      ) : null }
                      <AvatarFallback>{getInitials(currentProvider.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 p-3">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">درحال نوشتن...</span>
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
             <div className="text-center text-xs text-muted-foreground pt-4">
               این یک چت با دستیار هوشمند است.
            </div>
        </CardContent>
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="پیام خود را بنویسید..." 
              className="pr-12"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isLoading}
            />
            <Button size="icon" type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isLoading || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
