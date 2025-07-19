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
    name: 'مزون و لباس',
    slug: 'fashion',
    description: 'جواهرات دست‌ساز نفیس، هنرهای تزئینی و لباس‌های بی‌نظیر.',
  },
];

export const services: Service[] = [
  // Beauty
  { name: 'مانیکور و پدیکور', slug: 'manicure-pedicure', categorySlug: 'beauty' },
  { name: 'کوتاهی و رنگ مو', slug: 'haircut-coloring', categorySlug: 'beauty' },
  { name: 'فیشیال صورت', slug: 'facial-treatment', categorySlug: 'beauty' },
  { name: 'آرایش عروس و مجلسی', slug: 'makeup', categorySlug: 'beauty' },
  { name: 'خدمات اپیلاسیون', slug: 'waxing', categorySlug: 'beauty' },
  // Cooking
  { name: 'غذای سنتی ایرانی', slug: 'traditional-food', categorySlug: 'cooking' },
  { name: 'کیک و شیرینی', slug: 'cakes-sweets', categorySlug: 'cooking' },
  { name: 'وعده‌های گیاهی و وگان', slug: 'vegetarian-vegan', categorySlug: 'cooking' },
  { name: 'فینگرفود و مزه', slug: 'finger-food', categorySlug: 'cooking' },
  { name: 'نان خانگی', slug: 'homemade-bread', categorySlug: 'cooking' },
  // Tailoring
  { name: 'دوخت لباس‌های سفارشی', slug: 'custom-clothing', categorySlug: 'tailoring' },
  { name: 'تعمیرات لباس', slug: 'clothing-repair', categorySlug: 'tailoring' },
  { name: 'طراحی مانتو مدرن', slug: 'manto-design', categorySlug: 'tailoring' },
  { name: 'خیاطی لباس کودک', slug: 'kids-clothing', categorySlug: 'tailoring' },
  { name: 'لباس مجلسی و شب', slug: 'evening-wear', categorySlug: 'tailoring' },
  // Fashion
  { name: 'جواهرات دست‌ساز', slug: 'handmade-jewelry', categorySlug: 'fashion' },
  { name: 'سفال‌های تزئینی', slug: 'decorative-pottery', categorySlug: 'fashion' },
  { name: 'ترمه و گلیم', slug: 'termeh-kilim', categorySlug: 'fashion' },
  { name: 'محصولات چرمی دست‌دوز', slug: 'leather-crafts', categorySlug: 'fashion' },
  { name: 'لباس‌های مجلسی آماده', slug: 'ready-evening-wear', categorySlug: 'fashion' },
];

export const providers: Provider[] = [
  // Beauty
  { id: 1, name: 'سالن زیبایی سارا', service: 'مانیکور و پدیکور', location: 'ارومیه، خیابان والفجر', phone: '09123456789', bio: 'متخصص در طراحی و هنر ناخن مدرن.', categorySlug: 'beauty', serviceSlug: 'manicure-pedicure' },
  { id: 2, name: 'طراحی مو لاله', service: 'کوتاهی و رنگ مو', location: 'ارومیه، شیخ تپه', phone: '09123456789', bio: 'کارشناس بالیاژ و مدل‌های موی مدرن.', categorySlug: 'beauty', serviceSlug: 'haircut-coloring' },
  { id: 3, name: 'مراقبت از پوست نگین', service: 'فیشیال صورت', location: 'ارومیه، استادان', phone: '09123456789', bio: 'درمان‌های پوستی ارگانیک و طبیعی برای انواع پوست.', categorySlug: 'beauty', serviceSlug: 'facial-treatment' },
  { id: 13, name: 'آرایشگاه رؤیا', service: 'آرایش عروس و مجلسی', location: 'ارومیه، خیابان کاشانی', phone: '09123456789', bio: 'گریم تخصصی عروس و آرایش حرفه‌ای برای مهمانی‌ها.', categorySlug: 'beauty', serviceSlug: 'makeup' },
  { id: 14, name: 'مرکز اپیلاسیون نازی', service: 'خدمات اپیلاسیون', location: 'ارومیه، خیابان ورزش', phone: '09123456789', bio: 'اپیلاسیون کامل بدن با استفاده از مواد درجه یک و بهداشتی.', categorySlug: 'beauty', serviceSlug: 'waxing' },
  
  // Cooking
  { id: 4, name: 'آشپزخانه مریم', service: 'غذای سنتی ایرانی', location: 'ارومیه، خیابان فردوسی', phone: '09123456789', bio: 'ارائه قورمه‌سبزی و کباب خانگی اصیل.', categorySlug: 'cooking', serviceSlug: 'traditional-food' },
  { id: 5, name: 'شیرینی‌پزی بهار', service: 'کیک و شیرینی', location: 'ارومیه، خیابان کشاورز', phone: '09123456789', bio: 'کیک‌های سفارشی برای تولد، عروسی و رویدادهای خاص.', categorySlug: 'cooking', serviceSlug: 'cakes-sweets' },
  { id: 6, name: 'غذای سالم زهرا', service: 'وعده‌های گیاهی و وگان', location: 'ارومیه، دانشکده', phone: '09123456789', bio: 'وعده‌های غذایی گیاهی خوشمزه و سالم با ارسال درب منزل.', categorySlug: 'cooking', serviceSlug: 'vegetarian-vegan' },
  { id: 15, name: 'فینگرفود شیک', service: 'فینگرفود و مزه', location: 'ارومیه، عمار', phone: '09123456789', bio: 'سینی‌های مزه و فینگرفودهای متنوع برای مهمانی‌ها.', categorySlug: 'cooking', serviceSlug: 'finger-food' },
  { id: 16, name: 'نان خانگی گندم', service: 'نان خانگی', location: 'ارومیه، مولوی', phone: '09123456789', bio: 'پخت روزانه انواع نان‌های حجیم، سنتی و رژیمی.', categorySlug: 'cooking', serviceSlug: 'homemade-bread' },
  
  // Tailoring
  { id: 7, name: 'خیاطی شیرین', service: 'دوخت لباس‌های سفارشی', location: 'ارومیه، خیابان مدرس', phone: '09123456789', bio: 'دوخت لباس‌های زیبا و سفارشی برای هر مناسبتی.', categorySlug: 'tailoring', serviceSlug: 'custom-clothing' },
  { id: 8, name: 'طراحی پروین', service: 'تعمیرات لباس', location: 'ارومیه، خیابان امام', phone: '09123456789', bio: 'تعمیرات حرفه‌ای و سریع برای فیت عالی لباس.', categorySlug: 'tailoring', serviceSlug: 'clothing-repair' },
  { id: 9, name: 'بوتیک افسانه', service: 'طراحی مانتو مدرن', location: 'ارومیه، خیابان خیام', phone: '09123456789', bio: 'مانتوهای منحصر به فرد و شیک که سنت را با مد مدرن ترکیب می‌کند.', categorySlug: 'tailoring', serviceSlug: 'manto-design' },
  { id: 17, name: 'لباس کودک رنگین‌کمان', service: 'خیاطی لباس کودک', location: 'ارومیه، برق', phone: '09123456789', bio: 'دوخت لباس‌های فانتزی و راحت برای کودکان.', categorySlug: 'tailoring', serviceSlug: 'kids-clothing' },
  { id: 18, name: 'خانه مد آناهیتا', service: 'لباس مجلسی و شب', location: 'ارومیه، خیابان حسنی', phone: '09123456789', bio: 'طراحی و دوخت لباس‌های شب و مجلسی با پارچه‌های خاص.', categorySlug: 'tailoring', serviceSlug: 'evening-wear' },
  
  // Fashion
  { id: 10, name: 'گالری هنری گیتا', service: 'جواهرات دست‌ساز', location: 'ارومیه، خیابان بعثت', phone: '09123456789', bio: 'جواهرات نقره و سنگ‌های قیمتی منحصر به فرد، ساخته شده با عشق.', categorySlug: 'fashion', serviceSlug: 'handmade-jewelry' },
  { id: 11, name: 'سفالگری مینا', service: 'سفال‌های تزئینی', location: 'ارومیه، خیابان بهار', phone: '09123456789', bio: 'سفال‌های زیبا و نقاشی شده برای خانه و باغ شما.', categorySlug: 'fashion', serviceSlug: 'decorative-pottery' },
  { id: 12, name: 'بافت ترمه', service: 'ترمه و گلیم', location: 'ارومیه، بازار', phone: '09123456789', bio: 'پارچه‌های ترمه سنتی ایرانی و گلیم‌های دیواری.', categorySlug: 'fashion', serviceSlug: 'termeh-kilim' },
  { id: 19, name: 'هنر چرم لیلا', service: 'محصولات چرمی دست‌دوز', location: 'ارومیه، همافر', phone: '09123456789', bio: 'کیف، کمربند و اکسسوری‌های چرمی با طراحی خاص.', categorySlug: 'fashion', serviceSlug: 'leather-crafts' },
  { id: 20, name: 'مزون پروانه', service: 'لباس‌های مجلسی آماده', location: 'ارومیه، مدنی', phone: '09123456789', bio: 'مجموعه‌ای از لباس‌های شب و مجلسی از بهترین طراحان.', categorySlug: 'fashion', serviceSlug: 'ready-evening-wear' },
];
