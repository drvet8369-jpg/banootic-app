
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { User as SupabaseUser } from '@supabase/supabase-js';

import { Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/star-rating';
import { addReviewAction } from './actions';
import type { Provider } from '@/lib/types';


interface ReviewFormProps {
  provider: Provider;
  user: SupabaseUser | null;
}

export function ReviewForm({ provider, user }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
        <Card className="mt-8 bg-muted/40">
            <CardContent className="p-6 text-center">
                <p className="font-semibold">برای ثبت نظر، لطفاً ابتدا وارد شوید.</p>
                <Button onClick={() => router.push('/login')} className="mt-4">
                    ورود به حساب کاربری
                </Button>
            </CardContent>
        </Card>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !comment.trim()) {
      toast.error("لطفاً امتیاز و متن نظر را وارد کنید.");
      return;
    }
    setIsSubmitting(true);
    toast.loading("در حال ثبت نظر شما...");

    const result = await addReviewAction({
        providerId: provider.id,
        profileId: provider.profile_id,
        rating,
        comment,
    });
    
    toast.dismiss();

    if (result.error) {
        toast.error("خطا در ثبت نظر", { description: result.error });
    } else {
        toast.success("نظر شما با موفقیت ثبت شد.");
        setRating(0);
        setComment('');
        router.refresh();
    }

    setIsSubmitting(false);
  };
  
  const isButtonDisabled = isSubmitting || rating === 0 || !comment.trim();

  return (
    <Card className="mt-8 bg-muted/30">
      <CardHeader>
        <CardTitle className="font-headline text-xl">نظر خود را ثبت کنید</CardTitle>
        <CardDescription>تجربه خود را با دیگران به اشتراک بگذارید.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-semibold text-sm mb-2 block">امتیاز شما:</label>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>
          <div>
            <label htmlFor="comment" className="font-semibold text-sm mb-2 block">نظر شما:</label>
            <Textarea
              id="comment"
              placeholder="تجربه خود را اینجا بنویسید..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button type="submit" disabled={isButtonDisabled} className="w-full">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4 ml-2" />}
                ارسال نظر
            </Button>
             {isButtonDisabled && !isSubmitting && (
                <p className="text-xs text-center text-muted-foreground">
                    {rating === 0 && !comment.trim() ? "لطفاً برای ثبت نظر، امتیاز و متن نظر را وارد کنید." :
                     rating === 0 ? "لطفاً امتیاز خود را با انتخاب ستاره‌ها مشخص کنید." :
                     "لطفاً متن نظر خود را بنویسید."}
                </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
