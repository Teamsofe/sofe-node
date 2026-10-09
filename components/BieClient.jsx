'use client';
import Link from 'next/link';

export default function BieClient() {
  const modules = [
    { num: 'Week 1', title: 'DLT Architecture & Enterprise Chains', desc: 'Private vs public blockchains, consensus models, enterprise node operations.' },
    { num: 'Week 2', title: 'Smart Contracts & Industrial Logic', desc: 'Automating business agreements, dispute mitigation, audit standards.' },
    { num: 'Week 3', title: 'Supply Chain & Provenance', desc: 'Real-time asset tracking, fraud elimination, pharmaceutical and agricultural use cases.' },
    { num: 'Week 4', title: 'Fintech, CBDCs & Cross-Border Settlement', desc: 'Stablecoins, tokenized RWA, liquidity corridors across African borders.' },
    { num: 'Week 5', title: 'Regulatory Compliance & Legal Frameworks', desc: 'SEC, Central Bank guidelines, AML/KYC on-chain compliance in emerging markets.' },
    { num: 'Week 6', title: 'Capstone Defense & Industrial Implementation', desc: 'Present your enterprise blockchain roadmap to industry judges.' },
  ];

  const industries = [
    { icon: '🏦', name: 'Banking & Financial Services' },
    { icon: '📦', name: 'Supply Chain & Logistics' },
    { icon: '🏥', name: 'Healthcare & Pharma' },
    { icon: '🏢', name: 'Real Estate & Land Registry' },
    { icon: '⚖️', name: 'Legal & Compliance' },
    { icon: '⚡', name: 'Energy & Commodities' },
  ];

  return (
    <>
      <link rel="stylesheet" href="/css/bie.css" />

      {/* ── HERO ── */}
      <section id="hero" style={{ padding: '8rem 5vw 4rem', textAlign: 'center' }}>
        <div className="hero-content" style={{ maxWidth: '850px', margin: '0 auto' }}>
          <div className="hero-tag" style={{ color: 'var(--orange)', textTransform: 'uppercase', fontSize: '.8rem', fontWeight: 700, letterSpacing: '.1em', marginBottom: '.8rem' }}>
            Sofe Node &middot; Executive Education
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.2rem' }}>
            Become a <em>Certified</em> <br /><em>Blockchain</em> Industrial Expert.
          </h1>
          <p className="hero-sub" style={{ color: 'var(--muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            A six-week intensive certification program designed for executives and professionals ready to leverage blockchain to increase productivity, reduce costs, and build absolute trust in their industry.
          </p>
          <div className="hero-btns" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/cbie-application?course=cbie" className="btn-primary" style={{ padding: '.8rem 1.8rem', background: 'var(--blue)', color: '#fff', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }}>Apply for Next Cohort</Link>
            <Link href="/about" className="btn-outline" style={{ padding: '.8rem 1.8rem', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}>About Sofe Node</Link>
          </div>
        </div>
      </section>

      {/* ── CURRICULUM ── */}
      <section style={{ padding: '5rem 5vw', background: 'var(--deep)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ color: 'var(--blue)', fontWeight: 700, textTransform: 'uppercase', fontSize: '.75rem', marginBottom: '.5rem' }}>Syllabus</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>6-Week <span style={{ color: 'var(--blue)' }}>Executive Curriculum</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {modules.map((m, idx) => (
              <div key={idx} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.8rem' }}>
                <div style={{ color: 'var(--orange)', fontWeight: 800, fontSize: '.8rem', marginBottom: '.3rem' }}>{m.num}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '.5rem' }}>{m.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '.85rem', lineHeight: 1.6 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TARGET INDUSTRIES ── */}
      <section style={{ padding: '5rem 5vw' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ color: 'var(--orange)', fontWeight: 700, textTransform: 'uppercase', fontSize: '.75rem', marginBottom: '.5rem' }}>Applications</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Industries <span style={{ color: 'var(--orange)' }}>Transformed</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
            {industries.map((ind, idx) => (
              <div key={idx} style={{ background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{ind.icon}</span>
                <span style={{ fontWeight: 600, color: 'var(--white)', fontSize: '.95rem' }}>{ind.name}</span>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
            <Link href="/cbie-application?course=cbie" className="btn-primary" style={{ padding: '.9rem 2.2rem', background: 'var(--orange)', color: '#000', borderRadius: '8px', fontWeight: 800, textDecoration: 'none' }}>
              Submit Your Application →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
