'use client';
import { useEffect } from 'react';

export default function ScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setTimeout(() => e.target.classList.add('visible'), 80);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((r) => obs.observe(r));
    return () => obs.disconnect();
  }, []);

  return null;
}
