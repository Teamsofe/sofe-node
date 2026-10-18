'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { runSofeIntro } from '@/lib/sofeIntroEngine';

export default function SofeIntro() {
  const pathname = usePathname();

  useEffect(() => {
    // Only run intro on the home page
    if (pathname !== '/') {
      document.documentElement.removeAttribute('data-sofe-intro');
      return;
    }

    const cleanup = runSofeIntro();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [pathname]);

  return null;
}
