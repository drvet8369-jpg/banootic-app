'use server';

import { getProviderByPhone } from '@/lib/data';

interface OtherPersonDetails {
  id: string | number;
  name: string;
  phone: string;
  profileImage?: { src: string; aiHint?: string };
}

/**
 * Fetches the details of the chat partner (provider or customer).
 * This is a Server Action to safely fetch server-side data from a client component.
 * @param otherPersonIdOrProviderId - The phone number of the other person in the chat.
 * @returns {Promise<OtherPersonDetails | null>}
 */
export async function getChatPartnerDetails(otherPersonIdOrProviderId: string): Promise<OtherPersonDetails | null> {
  const provider = await getProviderByPhone(otherPersonIdOrProviderId);

  if (provider) {
    return {
        id: provider.id,
        name: provider.name,
        phone: provider.phone,
        profileImage: provider.profileImage
    };
  }

  // If not a provider, treat them as a customer based on their phone number.
  const customerPhone = otherPersonIdOrProviderId;
  return {
    id: customerPhone,
    name: `مشتری ${customerPhone.slice(-4)}`,
    phone: customerPhone,
  };
}
