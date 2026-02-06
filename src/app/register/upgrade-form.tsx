'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { categories, services } from '@/lib/constants';
import type { Profile, Service } from '@/lib/types';
import { upgradeCustomerToProviderAction } from './actions';
import { Label } from '@/components/ui/label';


const UpgradeSchema = z.object({
  serviceType: z.string({ required_error: 'لطفاً دسته‌بندی خدمات را انتخاب کنید.' }),
  serviceSlug: z.string({ required_error: 'لطفاً خدمت تخصصی خود را انتخاب کنید.' }),
  bio: z.string().min(10, { message: 'بیوگرافی باید حداقل ۱۰ کاراکتر باشد.' }),
  location: z.string().min(2, { message: 'لطفاً شهر خود را وارد کنید.' }),
});

type UpgradeFormValues = z.infer<typeof UpgradeSchema>;

export function UpgradeForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [subServices, setSubServices] = useState<Service[]>([]);
  
  const form = useForm<UpgradeFormValues>({
    resolver: zodResolver(UpgradeSchema),
    defaultValues: { bio: '', location: 'ارومیه' },
  });
  
  const serviceType = form.watch('serviceType');

  useEffect(() => {
    if (serviceType) {
        const category = categories.find(c => c.slug === serviceType);
        if (category) {
            const relatedServices = services.filter(s => s.category_id === category.id);
            setSubServices(relatedServices);
            form.setValue('serviceSlug', undefined);
        }
    } else {
        setSubServices([]);
    }
  }, [serviceType, form]);

  async function onSubmit(values: UpgradeFormValues) {
    setIsLoading(true);
    toast.loading("در حال ارتقاء حساب...");
    
    const result = await upgradeCustomerToProviderAction(values);
    toast.dismiss();

    if (result.error) {
      toast.error("خطا در ارتقاء حساب", { description: result.error });
      setIsLoading(false);
    } else {
      toast.success("حساب شما با موفقیت به هنرمند ارتقا یافت!");
      router.push('/profile');
      router.refresh();
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-2">
                <Label>نام کامل یا نام کسب‌وکار</Label>
                <Input value={profile.full_name || ''} disabled readOnly />
            </div>
             <div className="space-y-2">
                <Label>شماره تلفن</Label>
                <Input value={profile.phone || ''} disabled readOnly />
            </div>
            
            <FormField control={form.control} name="serviceType" render={({ field }) => (
              <FormItem>
                <FormLabel>دسته‌بندی خدمات</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                  <FormControl><SelectTrigger><SelectValue placeholder="یک دسته‌بندی خدمات انتخاب کنید" /></SelectTrigger></FormControl>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {subServices.length > 0 && (
                <FormField control={form.control} name="serviceSlug" render={({ field }) => (
                    <FormItem>
                        <FormLabel>خدمت تخصصی</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                            <FormControl><SelectTrigger><SelectValue placeholder="خدمت تخصصی خود را انتخاب کنید" /></SelectTrigger></FormControl>
                            <SelectContent>{subServices.map((s) => <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />
            )}

            <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                    <FormLabel>شهر</FormLabel>
                    <FormControl><Input placeholder="مثال: ارومیه" {...field} disabled={isLoading} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="bio" render={({ field }) => (
              <FormItem>
                <FormLabel>بیوگرافی کوتاه</FormLabel>
                <FormControl><Textarea placeholder="کمی در مورد خدمات و هنر خود به ما بگویید" {...field} disabled={isLoading} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تکمیل ثبت‌نام و ارتقاء به هنرمند
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
