
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { faIR } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getConversationsForUser } from './actions';


const getInitials = (name: string | null) => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length > 1 && names[1] && isNaN(parseInt(names[1]))) {
    return `${names[0][0]}${names[1][0]}`;
  }
  return name.substring(0, 2);
};


export default async function InboxPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center py-20">
            <User className="w-16 h-16 text-muted-foreground mb-4" />
            <h1 className="font-headline text-2xl">لطفا وارد شوید</h1>
            <p className="text-muted-foreground mt-2">برای مشاهده صندوق ورودی باید وارد حساب کاربری خود شوید.</p>
            <Button asChild className="mt-6">
              <Link href="/login">ورود به حساب کاربری</Link>
            </Button>
          </div>
        );
    }
    
    const { data: profile } = await supabase.from('profiles').select('account_type').eq('id', user.id).single();
    const conversations = await getConversationsForUser();

    if (conversations.length === 0) {
        return (
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">صندوق ورودی پیام‌ها</CardTitle>
                    <CardDescription>
                        {profile?.account_type === 'provider' 
                            ? 'آخرین گفتگوهای خود با مشتریان را در اینجا مشاهده کنید.' 
                            : 'آخرین گفتگوهای خود با هنرمندان را در اینجا مشاهده کنید.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-20 border-2 border-dashed rounded-lg">
                        <Inbox className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-bold text-xl">صندوق ورودی شما خالی است</h3>
                        <p className="text-muted-foreground mt-2">
                            {profile?.account_type === 'provider'
                                ? 'وقتی پیامی از مشتریان دریافت کنید، در اینجا نمایش داده می‌شود.'
                                : 'برای شروع، یک هنرمند را پیدا کرده و به او پیام دهید.'}
                        </p>
                    </div>
                </CardContent>
            </Card>
            </div>
        )
    }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">صندوق ورودی پیام‌ها</CardTitle>
          <CardDescription>آخرین گفتگوهای خود را در اینجا مشاهده کنید.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
              {conversations.map((convo) => (
                <Link href={`/chat/${convo.other_participant.phone}`} key={convo.id}>
                    <div className="flex items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                        <Avatar className="h-12 w-12 ml-4">
                            <AvatarFallback>{getInitials(convo.other_participant.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow overflow-hidden">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold">{convo.other_participant.full_name}</h4>
                                <p className="text-xs text-muted-foreground flex-shrink-0">
                                  {convo.last_message_at ? formatDistanceToNow(new Date(convo.last_message_at), { addSuffix: true, locale: faIR }) : ''}
                                </p>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <p className="text-sm text-muted-foreground truncate font-semibold">{convo.last_message_content}</p>
                                {convo.unread_count > 0 && (
                                    <Badge variant="destructive" className="flex-shrink-0">{convo.unread_count}</Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </Link>
              ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
