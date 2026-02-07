'use server';

import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';
import { getInitialChatData } from '../actions';
import { ChatUI } from './ChatUI';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ChatPage({ params }: { params: { providerId: string } }) {
    noStore();
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/login?redirect=/chat/${params.providerId}`);
    }
    
    const { data: currentUserProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if (profileError || !currentUserProfile) {
        return <div className='container mx-auto py-8 text-center'>خطا در بارگذاری پروفایل شما.</div>
    }

    const initialData = await getInitialChatData(params.providerId);

    if (initialData.error) {
        let errorMessage = "خطا در بارگذاری گفتگو.";
        if (initialData.error === 'Agreement not accepted.') {
           errorMessage = "برای شروع گفتگو، ابتدا باید با این هنرمند توافق تایید شده داشته باشید.";
        }
        return (
            <div className="container mx-auto text-center py-20">
                <h1 className="text-2xl font-bold">{errorMessage}</h1>
                <Button asChild className="mt-4"><Link href={`/provider/${params.providerId}`}>بازگشت به پروفایل هنرمند</Link></Button>
            </div>
        );
    }
    
    return (
      <div className="flex flex-col h-full py-4 flex-1">
        <ChatUI initialData={initialData} currentUserProfile={currentUserProfile} />
      </div>
    );
}
