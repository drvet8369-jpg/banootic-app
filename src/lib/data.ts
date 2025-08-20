
import type { Provider } from './types';

// This file is re-introduced to provide default seed data for development and testing.
// The API layer will use this data as a fallback if the database is empty or not configured.

export const defaultProviders: Provider[] = [
  // Beauty
  { id: 1, name: 'سالن زیبایی سارا', service: 'خدمات ناخن', location: 'ارومیه، خیابان والفجر', phone: '09353847484', bio: 'متخصص در طراحی و هنر ناخن مدرن.', category_slug: 'beauty', service_slug: 'manicure-pedicure', rating: 4.8, reviews_count: 45, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman portrait' }, portfolio: [] },
  { id: 2, name: 'طراحی مو لاله', service: 'خدمات مو', location: 'ارومیه، شیخ تپه', phone: '09000000002', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن.', category_slug: 'beauty', service_slug: 'haircut-coloring', rating: 4.9, reviews_count: 62, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman hair' }, portfolio: [] },
  { id: 3, name: 'مراقبت از پوست نگین', service: 'پاکسازی پوست', location: 'ارومیه، استادان', phone: '09000000003', bio: 'درمان‌های پوستی ارگانیک و طبیعی برای انواع پوست.', category_slug: 'beauty', service_slug: 'facial-treatment', rating: 4.7, reviews_count: 30, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'skincare' }, portfolio: [] },
  { id: 13, name: 'آرایشگاه رؤیا', service: 'آرایش صورت', location: 'ارومیه، خیابان کاشانی', phone: '09000000013', bio: 'گریم تخصصی عروس و آرایش حرفه‌ای برای مهمانی‌ها.', category_slug: 'beauty', service_slug: 'makeup', rating: 5.0, reviews_count: 25, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'makeup artist' }, portfolio: [] },
  { id: 14, name: 'مرکز اپیلاسیون نازی', service: 'اپیلاسیون', location: 'ارومیه، خیابان ورزش', phone: '09000000014', bio: 'اپیلاسیون کامل بدن با استفاده از مواد درجه یک و بهداشتی.', category_slug: 'beauty', service_slug: 'waxing', rating: 4.6, reviews_count: 55, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman beautiful' }, portfolio: [] },
  
  // Cooking
  { id: 4, name: 'آشپزخانه مریم', service: 'غذای سنتی', location: 'ارومیه، خیابان فردوسی', phone: '09000000004', bio: 'ارائه قورمه‌سبزی و کباب خانگی اصیل.', category_slug: 'cooking', service_slug: 'traditional-food', rating: 4.9, reviews_count: 112, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'woman cooking' }, portfolio: [] },
  { 
    id: 5, 
    name: 'شیرینی‌پزی بهار', 
    service: 'کیک و شیرینی', 
    location: 'ارومیه، خیابان کشاورز', 
    phone: '09000000005', 
    bio: 'کیک‌های سفارشی برای تولد، عروسی و رویدادهای خاص.', 
    category_slug: 'cooking', 
    service_slug: 'cakes-sweets', 
    rating: 4.8, 
    reviews_count: 88, 
    profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'pastry chef' },
    portfolio: []
  },
  { id: 6, name: 'غذای سالم زهرا', service: 'غذای گیاهی', location: 'ارومیه، دانشکده', phone: '09000000006', bio: 'وعده‌های غذایی گیاهی خوشمزه و سالم با ارسال درب منزل.', category_slug: 'cooking', service_slug: 'vegetarian-vegan', rating: 4.7, reviews_count: 40, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'healthy food' }, portfolio: [] },
  { id: 15, name: 'فینگرفود شیک', service: 'فینگرفود', location: 'ارومیه، عمار', phone: '09000000015', bio: 'سینی‌های مزه و فینگرفودهای متنوع برای مهمانی‌ها.', category_slug: 'cooking', service_slug: 'finger-food', rating: 4.9, reviews_count: 75, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'party food' }, portfolio: [] },
  { id: 16, name: 'نان خانگی گندم', service: 'نان خانگی', location: 'ارومیه، مولوی', phone: '09000000016', bio: 'پخت روزانه انواع نان‌های حجیم، سنتی و رژیمی.', category_slug: 'cooking', service_slug: 'homemade-bread', rating: 5.0, reviews_count: 95, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'baker woman' }, portfolio: [] },
  
  // Tailoring
  { id: 7, name: 'خیاطی شیرین', service: 'دوخت سفارشی لباس', location: 'ارومیه، خیابان مدرس', phone: '09000000007', bio: 'دوخت لباس‌های زیبا و سفارشی برای هر مناسبتی.', category_slug: 'tailoring', service_slug: 'custom-clothing', rating: 4.8, reviews_count: 50, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'tailor woman' }, portfolio: [] },
  { id: 8, name: 'طراحی پروین', service: 'تعمیرات تخصصی لباس', location: 'ارومیه، خیابان امام', phone: '09000000008', bio: 'تعمیرات حرفه‌ای و سریع برای فیت عالی لباس.', category_slug: 'tailoring', service_slug: 'clothing-repair', rating: 4.7, reviews_count: 35, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'fashion designer' }, portfolio: [] },
  { id: 9, name: 'بوتیک افسانه', service: 'مزون، لباس عروس و مجلسی', location: 'ارومیه، خیابان خیام', phone: '09000000009', bio: 'مانتوهای منحصر به فرد و شیک که سنت را با مد مدرن ترکیب می‌کند.', category_slug: 'tailoring', service_slug: 'fashion-design-mezon', rating: 4.9, reviews_count: 80, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'fashion boutique' }, portfolio: [] },
  { id: 18, name: 'خانه مد آناهیتا', service: 'مزون، لباس عروس و مجلسی', location: 'ارومیه، خیابان حسنی', phone: '09000000018', bio: 'طراحی و دوخت لباس‌های شب و مجلسی با پارچه‌های خاص.', category_slug: 'tailoring', service_slug: 'fashion-design-mezon', rating: 5.0, reviews_count: 33, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'evening dress' }, portfolio: [] },
  
  // Handicrafts
  { id: 10, name: 'گالری هنری گیتا', service: 'زیورآلات دست‌ساز', location: 'ارومیه، خیابان بعثت', phone: '09000000010', bio: 'جواهرات نقره و سنگ‌های قیمتی منحصر به فرد، ساخته شده با عشق.', category_slug: 'handicrafts', service_slug: 'handmade-jewelry', rating: 4.9, reviews_count: 65, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'jewelry maker' }, portfolio: [] },
  { id: 11, name: 'سفالگری مینا', service: 'سفال تزئینی', location: 'ارومیه، خیابان بهار', phone: '09000000011', bio: 'سفال‌های زیبا و نقاشی شده برای خانه و باغ شما.', category_slug: 'handicrafts', service_slug: 'decorative-pottery', rating: 4.7, reviews_count: 28, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'pottery artist' }, portfolio: [] },
  { id: 12, name: 'بافتنی صبا', service: 'بافتنی‌ها', location: 'ارومیه، بازار', phone: '09000000012', bio: 'انواع لباس‌ها و وسایل بافتنی دستباف.', category_slug: 'handicrafts', service_slug: 'termeh-kilim', rating: 4.8, reviews_count: 48, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'knitting craft' }, portfolio: [] },
  { id: 19, name: 'هنر چرم لیلا', service: 'چرم‌دوزی', location: 'ارومیه، همافر', phone: '09000000019', bio: 'کیف، کمربند و اکسسوری‌های چرمی با طراحی خاص.', category_slug: 'handicrafts', service_slug: 'leather-crafts', rating: 4.9, reviews_count: 58, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'leather goods' }, portfolio: [] },
  { id: 20, name: 'کارگاه شمع‌سازی رویا', service: 'شمع‌سازی', location: 'ارومیه، مدنی', phone: '09000000020', bio: 'انواع شمع‌های معطر و صابون‌های گیاهی دست‌ساز.', category_slug: 'handicrafts', service_slug: 'candles-soaps', rating: 4.8, reviews_count: 72, profileimage: { src: 'https://placehold.co/400x400.png', aiHint: 'candle maker' }, portfolio: [] },
];
