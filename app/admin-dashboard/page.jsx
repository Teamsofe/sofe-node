import AdminDashboardClient from '@/components/AdminDashboardClient';

export const metadata = {
  title: 'Admin Control Center | Sofe Node',
  description: 'Control plane for Sofe Node operations, courses, RBAC roles, grading, and disbursements.',
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
