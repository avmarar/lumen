'use client';

import { SerwistProvider as Provider } from '@serwist/turbopack/react';
import type { ReactNode } from 'react';

/** Registers the service worker in production only. */
export function SerwistProvider({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === 'development') {
    return <>{children}</>;
  }

  return (
    <Provider swUrl="/serwist/sw.js" reloadOnOnline={false}>
      {children}
    </Provider>
  );
}
