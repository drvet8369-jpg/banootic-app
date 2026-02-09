import { services, categories } from '@/lib/constants';
import { getProviders } from '@/lib/data';
import type { Service, Provider, Category } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SearchResultCard from '@/components/search-result-card';

export default async function ServiceProvidersPage({ params }: { params: { category: string; service: string } }) {
  const { category: categorySlug, service: serviceSlug } = params;

  const category = categories.find((c) => c.slug === categorySlug);
  const service = services.find((s) => s.slug === serviceSlug && s.category_id === category?.id);
    
  if (!category || !service) {
    notFound();
  }

  // Fetch data directly on the server
  const serviceProviders = await getProviders({serviceSlug: serviceSlug});

  return (
    <div className="py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">{service.name}</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          لیست بهترین هنرمندان متخصص در این رشته را مشاهده کنید.
        </p>
      </div>

      {serviceProviders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {serviceProviders.map((provider) => (
            <SearchResultCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">هنوز هیچ ارائه‌دهنده‌ای برای این سرویس ثبت‌نام نکرده است.</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/register">اولین نفر باشید!</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
