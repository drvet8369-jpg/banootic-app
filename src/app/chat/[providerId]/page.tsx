'use client';

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
import type { Provider, ChatMessage } from '@/lib/types';
import { getProviderByPhone, sendMessage, subscribeToMessages } from '@/lib/api';
import { RealtimeChannel } from '@supabase/supabase-js';
import { dispatchCrossTabEvent } from '@/lib/events';


interface OtherPersonDetails {
    id: string | number;
    name: string;
    phone: string;
    profileImage?: { src: string; aiHint?: string };
}


export default function ChatPage() {
  const params = useParams();
  const otherPersonId = params.providerId as string;
  const { user, isLoggedIn } = useAuth();
  const { toast } = useToast();
  const channelRef = useRef<RealtimeChannel | null>(null);

  const [otherPersonDetails, setOtherPersonDetails] = useState<OtherPersonDetails | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  const getChatId = useCallback((phone1?: string, phone2?: string) => {
    if (!phone1 || !phone2) return null;
    return [phone1, phone2].sort().join('__');
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

  // Effect to load initial chat data and set up real-time subscription
  useEffect(() => {
    if (!isLoggedIn || !user || !otherPersonId) {
      setIsLoading(false);
      return;
    }

    const chatId = getChatId(user.phone, otherPersonId);
    if (!chatId) {
        setIsLoading(false);
        return;
    }

    async function setupChat() {
      // 1. Fetch details of the other person
      try {
        const providerDetails = await getProviderByPhone(otherPersonId);
        if(providerDetails) {
            setOtherPersonDetails(providerDetails);
        } else {
             // Fallback for customer-to-customer or non-provider chats
            setOtherPersonDetails({ id: otherPersonId, name: `کاربر ${otherPersonId.slice(-4)}`, phone: otherPersonId });
        }
      } catch (error) {
        toast({ title: 'خطا', description: 'اطلاعات کاربر مقابل یافت نشد.', variant: 'destructive' });
      }

      // 2. Subscribe to messages
      const { initialMessages, channel } = await subscribeToMessages(chatId, (newMessage) => {
        setMessages((prevMessages) => {
          // Avoid adding duplicates
          if (prevMessages.some(m => m.id === newMessage.id)) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });
        dispatchCrossTabEvent('messages-update'); // Notify other tabs
      });

      setMessages(initialMessages);
      channelRef.current = channel;
      setIsLoading(false);
    }

    setupChat();

    // Cleanup subscription on component unmount
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [otherPersonId, isLoggedIn, user, getChatId, toast]);


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
  
  const handleStartEdit = (message: ChatMessage) => {
    if(!message.id) return;
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };
  
  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim() || !user || !otherPersonDetails) return;
    setIsSending(true);
    // Here you would call an API function to update the message in Supabase
    // For now, we'll just optimistically update the UI
    setMessages(messages.map(msg => 
      msg.id === editingMessageId ? { ...msg, text: editingText.trim(), is_edited: true } : msg
    ));
    // await updateMessage(editingMessageId, editingText.trim());
    dispatchCrossTabEvent('messages-update'); // Notify other tabs
    toast({ title: 'پیام ویرایش شد.' });
    handleCancelEdit();
    setIsSending(false);
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || isSending || !otherPersonDetails || !user) return;
    
    setIsSending(true);
    
    const chatId = getChatId(user.phone, otherPersonDetails.phone);
    if (!chatId) {
        setIsSending(false);
        toast({ title: 'خطا', description: 'شناسه گفتگو نامعتبر است.', variant: 'destructive'});
        return;
    }

    try {
        await sendMessage({
            chat_id: chatId,
            sender_id: user.phone,
            text: text,
        });
        setNewMessage('');
        // No need to dispatch here, the subscription handler will do it.
    } catch (error) {
        toast({ title: 'خطا', description: 'پیام شما ارسال نشد. لطفاً دوباره تلاش کنید.', variant: 'destructive'});
    } finally {
        setIsSending(false);
    }
  };

  const getHeaderLink = () => {
    if (user.accountType === 'provider') return '/inbox';
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
            <CardDescription className="text-sm">گفتگوی مستقیم</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 space-y-4 overflow-y-auto">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground p-8">
                <p>این یک گفتگوی جدید است. اولین پیام را ارسال کنید.</p>
              </div>
            )}
            {messages.map((message) => {
                const senderIsUser = message.sender_id === user?.phone;
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
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleSaveEdit} disabled={isSending}><Save className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleCancelEdit} disabled={isSending}><XCircle className="w-4 h-4" /></Button>
                        </div>
                    ) : (
                         <div className={`flex items-center gap-2 ${senderIsUser ? 'flex-row-reverse' : ''}`}>
                             <div className={`p-3 rounded-lg max-w-xs md:max-w-md relative select-none ${senderIsUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="text-sm font-semibold">
                                  {message.text}
                                  {message.is_edited && <span className="text-xs opacity-70 mr-2">(ویرایش شده)</span>}
                                </p>
                            </div>
                            {/* Edit functionality is disabled for now in the live version */}
                            {/* {senderIsUser && (
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleStartEdit(message)}
                                >
                                    <Edit className="w-4 h-4"/>
                                </Button>
                            )} */}
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
                disabled={isSending || isLoading}
              />
              <Button size="icon" type="submit" className="h-10 w-10 shrink-0" disabled={isSending || !newMessage.trim() || isLoading}>
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
              </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
