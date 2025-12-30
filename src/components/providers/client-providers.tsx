'use client';

import { AuthProvider } from '@/components/providers/auth-provider';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
