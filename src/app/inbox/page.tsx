import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getConversationsForUser } from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox, User } from 'lucide-react';
import Link from 'next/link';
import { InboxClientPage } from './InboxClientPage';

export default async function InboxPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="container mx-auto flex flex-col items-center justify-center text-center py-20 flex-grow">
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
            <div className="max-w-4xl mx-auto py-12 container">
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
                            {profile?.account_type === 'customer' && (
                                <Button asChild className="mt-6">
                                    <Link href="/">مشاهده هنرمندان</Link>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 container">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl">صندوق ورودی پیام‌ها</CardTitle>
                    <CardDescription>آخرین گفتگوهای خود را در اینجا مشاهده کنید.</CardDescription>
                </CardHeader>
                <CardContent>
                    <InboxClientPage initialConversations={conversations} />
                </CardContent>
            </Card>
        </div>
    );
}
