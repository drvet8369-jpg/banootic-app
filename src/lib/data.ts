import type { Category, Provider } from './types';

export const categories: Category[] = [
  {
    id: 1,
    name: 'Women’s Beauty Services',
    slug: 'beauty',
    description: 'Hair, nails, makeup, and skin care services offered by talented local stylists.',
  },
  {
    id: 2,
    name: 'Homemade Cooking & Food',
    slug: 'cooking',
    description: 'Delicious, authentic homemade meals, baked goods, and traditional dishes.',
  },
  {
    id: 3,
    name: 'Tailoring & Fashion',
    slug: 'tailoring',
    description: 'Custom clothing, alterations, and unique fashion designs from local boutiques.',
  },
  {
    id: 4,
    name: 'Handicrafts & Arts',
    slug: 'handicrafts',
    description: 'Exquisite handmade jewelry, decorative arts, and unique crafts.',
  },
];

export const providers: Provider[] = [
  // Beauty
  { id: 1, name: 'Sara Beauty Salon', service: 'Manicure & Pedicure', location: 'Urmia, Valiasr St.', phone: '09123456789', bio: 'Specializing in modern nail art and design.', categorySlug: 'beauty' },
  { id: 2, name: 'Laleh Hair Design', service: 'Haircut & Coloring', location: 'Urmia, Sheikh Tappeh', phone: '09123456789', bio: 'Expert in balayage and modern hairstyles.', categorySlug: 'beauty' },
  { id: 3, name: 'Negin Skincare', service: 'Facials', location: 'Urmia, Ostadan', phone: '09123456789', bio: 'Organic and natural skincare treatments for all skin types.', categorySlug: 'beauty' },

  // Cooking
  { id: 4, name: 'Maryam’s Kitchen', service: 'Traditional Iranian Food', location: 'Urmia, Ferdowsi St.', phone: '09123456789', bio: 'Serving authentic home-cooked Ghormeh Sabzi and Kebab.', categorySlug: 'cooking' },
  { id: 5, name: 'Bahar Pastries', service: 'Cakes & Sweets', location: 'Urmia, Keshavarz St.', phone: '09123456789', bio: 'Custom cakes for birthdays, weddings, and special events.', categorySlug: 'cooking' },
  { id: 6, name: 'Zahra’s Healthy Bites', service: 'Vegan & Vegetarian Meals', location: 'Urmia, Daneshkade', phone: '09123456789', bio: 'Delicious and healthy plant-based meals delivered to your door.', categorySlug: 'cooking' },

  // Tailoring
  { id: 7, name: 'Shirin Sews', service: 'Custom Dresses', location: 'Urmia, Modarres St.', phone: '09123456789', bio: 'Creating beautiful, custom-fit dresses for any occasion.', categorySlug: 'tailoring' },
  { id: 8, name: 'Parvin Design', service: 'Clothing Alterations', location: 'Urmia, Emam St.', phone: '09123456789', bio: 'Professional and quick alterations for a perfect fit.', categorySlug: 'tailoring' },
  { id: 9, name: 'Afsaneh Boutique', service: 'Modern Manto Design', location: 'Urmia, Khayyam St.', phone: '09123456789', bio: 'Unique and stylish mantos that blend tradition with modern fashion.', categorySlug: 'tailoring' },
  
  // Handicrafts
  { id: 10, name: 'Gita Art Gallery', service: 'Handmade Jewelry', location: 'Urmia, Besat St.', phone: '09123456789', bio: 'Unique silver and gemstone jewelry, handcrafted with love.', categorySlug: 'handicrafts' },
  { id: 11, name: 'Mina Pottery', service: 'Decorative Pottery', location: 'Urmia, Bahar St.', phone: '09123456789', bio: 'Beautifully painted pottery for your home and garden.', categorySlug: 'handicrafts' },
  { id: 12, name: 'Termeh Weaves', service: 'Termeh and Tapestry', location: 'Urmia, Bazar', phone: '09123456789', bio: 'Traditional Iranian Termeh textiles and wall tapestries.', categorySlug: 'handicrafts' },
];
