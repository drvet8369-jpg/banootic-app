
'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string,
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<(() => void) | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      const evt = e as BeforeInstallPromptEvent;

      // Stash the event so it can be triggered later.
      const prompt = () => {
        evt.prompt();
      };
      setInstallPrompt(() => prompt);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // This event is fired after the user installs the PWA
    const afterInstallHandler = () => {
        setCanInstall(false);
        setInstallPrompt(null);
    };

    window.addEventListener('appinstalled', afterInstallHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', afterInstallHandler);
    };
  }, []);

  return { installPrompt, canInstall };
}
