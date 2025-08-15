'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowUp, Loader2, User, Edit, Save, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormEvent, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Message as MessageType, Provider } from '@/lib/types';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface OtherPersonDetails {
    id: string;
    name: string;
    phone: string;
    profileImage?: { src: string; aiHint?: string };
}

export default function ChatPage() {
  const params = useParams();
  const otherPersonPhone = params.providerId as string;
  const { user, isLoggedIn, isLoading: isAuthLoading, providers, sendChatMessage, editChatMessage, markChatAsRead, getInboxForUser } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const otherPersonDetails = useMemo<OtherPersonDetails | null>(() => {
    const provider = providers.find(p => p.phone === otherPersonPhone);
    if (provider) {
        return provider;
    }
    // If the other person is not a known provider, it must be a customer.
    // We might not have their full details if they haven't been in a chat before,
    // so create a placeholder. The name will be updated once the chat logic runs.
    return { id: otherPersonPhone, name: `مشتری ${otherPersonPhone.slice(-4)}`, phone: otherPersonPhone };
  }, [providers, otherPersonPhone]);

  const getChatId = useCallback((phone1?: string, phone2?: string) => {
    if (!phone1 || !phone2) return null;
    return [phone1, phone2].sort().join('_');
  }, []);

  const chatId = useMemo(() => getChatId(user?.phone, otherPersonPhone), [user?.phone, otherPersonPhone, getChatId]);
  
  useEffect(() => {
    if (!chatId || !user?.phone) {
        setIsLoadingChat(false);
        return;
    }

    setIsLoadingChat(true);
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: MessageType[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // Convert Firestore Timestamp to ISO string for consistency
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString();
          return {
              ...data,
              id: doc.id,
              createdAt,
          } as MessageType
      });
      setMessages(msgs);
      setIsLoadingChat(false);
      markChatAsRead(chatId, user.phone);
    }, (error) => {
        console.error("Error listening to chat messages:", error);
        toast({ title: "خطا", description: "امکان بارگذاری پیام‌ها وجود ندارد.", variant: "destructive" });
        setIsLoadingChat(false);
    });

    return () => unsubscribe();
  }, [chatId, user?.phone, markChatAsRead, toast]);


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

  const [headerLink, setHeaderLink] = useState('/');
  useEffect(() => {
    const checkInbox = async () => {
        if (!user) return;
        if (user.accountType === 'provider') {
            setHeaderLink('/inbox');
            return;
        }
        try {
            const inbox = await getInboxForUser(user.phone);
            if (Object.keys(inbox).length > 0) {
                setHeaderLink('/inbox');
            } else {
                setHeaderLink('/');
            }
        } catch (e) {
            setHeaderLink('/');
        }
    }
    if(user){
        checkInbox();
    }
  }, [user, getInboxForUser]);
  
  const isLoading = isAuthLoading || isLoadingChat;

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
            <Button asChild className="mt-6">
                <Link href="/login">ورود به حساب کاربری</Link>
            </Button>
        </div>
    );
  }
  
  const handleStartEdit = (message: MessageType) => {
    setEditingMessageId(message.id);
    setEditingText(message.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };
  
  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingText.trim() || !chatId) return;
    setIsSending(true);
    try {
      await editChatMessage(chatId, editingMessageId, editingText.trim());
      handleCancelEdit();
      toast({ title: 'پیام ویرایش شد.' });
    } catch (e) {
      console.error("Failed to edit message", e);
      toast({ title: "خطا", description: "پیام شما ویرایش نشد.", variant: "destructive" });
    } finally {
       setIsSending(false);
    }
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || isSending || !otherPersonDetails || !user || !chatId) return;
    
    setIsSending(true);
    
    const messageToSend: Omit<MessageType, 'id'> = {
      text: text,
      senderId: user.phone,
      createdAt: new Date().toISOString(),
    };
    
    setNewMessage('');
    
    try {
       await sendChatMessage(chatId, messageToSend, { phone: otherPersonDetails.phone, name: otherPersonDetails.name }, user);
    } catch(e) {
        console.error("Failed to send message", e);
        toast({ title: "خطا", description: "پیام شما ارسال نشد.", variant: "destructive" });
        setNewMessage(text);
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full py-4">
      <Card className="flex-1 flex flex-col w-full">
        <CardHeader className="flex flex-row items-center gap-4 border-b shrink-0">
           <Link href={headerLink}>
             <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5"/>
             </Button>
           </Link>
           <Avatar>
            {otherPersonDetails?.profileImage?.src ? (
                <AvatarImage src={otherPersonDetails.profileImage.src} alt={otherPersonDetails.name} />
            ) : null }
            <AvatarFallback>{getInitials(otherPersonDetails?.name ?? '?')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{otherPersonDetails?.name}</CardTitle>
            <CardDescription>{'گفتگوی مستقیم'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 space-y-4 overflow-y-auto">
            {isLoadingChat && (
              <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isLoadingChat && messages.length === 0 && (
              <div className="text-center text-muted-foreground p-8">
                <p>شما اولین پیام را ارسال کنید.</p>
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
                        <AvatarFallback>{getInitials(otherPersonDetails?.name ?? '?')}</AvatarFallback>
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
