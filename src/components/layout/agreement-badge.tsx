'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { getAgreementsByProvider } from '@/lib/api';
import { useCrossTabEventListener } from '@/lib/events';

export function AgreementBadge() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const checkPendingAgreements = useCallback(async () => {
    if (!user?.phone || user.accountType !== 'provider') {
      setPendingCount(0);
      return;
    }

    try {
      const allAgreements = await getAgreementsByProvider(user.phone);
      const count = allAgreements.filter(a => a.status === 'pending').length;
      setPendingCount(count);
    } catch (e) {
      setPendingCount(0);
    }
  }, [user?.phone, user?.accountType]);

  useEffect(() => {
    checkPendingAgreements();

    // Listen for updates from other tabs
    const cleanup = useCrossTabEventListener('agreements-update', checkPendingAgreements);
    
    // Also listen to window focus event as a fallback
    window.addEventListener('focus', checkPendingAgreements);

    return () => {
      cleanup();
      window.removeEventListener('focus', checkPendingAgreements);
    };
  }, [checkPendingAgreements]);

  if (pendingCount === 0) {
    return null;
  }

  return <Badge variant="destructive">{pendingCount}</Badge>;
}
