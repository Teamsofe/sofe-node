import React, { Suspense } from 'react';
import VerifyCertificateClient from '@/components/VerifyCertificateClient';

export async function generateMetadata({ params }) {
  const certId = params.id ? decodeURIComponent(params.id) : 'Credential';
  return {
    title: `Verify Credential ${certId} | Sofe Node Academy`,
    description: `Official on-chain proof of completion and verified assessment certification issued by Sofe Node Academy.`,
  };
}

export default function VerifyPage({ params }) {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', background: '#04080F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <p>Verifying Credential Seal...</p>
        </div>
      }
    >
      <VerifyCertificateClient certIdParam={params.id} />
    </Suspense>
  );
}
