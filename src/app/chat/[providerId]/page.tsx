
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { getInitialChatData } from '../actions';
import { ChatUI } from './ChatUI';
import type { Profile } from '@/lib/types';

export default async function ChatPage({ params }: { params: { providerId: string } }) {
  const partnerPhone = params.providerId;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/chat/${partnerPhone}`);
  }

  const { data: currentUserProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
  
  if (profileError || !currentUserProfile) {
      console.error("Chat page: Could not load current user profile", profileError);
      return <div className="container mx-auto py-10">خطا: پروفایل کاربری شما یافت نشد.</div>
  }

  const initialData = await getInitialChatData(partnerPhone);
  
  if (initialData.error) {
    console.error("Error fetching initial chat data:", initialData?.error);
    if (initialData.error === 'Agreement not accepted.') {
        return (
            <div className="container mx-auto py-20 text-center">
                <h1 className="text-2xl font-bold text-destructive">دسترسی به گفتگو ممکن نیست</h1>
                <p className="mt-4 text-muted-foreground">شما باید با این هنرمند توافق تایید شده داشته باشید تا بتوانید گفتگو را آغاز کنید.</p>
            </div>
        );
    }
    notFound();
  }

  return (
    <div className="flex flex-col h-full">
      <ChatUI 
        initialData={initialData}
        currentUserProfile={currentUserProfile as Profile}
      />
    </div>
  );
}
