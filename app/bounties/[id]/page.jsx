import BountyDetailClient from '@/components/BountyDetailClient';

export function generateStaticParams() {
  return [
    { id: 'default' }
  ];
}

export const metadata = {
  title: 'Bounty Campaign Details | Sofe Node',
  description: 'View bounty requirements, prize rewards, and submit proof of work on Sofe Node.',
};

export default function BountyDetailPage() {
  return <BountyDetailClient />;
}
