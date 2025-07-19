
'use client';

import { providers } from '@/lib/data';
import { notFound, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormEvent, useState, useRef, useEffect } from 'react';
import { chat } from '@/ai/flows/chat';


interface PageProps {
  params: {
    providerId: string;
  };
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'provider';
}


export default function ChatPage({ params }: PageProps) {
  const provider = providers.find(p => p.id.toString() === params.providerId);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'سلام! چطور میتونم کمکتون کنم؟', sender: 'provider' }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  if (!provider) {
    notFound();
  }

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
      id: Date.now(),
      text: newMessage,
      sender: 'user',
    };
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      const response = await chat({
        providerName: provider.name,
        serviceName: provider.service,
        history: messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          content: [{ text: m.text }],
        })),
        message: newMessage,
      });

      const aiMessage: Message = {
        id: Date.now() + 1,
        text: response.answer,
        sender: 'provider',
      };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: 'متاسفانه مشکلی پیش آمده. لطفاً کمی بعد دوباره تلاش کنید.',
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
           <Link href={`/services/${provider.categorySlug}/${provider.serviceSlug}`}>
             <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5"/>
             </Button>
           </Link>
           <Avatar>
            {provider.portfolio && provider.portfolio.length > 0 ? (
                <AvatarImage src={provider.portfolio[0].src} alt={provider.name} />
            ) : null }
            <AvatarFallback>{getInitials(provider.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{provider.name}</CardTitle>
            <CardDescription>{provider.service}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-6 space-y-4 overflow-y-auto">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex items-end gap-2 ${message.sender === 'user' ? 'justify-end' : ''}`}
              >
                {message.sender === 'provider' && (
                  <Avatar className="h-8 w-8">
                      {provider.portfolio && provider.portfolio.length > 0 ? (
                          <AvatarImage src={provider.portfolio[0].src} alt={provider.name} />
                      ) : null }
                      <AvatarFallback>{getInitials(provider.name)}</AvatarFallback>
                  </Avatar>
                )}
                <div className={`p-3 rounded-lg max-w-xs ${message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
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
               <div className="flex items-end gap-2">
                  <Avatar className="h-8 w-8">
                     {provider.portfolio && provider.portfolio.length > 0 ? (
                          <AvatarImage src={provider.portfolio[0].src} alt={provider.name} />
                      ) : null }
                      <AvatarFallback>{getInitials(provider.name)}</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted p-3 rounded-lg max-w-xs flex items-center">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
              </div>
            )}
            <div ref={messagesEndRef} />
             <div className="text-center text-xs text-muted-foreground pt-4">
               این یک نسخه نمایشی است. پیام ها ذخیره نمی شوند.
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
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

