import React, { Suspense } from 'react';
import SignupClient from '@/components/SignupClient';

export const metadata = {
  title: 'Sign Up — Create Free Account | Sofe Node',
  description:
    'Create your free Sofian account — start your Web3 education, earn commissions, and track your progress.',
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', background: '#04080F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading Sign Up...</p></div>}>
      <SignupClient />
    </Suspense>
  );
}
