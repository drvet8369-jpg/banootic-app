
import { services, categories } from '@/lib/constants';
import { getProviders } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SearchResultCard from '@/components/search-result-card';

interface PageProps {
  params: {
    category: string;
    service: string;
  };
}

export default async function ServiceProvidersPage({ params }: PageProps) {
  const { category: categorySlug, service: serviceSlug } = params;

  const category = categories.find((c) => c.slug === categorySlug);
  const service = services.find(
    (s) => s.slug === serviceSlug && s.category_id === category?.id
  );

  if (!service || !category) {
    notFound();
  }

  // --- TEMPORARY DEBUG LOGIC ---
  // Fetch all providers in the parent category to see their raw data,
  // instead of filtering by the specific service.
  const serviceProviders = await getProviders({ categorySlug: category.slug });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="text-center mb-12 p-4 border-2 border-dashed border-red-500 bg-red-50 rounded-lg">
        <h1 className="font-headline text-2xl md:text-3xl font-bold text-red-700">[حالت عیب‌یابی فعال است]</h1>
        <p className="mt-3 text-lg text-foreground font-semibold">
         در حال نمایش تمام هنرمندان دسته‌ی{' '}
          <Link href={`/services/${category.slug}`} className="hover:underline text-accent">
            {category.name}
          </Link>
        </p>
         <p className="mt-2 font-mono text-sm text-blue-600">
            مقدار Slug مورد انتظار برای این صفحه: <strong className="break-all">'{service.slug}'</strong>
        </p>
         <p className="mt-1 text-xs text-muted-foreground">مقدار بالا را با کادر "DEBUG INFO" در کارت هر هنرمند مقایسه کنید.</p>
      </div>

      {serviceProviders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviceProviders.map((provider) => (
            <SearchResultCard 
                key={provider.id} 
                provider={provider} 
                // Pass the actual slug from the database to the card for debugging
                debugSlug={provider.serviceSlug}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">هنوز هیچ ارائه‌دهنده‌ای برای این سرویس ثبت‌نام نکرده است.</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/login">اولین نفر باشید!</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

