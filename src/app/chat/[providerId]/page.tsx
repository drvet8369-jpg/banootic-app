
'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowUp, Loader2, User, Edit, Save, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FormEvent, useState, useRef, useEffect, useCallback } from 'react';
import { useAuth, UserProfile } from '@/context/AuthContext';
import { toast } from 'sonner';
import { getProviderProfile } from '@/lib/data';
import type { ChatParticipant } from '@/lib/types';


interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: string; // Using ISO string for localStorage
  isEdited?: boolean;
}


export default function ChatPage() {
  const params = useParams();
  const otherPersonId = params.providerId as string;
  const { user, isLoading: isAuthLoading } = useAuth();

  const [otherPersonDetails, setOtherPersonDetails] = useState<ChatParticipant | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const getChatId = useCallback((id1?: string, id2?: string) => {
    if (!id1 || !id2) return null;
    return [id1, id2].sort().join('_');
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
    async function fetchOtherPersonDetails() {
        if (!otherPersonId) {
            setIsLoading(false);
            return;
        };

        const providerProfile = await getProviderProfile(otherPersonId);
        
        if (providerProfile) {
          setOtherPersonDetails({
            id: providerProfile.id,
            name: providerProfile.full_name,
            profile_image_url: providerProfile.profile_image_url
          });
        } else {
            // This could be a customer-to-customer chat if we implement that,
            // for now, we assume it's always a provider or we can't find them.
            // Fallback for direct chat links where the other user might not be a provider.
             setOtherPersonDetails({ id: otherPersonId, name: `کاربر`, profile_image_url: '' });
        }
    }
    
    fetchOtherPersonDetails();

  }, [otherPersonId]);


  useEffect(() => {
    if (isAuthLoading || !user || !otherPersonDetails) return;

    const chatId = getChatId(user.id, otherPersonDetails.id);
    if (chatId) {
      try {
          const storedMessages = localStorage.getItem(`chat_${chatId}`);
          if (storedMessages) {
              setMessages(JSON.parse(storedMessages));
          }

          // Mark messages as read when chat is opened
          const allChats = JSON.parse(localStorage.getItem('inbox_chats') || '{}');
          if (allChats[chatId] && allChats[chatId].participants && allChats[chatId].participants[user.id]) {
              allChats[chatId].participants[user.id].unreadCount = 0;
              localStorage.setItem('inbox_chats', JSON.stringify(allChats));
          }
      } catch(e) {
          console.error("Failed to load/update chat from localStorage", e);
      }
    }
    
    setIsLoading(false);

  }, [otherPersonId, isAuthLoading, user, otherPersonDetails, getChatId]);


  if (!user && !isAuthLoading) {
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
  
  if (isLoading || isAuthLoading || !otherPersonDetails) {
     return (
        <div className="flex flex-col items-center justify-center h-full py-20 flex-grow">
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

    const chatId = getChatId(user.id, otherPersonDetails.id);
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
    toast.success('پیام ویرایش شد.');
  };


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || isSending || !otherPersonDetails || !user) return;
    
    setIsSending(true);
    
    const tempUiMessage: Message = {
      id: Date.now().toString(),
      text: text,
      senderId: user.id,
      createdAt: new Date().toISOString(),
    };
    
    const updatedMessages = [...messages, tempUiMessage];
    setMessages(updatedMessages);
    setNewMessage('');

    const chatId = getChatId(user.id, otherPersonDetails.id);
    if (chatId) {
        try {
            const allChats = JSON.parse(localStorage.getItem('inbox_chats') || '{}');
            const currentChat = allChats[chatId] || {
                id: chatId,
                members: [user.id, otherPersonDetails.id],
                participants: {
                    [user.id]: { name: user.full_name, unreadCount: 0 },
                    [otherPersonDetails.id]: { name: otherPersonDetails.name, unreadCount: 0 }
                }
            };
            
            currentChat.lastMessage = text;
            currentChat.updatedAt = new Date().toISOString();

            const receiverId = otherPersonDetails.id;
            if (currentChat.participants[receiverId]) {
                currentChat.participants[receiverId].unreadCount = (currentChat.participants[receiverId].unreadCount || 0) + 1;
            } else {
                 currentChat.participants[receiverId] = { name: otherPersonDetails.name, unreadCount: 1 };
            }

            if (!currentChat.participants[user.id]) {
                currentChat.participants[user.id] = { name: user.full_name, unreadCount: 0 };
            }

            allChats[chatId] = currentChat;
            
            localStorage.setItem(`chat_${chatId}`, JSON.stringify(updatedMessages));
            localStorage.setItem('inbox_chats', JSON.stringify(allChats));
        } catch(e) {
            console.error("Failed to save to localStorage", e);
            toast.error("خطا", {description: "پیام شما در حافظه موقت ذخیره نشد."});
        }
    }
   
    setTimeout(() => {
        setIsSending(false);
    }, 500);
  };

  const getHeaderLink = () => {
    if (user.account_type === 'provider') return '/inbox';
    try {
      const allChatsData = JSON.parse(localStorage.getItem('inbox_chats') || '{}');
      const userChats = Object.values(allChatsData).filter((chat: any) => chat.members?.includes(user.id));
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
            {otherPersonDetails?.profile_image_url ? (
                <AvatarImage src={otherPersonDetails.profile_image_url} alt={otherPersonDetails.name} />
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
                const senderIsUser = message.senderId === user?.id;
                const isEditing = editingMessageId === message.id;

                return (
                  <div 
                    key={message.id} 
                    className={`flex items-end gap-2 group ${senderIsUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!senderIsUser && (
                      <Avatar className="h-8 w-8 select-none">
                        {otherPersonDetails?.profile_image_url ? (
                            <AvatarImage src={otherPersonDetails.profile_image_url} alt={otherPersonDetails.name} />
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
                                <p className="text-sm">
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
