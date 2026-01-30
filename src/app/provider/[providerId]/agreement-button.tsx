
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, ShieldQuestion } from 'lucide-react';
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
    const [isSent, setIsSent] = useState(hasAlreadyAgreed);

    if (isOwner) {
        return null;
    }

    const handleClick = async () => {
        if (!currentUser) {
            router.push('/login');
            return;
        }

        setIsLoading(true);
        toast.loading('در حال ارسال درخواست...');
        const result = await sendAgreementAction(providerProfileId);
        toast.dismiss();

        if (result.error) {
            toast.error('خطا', { description: result.error });
        } else if (result.success) {
            toast.success('درخواست توافق شما ارسال شد! منتظر تایید هنرمند بمانید.');
            setIsSent(true);
        }
        setIsLoading(false);
    };

    if (isSent) {
        return (
            <Button size="sm" variant="outline" disabled className="w-full">
                <ShieldQuestion className="w-4 h-4 ml-2 text-blue-500" />
                درخواست توافق ارسال شده
            </Button>
        );
    }
    
    return (
        <Button onClick={handleClick} size="sm" variant="outline" disabled={isLoading} className="w-full">
            {isLoading ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
                <ShieldCheck className="w-4 h-4 ml-2 text-green-500" />
            )}
            ارسال درخواست توافق
        </Button>
    );
}
