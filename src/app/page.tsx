import Link from 'next/link';
import { categories } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import BeautyIcon from '@/components/icons/beauty-icon';
import CookingIcon from '@/components/icons/cooking-icon';
import TailoringIcon from '@/components/icons/tailoring-icon';
import HandicraftsIcon from '@/components/icons/handicrafts-icon';

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  beauty: BeautyIcon,
  cooking: CookingIcon,
  tailoring: TailoringIcon,
  handicrafts: HandicraftsIcon,
};

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center">
      <section className="text-center py-20 lg:py-32">
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary-foreground to-accent-foreground/80">
          ZanMahal
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover and support talented women offering home-based services in your community. From delicious homemade food to intricate handicrafts, find the best local artisans here.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="#categories">Explore Services</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">Become a Provider</Link>
          </Button>
        </div>
      </section>

      <section id="categories" className="py-16 w-full">
        <h2 className="text-3xl font-headline font-bold text-center mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => {
            const Icon = iconMap[category.slug];
            return (
              <Link href={`/services/${category.slug}`} key={category.id}>
                <Card className="h-full flex flex-col items-center text-center p-6 hover:shadow-lg hover:-translate-y-1 transition-transform duration-300">
                  <CardHeader>
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
