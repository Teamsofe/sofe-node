'use client';

import React from 'react';
import Link from 'next/link';

export default function BieClient() {
  return (
    <>
      <link rel="stylesheet" href="/css/bie.css" />

      {/* ── HERO ── */}
      <section id="hero">
        <div className="hero-content">
          <div className="hero-tag">Sofe Node &middot; A Sofe Group Company</div>
          <h1>
            Become a <em>Certified</em> <br />
            <em>Blockchain</em> Industrial Expert.
          </h1>
          <p className="hero-sub">
            A six-weeks intensive certification program designed for professionals ready to leverage blockchain to increase productivity, reduce costs, and build absolute trust in their industry.
          </p>
          <div className="hero-btns">
            <Link href="/cbie-application?course=cbie" className="btn-primary">
              Apply Now
            </Link>
            <Link href="/about" className="btn-outline">
              About Us
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div id="trust">
        <div className="trust-inner">
          <div className="trust-label">Trusted by</div>
          <div className="trust-track">
            <div className="trust-scroll">
              <div className="trust-item"><img src="/images/Partners/SofeNodeCoinW.png" alt="CoinW" style={{ height: '32px', maxHeight: '32px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} /></div>
              <div className="trust-item"><img src="/images/Partners/SofeNodeRally.png" alt="Rally" style={{ height: '32px', maxHeight: '32px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} /></div>
              <div className="trust-item"><img src="/images/Partners/SofeNodeCoinEx.png" alt="CoinEx" style={{ height: '32px', maxHeight: '32px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} /></div>
              {/* Loop */}
              <div className="trust-item"><img src="/images/Partners/SofeNodeCoinW.png" alt="CoinW" style={{ height: '32px', maxHeight: '32px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} /></div>
              <div className="trust-item"><img src="/images/Partners/SofeNodeRally.png" alt="Rally" style={{ height: '32px', maxHeight: '32px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} /></div>
              <div className="trust-item"><img src="/images/Partners/SofeNodeCoinEx.png" alt="CoinEx" style={{ height: '32px', maxHeight: '32px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CASE STUDY / PROGRAM OVERVIEW ── */}
      <section id="case-study">
        <div className="section-tag">The Opportunity</div>
        <h2>
          Don&apos;t Just Observe the Future. <em>Lead It.</em>
        </h2>
        <p className="body-text">
          Blockchain is no longer a concept; it is the infrastructure transforming real estate, finance, supply chain, healthcare, and governance. To remain competitive, you cannot just know about it — you must know how to use it.
        </p>
        <div className="cs-grid visible" style={{ opacity: 1, transform: 'none' }}>
          <div className="cs-card">
            <div className="cs-logo">Program Overview</div>
            <div className="cs-title">Strategic, Industry-Specific, and Flexible.</div>
            <div className="cs-block">
              <h4>The Opportunity</h4>
              <p>
                Blockchain technology is disrupting traditional industry structures and creating massive career opportunities for leaders who understand how to help companies leverage it.
              </p>
            </div>
            <div className="cs-block">
              <h4>Our Solution</h4>
              <p>
                Bridge the gap between blockchain technical complexity and industrial application. CBIE equips professionals to drive real-world blockchain adoption, optimize operations, and unlock new revenue models in their specific industries.
              </p>
            </div>
            <div className="cs-results">
              <div className="cs-result">
                <span className="num">6 weeks</span>
                <span className="lbl">A time-conscious, high-impact curriculum designed for busy professionals.</span>
              </div>
              <div className="cs-result">
                <span className="num">Choose Your Pace</span>
                <span className="lbl">Flexible learning with both Live Online and Self-Paced study options to fit your schedule.</span>
              </div>
              <div className="cs-result">
                <span className="num">Real-World Capstone</span>
                <span className="lbl">Complete an Industry Specific Capstone Project solving a real problem in your field.</span>
              </div>
              <div className="cs-result">
                <span className="num">Certification &amp; Graduation</span>
                <span className="lbl">Gain the prestigious &quot;Blockchain Industrial Expert&quot; certification verifiable on-chain.</span>
              </div>
            </div>
          </div>
          <div className="cs-visual">
            <div className="network-visual" style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="nv-node" style={{ width: '100%', height: 'auto' }}>
                <img src="/images/cbie.png" alt="CBIE Executive Certification" style={{ width: '100%', height: 'auto', borderRadius: '12px', boxShadow: '0 16px 40px rgba(0,0,0,0.4)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── DETAILED CURRICULUM OVERVIEW ── */}
        <div style={{ marginTop: '4.5rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2.5rem' }}>
          <div className="section-tag" style={{ color: 'var(--orange)' }}>Curriculum Breakdown</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--white)', marginBottom: '0.6rem' }}>
            What You Will Master During the 6 Weeks
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: '720px' }}>
            A rigorous, structured roadmap connecting foundational cryptographic mechanisms to commercial deployment and executive decision-making.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
            {[
              {
                week: 'Week 1',
                title: 'Blockchain Architecture & Enterprise Fundamentals',
                desc: 'Consensus algorithms, public vs private ledgers, smart contract capabilities, and how distributed systems eliminate intermediaries.'
              },
              {
                week: 'Week 2',
                title: 'Tokenomics & Smart Contract Logic',
                desc: 'Token utility design, incentive structures, risk assessment, and auditing frameworks without needing to write low-level code.'
              },
              {
                week: 'Week 3',
                title: 'Industry Applications & Real-World Use Cases',
                desc: 'Deep dives into Real Estate asset tokenization, FinTech liquidity & cross-border settlements, Supply Chain provenance, and Healthcare records.'
              },
              {
                week: 'Week 4',
                title: 'Governance, DAOs & Regulatory Compliance',
                desc: 'Navigating regulatory requirements in Nigeria, Africa, and global jurisdictions (SEC, CBN, GDPR), plus decentralized organization operations.'
              },
              {
                week: 'Week 5',
                title: 'Enterprise Integration & Web3 Business Models',
                desc: 'ROI calculation, vendor evaluation, change management, and pitching Web3 adoption strategies to executive boards and stakeholders.'
              },
              {
                week: 'Week 6',
                title: 'Capstone Presentation & Certification',
                desc: 'Defend your end-to-end industry capstone proposal before an executive jury, receive your on-chain verified credential, and graduate.'
              }
            ].map((mod) => (
              <div key={mod.week} style={{ background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.4rem', position: 'relative' }}>
                <div style={{ color: 'var(--blue)', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '0.35rem' }}>
                  {mod.week}
                </div>
                <div style={{ color: 'var(--white)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem', lineHeight: 1.35 }}>
                  {mod.title}
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.78rem', lineHeight: 1.6, margin: 0 }}>
                  {mod.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <section id="cta-strip">
        <div className="section-tag orange" style={{ justifyContent: 'center' }}>Your Next Step</div>
        <h2>
          Ready to lead Blockchain Applications<br />
          <em className="orange">in your Industry?</em>
        </h2>
        <p>Seats in each cohort are limited. Join professionals globally building the future in their industry.</p>
        <div className="cta-btns">
          <Link href="/cbie-application?course=cbie" className="btn-primary orange">
            🎓 Apply Now
          </Link>
          <Link href="/academy" className="btn-primary">
            Explore Other Courses &rarr;
          </Link>
          <Link href="/ecosystem" className="btn-outline">
            Are You a Brand? &rarr;
          </Link>
        </div>
      </section>
    </>
  );
}
