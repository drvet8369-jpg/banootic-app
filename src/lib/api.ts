import type { Provider, Review, Agreement, Customer } from './types';
import { createClient } from './supabase/client';

export async function getProviderByPhone(phone: string): Promise<Provider | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is not an error here.
    console.error('Error fetching provider by phone:', error);
    throw error;
  }
  return data;
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching customer by phone:', error);
    throw error;
  }
  return data;
}

export async function createProvider(providerData: Partial<Provider>): Promise<Provider> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('providers')
        .insert(providerData)
        .select()
        .single();
    
    if (error) {
        console.error("Error creating provider:", error);
        throw error;
    }
    return data;
}

export async function createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();
    
    if (error) {
        console.error("Error creating customer:", error);
        throw error;
    }
    return data;
}

export async function getAllProviders(): Promise<Provider[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('providers').select('*');
    if (error) {
        console.error('Error fetching all providers:', error);
        throw error;
    }
    return data || [];
}

export async function getProvidersByServiceSlug(serviceSlug: string): Promise<Provider[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('providers').select('*').eq('service_slug', serviceSlug);
    if (error) {
        console.error('Error fetching providers by service slug:', error);
        throw error;
    }
    return data || [];
}

export async function getReviewsByProviderId(providerId: string): Promise<Review[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
        throw error;
    }
    return data || [];
}

export async function addReview(reviewData: Omit<Review, 'id' | 'created_at' | 'user_id'>): Promise<Review> {
    const supabase = createClient();
    const {data: {user}} = await supabase.auth.getUser();

    if(!user) throw new Error("User not authenticated to add a review");
    
    const { data, error } = await supabase
        .from('reviews')
        .insert({...reviewData, user_id: user.id})
        .select()
        .single();

    if (error) {
        console.error('Error adding review:', error);
        if (error.code === '23505') { // Unique constraint violation
             throw new Error("You have already submitted a review for this provider.");
        }
        throw error;
    }
    await updateProviderRating(reviewData.provider_id);
    return data;
}

export async function updateProviderRating(providerId: string): Promise<void> {
    const supabase = createClient();
    // This now calls a Supabase function that will be created in the next step.
    const { error } = await supabase.rpc('update_provider_rating', {
        p_id: providerId
    });

    if (error) {
        console.error('Error updating provider rating via RPC:', error);
        throw error;
    }
}

export async function getAgreementsByProvider(providerPhone: string): Promise<Agreement[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('provider_phone', providerPhone)
        .order('requested_at', { ascending: false });

    if (error) {
        console.error('Error fetching agreements by provider:', error);
        throw error;
    }
    return data || [];
}

export async function getAgreementsByCustomer(customerPhone: string): Promise<Agreement[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('agreements')
        .select('*')
        .eq('customer_phone', customerPhone)
        .order('requested_at', { ascending: false });

    if (error) {
        console.error('Error fetching agreements by customer:', error);
        throw error;
    }
    return data || [];
}

export async function createAgreement(provider: Provider, user: { phone: string, name: string }): Promise<Agreement> {
    const supabase = createClient();
    const agreementData = {
        provider_id: provider.id,
        provider_phone: provider.phone,
        customer_phone: user.phone,
        customer_name: user.name,
    };

    const { data, error } = await supabase
        .from('agreements')
        .insert(agreementData)
        .select()
        .single();

    if (error) {
        console.error('Error creating agreement:', error);
        if (error.code === '23505') {
            throw new Error('شما قبلاً یک درخواست برای این هنرمند ثبت کرده‌اید.');
        }
        throw error;
    }

    return data;
}

export async function confirmAgreement(agreementId: number): Promise<Agreement> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('agreements')
        .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
        .eq('id', agreementId)
        .select()
        .single();
    
    if (error) {
        console.error('Error confirming agreement:', error);
        throw error;
    }
    return data;
}

export async function updateProviderDetails(phone: string, details: { name: string; service: string; bio: string }): Promise<Provider> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('providers')
        .update(details)
        .eq('phone', phone)
        .select()
        .single();

    if (error) {
        console.error('Error updating provider details:', error);
        throw new Error('خطا در به‌روزرسانی اطلاعات هنرمند.');
    }
    return data;
}

export async function addPortfolioItem(phone: string, imageUrl: string, aiHint: string): Promise<Provider> {
    const supabase = createClient();
    // 1. Fetch the current portfolio
    const { data: providerData, error: fetchError } = await supabase
        .from('providers')
        .select('portfolio')
        .eq('phone', phone)
        .single();
    if (fetchError || !providerData) {
        console.error("Error fetching provider's portfolio:", fetchError);
        throw new Error("Could not fetch provider to add portfolio item.");
    }

    // 2. Add the new item to the existing array
    const currentPortfolio = providerData.portfolio || [];
    const updatedPortfolio = [...currentPortfolio, { src: imageUrl, ai_hint: aiHint }];

    // 3. Update the provider with the new portfolio array
    const { data, error } = await supabase
        .from('providers')
        .update({ portfolio: updatedPortfolio })
        .eq('phone', phone)
        .select()
        .single();
    
    if (error) {
        console.error('Error adding portfolio item:', error);
        throw new Error('خطا در افزودن نمونه کار به پروفایل.');
    }
    return data;
}

export async function deletePortfolioItem(phone: string, itemIndex: number): Promise<Provider> {
    const supabase = createClient();
    // 1. Fetch current portfolio
    const { data: providerData, error: fetchError } = await supabase
        .from('providers')
        .select('portfolio')
        .eq('phone', phone)
        .single();
    if (fetchError || !providerData) {
        console.error("Error fetching provider's portfolio for deletion:", fetchError);
        throw new Error("Could not fetch provider to delete portfolio item.");
    }

    // 2. Filter out the item to delete
    const currentPortfolio = providerData.portfolio || [];
    const updatedPortfolio = currentPortfolio.filter((_, index) => index !== itemIndex);

    // 3. Update the provider record
    const { data, error } = await supabase
        .from('providers')
        .update({ portfolio: updatedPortfolio })
        .eq('phone', phone)
        .select()
        .single();

    if (error) {
        console.error('Error deleting portfolio item:', error);
        throw new Error('خطا در حذف نمونه کار.');
    }
    return data;
}

export async function updateProviderProfileImage(phone: string, imageUrl: string, aiHint: string): Promise<Provider> {
    const supabase = createClient();
    const newProfileImage = { src: imageUrl, ai_hint: aiHint };

    const { data, error } = await supabase
        .from('providers')
        .update({ profile_image: newProfileImage })
        .eq('phone', phone)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile image:', error);
        throw new Error('خطا در به‌روزرسانی عکس پروفایل.');
    }
    return data;
}

    