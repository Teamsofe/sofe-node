import React, { Suspense } from 'react';
import CbieApplicationClient from '@/components/CbieApplicationClient';

export const metadata = {
  title: 'Apply for CBIE - Certified Blockchain & Intelligence Expert | Sofe Node',
  description: 'Apply for the Certified Blockchain & Intelligence Expert (CBIE) flagship program at Sofe Node.',
};

export default function CbieApplicationPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', background: '#04080F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading Application Form...</p></div>}>
      <CbieApplicationClient />
    </Suspense>
  );
}
