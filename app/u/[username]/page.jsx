import React, { Suspense } from 'react';
import PublicProfileClient from '@/components/PublicProfileClient';

export async function generateMetadata({ params }) {
  const username = params.username ? decodeURIComponent(params.username) : 'Builder';
  return {
    title: `${username} | Verified Web3 CV & Proof of Work | Sofe Node`,
    description: `Inspect ${username}'s verified Web3 certifications, proof-of-work assessment scores, and leaderboard rank on Sofe Node Academy.`,
  };
}

export default function PublicProfilePage({ params }) {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px' }}>
          <p style={{ fontSize: '0.92rem', opacity: 0.8 }}>Loading Verified Web3 CV...</p>
        </div>
      }
    >
      <PublicProfileClient usernameParam={params.username} />
    </Suspense>
  );
}
