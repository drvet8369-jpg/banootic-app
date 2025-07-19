import Link from 'next/link';
import { categories } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const HandMirrorIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13.1 19.8a6.6 6.6 0 0 0 8.7-1.1l-3.7-3.7" />
    <path d="M12.3 14.6a6.6 6.6 0 0 0-7.8 1.1L4 16.2a1 1 0 0 0-1.1 1.6l1.1 1.1c.3.3.7.4 1.1.4h.1" />
    <circle cx="12" cy="8" r="5" />
    <path d="M4.2 21.8a2.1 2.1 0 0 0 3-3L5.6 17.2" />
  </svg>
);

const WhiskAndBowlIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 14a8 8 0 0 1 16 0" />
    <path d="M4 14h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-4z" />
    <path d="M12 2a4 4 0 0 0-4 4v2" />
    <path d="M16 2a4 4 0 0 1 4 4v2" />
    <path d="M12 6a4 4 0 0 0 4-4" />
    <path d="M8 6a4 4 0 0 1-4-4" />
    <path d="M12 10V2" />
  </svg>
);

const MannequinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="4" r="2" />
    <path d="M12 6v10" />
    <path d="M8 16h8" />
    <path d="M6 22h12" />
    <path d="M10 12c0-2.5 4-2.5 4 0" />
    <path d="M10 16a2 2 0 1 0 4 0" />
    <path d="M12 16v6" />
  </svg>
);

const PotteryIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 14h12" />
    <path d="M6 18a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4v-4" />
    <path d="M5 14a7 7 0 0 1 14 0" />
    <path d="M12 5a2 2 0 0 1 2 2v1h-4V7a2 2 0 0 1 2-2z" />
    <path d="M10 2h4" />
  </svg>
);


const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  beauty: HandMirrorIcon,
  cooking: WhiskAndBowlIcon,
  tailoring: MannequinIcon,
  handicrafts: PotteryIcon,
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
