
import type { Category, Provider, Service } from './types';

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
  { name: 'خدمات ناخن', slug: 'manicure-pedicure', categorySlug: 'beauty' },
  { name: 'خدمات مو', slug: 'haircut-coloring', categorySlug: 'beauty' },
  { name: 'پاکسازی پوست', slug: 'facial-treatment', categorySlug: 'beauty' },
  { name: 'آرایش صورت', slug: 'makeup', categorySlug: 'beauty' },
  { name: 'اپیلاسیون', slug: 'waxing', categorySlug: 'beauty' },
  // Cooking
  { name: 'غذای سنتی', slug: 'traditional-food', categorySlug: 'cooking' },
  { name: 'کیک و شیرینی', slug: 'cakes-sweets', categorySlug: 'cooking' },
  { name: 'غذای گیاهی', slug: 'vegetarian-vegan', categorySlug: 'cooking' },
  { name: 'فینگرفود', slug: 'finger-food', categorySlug: 'cooking' },
  { name: 'نان خانگی', slug: 'homemade-bread', categorySlug: 'cooking' },
  // Tailoring
  { name: 'دوخت سفارشی لباس', slug: 'custom-clothing', categorySlug: 'tailoring' },
  { name: 'مزون، لباس عروس و مجلسی', slug: 'fashion-design-mezon', categorySlug: 'tailoring' },
  { name: 'تعمیرات تخصصی لباس', slug: 'clothing-repair', categorySlug: 'tailoring' },
  // Handicrafts
  { name: 'زیورآلات دست‌ساز', slug: 'handmade-jewelry', categorySlug: 'handicrafts' },
  { name: 'سفال تزئینی', slug: 'decorative-pottery', categorySlug: 'handicrafts' },
  { name: 'بافتنی‌ها', slug: 'termeh-kilim', categorySlug: 'handicrafts' },
  { name: 'چرم‌دوزی', slug: 'leather-crafts', categorySlug: 'handicrafts' },
  { name: 'شمع‌سازی', slug: 'candles-soaps', categorySlug: 'handicrafts' },
];

export const providers: Provider[] = [
  // Beauty
  { id: 1, name: 'سالن زیبایی سارا', service: 'خدمات ناخن', location: 'ارومیه، خیابان والفجر', phone: '09123456789', bio: 'متخصص در طراحی و هنر ناخن مدرن.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure', rating: 4.8, reviewsCount: 45, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'nail art' }, { src: 'https://placehold.co/400x250', aiHint: 'pedicure' }] },
  { id: 2, name: 'طراحی مو لاله', service: 'خدمات مو', location: 'ارومیه، شیخ تپه', phone: '09123456789', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن.', categorySlug: 'beauty', serviceSlug: 'haircut-coloring', rating: 4.9, reviewsCount: 62, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'hair color' }, { src: 'https://placehold.co/400x250', aiHint: 'hairstyle' }] },
  { id: 3, name: 'مراقبت از پوست نگین', service: 'پاکسازی پوست', location: 'ارومیه، استادان', phone: '09123456789', bio: 'درمان‌های پوستی ارگانیک و طبیعی برای انواع پوست.', categorySlug: 'beauty', serviceSlug: 'facial-treatment', rating: 4.7, reviewsCount: 30, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'facial mask' }, { src: 'https://placehold.co/400x250', aiHint: 'skincare product' }] },
  { id: 13, name: 'آرایشگاه رؤیا', service: 'آرایش صورت', location: 'ارومیه، خیابان کاشانی', phone: '09123456789', bio: 'گریم تخصصی عروس و آرایش حرفه‌ای برای مهمانی‌ها.', categorySlug: 'beauty', serviceSlug: 'makeup', rating: 5.0, reviewsCount: 25, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'bridal makeup' }, { src: 'https://placehold.co/400x250', aiHint: 'evening makeup' }] },
  { id: 14, name: 'مرکز اپیلاسیون نازی', service: 'اپیلاسیون', location: 'ارومیه، خیابان ورزش', phone: '09123456789', bio: 'اپیلاسیون کامل بدن با استفاده از مواد درجه یک و بهداشتی.', categorySlug: 'beauty', serviceSlug: 'waxing', rating: 4.6, reviewsCount: 55, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'waxing salon' }] },
  
  // Cooking
  { id: 4, name: 'آشپزخانه مریم', service: 'غذای سنتی', location: 'ارومیه، خیابان فردوسی', phone: '09123456789', bio: 'ارائه قورمه‌سبزی و کباب خانگی اصیل.', categorySlug: 'cooking', serviceSlug: 'traditional-food', rating: 4.9, reviewsCount: 112, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'persian food' }, { src: 'https://placehold.co/400x250', aiHint: 'kebab' }] },
  { id: 5, name: 'شیرینی‌پزی بهار', service: 'کیک و شیرینی', location: 'ارومیه، خیابان کشاورز', phone: '09123456789', bio: 'کیک‌های سفارشی برای تولد، عروسی و رویدادهای خاص.', categorySlug: 'cooking', serviceSlug: 'cakes-sweets', rating: 4.8, reviewsCount: 88, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'birthday cake' }, { src: 'https://placehold.co/400x250', aiHint: 'wedding cake' }] },
  { id: 6, name: 'غذای سالم زهرا', service: 'غذای گیاهی', location: 'ارومیه، دانشکده', phone: '09123456789', bio: 'وعده‌های غذایی گیاهی خوشمزه و سالم با ارسال درب منزل.', categorySlug: 'cooking', serviceSlug: 'vegetarian-vegan', rating: 4.7, reviewsCount: 40, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'vegan salad' }, { src: 'https://placehold.co/400x250', aiHint: 'vegetarian meal' }] },
  { id: 15, name: 'فینگرفود شیک', service: 'فینگرفود', location: 'ارومیه، عمار', phone: '09123456789', bio: 'سینی‌های مزه و فینگرفودهای متنوع برای مهمانی‌ها.', categorySlug: 'cooking', serviceSlug: 'finger-food', rating: 4.9, reviewsCount: 75, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'finger food platter' }] },
  { id: 16, name: 'نان خانگی گندم', service: 'نان خانگی', location: 'ارومیه، مولوی', phone: '09123456789', bio: 'پخت روزانه انواع نان‌های حجیم، سنتی و رژیمی.', categorySlug: 'cooking', serviceSlug: 'homemade-bread', rating: 5.0, reviewsCount: 95, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'artisan bread' }, { src: 'https://placehold.co/400x250', aiHint: 'fresh bread' }] },
  
  // Tailoring
  { id: 7, name: 'خیاطی شیرین', service: 'دوخت سفارشی لباس', location: 'ارومیه، خیابان مدرس', phone: '09123456789', bio: 'دوخت لباس‌های زیبا و سفارشی برای هر مناسبتی.', categorySlug: 'tailoring', serviceSlug: 'custom-clothing', rating: 4.8, reviewsCount: 50, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'custom dress' }, { src: 'https://placehold.co/400x250', aiHint: 'sewing machine' }] },
  { id: 8, name: 'طراحی پروین', service: 'تعمیرات تخصصی لباس', location: 'ارومیه، خیابان امام', phone: '09123456789', bio: 'تعمیرات حرفه‌ای و سریع برای فیت عالی لباس.', categorySlug: 'tailoring', serviceSlug: 'clothing-repair', rating: 4.7, reviewsCount: 35, portfolio: [] },
  { id: 9, name: 'بوتیک افسانه', service: 'مزون، لباس عروس و مجلسی', location: 'ارومیه، خیابان خیام', phone: '09123456789', bio: 'مانتوهای منحصر به فرد و شیک که سنت را با مد مدرن ترکیب می‌کند.', categorySlug: 'tailoring', serviceSlug: 'fashion-design-mezon', rating: 4.9, reviewsCount: 80, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'fashion designer' }, { src: 'https://placehold.co/400x250', aiHint: 'clothing rack' }] },
  { id: 18, name: 'خانه مد آناهیتا', service: 'مزون، لباس عروس و مجلسی', location: 'ارومیه، خیابان حسنی', phone: '09123456789', bio: 'طراحی و دوخت لباس‌های شب و مجلسی با پارچه‌های خاص.', categorySlug: 'tailoring', serviceSlug: 'fashion-design-mezon', rating: 5.0, reviewsCount: 33, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'evening gown' }, { src: 'https://placehold.co/400x250', aiHint: 'wedding gown' }] },
  
  // Handicrafts
  { id: 10, name: 'گالری هنری گیتا', service: 'زیورآلات دست‌ساز', location: 'ارومیه، خیابان بعثت', phone: '09123456789', bio: 'جواهرات نقره و سنگ‌های قیمتی منحصر به فرد، ساخته شده با عشق.', categorySlug: 'handicrafts', serviceSlug: 'handmade-jewelry', rating: 4.9, reviewsCount: 65, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'handmade necklace' }, { src: 'https://placehold.co/400x250', aiHint: 'gemstone rings' }] },
  { id: 11, name: 'سفالگری مینا', service: 'سفال تزئینی', location: 'ارومیه، خیابان بهار', phone: '09123456789', bio: 'سفال‌های زیبا و نقاشی شده برای خانه و باغ شما.', categorySlug: 'handicrafts', serviceSlug: 'decorative-pottery', rating: 4.7, reviewsCount: 28, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'pottery vase' }, { src: 'https://placehold.co/400x250', aiHint: 'painted ceramics' }] },
  { id: 12, name: 'بافتنی صبا', service: 'بافتنی‌ها', location: 'ارومیه، بازار', phone: '09123456789', bio: 'انواع لباس‌ها و وسایل بافتنی دستباف.', categorySlug: 'handicrafts', serviceSlug: 'termeh-kilim', rating: 4.8, reviewsCount: 48, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'knitting yarn' }, { src: 'https://placehold.co/400x250', aiHint: 'handmade sweater' }] },
  { id: 19, name: 'هنر چرم لیلا', service: 'چرم‌دوزی', location: 'ارومیه، همافر', phone: '09123456789', bio: 'کیف، کمربند و اکسسوری‌های چرمی با طراحی خاص.', categorySlug: 'handicrafts', serviceSlug: 'leather-crafts', rating: 4.9, reviewsCount: 58, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'leather bag' }] },
  { id: 20, name: 'کارگاه شمع‌سازی رویا', service: 'شمع‌سازی', location: 'ارومیه، مدنی', phone: '09123456789', bio: 'انواع شمع‌های معطر و صابون‌های گیاهی دست‌ساز.', categorySlug: 'handicrafts', serviceSlug: 'candles-soaps', rating: 4.8, reviewsCount: 72, portfolio: [{ src: 'https://placehold.co/400x250', aiHint: 'scented candle' }, { src: 'https://placehold.co/400x250', aiHint: 'handmade soap' }] },
];
