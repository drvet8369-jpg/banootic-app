import Link from 'next/link';
import { categories } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Utensils, Scissors, Paintbrush } from 'lucide-react';

const LipstickIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
    <path d="M8.5 10a1.5 1.5 0 0 1-1.4-2.2L9.5 4l1-2.5c.2-.5.9-.5 1.1 0l1 2.5 2.4 3.8A1.5 1.5 0 0 1 15.5 10Z" />
    <path d="M8.5 10h7" />
  </svg>
);


const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  beauty: LipstickIcon,
  cooking: Utensils,
  tailoring: Scissors,
  handicrafts: Paintbrush,
};

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center">
      <section className="text-center py-20 lg:py-32">
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary-foreground to-accent-foreground/80">
          زن‌محل
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          بانوان هنرمندی که خدمات خانگی در محله شما ارائه می‌دهند را کشف و حمایت کنید. از غذاهای خانگی خوشمزه تا صنایع دستی پیچیده، بهترین صنعتگران محلی را اینجا پیدا کنید.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="#categories">مشاهده خدمات</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/register">ارائه‌دهنده شوید</Link>
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
