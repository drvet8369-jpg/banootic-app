
// This script is used to seed the database with initial data.
// It is intended to be run manually from the command line.
// Usage: npm run db:seed

import { createAdminClient } from './supabase/server';
import { categories, services } from './constants';
import type { Provider, Customer } from './types';

// IMPORTANT: Do not import from './data' as it can cause circular dependencies 
// or conflicts with client-side logic. This script is server-side only.

const supabase = createAdminClient();

// Default raw data for providers
const defaultProviderData = [
  { id: 1, user_id: '10000000-0000-0000-0000-000000000001', name: 'سالن زیبایی سارا', service: 'خدمات ناخن', location: 'ارومیه، خیابان والفجر', phone: '09353847484', bio: 'متخصص در طراحی و هنر ناخن مدرن.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure', profileImageSrc: 'https://placehold.co/400x400.png', profileImageHint: 'woman portrait' },
  { id: 2, user_id: '10000000-0000-0000-0000-000000000002', name: 'طراحی مو لاله', service: 'خدمات مو', location: 'ارومیه، شیخ تپه', phone: '09000000002', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن.', categorySlug: 'beauty', serviceSlug: 'haircut-coloring', profileImageSrc: 'https://placehold.co/400x400.png', profileImageHint: 'woman hair' },
  { id: 3, user_id: '10000000-0000-0000-0000-000000000003', name: 'مراقبت از پوست نگین', service: 'پاکسازی پوست', location: 'ارومیه، استادان', phone: '09000000003', bio: 'درمان‌های پوستی ارگانیک و طبیعی برای انواع پوست.', categorySlug: 'beauty', serviceSlug: 'facial-treatment', profileImageSrc: 'https://placehold.co/400x400.png', profileImageHint: 'skincare' },
  { id: 4, user_id: '10000000-0000-0000-0000-000000000004', name: 'آشپزخانه مریم', service: 'غذای سنتی', location: 'ارومیه، خیابان فردوسی', phone: '09000000004', bio: 'ارائه قورمه‌سبزی و کباب خانگی اصیل.', categorySlug: 'cooking', serviceSlug: 'traditional-food', profileImageSrc: 'https://placehold.co/400x400.png', profileImageHint: 'woman cooking' },
  { id: 5, user_id: '10000000-0000-0000-0000-000000000005', name: 'شیرینی‌پزی بهار', service: 'کیک و شیرینی', location: 'ارومیه، خیابان کشاورز', phone: '09000000005', bio: 'کیک‌های سفارشی برای تولد، عروسی و رویدادهای خاص.', categorySlug: 'cooking', serviceSlug: 'cakes-sweets', profileImageSrc: 'https://placehold.co/400x400.png', profileImageHint: 'pastry chef' },
];

// Default raw data for customers
const defaultCustomerData = [
    { user_id: '20000000-0000-0000-0000-000000000001', name: 'علی رضایی', phone: '09141234567'},
    { user_id: '20000000-0000-0000-0000-000000000002', name: 'فاطمه محمدی', phone: '09129876543'},
];


async function seedDatabase() {
  console.log('Starting to seed the database...');

  // 1. Check if users table already has data
  const { data: existingUsers, error: checkError } = await supabase.from('users').select('id').limit(1);
  if (checkError) {
    console.error('Error checking for existing data:', checkError);
    return;
  }

  if (existingUsers && existingUsers.length > 0) {
    console.log('Database already contains data. Seeding script will not run.');
    return;
  }
  
  console.log('Database is empty. Proceeding with seeding...');

  // 2. Prepare user data
  const usersToInsert = [
      ...defaultProviderData.map(p => ({ id: p.user_id, name: p.name, account_type: 'provider' as const, phone: p.phone })),
      ...defaultCustomerData.map(c => ({ id: c.user_id, name: c.name, account_type: 'customer' as const, phone: c.phone }))
  ];
  
  // 3. Insert users
  const { error: userError } = await supabase.from('users').insert(usersToInsert);
  if (userError) {
    console.error('Error seeding users:', userError);
    return;
  }
  console.log(`Successfully seeded ${usersToInsert.length} users.`);


  // 4. Prepare provider data
  const providersToInsert = defaultProviderData.map(p => ({
    user_id: p.user_id,
    name: p.name,
    service: p.service,
    location: p.location,
    phone: p.phone,
    bio: p.bio,
    category_slug: p.categorySlug,
    service_slug: p.serviceSlug,
    rating: (Math.random() * (5 - 4.5) + 4.5).toFixed(1), // Random rating between 4.5 and 5
    reviews_count: Math.floor(Math.random() * 100) + 20, // Random reviews between 20 and 120
    profile_image: { src: p.profileImageSrc, ai_hint: p.profileImageHint },
    portfolio: [],
  }));

  // 5. Insert providers
  const { error: providerError } = await supabase.from('providers').insert(providersToInsert);
   if (providerError) {
    console.error('Error seeding providers:', providerError);
    return;
  }
  console.log(`Successfully seeded ${providersToInsert.length} providers.`);

  // 6. Prepare customer data
  const customersToInsert = defaultCustomerData.map(c => ({
      user_id: c.user_id,
      name: c.name,
      phone: c.phone,
  }));

  // 7. Insert customers
  const { error: customerError } = await supabase.from('customers').insert(customersToInsert);
  if (customerError) {
    console.error('Error seeding customers:', customerError);
    return;
  }
  console.log(`Successfully seeded ${customersToInsert.length} customers.`);
  
  console.log('Database seeding completed successfully!');
}

seedDatabase();
