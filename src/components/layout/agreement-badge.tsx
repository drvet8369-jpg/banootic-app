'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { getAgreements } from '@/lib/data';

export function AgreementBadge() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // This badge is only for providers
    if (!user?.phone || user.accountType !== 'provider') {
      setPendingCount(0);
      return;
    }

    const checkPendingAgreements = () => {
      try {
        const allAgreements = getAgreements();
        const count = allAgreements.filter(
          (a) => a.providerPhone === user.phone && a.status === 'pending'
        ).length;
        setPendingCount(count);
      } catch (e) {
        setPendingCount(0);
      }
    };

    checkPendingAgreements();

    // Set up listeners for real-time updates
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'banotic-agreements') {
            checkPendingAgreements();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', checkPendingAgreements);
    const intervalId = setInterval(checkPendingAgreements, 5000); 

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', checkPendingAgreements);
    };
  }, [user?.phone, user?.accountType]);

  if (pendingCount === 0) {
    return null;
  }

  return <Badge variant="destructive">{pendingCount}</Badge>;
}
