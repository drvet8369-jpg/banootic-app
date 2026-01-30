
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { getInitialChatData } from '../actions';
import { ChatUI } from './ChatUI';

export default async function ChatPage({ params }: { params: { providerId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: currentUserProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  
  if (!currentUserProfile) {
    redirect('/login');
  }

  const initialData = await getInitialChatData(params.providerId);
  if (!initialData || initialData.error) {
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
