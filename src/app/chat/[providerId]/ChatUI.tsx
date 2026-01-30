
'use client';

import { FormEvent, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowUp, Loader2 } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import type { Conversation, Message, Profile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { sendMessageAction } from '../actions';
import { useRouter } from 'next/navigation';

interface ChatUIProps {
  initialData: {
    partnerProfile: Profile;
    conversation: Conversation;
    messages: Message[];
  };
  currentUserProfile: Profile;
}

const getInitials = (name: string | null) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length > 1 && names[1]) {
    return `${names[0][0]}${names[1][0]}`;
  }
  return name.substring(0, 2);
}

export function ChatUI({ initialData, currentUserProfile }: ChatUIProps) {
  const router = useRouter();
  const { partnerProfile, conversation } = initialData;
  const [messages, setMessages] = useState<Message[]>(initialData.messages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
      const supabase = createClient();
      if (!conversation) return;

      const channel = supabase
        .channel(`chat-room-${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`,
          },
          (payload) => {
            const newMessage = payload.new as Message;
            // Prevent adding own message twice (optimistic update + real-time)
            if (newMessage.sender_id !== currentUserProfile.id) {
               setMessages((prevMessages) => [...prevMessages, newMessage]);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [conversation, currentUserProfile.id]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content || isSending || !conversation) return;
    
    setIsSending(true);
    
    const tempMessage: Message = {
      id: Date.now().toString(), // temporary ID
      content: content,
      sender_id: currentUserProfile.id,
      receiver_id: partnerProfile.id,
      conversation_id: conversation.id,
      created_at: new Date().toISOString(),
    };
    
    // Optimistic UI update
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    const result = await sendMessageAction({
        conversationId: conversation.id,
        content,
        receiverId: partnerProfile.id,
    });
    
    if(result.error) {
        toast.error("Failed to send message", { description: result.error });
        // Revert optimistic update on failure
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
    
    setIsSending(false);
    // No need to refresh, realtime will update last message on inbox
  };
  
  const getHeaderLink = () => {
    if (currentUserProfile.account_type === 'provider') return '/inbox';
    // Simplified: always link back to inbox if they get here.
    return '/inbox';
  }

  return (
    <div className="flex flex-1 flex-col py-4 container mx-auto">
      <Card className="flex-1 flex flex-col w-full">
        <CardHeader className="flex flex-row items-center gap-4 border-b shrink-0">
           <Link href={getHeaderLink()}>
             <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5"/>
             </Button>
           </Link>
           <Avatar>
            {partnerProfile?.profile_image_url ? (
                <AvatarImage src={partnerProfile.profile_image_url} alt={partnerProfile.full_name ?? ''} />
            ) : null }
            <AvatarFallback>{getInitials(partnerProfile?.full_name ?? '')}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{partnerProfile?.full_name}</CardTitle>
            <CardDescription>{'گفتگوی مستقیم'}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-6 space-y-4 overflow-y-auto">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground p-8">
                <p>هیچ پیامی در این گفتگو وجود ندارد.</p>
                <p className="text-xs mt-2">شما اولین پیام را ارسال کنید.</p>
              </div>
            )}
            {messages.map((message) => {
                const senderIsUser = message.sender_id === currentUserProfile.id;

                return (
                  <div 
                    key={message.id} 
                    className={`flex items-end gap-2 group ${senderIsUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!senderIsUser && (
                      <Avatar className="h-8 w-8 select-none">
                        {partnerProfile?.profile_image_url ? (
                            <AvatarImage src={partnerProfile.profile_image_url} alt={partnerProfile.full_name ?? ''} />
                        ) : null }
                        <AvatarFallback>{getInitials(partnerProfile?.full_name ?? '')}</AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`flex items-center gap-2 ${senderIsUser ? 'flex-row-reverse' : ''}`}>
                        <div className={`p-3 rounded-lg max-w-xs md:max-w-md relative select-none ${senderIsUser ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          <p className="text-sm font-semibold">{message.content}</p>
                        </div>
                    </div>

                     {senderIsUser && (
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
                disabled={isSending || !conversation}
              />
              <Button size="icon" type="submit" className="h-10 w-10 shrink-0" disabled={isSending || !newMessage.trim() || !conversation}>
                  {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
              </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
