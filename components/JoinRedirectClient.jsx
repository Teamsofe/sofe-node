'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, doc, getDoc, collection, query, where, getDocs } from '@/lib/firebase';

export default function JoinRedirectClient({ slug }) {
  const router = useRouter();
  const [status, setStatus] = useState('Resolving campus node...');

  useEffect(() => {
    async function resolveNode() {
      try {
        let chSnap = await getDoc(doc(db, 'chapters', slug));
        let chapter = chSnap.exists() ? chSnap.data() : null;

        if (!chapter) {
          const qSnap = await getDocs(query(collection(db, 'chapters'), where('slug', '==', slug)));
          if (!qSnap.empty) {
            chapter = qSnap.docs[0].data();
          }
        }

        if (chapter && chapter.whatsapp_link) {
          setStatus(`Connecting to ${chapter.name || 'Campus Node'} WhatsApp group...`);
          window.location.href = chapter.whatsapp_link;
        } else {
          setStatus('Node found! Redirecting to signup...');
          router.replace(`/signup?node=${slug}`);
        }
      } catch (err) {
        console.error('Error resolving chapter:', err);
        router.replace(`/signup?node=${slug}`);
      }
    }

    if (slug) {
      resolveNode();
    }
  }, [slug, router]);

  return (
    <div style={{ minHeight: '100vh', background: '#040810', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1.5s infinite linear' }}>🏛</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem' }}>{status}</h2>
        <p style={{ color: 'rgba(200,215,240,0.6)', fontSize: '0.8rem' }}>Please wait while we establish your node handshake.</p>
      </div>
    </div>
  );
}
