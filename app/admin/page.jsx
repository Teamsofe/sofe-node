'use client';

import { useEffect } from 'react';

export default function AdminPage() {
  useEffect(() => {
    window.location.replace('/admin-dashboard-v2.html');
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#04080F',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ fontSize: '2rem' }}>⚡</div>
      <div style={{ fontSize: '0.9rem', color: 'rgba(200, 215, 240, 0.7)' }}>
        Loading Sofe Node Admin Console…
      </div>
    </div>
  );
}
