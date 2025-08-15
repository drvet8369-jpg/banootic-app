import type { Category, Service } from './types';

// This file is now only for static data that does not change.
// All functions interacting with Firestore have been moved to `src/lib/actions.ts`.

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
  { name: 'خدمات ناخن', slug: 'manicure-pedicure', categorySlug: 'beauty' },
  { name: 'خدمات مو', slug: 'haircut-coloring', categorySlug: 'beauty' },
  { name: 'پاکسازی پوست', slug: 'facial-treatment', categorySlug: 'beauty' },
  { name: 'آرایش صورت', slug: 'makeup', categorySlug: 'beauty' },
  { name: 'اپیلاسیون', slug: 'waxing', categorySlug: 'beauty' },
  { name: 'غذای سنتی', slug: 'traditional-food', categorySlug: 'cooking' },
  { name: 'کیک و شیرینی', slug: 'cakes-sweets', categorySlug: 'cooking' },
  { name: 'غذای گیاهی', slug: 'vegetarian-vegan', categorySlug: 'cooking' },
  { name: 'فینگرفود', slug: 'finger-food', categorySlug: 'cooking' },
  { name: 'نان خانگی', slug: 'homemade-bread', categorySlug: 'cooking' },
  { name: 'دوخت سفارشی لباس', slug: 'custom-clothing', categorySlug: 'tailoring' },
  { name: 'مزون، لباس عروس و مجلسی', slug: 'fashion-design-mezon', categorySlug: 'tailoring' },
  { name: 'تعمیرات تخصصی لباس', slug: 'clothing-repair', categorySlug: 'tailoring' },
  { name: 'زیورآلات دست‌ساز', slug: 'handmade-jewelry', categorySlug: 'handicrafts' },
  { name: 'سفال تزئینی', slug: 'decorative-pottery', categorySlug: 'handicrafts' },
  { name: 'بافتنی‌ها', slug: 'termeh-kilim', categorySlug: 'handicrafts' },
  { name: 'چرم‌دوزی', slug: 'leather-crafts', categorySlug: 'handicrafts' },
  { name: 'شمع‌سازی', slug: 'candles-soaps', categorySlug: 'handicrafts' },
];
