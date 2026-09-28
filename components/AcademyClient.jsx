'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function AcademyClient() {
  const [mode, setMode] = useState('live'); // 'live' | 'selfpaced'

  const foundationModules = [
    { num: '01', title: 'Intro to Blockchain & DLT', desc: 'How distributed ledgers work, consensus mechanisms, and why it matters.' },
    { num: '02', title: 'Crypto Wallets & Security', desc: 'Seed phrases, hardware wallets, hot vs cold storage. Stay safe on-chain.' },
    { num: '03', title: 'DeFi Fundamentals', desc: 'AMMs, liquidity pools, yield farming, lending protocols.' },
    { num: '04', title: 'Trading Basics & Strategies', desc: 'Chart reading, order types, risk management, position sizing.' },
    { num: '05', title: 'NFTs & Web3 Culture', desc: 'Minting, marketplaces, creator royalties, cultural context.' },
    { num: '06', title: 'On-chain Research & Tools', desc: 'Dune Analytics, Etherscan, DefiLlama — read the chain.' },
    { num: '07', title: 'Earning in Web3', desc: 'Airdrops, bounties, staking, affiliate models, play-to-earn.' },
    { num: '08', title: 'Career & Community Pathways', desc: 'Job boards, DAO contributions, Sofe Node alumni network.' },
  ];

  const careerTracks = [
    { icon: '💻', track: 'Development', desc: 'Solidity, smart contracts, dApp builds', level: 'Advanced' },
    { icon: '📊', track: 'Data Analysis', desc: 'On-chain analytics, DeFi research', level: 'Intermediate' },
    { icon: '🎨', track: 'Product & Design', desc: 'Web3 UX, protocol product management', level: 'Intermediate' },
    { icon: '📋', track: 'Management', desc: 'DAO operations, project management', level: 'Intermediate' },
    { icon: '📢', track: 'Growth & Media', desc: 'Community, content strategy, marketing', level: 'Beginner-friendly' },
  ];

  return (
    <>
      {/* ── HERO ────────────────────────────────────────────────────── */}
      <div className="academy-hero-wrap">
        <div className="hero academy-hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot" />
              Cohort Enrollment Open Now
            </div>
            <h1>
              Don&apos;t Just Learn Crypto.<br />
              <span className="accent">Validate</span> Your Future.
            </h1>
            <p className="hero-sub">
              Every Sofian starts with our <strong>free Foundation Track</strong> — then earns, grows, and gets certified on-chain.
              Your certificate isn&apos;t just a PDF. <strong>It&apos;s a mintable NFT on the blockchain.</strong>
            </p>
            <div className="hero-actions">
              <Link href="#signup" className="btn-primary">
                Start Learning &amp; Earning <span>→</span>
              </Link>
              <Link href="#programs" className="btn-secondary">Explore Programs</Link>
            </div>
            <div className="hero-stats">
              {[
                { num: '5,000+', lbl: 'Onboarded to Web3' },
                { num: '₦0', lbl: 'Foundation Track fee' },
                { num: '₦2k', lbl: 'NFT Certificate fee' },
                { num: 'On-chain', lbl: 'Mintable NFT cert' },
              ].map(({ num, lbl }, i, arr) => (
                <span key={lbl} style={{ display: 'contents' }}>
                  <div className="stat">
                    <span className="stat-number">{num}</span>
                    <span className="stat-label">{lbl}</span>
                  </div>
                  {i < arr.length - 1 && <div className="stat-divider" />}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TRUST BAR ───────────────────────────────────────────────── */}
      <div className="trust-section">
        <div>
          <p className="trust-label">Subsidized by leading global partners</p>
          <div className="logos-row">
            {['CoinW', 'Rally', 'UNN', 'University of Jos', 'Fed. Poly Nekede'].map((name) => (
              <div className="logo-pill" key={name}>{name}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROGRAMS ────────────────────────────────────────────────── */}
      <section id="programs">
        <div className="section-label reveal">Our Programs</div>
        <h2 className="section-title reveal">Start free. Then go pro.</h2>
        <p className="section-sub reveal">Every Sofian begins at Step 1 — the Foundation Track is free and compulsory. Complete it, earn your on-chain certificate, then unlock the Career Track.</p>

        {/* Step indicator */}
        <div className="step-indicator reveal">
          <div className="step-pill step-pill-active">
            <span className="step-num-circle">1</span>
            <span>Foundation Track</span>
            <span className="step-pill-tag free-tag">FREE</span>
          </div>
          <div className="step-arrow">→</div>
          <div className="step-pill step-pill-locked">
            <span className="step-num-circle step-locked-circle">2</span>
            <span>Career Track</span>
            <span className="step-pill-tag locked-tag">🔒 Unlocks after Step 1</span>
          </div>
        </div>

        {/* Program 1: Foundation */}
        <div className="program-card reveal" id="foundation">
          <div className="program-card-top foundation-top" />
          <div className="program-card-body">
            <div className="program-header">
              <div>
                <div className="program-eyebrow">Step 1 &middot; Foundation Track</div>
                <h3 className="program-title">Blockchain &amp; Cryptocurrency Bootcamp</h3>
                <p className="program-meta">🔵 Beginner → Intermediate &nbsp;
                  <strong style={{ color: 'var(--orange)' }}>FREE to Learn</strong>
                </p>
              </div>
              <div className="program-badges-col">
                <span className="program-badge popular-badge">Most Popular</span>
              </div>
            </div>
            <div className="program-details">
              <div className="program-info-chips">
                {['📅 4 Weeks', '🌐 Virtual', '🎓 Certificate', '💰 ₦2,000 NFT Cert'].map((c) => (
                  <span className="info-chip" key={c}>{c}</span>
                ))}
              </div>

              {/* Learning mode toggle */}
              <div className="mode-toggle">
                <div className="mode-toggle-label">Choose Your Format</div>
                <div className="mode-toggle-btns">
                  <button
                    className={`mode-btn${mode === 'live' ? ' mode-btn-active' : ''}`}
                    onClick={() => setMode('live')}
                  >
                    🎓 Live Cohort
                  </button>
                  <button
                    className={`mode-btn${mode === 'selfpaced' ? ' mode-btn-active' : ''}`}
                    onClick={() => setMode('selfpaced')}
                  >
                    ⏱️ Self-Paced
                  </button>
                </div>
                {mode === 'live' && (
                  <p className="mode-desc">Weekly live sessions with instructors, cohort community, and real-time Q&A. Deadlines keep you accountable.</p>
                )}
                {mode === 'selfpaced' && (
                  <p className="mode-desc">Study at your own pace. All materials available immediately. Complete in your own time — minimum 4 weeks recommended.</p>
                )}
              </div>

              {/* 8 Modules */}
              <div className="modules-section">
                <div className="modules-label">8 Modules</div>
                <div className="modules-grid">
                  {foundationModules.map(({ num, title, desc }) => (
                    <div className="module-card" key={num}>
                      <div className="module-num">{num}</div>
                      <div>
                        <div className="module-title">{title}</div>
                        <div className="module-desc">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NFT Certificate block */}
              <div className="nft-cert-block">
                <div className="nft-cert-icon">🔗</div>
                <div>
                  <div className="nft-cert-title">On-Chain NFT Certificate</div>
                  <div className="nft-cert-desc">
                    Your certificate is minted on the blockchain — verifiable by any employer, shareable to LinkedIn with one click, and yours forever. <strong>Certificate fee: ₦2,000 ($2).</strong>
                  </div>
                </div>
              </div>

              <div className="program-ctas">
                <Link href="/signup" className="btn-outline">Enrol Self-Paced</Link>
                <Link href="/signup?cohort=live" className="btn-primary orange">Join Live Cohort →</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Program 2: Career Track */}
        <div className="program-card program-card-pro reveal" id="career">
          <div className="program-card-top pro-gradient-top" />
          <div className="program-card-body">
            <div className="program-header">
              <div>
                <div className="program-eyebrow" style={{ color: 'var(--blue)' }}>Step 2 &middot; Career Track</div>
                <h3 className="program-title">Certified Blockchain Professional</h3>
                <p className="program-meta">💼 Professional · 3–4 Months</p>
              </div>
              <div className="program-badges-col">
                <span className="program-badge pro-badge-pill">🔒 Locked</span>
              </div>
            </div>
            <p className="program-body-text">Join the next generation of blockchain professionals through our Blockchain Career Training Programme, Internship placement, and Startup Accelerator. Pick your track and go deep.</p>
            <div className="tracks-grid">
              {careerTracks.map(({ icon, track, desc, level }) => (
                <div className="track-card" key={track}>
                  <div className="track-card-icon">{icon}</div>
                  <div className="track-card-title">{track}</div>
                  <div className="track-card-desc">{desc}</div>
                  <div className="track-card-level">{level}</div>
                </div>
              ))}
            </div>
            <div className="locked-overlay-hint">
              <div className="locked-hint-icon">🔒</div>
              <div>
                <strong>Complete the Foundation Track to unlock</strong><br />
                <span style={{ fontSize: '.85rem', color: 'var(--muted)', fontWeight: 300 }}>Finish the Blockchain &amp; Cryptocurrency Bootcamp and earn your NFT certificate to access the Career Track.</span>
              </div>
              <Link href="#foundation" className="btn-primary" style={{ flexShrink: 0 }}>Start Step 1 →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── EARN SECTION ────────────────────────────────────────────── */}
      <section id="earn" style={{ background: 'var(--deep)' }}>
        <div className="section-label reveal">Sofian Partner Programme</div>
        <h2 className="section-title reveal">Learn. Then <span className="accent">Earn</span>.</h2>
        <p className="section-sub reveal">Your referral link goes live the moment you register. Every friend you bring in earns you real money — and can fund your own certification.</p>
        <div className="earn-grid reveal">

          {/* Affiliate UI mock */}
          <div className="earn-mock">
            <div className="earn-mock-header">
              <span className="earn-mock-title">My Business</span>
              <span className="earn-mock-badge">Level 1 — Newbie</span>
            </div>
            <div className="earn-ref-block">
              <div className="earn-ref-label">Your Referral Link</div>
              <div className="earn-ref-row">
                <span className="earn-ref-url">sofenode.com/r/sofian123</span>
                <button className="earn-copy-btn">Copy</button>
              </div>
            </div>
            <div className="earn-stats-row">
              {[{ val: '45', lbl: 'Clicks' }, { val: '3', lbl: 'Signups' }, { val: '₦15K', lbl: 'Earned' }].map(({ val, lbl }) => (
                <div className="earn-stat" key={lbl}>
                  <div className="earn-stat-val">{val}</div>
                  <div className="earn-stat-lbl">{lbl}</div>
                </div>
              ))}
            </div>
            <div className="earn-hook">💡 Refer <strong>2 more friends</strong> → Unlock your next course <strong>FREE</strong></div>
          </div>

          {/* Content */}
          <div className="earn-content">
            {[
              { badge: 'L1 · Newbie', commission: '10% Commission', desc: 'From your very first referral. No requirements — just share your link and earn.', color: 'var(--orange)' },
              { badge: 'L2 · Ambassador', commission: '15% Commission', desc: 'Unlock by completing Blockchain Basics + referring 5 graduates. Ambassadors know what they\'re selling.', color: 'var(--blue)' },
            ].map(({ badge, commission, desc, color }) => (
              <div key={badge} className="earn-tier-card">
                <div className="earn-tier-badge" style={{ borderColor: color, color }}>{badge}</div>
                <div className="earn-tier-commission" style={{ color }}>{commission}</div>
                <div className="earn-tier-desc">{desc}</div>
              </div>
            ))}
            <div className="earn-payout-note">
              💳 Commissions paid directly to your Nigerian bank account via <strong>Paystack</strong> — no crypto required.
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section id="how">
        <div className="section-label reveal">Your Journey</div>
        <h2 className="section-title reveal">Zero to <span className="accent">Web3 Pro</span> in 4 Steps.</h2>
        <div className="how-steps reveal">
          {[
            { num: '01', icon: '👤', title: 'Create Free Account', desc: 'Sign up and instantly get your referral link. No fees, no commitment.' },
            { num: '02', icon: '📚', title: 'Complete Foundation Track', desc: 'Study 8 modules. Pass the assessment. Mint your on-chain NFT certificate.' },
            { num: '03', icon: '🔗', title: 'Refer & Earn', desc: 'Share your link. Earn 10–20% on every signup. Fund your education or bank it.' },
            { num: '04', icon: '🚀', title: 'Go Pro or Get Hired', desc: 'Unlock the Career Track. Join the talent pool. Get matched with protocols hiring Sofians.' },
          ].map(({ num, icon, title, desc }) => (
            <div className="how-step" key={num}>
              <div className="how-step-num">{num}</div>
              <div className="how-step-icon">{icon}</div>
              <div className="how-step-title">{title}</div>
              <div className="how-step-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BADGES ──────────────────────────────────────────────────── */}
      <section id="badges" style={{ background: 'var(--deep)' }}>
        <div className="section-label reveal">Achievement System</div>
        <h2 className="section-title reveal">Earn Badges. <span className="accent">Own Your Rep.</span></h2>
        <p className="section-sub reveal">Every badge is an on-chain credential. Employers and protocols can verify your skill level directly.</p>
        <div className="badges-showcase reveal">
          {[
            { icon: '🌱', label: 'Genesis Node', sub: 'Signup', active: true },
            { icon: '⚡', label: 'Validator', sub: '500 XP', active: false },
            { icon: '⚔️', label: 'Crypto Knight', sub: '1,500 XP', active: false },
            { icon: '🔥', label: 'Chain Architect', sub: '4,000 XP', active: false },
            { icon: '🏆', label: 'Node Operator', sub: '8,000 XP', active: false },
            { icon: '👑', label: 'Node Sovereign', sub: '15,000 XP', active: false },
          ].map(({ icon, label, sub, active }) => (
            <div key={label} className={`badge-showcase-item${active ? ' badge-active' : ' badge-locked'}`}>
              <div className="badge-showcase-icon">{icon}</div>
              <div className="badge-showcase-label">{label}</div>
              <div className="badge-showcase-sub">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────── */}
      <section id="signup" style={{ background: 'linear-gradient(135deg, rgba(20,40,255,0.06), rgba(255,138,0,0.06))' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }} className="reveal">
          <div className="section-label" style={{ justifyContent: 'center' }}>Start Today — It&apos;s Free</div>
          <h2 className="section-title">Join 5,000+ Sofians<br />Building in Web3.</h2>
          <p className="section-sub" style={{ marginBottom: '2.5rem' }}>
            Free Foundation Track. Earn while you learn. On-chain certificates.<br />
            Your referral link is waiting.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn-primary orange" style={{ fontSize: '1rem', padding: '1rem 2.5rem' }}>
              Start Learning &amp; Earning →
            </Link>
            <Link href="/services/talent" className="btn-outline">Learn More</Link>
          </div>
        </div>
      </section>
    </>
  );
}
