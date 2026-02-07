import { services, categories } from '@/lib/constants';
import { getProviders } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SearchResultCard from '@/components/search-result-card';

export default async function ServiceProvidersPage({ params }: { params: { category: string; service: string } }) {
  const { category: categorySlug, service: serviceSlug } = params;

  const category = categories.find((c) => c.slug === categorySlug);
  const service = services.find((s) => s.slug === serviceSlug);

  if (!service || !category) {
    notFound();
  }

  // Use the Supabase-powered getProviders function
  const serviceProviders = await getProviders({ serviceSlug });

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">{service.name}</h1>
        <p className="mt-3 text-lg text-foreground font-semibold">
          ارائه‌دهندگان خدمات برای {service.name} در دسته‌ی {' '}
          <Link href={`/services/${category.slug}`} className="hover:underline text-primary">
            {category.name}
          </Link>
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
          <Link href="/register" className="mt-2 inline-block text-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary">
            اولین نفر باشید!
          </Link>
        </div>
      )}
    </div>
  );
}
