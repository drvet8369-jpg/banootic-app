import { providers } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface PageProps {
  params: {
    providerId: string;
  };
}

export default function ChatPage({ params }: PageProps) {
  const provider = providers.find(p => p.id.toString() === params.providerId);

  if (!provider) {
    notFound();
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name.substring(0, 2);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-2xl mx-auto py-8">
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4 border-b">
           <Link href={`/services/${provider.categorySlug}/${provider.serviceSlug}`}>
             <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5"/>
             </Button>
           </Link>
           <Avatar>
            {provider.portfolio && provider.portfolio.length > 0 ? (
                <AvatarImage src={provider.portfolio[0].src} alt={provider.name} />
            ) : null }
            <AvatarFallback>{getInitials(provider.name)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-headline text-xl">{provider.name}</CardTitle>
            <CardDescription>{provider.service}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-6 space-y-4 overflow-y-auto">
            {/* Example Messages */}
             <div className="flex items-end gap-2">
                <Avatar className="h-8 w-8">
                    {provider.portfolio && provider.portfolio.length > 0 ? (
                        <AvatarImage src={provider.portfolio[0].src} alt={provider.name} />
                    ) : null }
                    <AvatarFallback>{getInitials(provider.name)}</AvatarFallback>
                </Avatar>
                <div className="bg-muted p-3 rounded-lg max-w-xs">
                    <p className="text-sm">سلام! چطور میتونم کمکتون کنم؟</p>
                </div>
            </div>
             <div className="flex items-end gap-2 justify-end">
                <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
                    <p className="text-sm">سلام، من در مورد خدمات ناخن شما سوال داشتم.</p>
                </div>
                 <Avatar className="h-8 w-8">
                    <AvatarFallback>شما</AvatarFallback>
                </Avatar>
            </div>
             <div className="text-center text-xs text-muted-foreground py-2">
               این یک نسخه نمایشی است. پیام ها ذخیره نمی شوند.
            </div>
        </CardContent>
        <div className="p-4 border-t">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="پیام خود را بنویسید..." 
              className="pr-12"
            />
            <Button size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
