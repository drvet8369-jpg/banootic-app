'use client';

import { useEffect } from 'react';

export default function ClientUtils() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch(error => console.log('Service Worker registration failed:', error));
    }
  }, []);

  return null; // This component does not render anything
}
