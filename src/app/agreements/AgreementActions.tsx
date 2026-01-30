
'use client';

import { Button } from "@/components/ui/button";
import { acceptAgreementAction, rejectAgreementAction } from "./actions";
import { toast } from "sonner";
import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

interface AgreementActionsProps {
    agreementId: string;
    providerProfileId: string;
}

export function AgreementActions({ agreementId, providerProfileId }: AgreementActionsProps) {
    const [isLoading, setIsLoading] = useState<false | 'accepting' | 'rejecting'>(false);

    const handleAccept = async () => {
        setIsLoading('accepting');
        const result = await acceptAgreementAction(agreementId, providerProfileId);
        if (result.error) {
            toast.error("خطا در تایید", { description: result.error });
        } else {
            toast.success("توافق با موفقیت تایید شد.");
        }
        setIsLoading(false);
    }

    const handleReject = async () => {
        if (!confirm("آیا از رد کردن این درخواست توافق مطمئن هستید؟")) return;
        setIsLoading('rejecting');
        const result = await rejectAgreementAction(agreementId, providerProfileId);
        if (result.error) {
            toast.error("خطا در رد کردن", { description: result.error });
        } else {
            toast.info("درخواست توافق رد شد.");
        }
        setIsLoading(false);
    }

    return (
        <div className="flex gap-2">
            <Button size="sm" onClick={handleAccept} disabled={!!isLoading}>
                {isLoading === 'accepting' ? <Loader2 className="animate-spin ml-2" /> : <Check className="ml-2" />}
                تایید
            </Button>
            <Button size="sm" variant="destructive" onClick={handleReject} disabled={!!isLoading}>
                {isLoading === 'rejecting' ? <Loader2 className="animate-spin ml-2" /> : <X className="ml-2" />}
                رد کردن
            </Button>
        </div>
    )
}
