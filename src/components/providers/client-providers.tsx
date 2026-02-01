'use client';

import { useEffect } from 'react';
import { AuthProvider } from './auth-provider';

// This component wraps all client-side providers for the application.
// This keeps the root layout as a Server Component.

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(error => console.log('Service Worker registration failed:', error));
    }
  }, []);

  return (
      <AuthProvider>
          {children}
      </AuthProvider>
  );
}
