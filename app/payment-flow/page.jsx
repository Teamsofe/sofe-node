import React, { Suspense } from 'react';
import PaymentFlowClient from '@/components/PaymentFlowClient';

export const metadata = {
  title: 'Secure Checkout & Payment | Sofe Node',
  description: 'Complete your course enrolment or premium VIP membership fee at Sofe Node.',
};

export default function PaymentFlowPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', background: '#040810', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <p>Loading Checkout...</p>
      </div>
    }>
      <PaymentFlowClient />
    </Suspense>
  );
}
