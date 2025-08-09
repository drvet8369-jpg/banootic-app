'use client';

import { useAuth } from '@/context/AuthContext';
import CustomerDashboard from '@/components/dashboard/customer-dashboard';
import ProviderDashboard from '@/components/dashboard/provider-dashboard';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="w-full py-8">
      {user?.accountType === 'provider' ? <ProviderDashboard /> : <CustomerDashboard />}
    </div>
  );
}
