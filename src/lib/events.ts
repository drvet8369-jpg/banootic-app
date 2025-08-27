// A simple event bus using BroadcastChannel to sync state across tabs.
// This is more reliable than listening to storage events.

type EventType = 'auth-change' | 'profile-update' | 'inbox-update' | 'agreements-update';

const CHANNEL_NAME = 'banotik-channel';
let channel: BroadcastChannel | null = null;

if (typeof window !== 'undefined') {
  channel = new BroadcastChannel(CHANNEL_NAME);
}

// Function to dispatch an event to all tabs
export function dispatchCrossTabEvent(type: EventType, detail?: any) {
  if (channel) {
    channel.postMessage({ type, detail });
  }
}

// Hook to subscribe to events from other tabs
export function useCrossTabEventListener(type: EventType, callback: (event: MessageEvent) => void) {
  if (channel) {
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type === type) {
        callback(event.data.detail);
      }
    };
    
    channel.addEventListener('message', handler);

    // Return a cleanup function
    return () => {
      channel?.removeEventListener('message', handler);
    };
  }
  
  // Return a no-op cleanup function if channel is not available
  return () => {};
}
