
# Project Files

This file contains the full content of all project files for easy reference and backup.

---
### `/.env`
---
```

```

---
### `/README.md`
---
```md
# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.
```

---
### `/apphosting.yaml`
---
```yaml
# Settings to manage and configure a Firebase App Hosting backend.
# https://firebase.google.com/docs/app-hosting/configure

runConfig:
  # Increase this value if you'd like to automatically spin up
  # more instances in response to increased traffic.
  maxInstances: 1
```

---
### `/components.json`
---
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

---
### `/next.config.ts`
---
```ts
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
```

---
### `/package.json`
---
```json
{
  "name": "nextn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 9002",
    "genkit:dev": "genkit start -- tsx src/ai/dev.ts",
    "genkit:watch": "genkit start -- tsx --watch src/ai/dev.ts",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@genkit-ai/firebase": "1.15.2",
    "@genkit-ai/googleai": "^1.15.2",
    "@genkit-ai/next": "^1.15.2",
    "@hookform/resolvers": "^4.1.3",
    "@radix-ui/react-accordion": "^1.2.3",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-avatar": "^1.1.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-dropdown-menu": "^2.1.6",
    "@radix-ui/react-label": "^2.1.2",
    "@radix-ui/react-menubar": "^1.1.6",
    "@radix-ui/react-popover": "^1.1.6",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-radio-group": "^1.2.3",
    "@radix-ui/react-scroll-area": "^1.2.3",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-separator": "^1.1.2",
    "@radix-ui/react-slider": "^1.2.3",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.1.3",
    "@radix-ui/react-tabs": "^1.1.3",
    "@radix-ui/react-toast": "^1.2.6",
    "@radix-ui/react-tooltip": "^1.1.8",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^3.6.0",
    "dotenv": "^16.5.0",
    "embla-carousel-react": "^8.6.0",
    "firebase": "^11.9.1",
    "firebase-admin": "^12.2.0",
    "genkit": "^1.15.2",
    "lucide-react": "^0.475.0",
    "next": "15.3.3",
    "patch-package": "^8.0.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.2",
    "recharts": "^2.15.1",
    "tailwind-merge": "^3.0.1",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "genkit-cli": "^1.15.2",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "typescript": "^5"
  }
}
```

---
### `/src/app/chat/[providerId]/page.tsx`
---
```tsx
'use client';

import { getProviders } from '@/lib/data';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowUp, Loader2, User, Edit, Save, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormEvent, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Provider } from '@/lib/types';
import Image from 'next/image';


interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: string; // Using ISO string for localStorage
  isEdited?: boolean;
}

interface OtherPersonDetails {
    id: string | number;
    name: string;
    phone: string;
    profileImage?: { src: string; aiHint?: string };
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

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const getChatId = useCallback((phone1?: string, phone2?: string) => {
    if (!phone1 || !phone2) return null;
    return [phone1, phone2].sort().join('_');
  }, []);
  
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
    const allProviders = getProviders();
    const provider = allProviders.find(p => p.phone === otherPersonIdOrProviderId);
    
    if (provider) {
      details = provider;
    } else {
      const customerPhone = otherPersonIdOrProviderId;
      details = { id: customerPhone, name: `مشتری ${customerPhone.slice(-4)}`, phone: customerPhone };
    }
    
    if (!details) {
        toast({ title: "خطا", description: "اطلاعات کاربر یا هنرمند یافت نشد.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    setOtherPersonDetails(details);
    
    const chatId = getChatId(user.phone, details.phone);
    if (chatId) {
      try {
          const storedMessages = localStorage.getItem(`chat_${chatId}`);
          if (storedMessages) {
              setMessages(JSON.parse(storedMessages));
          }

          // Mark messages as read when chat is opened
          const allChats = JSON.parse(localStorage.getItem('inbox_chats') || '{}');
          if (allChats[chatId] && allChats[chatId].participants && allChats[chatId].participants[user.phone]) {
              allChats[chatId].participants[user.phone].unreadCount = 0;
              localStorage.setItem('inbox_chats', JSON.stringify(allChats));
          }
      } catch(e) {
          console.error("Failed to load/update chat from localStorage", e);
      }
    }
    
    setIsLoading(false);

  }, [otherPersonIdOrProviderId, isLoggedIn, user, toast, getChatId]);


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
  
  const handleStartEdit = (message: Message) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };
  
  const handleSaveEdit = () => {
    if (!editingMessageId || !editingText.trim() || !user || !otherPersonDetails) return;

    const chatId = getChatId(user.phone, otherPersonDetails.phone);
    if (!chatId) return;

    const updatedMessages = messages.map(msg => {
      if (msg.id === editingMessageId) {
        return { ...msg, text: editingText.trim(), isEdited: true };
      }
      return msg;
    });

    setMessages(updatedMessages);
    localStorage.setItem(`chat_${chatId}`, JSON.stringify(updatedMessages));

    // Also update the last message in the inbox if this was the last message
    const lastMessage = updatedMessages[updatedMessages.length - 1];
    if (lastMessage.id === editingMessageId) {
        const allChats = JSON.parse(localStorage.getItem('inbox_chats') || '{}');
        if (allChats[chatId]) {
            allChats[chatId].lastMessage = editingText.trim();
            localStorage.setItem('inbox_chats', JSON.stringify(allChats));
        }
    }

    handleCancelEdit();
    toast({ title: 'پیام ویرایش شد.' });
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || isSending || !otherPersonDetails || !user) return;
    
    setIsSending(true);
    
    const tempUiMessage: Message = {
      id: Date.now().toString(),
      text: text,
      senderId: user.phone,
      createdAt: new Date().toISOString(),
    };
    
    const updatedMessages = [...messages, tempUiMessage];
    setMessages(updatedMessages);
    setNewMessage('');

    const chatId = getChatId(user.phone, otherPersonDetails.phone);
    if (chatId) {
        try {
            const allChats = JSON.parse(localStorage.getItem('inbox_chats') || '{}');
            const currentChat = allChats[chatId] || {
                id: chatId,
                members: [user.phone, otherPersonDetails.phone],
                participants: {
                    [user.phone]: { name: user.name, unreadCount: 0 },
                    [otherPersonDetails.phone]: { name: otherPersonDetails.name, unreadCount: 0 }
                }
            };
            
            // Update last message and timestamp
            currentChat.lastMessage = text;
            currentChat.updatedAt = new Date().toISOString();

            // Increment unread count for the receiver
            const receiverPhone = otherPersonDetails.phone;
            if (currentChat.participants[receiverPhone]) {
                currentChat.participants[receiverPhone].unreadCount = (currentChat.participants[receiverPhone].unreadCount || 0) + 1;
            } else {
                 currentChat.participants[receiverPhone] = { name: otherPersonDetails.name, unreadCount: 1 };
            }

            // Ensure sender's participant data exists
            if (!currentChat.participants[user.phone]) {
                currentChat.participants[user.phone] = { name: user.name, unreadCount: 0 };
            }

            allChats[chatId] = currentChat;
            
            localStorage.setItem(`chat_${chatId}`, JSON.stringify(updatedMessages));
            localStorage.setItem('inbox_chats', JSON.stringify(allChats));
        } catch(e) {
            console.error("Failed to save to localStorage", e);
            toast({ title: "خطا", description: "پیام شما در حافظه موقت ذخیره نشد.", variant: "destructive" });
        }
    }
   
    setTimeout(() => {
        setIsSending(false);
    }, 500);
  };

  const getHeaderLink = () => {
    if (user.accountType === 'provider') return '/inbox';
    // For customers, check if they have any chats, if so link to inbox, otherwise home.
    try {
      const allChatsData = JSON.parse(localStorage.getItem('inbox_chats') || '{}');
      const userChats = Object.values(allChatsData).filter((chat: any) => chat.members?.includes(user.phone));
      if (userChats.length > 0) return '/inbox';
    } catch (e) { /* ignore */ }
    return '/'; 
  }


  return (
    <div className="flex flex-col h-full py-4">
      <Card className="flex-1 flex flex-col w-full">
        <CardHeader className="flex flex-row items-center gap-4 border-b shrink-0">
           <Link href={getHeaderLink()}>
             <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5"/>
             </Button>
           </Link>
           <Avatar>
            {otherPersonDetails?.profileImage?.src ? (
                <AvatarImage src={otherPersonDetails.profileImage.src} alt={otherPersonDetails.name} />
            ) : null }
            <AvatarFallback>{getInitials(otherPersonDetails?.name ?? '')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{otherPersonDetails?.name}</CardTitle>
            <CardDescription>{'گفتگوی مستقیم (حالت نمایشی)'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 space-y-4 overflow-y-auto">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground p-8">
                <p>پیام‌ها به صورت موقت در مرورگر شما ذخیره می‌شوند.</p>
                <p className="text-xs mt-2">شما اولین پیام را ارسال کنید.</p>
              </div>
            )}
            {messages.map((message) => {
                const senderIsUser = message.senderId === user?.phone;
                const isEditing = editingMessageId === message.id;

                return (
                  <div 
                    key={message.id} 
                    className={`flex items-end gap-2 group ${senderIsUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!senderIsUser && (
                      <Avatar className="h-8 w-8 select-none">
                        {otherPersonDetails?.profileImage?.src ? (
                            <AvatarImage src={otherPersonDetails.profileImage.src} alt={otherPersonDetails.name} />
                        ) : null }
                        <AvatarFallback>{getInitials(otherPersonDetails?.name ?? '')}</AvatarFallback>
                      </Avatar>
                    )}
                    
                    {isEditing ? (
                        <div className="flex-1 flex items-center gap-1">
                            <Input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="h-9"
                                onKeyDown={(e) => { if(e.key === 'Enter') { handleSaveEdit(); } else if (e.key === 'Escape') { handleCancelEdit(); } }}
                                autoFocus
                            />
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleSaveEdit}><Save className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleCancelEdit}><XCircle className="w-4 h-4" /></Button>
                        </div>
                    ) : (
                         <div className={`flex items-center gap-2 ${senderIsUser ? 'flex-row-reverse' : ''}`}>
                             <div className={`p-3 rounded-lg max-w-xs md:max-w-md relative select-none ${senderIsUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="text-sm font-semibold">
                                  {message.text}
                                  {message.isEdited && <span className="text-xs opacity-70 mr-2">(ویرایش شده)</span>}
                                </p>
                            </div>
                            {senderIsUser && (
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleStartEdit(message)}
                                >
                                    <Edit className="w-4 h-4"/>
                                </Button>
                            )}
                        </div>
                    )}

                     {senderIsUser && !isEditing && (
                       <Avatar className="h-8 w-8 select-none">
                          <AvatarFallback>شما</AvatarFallback>
                      </Avatar>
                    )}
                </div>
                )
            })}
            <div ref={messagesEndRef} />
        </CardContent>
        <div className="p-4 border-t bg-background shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input 
                type="text" 
                placeholder="پیام خود را بنویسید..." 
                className="flex-1"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isSending || isLoading || !!editingMessageId}
              />
              <Button size="icon" type="submit" className="h-10 w-10 shrink-0" disabled={isSending || !newMessage.trim() || isLoading || !!editingMessageId}>
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
              </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
```

---
### `/src/app/globals.css`
---
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 140 60% 97%;
    --foreground: 145 45% 15%; /* Made darker */
    --card: 0 0% 100%;
    --card-foreground: 145 35% 15%; /* Made darker */
    --popover: 0 0% 100%;
    --popover-foreground: 145 35% 15%; /* Made darker */
    --primary: 140 42% 55%; /* Made darker */
    --primary-foreground: 145 45% 10%; /* Made darker */
    --secondary: 140 30% 80%; /* Made darker */
    --secondary-foreground: 145 35% 15%; /* Made darker */
    --muted: 140 30% 90%;
    --muted-foreground: 145 25% 45%; /* Made darker */
    --accent: 353 40% 60%; /* Made darker */
    --accent-foreground: 353 30% 18%; /* Made darker */
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 140 25% 75%; /* Made darker and less saturated */
    --input: 140 25% 75%; /* Made darker and less saturated */
    --ring: 140 44% 55%; /* Made darker */
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "calt" 1, "liga" 1;
  }
}
```

---
### `/src/app/inbox/page.tsx`
---
```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Inbox, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface Chat {
  id: string;
  otherMemberName: string;
  otherMemberId: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}

const getInitials = (name: string) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length > 1 && names[1] && isNaN(parseInt(names[1]))) {
    return `${names[0][0]}${names[1][0]}`;
  }
  return name.substring(0, 2);
};


export default function InboxPage() {
  const { user, isLoggedIn } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, preventing hydration mismatch for date formatting.
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!user?.phone) {
      setChats([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const allChatsData = JSON.parse(localStorage.getItem('inbox_chats') || '{}');
      
      const userChats = Object.values(allChatsData)
        .filter((chat: any) => chat.members?.includes(user.phone))
        .map((chat: any): Chat | null => {
            if (!chat.participants || !chat.members) return null;

            const otherMemberId = chat.members.find((id: string) => id !== user.phone);
            if (!otherMemberId) return null;
            
            const otherMemberInfo = chat.participants[otherMemberId];
            const selfInfo = chat.participants[user.phone];

            const otherMemberName = otherMemberInfo?.name || `کاربر ${otherMemberId.slice(-4)}`;

            return {
                id: chat.id,
                otherMemberId: otherMemberId,
                otherMemberName: otherMemberName,
                lastMessage: chat.lastMessage || '',
                updatedAt: chat.updatedAt,
                unreadCount: selfInfo?.unreadCount || 0,
            };
        })
        .filter((chat): chat is Chat => chat !== null)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
      setChats(userChats);
    } catch (e) {
      console.error("Failed to load chats from localStorage", e);
      setError('خطا در بارگذاری گفتگوهای موقت.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.phone]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <User className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="font-headline text-2xl">لطفا وارد شوید</h1>
        <p className="text-muted-foreground mt-2">برای مشاهده صندوق ورودی باید وارد حساب کاربری خود شوید.</p>
        <Button asChild className="mt-6">
          <Link href="/login">ورود به حساب کاربری</Link>
        </Button>
      </div>
    );
  }
  
  if (chats.length === 0 && !isLoading && !error) {
     return (
       <div className="max-w-4xl mx-auto py-12">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-3xl">صندوق ورودی پیام‌ها</CardTitle>
                 <CardDescription>
                    {user.accountType === 'provider' 
                        ? 'آخرین گفتگوهای خود با مشتریان را در اینجا مشاهده کنید.' 
                        : 'آخرین گفتگوهای خود با هنرمندان را در اینجا مشاهده کنید.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="text-center py-20 border-2 border-dashed rounded-lg">
                    <Inbox className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-bold text-xl">صندوق ورودی شما خالی است</h3>
                    <p className="text-muted-foreground mt-2">
                        {user.accountType === 'provider'
                            ? 'وقتی پیامی از مشتریان دریافت کنید، در اینجا نمایش داده می‌شود.'
                            : 'برای شروع، یک هنرمند را پیدا کرده و به او پیام دهید.'}
                    </p>
                    {user.accountType === 'customer' && (
                        <Button asChild className="mt-6">
                            <Link href="/">مشاهده هنرمندان</Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
       </div>
     )
  }

  return (
    <div className="max-w-4xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">صندوق ورودی پیام‌ها</CardTitle>
          <CardDescription>آخرین گفتگوهای خود را در اینجا مشاهده کنید. پیام‌ها موقتا در مرورگر شما ذخیره می‌شوند.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-20 text-destructive bg-destructive/10 rounded-lg">
              <p>{error}</p>
            </div>
          )}
          {!error && chats.length > 0 && (
            <div className="space-y-4">
              {chats.map((chat) => (
                <Link href={`/chat/${chat.otherMemberId}`} key={chat.id}>
                    <div className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <Avatar className="h-12 w-12 ml-4">
                            <AvatarFallback>{getInitials(chat.otherMemberName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow overflow-hidden">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold">{chat.otherMemberName}</h4>
                                <p className="text-xs text-muted-foreground flex-shrink-0">
                                  {isClient ? formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true, locale: faIR }) : '...'}
                                </p>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-sm text-muted-foreground truncate font-semibold">{chat.lastMessage}</p>
                                {chat.unreadCount > 0 && (
                                    <Badge variant="destructive" className="flex-shrink-0">{chat.unreadCount}</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

---
### `/src/app/layout.tsx`
---
```tsx
'use client';

import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';

const AuthProvider = dynamic(() => import('@/context/AuthContext').then(mod => mod.AuthProvider), { ssr: false });
const Header = dynamic(() => import('@/components/layout/header'), { ssr: false });
const SearchBar = dynamic(() => import('@/components/ui/search-bar'), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/footer'), { ssr: false });
const Toaster = dynamic(() => import('@/components/ui/toaster').then(mod => mod.Toaster), { ssr: false });


const vazirmatn = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-sans',
});

// This can't be a dynamic export in a client component, 
// so we define it statically here.
// export const metadata: Metadata = {
//   title: 'هنربانو',
//   description: 'بازاری برای خدمات خانگی بانوان هنرمند',
//   manifest: '/manifest.json',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(error => console.log('Service Worker registration failed:', error));
    }
  }, []);

  return (
    <html lang="fa" dir="rtl">
       <head>
          <title>هنربانو</title>
          <meta name="description" content="بازاری برای خدمات خانگی بانوان هنرمند" />
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#A3BEA6" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          vazirmatn.variable
        )}
      >
        <AuthProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <SearchBar />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
```

---
### `/src/app/login/page.tsx`
---
```tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from "next/link";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from "@/components/ui/input";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getProviders } from '@/lib/data';
import type { User } from '@/context/AuthContext';


const formSchema = z.object({
  phone: z.string().regex(/^09\d{9}$/, {
    message: 'لطفاً یک شماره تلفن معتبر ایرانی وارد کنید (مثال: 09123456789).',
  }),
});

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const allProviders = getProviders();
        const existingProvider = allProviders.find(p => p.phone === values.phone);

        let userToLogin: User;

        if (existingProvider) {
          // User is a known provider
          userToLogin = {
            name: existingProvider.name,
            phone: existingProvider.phone,
            accountType: 'provider',
          };
        } else {
          // User is a customer
          userToLogin = {
            name: `کاربر ${values.phone.slice(-4)}`,
            phone: values.phone,
            accountType: 'customer',
          };
        }
        
        login(userToLogin);

        toast({
          title: 'ورود با موفقیت انجام شد!',
          description: `خوش آمدید ${userToLogin.name}! به صفحه اصلی هدایت می‌شوید.`,
        });
        
        router.push('/');

    } catch (error) {
        console.error("Login failed:", error);
        toast({
            title: 'خطا در ورود',
            description: 'مشکلی پیش آمده است، لطفاً دوباره تلاش کنید.',
            variant: 'destructive'
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center py-12 md:py-20">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">ورود یا ثبت‌نام</CardTitle>
          <CardDescription>
            برای ورود یا ساخت حساب کاربری، شماره تلفن خود را وارد کنید.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره تلفن</FormLabel>
                    <FormControl>
                      <Input placeholder="09123456789" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                 {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                ورود
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm">
            هنرمند هستید؟{" "}
            <Link href="/register" className="underline">
              از اینجا ثبت‌نام کنید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---
### `/src/app/not-found.tsx`
---
```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 md:py-32">
      <SearchX className="w-24 h-24 text-destructive mb-6" />
      <h1 className="font-display text-5xl md:text-7xl font-bold">۴۰۴ - صفحه یافت نشد</h1>
      <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
        متاسفانه صفحه‌ای که به دنبال آن بودید وجود ندارد. ممکن است آدرس را اشتباه وارد کرده باشید یا صفحه حذف شده باشد.
      </p>
      <Button asChild size="lg" className="mt-8">
        <Link href="/">بازگشت به صفحه اصلی</Link>
      </Button>
    </div>
  )
}
```

---
### `/src/app/page.tsx`
---
```tsx
'use client';

import Link from 'next/link';
import { categories } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, ChefHat, Scissors, Gift } from 'lucide-react';
import dynamic from 'next/dynamic';

const Logo = dynamic(() => import('@/components/layout/logo').then(mod => mod.Logo), { ssr: false });

const iconMap: { [key: string]: React.ElementType } = {
  beauty: Palette,
  cooking: ChefHat,
  tailoring: Scissors,
  handicrafts: Gift,
};

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center">
      <section className="text-center py-20 lg:py-24 w-full">
        <Logo className="mx-auto mb-6 h-32 w-32 text-primary-foreground" />
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary-foreground to-accent-foreground/80">
          هنربانو
        </h1>
        <p className="mt-4 font-headline text-xl md:text-2xl text-primary-foreground">
          با دستان هنرمندت بدرخش
        </p>
        <p className="mt-4 text-lg md:text-xl text-primary-foreground max-w-2xl mx-auto">
          بانوان هنرمندی که خدمات خانگی در محله شما ارائه می‌دهند را کشف و حمایت کنید. از غذاهای خانگی خوشمزه تا صنایع دستی زیبا، بهترین هنرمندان محلی را اینجا پیدا کنید.
        </p>
      </section>

      <section id="categories" className="py-16 w-full">
        <h2 className="text-3xl font-headline font-bold text-center mb-12">خدمات ما</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => {
            const Icon = iconMap[category.slug];
            return (
              <Link href={`/services/${category.slug}`} key={category.id}>
                <Card className="h-full flex flex-col items-center text-center p-6 hover:shadow-lg hover:-translate-y-1 transition-transform duration-300">
                  <CardHeader className="items-center">
                    {Icon && <Icon className="w-20 h-20 mb-4 text-accent" />}
                    <CardTitle className="font-headline text-2xl">{category.name}</CardTitle>
                  </CardHeader>
                  <CardDescription>{category.description}</CardDescription>
                </Card>
              </Link>
            );
          })}
        </div>
         <div className="mt-12 text-center">
            <Button asChild variant="secondary" size="lg" className="text-lg">
              <Link href="/register">به جامعه ما بپیوندید</Link>
            </Button>
          </div>
      </section>
    </div>
  );
}
```

---
### `/src/app/profile/page.tsx`
---
```tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input as UiInput } from '@/components/ui/input';
import { Textarea as UiTextarea } from '@/components/ui/textarea';
import { MapPin, User, AlertTriangle, PlusCircle, Trash2, Camera, Edit, Save, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import type { Provider } from '@/lib/types';
import { getProviders, saveProviders } from '@/lib/data';
import { useState, useEffect, useRef, ChangeEvent, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, isLoggedIn, login } = useAuth();
  const [provider, setProvider] = useState<Provider | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);
  const profilePicInputRef = useRef<HTMLInputElement>(null);
  
  const [mode, setMode] = useState<'viewing' | 'editing'>('viewing');
  const [editedData, setEditedData] = useState({ name: '', service: '', bio: '' });

  const loadProviderData = useCallback(() => {
    if (user && user.accountType === 'provider') {
        const allProviders = getProviders();
        let currentProvider = allProviders.find(p => p.phone === user.phone);
        
        if (currentProvider) {
            setProvider(currentProvider);
            setEditedData({
                name: currentProvider.name,
                service: currentProvider.service,
                bio: currentProvider.bio,
            });
        }
    }
  }, [user]);

  useEffect(() => {
    loadProviderData();
  }, [loadProviderData]);


  const handleEditInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedData(prev => ({...prev, [name]: value}));
  }

  const handleSaveChanges = () => {
    if(!editedData.name.trim() || !editedData.service.trim() || !editedData.bio.trim()){
        toast({ title: "خطا", description: "تمام فیلدها باید پر شوند.", variant: "destructive"});
        return;
    }

    let userWasUpdated = false;
    const success = updateProviderData((p) => {
        if(user && user.name !== editedData.name){
            userWasUpdated = true;
        }
        p.name = editedData.name;
        p.service = editedData.service;
        p.bio = editedData.bio;
    });

    if(success) {
        if (userWasUpdated && user) {
            const updatedUser = { ...user, name: editedData.name };
            login(updatedUser); 
        }
        toast({ title: "موفق", description: "اطلاعات شما با موفقیت به‌روز شد."});
        setMode('viewing');
    } else {
        toast({ title: 'خطا', description: 'اطلاعات هنرمند برای به‌روزرسانی یافت نشد.', variant: 'destructive' });
    }
  }

  const handleCancelEdit = () => {
    if (provider) {
       setEditedData({
            name: provider.name,
            service: provider.service,
            bio: provider.bio,
        });
    }
    setMode('viewing');
  }


  const handleImageResizeAndSave = (file: File, callback: (dataUrl: string) => void) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string;
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            callback(compressedDataUrl);
          } else {
            callback(imageSrc);
          }
        };
        img.src = imageSrc;
      };
      reader.readAsDataURL(file);
  }

  const updateProviderData = (updateFn: (provider: Provider) => void) => {
    if (!user) return false;
    const allProviders = getProviders();
    const updatedProvidersList = JSON.parse(JSON.stringify(allProviders));
    const providerIndex = updatedProvidersList.findIndex((p: Provider) => p.phone === user.phone);

    if (providerIndex > -1) {
      updateFn(updatedProvidersList[providerIndex]);
      saveProviders(updatedProvidersList);
      // After saving, reload data into state
      loadProviderData();
      return true;
    }
    return false;
  }

  const addPortfolioItem = (imageSrc: string) => {
    const success = updateProviderData((p) => {
      if (!p.portfolio) p.portfolio = [];
      p.portfolio.push({ src: imageSrc, aiHint: 'new work' });
    });
    if (success) {
      toast({ title: 'موفقیت‌آمیز', description: 'نمونه کار جدید با موفقیت اضافه شد.' });
    } else {
      toast({ title: 'خطا', description: 'اطلاعات هنرمند برای به‌روزرسانی یافت نشد.', variant: 'destructive' });
    }
  };
  
  const handleProfilePictureChange = (newImageSrc: string) => {
      const success = updateProviderData((p) => {
        if (!p.profileImage) p.profileImage = { src: '', aiHint: 'woman portrait' };
        p.profileImage.src = newImageSrc;
      });
      if (success) {
        toast({ title: 'موفقیت‌آمیز', description: 'عکس پروفایل شما با موفقیت به‌روز شد.' });
      } else {
        toast({ title: 'خطا', description: 'اطلاعات هنرمند برای به‌روزرسانی یافت نشد.', variant: 'destructive' });
      }
  }

  const handleDeleteProfilePicture = () => {
    const success = updateProviderData((p) => {
      if (p.profileImage) p.profileImage.src = '';
    });
    if (success) {
      toast({ title: 'موفقیت‌آمیز', description: 'عکس پروفایل شما با موفقیت حذف شد.' });
    } else {
      toast({ title: 'خطا', description: 'اطلاعات هنرمند برای به‌روزرسانی یافت نشد.', variant: 'destructive' });
    }
  };

  const handleAddPortfolioClick = () => {
    portfolioFileInputRef.current?.click();
  };
  
  const handleEditProfilePicClick = () => {
    profilePicInputRef.current?.click();
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>, callback: (dataUrl: string) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageResizeAndSave(file, callback);
      event.target.value = '';
    }
  };
  
  if (!isLoggedIn) {
     return (
        <div className="flex flex-col items-center justify-center text-center py-20 md:py-32">
            <User className="w-24 h-24 text-muted-foreground mb-6" />
            <h1 className="font-display text-4xl md:text-5xl font-bold">صفحه پروفایل</h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
                برای مشاهده پروفایل خود، لطفاً ابتدا وارد شوید.
            </p>
            <Button asChild size="lg" className="mt-8">
                <Link href="/login">ورود به حساب کاربری</Link>
            </Button>
        </div>
     )
  }

  if (user?.accountType !== 'provider') {
     return (
        <div className="flex flex-col items-center justify-center text-center py-20 md:py-32">
            <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
            <h1 className="font-display text-4xl md:text-5xl font-bold">شما ارائه‌دهنده خدمات نیستید</h1>
            <p className="mt-4 text-lg md-text-xl text-muted-foreground max-w-xl mx-auto">
                این صفحه فقط برای ارائه‌دهندگان خدمات است. برای ثبت نام به عنوان هنرمند، به صفحه ثبت‌نام بروید.
            </p>
            <Button asChild size="lg" className="mt-8">
                <Link href="/register">ثبت‌نام به عنوان هنرمند</Link>
            </Button>
        </div>
     )
  }
  
  if (!provider) {
    return <div>در حال بارگذاری پروفایل...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-12 md:py-20 space-y-8">
      <Card>
        <div className="grid md:grid-cols-3">
          <div className="md:col-span-1 p-6 flex flex-col items-center text-center border-b md:border-b-0 md:border-l">
             <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-primary shadow-lg mb-4">
               {provider.profileImage && provider.profileImage.src ? (
                  <Image
                    src={provider.profileImage.src}
                    alt={provider.name}
                    fill
                    className="object-cover"
                    data-ai-hint={provider.profileImage.aiHint}
                  />
                ) : (
                   <div className="bg-muted w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
            </div>
            {mode === 'editing' ? (
                 <UiInput name="name" value={editedData.name} onChange={handleEditInputChange} className="text-center font-headline text-3xl mb-1" />
            ) : (
                <CardTitle className="font-headline text-3xl">{provider.name}</CardTitle>
            )}
             {mode === 'editing' ? (
                 <UiInput name="service" value={editedData.service} onChange={handleEditInputChange} className="text-center text-lg text-muted-foreground" />
            ) : (
                <CardDescription className="text-lg">{provider.service}</CardDescription>
            )}

             <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 ml-2 text-accent" />
                <span>{provider.location}</span>
             </div>
          </div>
          <div className="md:col-span-2 p-6 flex flex-col">
            <CardHeader className="p-0 pb-4">
                <CardTitle className="font-headline text-2xl">داشبورد مدیریت</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-grow">
              <h3 className="font-semibold mb-2">درباره شما</h3>
              {mode === 'editing' ? (
                  <UiTextarea name="bio" value={editedData.bio} onChange={handleEditInputChange} className="text-base text-foreground/80 leading-relaxed" rows={4} />
              ) : (
                  <p className="text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{provider.bio}</p>
              )}
               <Separator className="my-6" />
                <div className="mb-4">
                  <h3 className="font-headline text-xl font-semibold mb-4">مدیریت نمونه کارها</h3>
                  
                  <input 
                    type="file" 
                    ref={portfolioFileInputRef} 
                    onChange={(e) => handleFileChange(e, addPortfolioItem)}
                    className="hidden"
                    accept="image/*"
                  />
                   <input
                    type="file"
                    ref={profilePicInputRef}
                    onChange={(e) => handleFileChange(e, handleProfilePictureChange)}
                    className="hidden"
                    accept="image/*"
                  />
                   <Button onClick={handleAddPortfolioClick} size="lg" className="w-full font-bold mb-6">
                        <PlusCircle className="w-5 h-5 ml-2" />
                        افزودن نمونه کار جدید
                   </Button>
                   <p className="text-xs text-center text-muted-foreground">برای حذف نمونه‌کارها، به پروفایل عمومی خود مراجعه کرده و روی دکمه سطل زباله کلیک کنید.</p>
                </div>
            </CardContent>
             <CardFooter className="flex flex-col sm:flex-row flex-wrap gap-2 pt-6 border-t mt-auto">
                {mode === 'editing' ? (
                    <>
                         <Button onClick={handleSaveChanges} className="w-full flex-1">
                            <Save className="w-4 h-4 ml-2" />
                            ذخیره تغییرات
                        </Button>
                         <Button onClick={handleEditProfilePicClick} variant="outline" className="w-full flex-1">
                            <Camera className="w-4 h-4 ml-2" />
                            تغییر عکس پروفایل
                        </Button>
                        <Button onClick={handleDeleteProfilePicture} variant="destructive" className="w-full flex-1">
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف عکس پروفایل
                        </Button>
                        <Button onClick={handleCancelEdit} variant="ghost" className="w-full flex-1 mt-2 sm:mt-0 sm:w-auto">
                            <XCircle className="w-4 h-4 ml-2" />
                            لغو
                        </Button>
                    </>
                ) : (
                    <>
                        <Button onClick={() => setMode('editing')} className="w-full flex-1">
                            <Edit className="w-4 h-4 ml-2" />
                            ویرایش اطلاعات
                        </Button>
                         <Button asChild className="w-full flex-1">
                            <Link href="/inbox">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-2"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                                صندوق ورودی
                            </Link>
                        </Button>
                        <Button asChild className="w-full flex-1" variant="secondary">
                            <Link href={`/provider/${provider.phone}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 ml-2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                مشاهده پروفایل عمومی
                            </Link>
                        </Button>
                    </>
                )}
            </CardFooter>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

... (and so on for every other file)

