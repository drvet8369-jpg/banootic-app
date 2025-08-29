// This script is used to seed the database with initial data.
// It is intended to be run manually from the command line.
// Usage: npm run db:seed

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { createAdminClient } from './supabase/server';
import { categories, services } from './constants';
import type { Provider, Customer, User } from './types';

// IMPORTANT: This script is destructive. It will delete all existing data
// in the users, providers, and customers tables before seeding.

const supabase = createAdminClient();

// This function will be called to clean the database
async function cleanDatabase() {
    console.log('--- Cleaning database ---');
    
    // Order of deletion is important due to foreign key constraints
    console.log('Deleting from providers...');
    const { error: providerError } = await supabase.from('providers').delete().neq('id', 0);
    if(providerError) console.error('Error cleaning providers:', providerError.message);

    console.log('Deleting from customers...');
    const { error: customerError } = await supabase.from('customers').delete().neq('id', 0);
    if(customerError) console.error('Error cleaning customers:', customerError.message);

    console.log('Deleting from users...');
    const { error: userError } = await supabase.from('users').delete().neq('id', '0');
    if(userError) console.error('Error cleaning users:', userError.message);
    
    console.log('Deleting from auth.users...');
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    if (authUsersError) {
        console.error('Error listing auth users:', authUsersError.message);
    } else {
        for (const user of authUsers.users) {
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
            if (deleteError) console.error(`Error deleting auth user ${user.id}:`, deleteError.message);
        }
    }
    
    console.log('--- Database cleaning complete ---');
}

async function seedDatabase() {
  console.log('Starting to seed the database...');
  
  // First, clean the database to ensure a fresh start
  await cleanDatabase();

  console.log('Seeding new data...');
  
  // Create test users in Supabase Auth and get their IDs
  const testUsersToCreate = [
      { email: 'sara-provider@example.com', password: 'password123', name: 'سالن زیبایی سارا', type: 'provider', phone: '09353847484', service: 'خدمات ناخن', bio: 'متخصص در طراحی و هنر ناخن مدرن.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure' },
      { email: 'laleh-provider@example.com', password: 'password123', name: 'طراحی مو لاله', type: 'provider', phone: '09000000002', service: 'خدمات مو', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن.', categorySlug: 'beauty', serviceSlug: 'haircut-coloring' },
      { email: 'ali-customer@example.com', password: 'password123', name: 'علی رضایی', type: 'customer', phone: '09141234567' }
  ];

  for (const userData of testUsersToCreate) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true, // Auto-confirm email for seeding
      });

      if (authError || !authData.user) {
          console.error(`Error creating auth user for ${userData.email}:`, authError?.message);
          continue; // Skip this user if auth creation fails
      }

      const userId = authData.user.id;
      
      // Insert into public.users table
      const { error: userError } = await supabase.from('users').insert({
          id: userId,
          name: userData.name,
          account_type: userData.type as 'provider' | 'customer',
          phone: userData.phone
      });

      if (userError) {
          console.error(`Error inserting into public.users for ${userData.name}:`, userError.message);
          continue;
      }

      // If provider, insert into public.providers table
      if (userData.type === 'provider') {
          const { error: providerError } = await supabase.from('providers').insert({
              user_id: userId,
              name: userData.name,
              service: userData.service,
              location: 'ارومیه', // Default location
              phone: userData.phone,
              bio: userData.bio,
              category_slug: userData.categorySlug,
              service_slug: userData.serviceSlug,
              rating: (Math.random() * (5 - 4.5) + 4.5).toFixed(1),
              reviews_count: Math.floor(Math.random() * 100) + 20,
              profile_image: { src: `https://placehold.co/400x400.png?text=${userData.name.charAt(0)}`, ai_hint: 'woman portrait' },
              portfolio: [],
          });
          if (providerError) {
              console.error(`Error inserting into public.providers for ${userData.name}:`, providerError.message);
          }
      }

      // If customer, insert into public.customers table
      if (userData.type === 'customer') {
          const { error: customerError } = await supabase.from('customers').insert({
              user_id: userId,
              name: userData.name,
              phone: userData.phone,
          });
          if (customerError) {
              console.error(`Error inserting into public.customers for ${userData.name}:`, customerError.message);
          }
      }
      console.log(`Successfully created user: ${userData.name}`);
  }
  
  console.log('Database seeding completed successfully!');
}

seedDatabase();
