import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Our Services — Infrastructure & Talent | Sofe Node',
  description: "Africa's distribution infrastructure for Web3 protocols, ecosystem growth, and world-class blockchain talent.",
};

export default function ServicesPage() {
  return (
    <div style={{ background: '#04080F', color: '#EEF4FF', minHeight: '100vh', fontFamily: 'Poppins, sans-serif', padding: '6rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FF8A00', marginBottom: '0.8rem' }}>
          Infrastructure & Growth
        </div>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>
          Tailored Services for <span style={{ color: '#1428FF' }}>Talents</span> & <span style={{ color: '#FF8A00' }}>Protocols</span>
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'rgba(200,215,240,0.7)', maxWidth: 640, margin: '0 auto 3.5rem', lineHeight: 1.6 }}>
          Whether you are an ambitious African developer seeking global careers, or a layer-1/layer-2 blockchain protocol seeking deep African distribution, Sofe Node is your gateway.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', textAlign: 'left' }}>
          {/* Card 1: For Talents */}
          <div style={{
            background: '#0D1526',
            border: '1px solid rgba(20,40,255,0.25)',
            borderRadius: 14,
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)'
          }}>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎓</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.8rem' }}>
                For Emerging Talent
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(200,215,240,0.7)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                Master blockchain fundamentals, earn industry-accredited certifications (CBIE), participate in paid protocol bounties, and secure vetted remote Web3 career placements.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem', color: 'rgba(200,215,240,0.85)' }}>
                <li>✓ Free Foundation Course</li>
                <li>✓ 2-Tier Referral Commissions</li>
                <li>✓ Campus Chapter Communities</li>
                <li>✓ Verified On-Chain Credentials</li>
              </ul>
            </div>
            <Link
              href="/services/talent"
              style={{
                display: 'inline-block',
                textAlign: 'center',
                background: '#1428FF',
                color: '#fff',
                padding: '0.75rem 1.6rem',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}
            >
              Explore Talent Tracks →
            </Link>
          </div>

          {/* Card 2: For Ecosystems */}
          <div style={{
            background: '#0D1526',
            border: '1px solid rgba(255,138,0,0.25)',
            borderRadius: 14,
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)'
          }}>
            <div>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌐</div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.8rem' }}>
                For Ecosystems & Protocols
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(200,215,240,0.7)', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                Tap into Africa&apos;s fastest-growing on-chain consumer base. We handle physical university tours, developer hackathons, campus node distribution, and verified protocol integration.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem', color: 'rgba(200,215,240,0.85)' }}>
                <li>✓ Blockchain Campus Experience (BCE) Tour</li>
                <li>✓ Post Bounties & Grants to 10k+ Builders</li>
                <li>✓ Campus Ambassador Node Network</li>
                <li>✓ Regulatory & Localized Market Strategy</li>
              </ul>
            </div>
            <Link
              href="/services/partners"
              style={{
                display: 'inline-block',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #FF8A00, #E07800)',
                color: '#fff',
                padding: '0.75rem 1.6rem',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}
            >
              Scale in Africa →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
