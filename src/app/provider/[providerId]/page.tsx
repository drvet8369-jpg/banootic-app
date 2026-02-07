import 'server-only';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProviders } from '@/lib/data';
import type { Review } from '@/lib/types';
import ProviderProfileClientPage from './ProviderProfileClientPage';

async function getReviewsForProvider(providerProfileId: string): Promise<Review[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('reviews')
        .select(`
            id,
            created_at,
            rating,
            comment,
            author:profiles!reviews_author_id_fkey (
                full_name
            )
        `)
        .eq('provider_id', providerProfileId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
    
    // Map the data to the frontend Review type
    return data.map(r => ({
        id: r.id,
        providerId: providerProfileId, // This is not in the query but we know it
        authorName: r.author?.full_name || 'کاربر ناشناس',
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
    }));
}


export default async function ProviderProfilePage({ params }: { params: { providerId: string } }) {
  const providerPhone = params.providerId;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const providers = await getProviders({ phone: providerPhone, limit: 1 });
  
  if (!providers || providers.length === 0) {
    notFound();
  }
  
  const provider = providers[0];
  const reviews = await getReviewsForProvider(provider.profile_id);

  // Check the agreement status between the current user and the provider
  let agreementStatus: 'accepted' | 'pending' | 'rejected' | 'none' = 'none';
  if (user) {
    const { data: agreement, error: agreementError } = await supabase
        .from('agreements')
        .select('status')
        .eq('customer_id', user.id)
        .eq('provider_id', provider.profile_id)
        .limit(1)
        .single();
    
    if (agreement && !agreementError) {
        agreementStatus = agreement.status;
    }
  }


  return (
      <ProviderProfileClientPage 
          provider={provider} 
          initialReviews={reviews} 
          currentUser={user}
          agreementStatus={agreementStatus}
      />
  );
}
