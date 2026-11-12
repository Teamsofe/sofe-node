import React, { Suspense } from 'react';
import ChallengeClient from '@/components/ChallengeClient';

export const metadata = {
  title: 'Web3 IQ Peer Challenge | Sofe Node Academy',
  description: 'Think you know Web3 better? Take the 60-second peer challenge, beat their score, and claim your exclusive Foundation Course bonus.',
};

export default function ChallengePage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: '#04080F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <p>Loading Peer Challenge...</p>
        </div>
      }
    >
      <ChallengeClient />
    </Suspense>
  );
}
