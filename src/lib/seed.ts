// This script is used to seed the database with initial data.
// It is intended to be run manually from the command line.
// Usage: npm run db:seed

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { createAdminClient } from './supabase/server';

// IMPORTANT: This script is destructive. It will delete all existing data
// in the users, providers, and customers tables, as well as auth.users.

const supabase = createAdminClient();

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
    const { error: userError } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if(userError) console.error('Error cleaning users:', userError.message);
    
    console.log('Deleting auth.users...');
    const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();
    if (authUsersError) {
        console.error('Error listing auth users:', authUsersError.message);
    } else {
        for (const user of authUsers.users) {
            // Don't delete the default supabase_admin user if it exists
            if (user.email && !user.email.endsWith('@supabase.com')) {
               const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
               if (deleteError) console.error(`Error deleting auth user ${user.id}:`, deleteError.message);
            }
        }
    }
    
    console.log('--- Database cleaning complete ---');
}

async function seedDatabase() {
  console.log('Starting to seed the database...');
  
  await cleanDatabase();

  console.log('Seeding new data...');
  
  const testUsersToCreate = [
      { email: 'sara.provider@example.com', password: 'password123', name: 'سالن زیبایی سارا', type: 'provider', phone: '09353847484', service: 'خدمات ناخن', bio: 'متخصص در طراحی و هنر ناخن مدرن.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure' },
      { email: 'laleh.provider@example.com', password: 'password123', name: 'طراحی مو لاله', type: 'provider', phone: '09112223344', service: 'خدمات مو', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن.', categorySlug: 'beauty', serviceSlug: 'haircut-coloring' },
      { email: 'maryam.chef@example.com', password: 'password123', name: 'آشپزخانه مریم', type: 'provider', phone: '09123456789', service: 'غذای سنتی', bio: 'ارائه قورمه‌سبزی و کباب خانگی اصیل.', categorySlug: 'cooking', serviceSlug: 'traditional-food'},
      { email: 'ali.customer@example.com', password: 'password123', name: 'علی رضایی', type: 'customer', phone: '09141234567' }
  ];

  for (const userData of testUsersToCreate) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true, // Auto-confirm email for seeding
          user_metadata: {
            name: userData.name,
            account_type: userData.type,
            phone: userData.phone,
            service: userData.type === 'provider' ? userData.service : undefined,
            location: userData.type === 'provider' ? 'ارومیه' : undefined,
            bio: userData.type === 'provider' ? userData.bio : undefined,
            category_slug: userData.type === 'provider' ? userData.categorySlug : undefined,
            service_slug: userData.type === 'provider' ? userData.serviceSlug : undefined,
          }
      });

      if (authError || !authData.user) {
          console.error(`Error creating auth user for ${userData.email}:`, authError?.message);
          continue; // Skip this user if auth creation fails
      }
      
      console.log(`Successfully created auth user: ${userData.name}`);
  }
  
  console.log('Database seeding completed successfully!');
  console.log('Run `npm run db:push` to ensure triggers and functions are up to date.');
}

seedDatabase();
