
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, ShieldQuestion, ShieldX, ShieldAlert } from 'lucide-react';
import { sendAgreementAction } from '@/app/agreements/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AgreementButtonProps {
    providerProfileId: string;
    currentUser: SupabaseUser | null;
    isOwner: boolean;
    agreementStatus: 'accepted' | 'pending' | 'rejected' | 'none';
}

export function AgreementButton({ providerProfileId, currentUser, isOwner, agreementStatus }: AgreementButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
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
        
        if (result.error) {
            toast.dismiss();
            toast.error('خطا', { description: result.error });
        } else if (result.success) {
            toast.dismiss();
            toast.success('درخواست توافق شما ارسال شد! منتظر تایید هنرمند بمانید.');
            router.refresh(); 
        }
        setIsLoading(false);
    };

    switch (agreementStatus) {
        case 'accepted':
            return (
                <Button size="sm" variant="outline" disabled className="w-full bg-green-100 border-green-400 text-green-800">
                    <ShieldCheck className="w-4 h-4 ml-2" />
                    توافق تایید شده
                </Button>
            );
        case 'pending':
            return (
                <Button size="sm" variant="outline" disabled className="w-full bg-blue-100 border-blue-400 text-blue-800">
                    <ShieldAlert className="w-4 h-4 ml-2" />
                    درخواست ارسال شده
                </Button>
            );
        case 'rejected':
             return (
                <Button size="sm" variant="outline" disabled className="w-full bg-red-100 border-red-400 text-red-800">
                    <ShieldX className="w-4 h-4 ml-2" />
                    درخواست رد شده
                </Button>
            );
        case 'none':
        default:
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
}
