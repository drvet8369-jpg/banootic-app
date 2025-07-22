
'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { Provider } from '@/lib/types';
import { CalendarIcon, Loader2, CreditCard, PartyPopper } from 'lucide-react';
import { faIR } from 'date-fns/locale';

const reservationSchema = z.object({
  date: z.date({
    required_error: 'لطفاً یک تاریخ انتخاب کنید.',
  }),
  timeSlot: z.enum(['morning', 'afternoon'], {
    required_error: 'لطفاً یک بازه زمانی انتخاب کنید.',
  }),
  notes: z.string().max(200, "یادداشت نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد.").optional(),
});

type ReservationFormValues = z.infer<typeof reservationSchema>;

const DEPOSIT_AMOUNT = 50000; // 50,000 Toman

interface ReservationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  provider: Provider;
}

export default function ReservationDialog({ isOpen, onOpenChange, provider }: ReservationDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationSchema),
  });

  const onSubmit = (data: ReservationFormValues) => {
    console.log('Reservation data:', data);
    setIsProcessing(true);
    setTimeout(() => {
        setStep('payment');
        setIsProcessing(false);
    }, 1000);
  };
  
  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setStep('success');
      setIsProcessing(false);
      toast({
        title: "رزرو با موفقیت انجام شد",
        description: `درخواست شما برای ${provider.name} ثبت شد.`
      })
    }, 2000);
  }
  
  const handleClose = () => {
    onOpenChange(false);
    // Reset state after a short delay to allow the dialog to close smoothly
    setTimeout(() => {
      form.reset();
      setStep('form');
    }, 300);
  };


  const renderContent = () => {
    switch (step) {
      case 'form':
        return (
          <>
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl">رزرو نوبت از {provider.name}</DialogTitle>
              <DialogDescription>
                لطفا تاریخ و زمان مورد نظر خود را برای دریافت خدمات انتخاب کنید.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col items-center">
                          <FormLabel className="mb-2">۱. تاریخ را انتخاب کنید</FormLabel>
                          <FormControl>
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                              initialFocus
                              locale={faIR}
                              className="rounded-md border"
                            />
                          </FormControl>
                          <FormMessage className="mt-2" />
                        </FormItem>
                      )}
                    />
                    <div className="space-y-6">
                        <FormField
                        control={form.control}
                        name="timeSlot"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>۲. بازه زمانی را انتخاب کنید</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-2"
                                >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="morning" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        نوبت صبح (ساعت ۹ الی ۱۲)
                                    </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="afternoon" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        نوبت بعد از ظهر (ساعت ۱۴ الی ۱۸)
                                    </FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                         <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>۳. یادداشت (اختیاری)</FormLabel>
                                <FormControl>
                                    <Textarea
                                    placeholder="اگر نکته خاصی برای هنرمند دارید، اینجا بنویسید..."
                                    className="resize-none"
                                    {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" className="w-full" disabled={isProcessing}>
                        {isProcessing && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        ادامه و پرداخت بیعانه
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        );
      case 'payment':
         return (
             <>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">پرداخت بیعانه</DialogTitle>
                    <DialogDescription>
                        برای نهایی کردن رزرو، لطفاً مبلغ بیعانه را پرداخت کنید.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-8 text-center">
                    <div className="bg-muted p-6 rounded-lg">
                        <p className="text-muted-foreground">مبلغ قابل پرداخت</p>
                        <p className="text-4xl font-bold mt-2">{DEPOSIT_AMOUNT.toLocaleString('fa-IR')} تومان</p>
                    </div>
                     <p className="text-xs text-muted-foreground mt-4">
                        این یک صفحه پرداخت شبیه‌سازی شده است. در نسخه نهایی به درگاه پرداخت متصل خواهد شد.
                    </p>
                </div>
                <DialogFooter>
                    <Button onClick={handlePayment} className="w-full" disabled={isProcessing}>
                         {isProcessing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CreditCard className="ml-2 h-4 w-4" />}
                        پرداخت می‌کنم
                    </Button>
                </DialogFooter>
             </>
         );
       case 'success':
        return (
            <>
                <DialogHeader className="items-center text-center">
                    <PartyPopper className="w-16 h-16 text-primary mb-4" />
                    <DialogTitle className="font-headline text-2xl">رزرو شما با موفقیت ثبت شد!</DialogTitle>
                    <DialogDescription>
                        درخواست شما برای هنرمند ارسال شد. جزئیات به زودی از طریق پیامک برای شما ارسال خواهد شد.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="bg-muted p-4 rounded-lg text-center">
                         <p className="font-semibold text-primary-foreground">با تشکر از اعتماد شما!</p>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                         <Button onClick={handleClose} className="w-full">متوجه شدم</Button>
                    </DialogClose>
                </DialogFooter>
            </>
        )
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!isProcessing) {
            onOpenChange(open);
            // If closing, reset the state
            if (!open) {
              handleClose();
            }
        }
    }}>
      <DialogContent 
        className="sm:max-w-3xl" 
        onEscapeKeyDown={(e) => {
            if (isProcessing) e.preventDefault();
        }}
        onInteractOutside={(e) => {
            if (isProcessing) e.preventDefault();
        }}
        onCloseAutoFocus={(e) => {
            if (isProcessing || step !== 'form') e.preventDefault();
        }}
      >
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
