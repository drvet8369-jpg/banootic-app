import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getInitialChatData } from '../actions';
import { ChatUI } from './ChatUI';

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
      return <div>خطا: پروفایل کاربری شما یافت نشد.</div>
  }

  const initialData = await getInitialChatData(partnerPhone);
  
  if (initialData.error) {
    console.error("Error fetching initial chat data:", initialData?.error);
    notFound();
  }

  return (
    <ChatUI 
      initialData={initialData}
      currentUserProfile={currentUserProfile}
    />
  );
}
