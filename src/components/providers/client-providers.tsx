'use client';

import { useEffect } from 'react';

// This component wraps client-side logic that needs to be at the root of the application,
// like service worker registration, without turning the entire root layout into a client component.

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

  return <>{children}</>;
}
