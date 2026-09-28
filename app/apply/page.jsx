import React, { Suspense } from 'react';
import CbieApplicationClient from '@/components/CbieApplicationClient';

export const metadata = {
  title: 'Apply - Sofe Node Programs & Certification',
  description: 'Apply for talent certifications, CBIE, and cohort tracks at Sofe Node.',
};

export default function ApplyPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', background: '#04080F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading Application Form...</p></div>}>
      <CbieApplicationClient />
    </Suspense>
  );
}
