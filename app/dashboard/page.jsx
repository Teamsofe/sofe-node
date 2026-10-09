import DashboardClient from '@/components/DashboardClient';
import { Suspense } from 'react';

export const metadata = {
  title: 'Sofian Dashboard & Success Portal | Sofe Node',
  description: 'Manage your Web3 courses, referrals, commissions, wallet, and certification at Sofe Node.',
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#04080F', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading Dashboard...</div>}>
      <DashboardClient />
    </Suspense>
  );
}
