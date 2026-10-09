'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BceClient() {
  const [timeLeft, setTimeLeft] = useState({ days: 45, hours: 12, mins: 30, secs: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: 59, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const tracks = [
    { icon: '💻', title: 'Engineering & Dev', desc: 'Smart contracts, dApp security, architecture workshops with leading protocol core devs.' },
    { icon: '📈', title: 'DeFi & Trading', desc: 'Market making, on-chain liquidity, derivatives trading, and algorithmic models.' },
    { icon: '🤝', title: 'Community & Ecosystem', desc: 'Growth strategies, developer relations, campus node leadership in African markets.' },
    { icon: '🏛', title: 'Governance & DAOs', desc: 'Decentralized decision-making, tokenomics, legal frameworks, and treasury management.' },
  ];

  const tickets = [
    { name: 'Student Pass', price: 'Free', sub: 'Verified university students', perks: ['Access to main stage keynotes', 'Virtual career expo', 'Certificate of attendance'], popular: false },
    { name: 'Professional Pass', price: '₦15,000', sub: 'Developers & Web3 workers', perks: ['Full stage & workshop access', 'Priority career fair matching', 'VIP Networking Lounge', 'Official BCE Swag Bag'], popular: true },
    { name: 'Protocol / Sponsor', price: 'Contact Us', sub: 'Exhibitors & recruiters', perks: ['Exhibition booth space', 'Keynote & panel speaking slot', 'Direct talent pipeline database', 'Brand feature across all nodes'], popular: false },
  ];

  return (
    <>
      <link rel="stylesheet" href="/css/bce.css" />

      {/* ── HERO ── */}
      <section className="bce-hero" id="bce-hero" style={{ padding: '8rem 5vw 4rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div className="bce-badge" style={{ display: 'inline-block', background: 'rgba(255,138,0,.15)', color: 'var(--orange)', border: '1px solid rgba(255,138,0,.3)', borderRadius: '20px', padding: '.4rem 1.2rem', fontSize: '.8rem', fontWeight: 700, marginBottom: '1.2rem' }}>
            🔥 Annual Flagship Event &middot; 2026 Edition
          </div>
          <h1 className="bce-h1" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 800, lineHeight: 1.15 }}>
            Blockchain <br /><span style={{ color: 'var(--blue)' }}>Career</span> <span style={{ color: 'var(--orange)' }}>Expo 2026</span>
          </h1>
          <p className="body-text" style={{ maxWidth: '580px', margin: '1.2rem auto 2rem', color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.7 }}>
            Africa&apos;s premier Web3 career event. Keynotes, workshops, a live career fair, and protocol exhibitions across our campus node networks. One day. Hundreds of opportunities.
          </p>

          {/* Countdown */}
          <div className="countdown-wrap" style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.4rem', minWidth: '80px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--orange)', display: 'block' }}>{timeLeft.days}</span>
              <span style={{ fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Days</span>
            </div>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.4rem', minWidth: '80px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--orange)', display: 'block' }}>{timeLeft.hours}</span>
              <span style={{ fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Hours</span>
            </div>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.4rem', minWidth: '80px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--orange)', display: 'block' }}>{timeLeft.mins}</span>
              <span style={{ fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Minutes</span>
            </div>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.4rem', minWidth: '80px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--orange)', display: 'block' }}>{timeLeft.secs}</span>
              <span style={{ fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Seconds</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#tickets" className="btn-primary" style={{ padding: '.8rem 1.8rem', background: 'var(--orange)', color: '#000', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }}>Get Your Ticket</a>
            <a href="#tracks" className="btn-outline" style={{ padding: '.8rem 1.8rem', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}>View Tracks</a>
          </div>
          <p style={{ marginTop: '1.2rem', fontSize: '.78rem', color: 'var(--muted)' }}>📍 University of Nigeria, Nsukka &amp; Virtual &middot; November 2026</p>
        </div>
      </section>

      {/* ── TRACKS ── */}
      <section id="tracks" style={{ padding: '5rem 5vw', background: 'var(--deep)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ color: 'var(--blue)', fontWeight: 700, textTransform: 'uppercase', fontSize: '.75rem', marginBottom: '.5rem' }}>Expo Content</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Four Curated <span style={{ color: 'var(--blue)' }}>Tracks</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {tracks.map((t, idx) => (
              <div key={idx} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '10px', padding: '2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{t.icon}</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--white)', marginBottom: '.5rem' }}>{t.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 1.65 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TICKETS ── */}
      <section id="tickets" style={{ padding: '5rem 5vw' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ color: 'var(--orange)', fontWeight: 700, textTransform: 'uppercase', fontSize: '.75rem', marginBottom: '.5rem' }}>Passes</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Reserve Your <span style={{ color: 'var(--orange)' }}>Spot</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            {tickets.map((t, idx) => (
              <div key={idx} style={{ background: t.popular ? 'rgba(20,40,255,.08)' : 'var(--panel)', border: t.popular ? '2px solid var(--blue)' : '1px solid var(--border)', borderRadius: '14px', padding: '2.2rem', position: 'relative' }}>
                {t.popular && <div style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--blue)', color: '#fff', fontSize: '.7rem', fontWeight: 700, padding: '.2rem .8rem', borderRadius: '20px' }}>MOST POPULAR</div>}
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--white)' }}>{t.name}</h3>
                <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: '1.2rem' }}>{t.sub}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--orange)', marginBottom: '1.5rem' }}>{t.price}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', color: 'var(--text)', fontSize: '.85rem', lineHeight: 2 }}>
                  {t.perks.map((p, pidx) => (
                    <li key={pidx} style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <span style={{ color: '#10b981' }}>✓</span> {p}
                    </li>
                  ))}
                </ul>
                <Link href="/login" style={{ display: 'block', textAlign: 'center', padding: '.75rem', background: t.popular ? 'var(--blue)' : 'transparent', border: t.popular ? 'none' : '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }}>
                  Register Pass →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
