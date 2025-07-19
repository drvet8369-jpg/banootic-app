import Link from 'next/link';
import Image from 'next/image';
import { categories } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, ChefHat, Scissors, Gift } from 'lucide-react';

const iconMap: { [key: string]: React.ElementType } = {
  beauty: Palette,
  cooking: ChefHat,
  tailoring: Scissors,
  handicrafts: Gift,
};

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center">
      <section className="text-center py-20 lg:py-32">
        <Image 
          src="/logo.png" 
          alt="هنربانو لوگو" 
          width={128} 
          height={128} 
          className="mx-auto mb-6 h-32 w-32"
          priority
        />
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary-foreground to-accent-foreground/80">
          هنربانو
        </h1>
        <p className="mt-4 font-headline text-xl md:text-2xl text-accent-foreground/90">
          با دستان هنرمندت بدرخش
        </p>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          بانوان هنرمندی که خدمات خانگی در محله شما ارائه می‌دهند را کشف و حمایت کنید. از غذاهای خانگی خوشمزه تا صنایع دستی زیبا، بهترین هنرمندان محلی را اینجا پیدا کنید.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg" className="w-48">
            <Link href="#categories">مشاهده خدمات</Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-48">
            <Link href="/register">عضویت و ارائه خدمات</Link>
          </Button>
        </div>
      </section>

      <section id="categories" className="py-16 w-full">
        <h2 className="text-3xl font-headline font-bold text-center mb-12">خدمات ما</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => {
            const Icon = iconMap[category.slug];
            return (
              <Link href={`/services/${category.slug}`} key={category.id}>
                <Card className="h-full flex flex-col items-center text-center p-6 hover:shadow-lg hover:-translate-y-1 transition-transform duration-300">
                  <CardHeader className="items-center">
                    {Icon && <Icon className="w-20 h-20 mb-4 text-accent" />}
                    <CardTitle className="font-headline text-2xl">{category.name}</CardTitle>
                  </CardHeader>
                  <CardDescription>{category.description}</CardDescription>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
