'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { getAgreementsByProvider } from '@/lib/api';

export function AgreementBadge() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const checkPendingAgreements = useCallback(async () => {
    // This badge is only for providers
    if (!user?.phone || user.accountType !== 'provider') {
      setPendingCount(0);
      return;
    }

    try {
      const allAgreements = await getAgreementsByProvider(user.phone);
      const count = allAgreements.filter(a => a.status === 'pending').length;
      setPendingCount(count);
    } catch (e) {
      // Silently fail to not interrupt user experience
      setPendingCount(0);
    }
  }, [user?.phone, user?.accountType]);

  useEffect(() => {
    checkPendingAgreements();

    // Set up an interval to periodically check for new agreements
    const intervalId = setInterval(checkPendingAgreements, 30000); // Check every 30 seconds

    // Re-check when the window gets focus, as user might have confirmed on another tab
    window.addEventListener('focus', checkPendingAgreements);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', checkPendingAgreements);
    };
  }, [checkPendingAgreements]);

  if (pendingCount === 0) {
    return null;
  }

  return <Badge variant="destructive">{pendingCount}</Badge>;
}
