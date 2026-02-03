'use client';

import { createBrowserClient } from '@supabase/ssr';

// This is the standard and recommended way to create a client-side Supabase client.
// It will automatically handle cookie management for both client and server components.
export const createClient = () => {
    // If mock data mode is on, return a mock client object that won't try to connect.
    // This prevents crashes when Supabase keys are not set in the environment.
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        console.log("Supabase client is in MOCK mode.");
        return {
            from: () => ({
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({ data: null, error: { message: 'Mock mode' } })
                    })
                }),
                insert: () => Promise.resolve({ error: { message: 'Mock mode enabled' } }),
                update: () => Promise.resolve({ error: { message: 'Mock mode enabled' } }),
            }),
            auth: {
                getSession: () => Promise.resolve({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({
                    data: { subscription: { unsubscribe: () => {} } },
                    error: null,
                }),
            },
            channel: (name: string) => ({
                on: (event: any, config: any, callback: any) => ({
                    subscribe: (statusCallback?: (status: string) => void) => {
                        if (statusCallback) {
                            statusCallback('SUBSCRIBED');
                        }
                        return {
                            unsubscribe: () => {}
                        };
                    }
                }),
            }),
            removeChannel: () => Promise.resolve('ok'),
            rpc: () => Promise.resolve({ data: null, error: { message: 'Mock mode' } }),
        } as any; // Using 'as any' to satisfy the complex SupabaseClient type for this mock.
    }

    // Original logic for live mode. This will throw an error if keys are missing.
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
};
