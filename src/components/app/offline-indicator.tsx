'use client';

import { useState, useEffect } from 'react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs bg-orange-50 border-b text-orange-700 dark:bg-orange-950/30 dark:text-orange-400">
      <span className="h-2 w-2 rounded-full bg-orange-400 shrink-0" />
      Offline — changes saved locally
    </div>
  );
}
