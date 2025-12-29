import type { Category, Service } from './types';

// This file is for static data that does not change.

export const categories: Category[] = [
  {
    id: 1,
    name: 'خدمات زیبایی بانوان',
    slug: 'beauty',
    description: 'خدمات مو، ناخن، آرایش و مراقبت از پوست توسط متخصصان محلی با استعداد.',
  },
  {
    id: 2,
    name: 'آشپزی و غذای خانگی',
    slug: 'cooking',
    description: 'غذاهای خانگی خوشمزه و اصیل، شیرینی‌جات و غذاهای سنتی.',
  },
  {
    id: 3,
    name: 'خیاطی و طراحی مد',
    slug: 'tailoring',
    description: 'لباس‌های سفارشی، تعمیرات و طراحی‌های مد منحصر به فرد از بوتیک‌های محلی.',
  },
  {
    id: 4,
    name: 'صنایع دستی و تزئینی',
    slug: 'handicrafts',
    description: 'کاردستی‌های دکوری، هنرهای تزئینی و محصولات دست‌ساز منحصر به فرد.',
  },
];

export const services: Service[] = [
  // Beauty
  { id: 1, name: 'خدمات ناخن', slug: 'manicure-pedicure', category_id: 1 },
  { id: 2, name: 'خدمات مو', slug: 'haircut-coloring', category_id: 1 },
  { id: 3, name: 'پاکسازی پوست', slug: 'facial-treatment', category_id: 1 },
  { id: 4, name: 'آرایش صورت', slug: 'makeup', category_id: 1 },
  { id: 5, name: 'اپیلاسیون', slug: 'waxing', category_id: 1 },
  // Cooking
  { id: 6, name: 'غذای سنتی', slug: 'traditional-food', category_id: 2 },
  { id: 7, name: 'کیک و شیرینی', slug: 'cakes-sweets', category_id: 2 },
  { id: 8, name: 'غذای گیاهی', slug: 'vegetarian-vegan', category_id: 2 },
  { id: 9, name: 'فینگرفود', slug: 'finger-food', category_id: 2 },
  { id: 10, name: 'نان خانگی', slug: 'homemade-bread', category_id: 2 },
  // Tailoring
  { id: 11, name: 'دوخت سفارشی لباس', slug: 'custom-clothing', category_id: 3 },
  { id: 12, name: 'مزون، لباس عروس و مجلسی', slug: 'fashion-design-mezon', category_id: 3 },
  { id: 13, name: 'تعمیرات تخصصی لباس', slug: 'clothing-repair', category_id: 3 },
  // Handicrafts
  { id: 14, name: 'زیورآلات دست‌ساز', slug: 'handmade-jewelry', category_id: 4 },
  { id: 15, name: 'سفال تزئینی', slug: 'decorative-pottery', category_id: 4 },
  { id: 16, name: 'بافتنی‌ها', slug: 'termeh-kilim', category_id: 4 },
  { id: 17, name: 'چرم‌دوزی', slug: 'leather-crafts', category_id: 4 },
  { id: 18, name: 'شمع‌سازی', slug: 'candles-soaps', category_id: 4 },
];
