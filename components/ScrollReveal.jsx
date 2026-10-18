'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '60px 0px 60px 0px' }
    );

    const observeAll = () => {
      if (typeof document === 'undefined') return;
      document.querySelectorAll('.reveal:not(.visible)').forEach((r) => {
        const rect = r.getBoundingClientRect();
        if (rect.top < (window.innerHeight || 800) + 80) {
          r.classList.add('visible');
        } else {
          obs.observe(r);
        }
      });
    };

    observeAll();
    const t1 = setTimeout(observeAll, 100);
    const t2 = setTimeout(observeAll, 400);

    let mutationObs;
    try {
      mutationObs = new MutationObserver(() => {
        observeAll();
      });
      mutationObs.observe(document.body, { childList: true, subtree: true });
    } catch {
      // Ignore if MutationObserver is unsupported
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      obs.disconnect();
      if (mutationObs) mutationObs.disconnect();
    };
  }, [pathname]);

  return null;
}
