
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { sendAgreementAction } from '@/app/agreements/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AgreementButtonProps {
    providerProfileId: string;
    currentUser: SupabaseUser | null;
    isOwner: boolean;
    hasAlreadyAgreed: boolean;
}

export function AgreementButton({ providerProfileId, currentUser, isOwner, hasAlreadyAgreed }: AgreementButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [agreed, setAgreed] = useState(hasAlreadyAgreed);

    if (isOwner) {
        return null;
    }

    const handleClick = async () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }

        setIsLoading(true);
        toast.loading('در حال ارسال توافق...');
        const result = await sendAgreementAction(providerProfileId);
        toast.dismiss();

        if (result.error) {
            toast.error('خطا', { description: result.error });
        } else if (result.success) {
            toast.success('توافق شما با موفقیت ثبت شد!');
            setAgreed(true);
        }
        setIsLoading(false);
    };

    if (agreed) {
        return (
            <Button size="sm" variant="outline" disabled className="w-1/2">
                <ShieldCheck className="w-4 h-4 ml-2 text-green-500" />
                شما قبلاً توافق کرده‌اید
            </Button>
        );
    }
    
    return (
        <Button onClick={handleClick} size="sm" variant="outline" disabled={isLoading} className="w-1/2">
            {isLoading ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
                <ShieldCheck className="w-4 h-4 ml-2 text-green-500" />
            )}
            ارسال توافق اولیه
        </Button>
    );
}
