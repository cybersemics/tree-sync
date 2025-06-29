'use client';

import { PowerSyncContext } from '@powersync/react';
import { observer } from 'mobx-react-lite';
import React, { Suspense, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import store from '@/stores/RootStore';

export const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

export const SystemProvider = observer(({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    // Ensure store is initialized on mount
    if (!isLoginPage && !store.isFullyInitialized) {
      store.restoreSession?.();
    }
  }, [isLoginPage, store]);

  // Don't show spinner on login page
  if (isLoginPage) {
    return children;
  }

  if (!hasMounted || !store.db) {
    return <LoadingSpinner />;
  }

  // Show spinner while initializing or not ready
  if (!store.isFullyInitialized) {
    return (
      <PowerSyncContext.Provider value={store.db}>
        <LoadingSpinner />
      </PowerSyncContext.Provider>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PowerSyncContext.Provider value={store.db}>
        {children}
      </PowerSyncContext.Provider>
    </Suspense>
  );
});

export default SystemProvider;
