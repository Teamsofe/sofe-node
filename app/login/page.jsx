import React, { Suspense } from 'react';
import LoginClient from '@/components/LoginClient';

export const metadata = {
  title: 'Login — Sofian Dashboard | Sofe Node',
  description:
    'Log in to your Sofian Dashboard — track your learning, manage referrals, and withdraw your earnings.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '80vh', background: '#04080F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading Login...</p></div>}>
      <LoginClient />
    </Suspense>
  );
}
