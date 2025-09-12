
'use client';
import { getCategoryBySlug, getServicesByCategory } from '@/lib/data';
import type { Category, Service } from '@/lib/types';
import { notFound, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function ServiceCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </CardHeader>
    </Card>
  );
}


export default function CategoryPage() {
  const params = useParams<{ category: string }>();
  const categorySlug = params.category;

  const [category, setCategory] = useState<Category | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(false);
      const cat = await getCategoryBySlug(categorySlug);
      if (!cat) {
        setError(true);
        setIsLoading(false);
        return;
      }
      const catServices = await getServicesByCategory(categorySlug);
      setCategory(cat);
      setServices(catServices);
      setIsLoading(false);
    }
    fetchData();
  }, [categorySlug]);

  if (isLoading) {
    return (
       <div className="py-12 md:py-20">
        <div className="text-center mb-12">
            <Skeleton className="h-12 w-1/2 mx-auto mb-4" />
            <Skeleton className="h-5 w-3/4 mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({length: 6}).map((_, i) => <ServiceCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (error || !category) {
    notFound();
  }

  return (
    <div className="py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-bold">{category.name}</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">{category.description}</p>
      </div>

      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Link href={`/services/${category.slug}/${service.slug}`} key={service.slug}>
              <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-transform duration-300">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="font-headline text-xl">{service.name}</CardTitle>
                  <ChevronLeft className="w-6 h-6 text-muted-foreground" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">هنوز هیچ خدماتی در این دسته‌بندی ثبت نشده است.</p>
           <Button asChild variant="link" className="mt-2">
            <Link href="/login">اولین نفر باشید!</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
