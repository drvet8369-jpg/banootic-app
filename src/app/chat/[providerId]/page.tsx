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
import type { Provider, Message as MessageType } from '@/lib/types';
import { onSnapshot, collection, query, orderBy, getDoc, doc as firestoreDoc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getProviders } from '@/lib/data';

interface OtherPersonDetails {
    id: string | number;
    name: string;
    phone: string;
    profileImage?: { src: string; aiHint?: string };
}

export default function ChatPage() {
  const params = useParams();
  const otherPersonPhone = params.providerId as string;
  const { user, isLoggedIn, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<MessageType[]>([]);
  const [otherPersonDetails, setOtherPersonDetails] = useState<OtherPersonDetails | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const getChatId = useCallback((phone1?: string, phone2?: string) => {
    if (!phone1 || !phone2) return null;
    return [phone1, phone2].sort().join('_');
  }, []);
  
  const chatId = useMemo(() => getChatId(user?.phone, otherPersonPhone), [user?.phone, otherPersonPhone, getChatId]);

  useEffect(() => {
    const fetchOtherPersonDetails = async () => {
        const allProviders = await getProviders();
        const provider = allProviders.find(p => p.phone === otherPersonPhone);
        if (provider) {
            setOtherPersonDetails(provider);
            return;
        }

        // Handle case where other person is a customer
        if (chatId) {
            const inboxDocRef = firestoreDoc(db, 'inboxes', otherPersonPhone);
            const inboxSnap = await getDoc(inboxDocRef);
            if(inboxSnap.exists()) {
                const inboxData = inboxSnap.data();
                const chatInfo = inboxData[chatId];
                if(chatInfo && chatInfo.participants[user!.phone]) {
                   setOtherPersonDetails({ id: otherPersonPhone, name: chatInfo.participants[user!.phone].name, phone: otherPersonPhone });
                   return;
                }
            }
        }
        
        // Fallback
        setOtherPersonDetails({ id: otherPersonPhone, name: `کاربر ${otherPersonPhone.slice(-4)}`, phone: otherPersonPhone });
    };

    if(user){
        fetchOtherPersonDetails();
    }
  }, [otherPersonPhone, user, chatId]);

  
  useEffect(() => {
    if (!chatId) {
        setIsLoadingChat(false);
        return;
    }

    setIsLoadingChat(true);
    const messagesColRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesColRef, orderBy("createdAt", "asc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: MessageType[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MessageType));
      setMessages(msgs);
      setIsLoadingChat(false);
      
      // Mark as read
      if(user?.phone) {
         const inboxRef = firestoreDoc(db, 'inboxes', user.phone);
         getDoc(inboxRef).then(docSnap => {
             if(docSnap.exists()){
                const inboxData = docSnap.data();
                if(inboxData[chatId] && inboxData[chatId].participants[user!.phone].unreadCount > 0) {
                   setDoc(inboxRef, {
                     [chatId]: { participants: { [user.phone]: { unreadCount: 0 } } }
                   }, { merge: true });
                }
             }
         })
      }
    }, (error) => {
        console.error("Error listening to chat messages:", error);
        toast({ title: "خطا", description: "امکان بارگذاری پیام‌ها وجود ندارد.", variant: "destructive" });
        setIsLoadingChat(false);
    });

    return () => unsubscribe();
  }, [chatId, user?.phone, toast]);


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
  
  const isLoading = isAuthLoading || isLoadingChat || !otherPersonDetails;

  if (isLoading) {
     return (
        <div className="flex flex-col items-center justify-center h-full py-20 flex-grow">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">در حال بارگذاری گفتگو...</p>
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
      const messageRef = firestoreDoc(db, "chats", chatId, "messages", editingMessageId);
      await setDoc(messageRef, { text: editingText.trim(), isEdited: true }, { merge: true });
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
      isEdited: false
    };
    
    setNewMessage('');
    
    try {
       const messagesColRef = collection(db, "chats", chatId, "messages");
       await addDoc(messagesColRef, messageToSend);
       
       // Update inbox for both users
       const senderInboxRef = firestoreDoc(db, 'inboxes', user.phone);
       const receiverInboxRef = firestoreDoc(db, 'inboxes', otherPersonDetails.phone);

       const updateData = {
         id: chatId,
         lastMessage: text,
         updatedAt: new Date().toISOString(),
         members: [user.phone, otherPersonDetails.phone],
         participants: {
             [user.phone]: { name: user.name },
             [otherPersonDetails.phone]: { name: otherPersonDetails.name }
         }
       };

       await setDoc(senderInboxRef, { [chatId]: updateData }, { merge: true });

       // Increment receiver's unread count
       const receiverInboxSnap = await getDoc(receiverInboxRef);
       const receiverInboxData = receiverInboxSnap.exists() ? receiverInboxSnap.data() : {};
       const currentUnreadCount = receiverInboxData[chatId]?.participants?.[otherPersonDetails.phone]?.unreadCount || 0;
       
       const receiverUpdateData = {
           ...updateData,
           participants: {
               ...updateData.participants,
               [otherPersonDetails.phone]: {
                   ...updateData.participants[otherPersonDetails.phone],
                   unreadCount: currentUnreadCount + 1
               },
                [user.phone]: {
                   ...updateData.participants[user.phone],
                   unreadCount: 0
               }
           }
       };

       await setDoc(receiverInboxRef, { [chatId]: receiverUpdateData }, { merge: true });

    } catch(e) {
        console.error("Failed to send message", e);
        toast({ title: "خطا", description: "پیام شما ارسال نشد.", variant: "destructive" });
        setNewMessage(text);
    } finally {
        setIsSending(false);
    }
  };

  const getHeaderLink = () => {
    if (user.accountType === 'provider') return '/inbox';
    // This logic can be simplified or improved based on app requirements
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
            <CardDescription>{'گفتگوی مستقیم'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 space-y-4 overflow-y-auto">
            {messages.length === 0 && !isLoadingChat && (
              <div className="text-center text-muted-foreground p-8">
                <p>پیام‌ها در پایگاه داده ذخیره می‌شوند.</p>
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
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleSaveEdit} disabled={isSending}><Save className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9" onClick={handleCancelEdit} disabled={isSending}><XCircle className="w-4 h-4" /></Button>
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
