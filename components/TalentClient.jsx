'use client';
import Link from 'next/link';

export default function TalentClient() {
  return (
    <>
      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href="/services">Services</Link>
          <span className="breadcrumb-sep">›</span>
          <span>For Talent</span>
        </div>
        <div className="page-tag">B2C &middot; Education &amp; Careers</div>
        <h1>Don&rsquo;t Just Learn Crypto.<br /><em>Master It. Earn From It.</em></h1>
        <p className="sub">High-quality blockchain education, heavily subsidised by global partners. Learn, refer, and earn while you study.</p>
        <div className="page-header-ctas">
          <Link href="#courses" className="btn-primary">View Courses &darr;</Link>
          <Link href="#affiliate" className="btn-outline">Earn Commissions &darr;</Link>
        </div>
      </div>

      {/* ── PROOF BAR ───────────────────────────────────────────────── */}
      <div className="proof-bar">
        {[
          { num: '5,000+', lbl: 'Sofians Onboarded' },
          { num: '20+', lbl: 'Bootcamps Delivered' },
          { num: 'Up to 80%', lbl: 'Tuition Subsidised' },
          { num: '10–20%', lbl: 'Referral Commission' },
        ].map(({ num, lbl }) => (
          <div className="proof-item" key={lbl}>
            <span className="proof-num">{num}</span>
            <span className="proof-lbl">{lbl}</span>
          </div>
        ))}
      </div>

      {/* ── COURSES ─────────────────────────────────────────────────── */}
      <section id="courses">
        <div className="section-tag">Our Programmes</div>
        <h2>Two Paths. <em>One Mission.</em></h2>
        <p className="body-text" style={{ marginBottom: '2.5rem' }}>Choose your entry point. Both tracks lead to the same place — a career in Web3, on your terms.</p>
        <div className="course-grid reveal">

          {/* Course 1 */}
          <div className="course-card">
            <div className="course-card-top" />
            <div className="course-card-body">
              <div className="course-badge-row">
                <span className="course-badge popular">Most Popular</span>
              </div>
              <h3 className="course-title">Blockchain &amp; Cryptocurrency Bootcamp</h3>
              <p className="course-level">🔵 Beginner → Intermediate &nbsp;<strong style={{ color: 'var(--orange)' }}>FREE</strong></p>
              <p className="course-desc">From newbie to intermediate — get a solid foundation on how to position and profit from blockchain and crypto from day one.</p>
              <div className="course-meta">
                <span>📅 4 Weeks</span>
                <span>🌐 Virtual</span>
                <span>🎓 Certificate Included</span>
                <span>💰 ₦2,000 Cert Fee</span>
              </div>
              <div className="course-modules">
                <div className="course-modules-label">8 Modules Included</div>
                <div className="module-list">
                  {['Intro to Blockchain & DLT', 'Crypto Wallets & Security', 'DeFi Fundamentals', 'Trading Basics & Strategies', 'NFTs & Web3 Culture', 'On-chain Research & Tools', 'Earning in Web3', 'Career & Community Pathways'].map((m) => (
                    <div className="module-item" key={m}><span className="module-check">✓</span>{m}</div>
                  ))}
                </div>
              </div>
              <div className="cert-note">
                <span className="cert-note-icon">🔗</span>
                Certificate is verifiable on-chain and shareable directly to LinkedIn.
              </div>
              <div className="course-ctas">
                <Link href="/signup" className="btn-outline">Enrol Self-Paced</Link>
                <Link href="/signup?cohort=live" className="btn-primary orange">Join Live Cohort →</Link>
              </div>
            </div>
          </div>

          {/* Course 2 */}
          <div className="course-card course-card-pro">
            <div className="course-card-top pro-top" />
            <div className="course-card-body">
              <div className="course-badge-row">
                <span className="course-badge pro-badge">💼 Professional Track</span>
              </div>
              <h3 className="course-title">Certified Blockchain Professional</h3>
              <p className="course-level">Advanced · Career-Ready Programme</p>
              <p className="course-desc">Join the next generation of blockchain professionals through our Blockchain Career Training Programme, Internship and Startup Accelerator.</p>
              <div className="course-meta">
                <span>📅 3–4 Months</span>
                <span>🌐 Virtual</span>
                <span>🏢 Internship Track</span>
                <span>🚀 Accelerator Access</span>
              </div>
              <div className="track-table">
                <div className="track-table-label">Choose Your Track</div>
                <div className="track-table-grid">
                  {[
                    { icon: '💻', track: 'Development', desc: 'Smart contracts, dApps, Solidity' },
                    { icon: '📊', track: 'Data Analysis', desc: 'On-chain analytics, DeFi data' },
                    { icon: '🎨', track: 'Product & Design', desc: 'Web3 UX, protocol product' },
                    { icon: '📋', track: 'Management', desc: 'DAO ops, project management' },
                    { icon: '📢', track: 'Growth & Media', desc: 'Community, content, marketing' },
                  ].map(({ icon, track, desc }) => (
                    <div className="track-row" key={track}>
                      <span className="track-icon">{icon}</span>
                      <span className="track-name">{track}</span>
                      <span className="track-desc">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="locked-cta-row">
                <span className="locked-cta-icon">🔒</span>
                <span className="locked-cta-msg">Complete the <strong>Blockchain &amp; Crypto Bootcamp</strong> to unlock this programme.</span>
                <Link href="#courses" className="btn-primary locked-unlock-btn">Start Bootcamp →</Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── AFFILIATE / EARN ────────────────────────────────────────── */}
      <section id="affiliate">
        <div className="section-tag orange-tag">Sofian Partner Programme</div>
        <h2>Sponsor Your Own <em className="orange">Education.</em></h2>
        <p className="body-text" style={{ marginBottom: '2.5rem' }}>
          Your referral link is your income stream. Every friend you bring in puts real money in your pocket — and covers your own tuition.
        </p>
        <div className="affiliate-grid reveal">
          <div className="affiliate-info">
            <div className="aff-level">
              <div className="aff-level-badge l1">L1</div>
              <div>
                <div className="aff-level-title">Level 1 — Newbie &nbsp;<span className="aff-commission">10% Commission</span></div>
                <div className="aff-level-desc">Earn 10% on every successful referral from Day 1. No requirements — just share your link.</div>
              </div>
            </div>
            <div className="aff-level">
              <div className="aff-level-badge l2">L2</div>
              <div>
                <div className="aff-level-title">Level 2 — Ambassador &nbsp;<span className="aff-commission orange-text">15% Commission</span></div>
                <div className="aff-level-desc">Unlock by completing the Blockchain Basics course <strong>and</strong> referring 5 people who have also completed it. Ambassadors actually know what they&apos;re selling.</div>
              </div>
            </div>
            <div className="aff-hook-box">
              <div className="aff-hook-icon">💡</div>
              <div className="aff-hook-text">Refer <strong>2 friends</strong> who enrol → Unlock your next course <strong>for FREE.</strong></div>
            </div>
          </div>

          {/* Live mock widget */}
          <div className="aff-widget reveal">
            <div className="aff-widget-header">
              <span className="aff-widget-title">My Business Dashboard</span>
              <span className="aff-widget-badge">Level 1 — Newbie</span>
            </div>
            <div className="aff-ref-box">
              <div className="aff-ref-label">Your Referral Link</div>
              <div className="aff-ref-row">
                <span className="aff-ref-link">sofenode.com/r/sofian123</span>
                <button className="aff-copy-btn">Copy Link</button>
              </div>
            </div>
            <div className="aff-stats-row">
              {[{ val: '45', lbl: 'Link Clicks' }, { val: '3', lbl: 'Signups' }, { val: '₦15,000', lbl: 'Earnings' }].map(({ val, lbl }) => (
                <div className="aff-stat" key={lbl}>
                  <div className="aff-stat-val">{val}</div>
                  <div className="aff-stat-lbl">{lbl}</div>
                </div>
              ))}
            </div>
            <div className="aff-progress-box">
              <div className="aff-progress-label">Ambassador Progress</div>
              <div className="aff-progress-bar"><div className="aff-progress-fill" style={{ width: '60%' }} /></div>
              <div className="aff-progress-hint">3 / 5 qualifying referrals &nbsp;·&nbsp; Complete Blockchain Basics to unlock L2</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── XP SYSTEM PREVIEW ───────────────────────────────────────── */}
      <section id="xp">
        <div className="section-tag">Reputation System</div>
        <h2>Earn XP. <em>Level Up.</em> Get Rewarded.</h2>
        <p className="body-text" style={{ marginBottom: '2.5rem' }}>
          Every action you take on Sofe Node earns XP — tracked on two separate leaderboards: monthly rankings and your all-time score.
        </p>
        <div className="xp-grid reveal">
          {/* XP Earning Actions */}
          <div className="xp-table-wrap">
            <div className="xp-table-title">How to Earn XP</div>
            <div className="xp-table">
              {[
                { action: 'Complete Foundation Certification', xp: '+500 XP', tags: ['Monthly', 'Total'] },
                { action: 'Connect Crypto Wallet', xp: '+100 XP', tags: ['Total'] },
                { action: 'Complete Career Certification', xp: '+1,000 XP', tags: ['Monthly', 'Total'] },
                { action: 'Referral Signs Up', xp: '+25 XP', tags: ['Monthly', 'Total'] },
                { action: 'Referral Completes Foundation', xp: '+200 XP', tags: ['Monthly', 'Total'] },
                { action: 'Referral Completes Career Cert', xp: '+400 XP', tags: ['Monthly', 'Total'] },
                { action: 'Attend AMA / Spaces', xp: '+30 XP', tags: ['Monthly'] },
                { action: 'Win Weekly Quiz', xp: '+150 XP', tags: ['Monthly', 'Total'] },
                { action: 'Complete Community Bounty', xp: '+300 XP', tags: ['Monthly', 'Total'] },
              ].map(({ action, xp, tags }) => (
                <div className="xp-row" key={action}>
                  <span className="xp-action">{action}</span>
                  <span className="xp-points">{xp}</span>
                  <span className="xp-tags">
                    {tags.map((t) => <span key={t} className={`xp-tag ${t === 'Monthly' ? 'xp-tag-monthly' : 'xp-tag-total'}`}>{t}</span>)}
                  </span>
                </div>
              ))}
            </div>
            <div className="xp-dual-track">
              <strong>Dual-Track System:</strong> Monthly XP resets every month — compete for top spots. Total XP never resets — your permanent reputation on the platform.
            </div>
          </div>

          {/* Tier Ladder */}
          <div className="xp-tiers-wrap">
            <div className="xp-table-title">Tier Ladder</div>
            {[
              { icon: '🌱', tier: 'Genesis Node', xp: '0 XP', desc: 'Earned on signup' },
              { icon: '⚡', tier: 'Validator', xp: '500 XP', desc: 'Foundation cert unlocks this on Day 1' },
              { icon: '⚔️', tier: 'Crypto Knight', xp: '1,500 XP', desc: '' },
              { icon: '🔥', tier: 'Chain Architect', xp: '4,000 XP', desc: '' },
              { icon: '🏆', tier: 'Protocol Master', xp: '8,000 XP', desc: '' },
              { icon: '👑', tier: 'Node Sovereign', xp: '15,000+ XP', desc: 'Elite' },
            ].map(({ icon, tier, xp, desc }, i) => (
              <div key={tier} className={`tier-row${i === 0 ? ' tier-active' : ''}`}>
                <span className="tier-icon">{icon}</span>
                <span className="tier-name">{tier}</span>
                <span className="tier-xp">{xp}</span>
                {desc && <span className="tier-note">{desc}</span>}
              </div>
            ))}
            <div className="tier-callout">
              💡 Completing the <strong>Foundation Certificate</strong> upgrades you from Genesis Node → Validator on Day 1 (+500 XP instantly)
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section id="how">
        <div className="section-tag">Your Journey</div>
        <h2>From Zero to <em>Web3 Pro.</em></h2>
        <div className="steps-grid reveal">
          {[
            { num: '01', title: 'Create Your Free Account', desc: 'Sign up and get your unique referral link instantly. No upfront fees required.', icon: '👤' },
            { num: '02', title: 'Enrol in the Bootcamp', desc: 'Join a live cohort or study self-paced. Tuition is subsidized by our global partners.', icon: '🎓' },
            { num: '03', title: 'Learn & Refer', desc: 'Study the curriculum and share your referral link to earn 10–20% commissions in parallel.', icon: '🔗' },
            { num: '04', title: 'Earn Your Certificate', desc: 'Pass the assessment to earn a verifiable on-chain certificate. Share it to LinkedIn with one click.', icon: '🏅' },
            { num: '05', title: 'Level Up & Get Hired', desc: 'Unlock the Career Track, build your on-chain reputation, and connect with protocols hiring Sofians.', icon: '🚀' },
          ].map(({ num, title, desc, icon }) => (
            <div className="step-card" key={num}>
              <div className="step-num">{num}</div>
              <div className="step-icon">{icon}</div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ACHIEVEMENT BADGES ──────────────────────────────────────── */}
      <section id="badges">
        <div className="section-tag">Achievement System</div>
        <h2>Earn Badges. <em>Own Your Rep.</em></h2>
        <p className="body-text" style={{ marginBottom: '2.5rem' }}>Collect verifiable achievement badges as you progress. Every badge is a signal to employers and the community.</p>
        <div className="badges-grid reveal">
          {[
            { icon: '🌱', title: 'Genesis Node', subtitle: 'Earned on Signup', desc: 'Welcome to the network. Your journey starts here.', status: 'earned' },
            { icon: '⚡', title: 'Validator', subtitle: '500 XP — Foundation Cert', desc: 'You\'ve been validated. The chain recognises you.', status: 'locked' },
            { icon: '⚔️', title: 'Crypto Knight', subtitle: '1,500 XP', desc: 'You fight for knowledge. The market respects you.', status: 'locked' },
            { icon: '🔥', title: 'Chain Architect', subtitle: '4,000 XP', desc: 'You\'re building the new financial system.', status: 'locked' },
            { icon: '🏆', title: 'Node Operator', subtitle: '8,000 XP', desc: 'You keep the network alive. Protocol-grade talent.', status: 'locked' },
            { icon: '👑', title: 'Node Sovereign', subtitle: '15,000+ XP — Elite', desc: 'Governance-level. The community looks to you.', status: 'locked' },
          ].map(({ icon, title, subtitle, desc, status }) => (
            <div key={title} className={`badge-card${status === 'locked' ? ' locked-badge' : ''}`}>
              <div className="badge-icon-wrap">{icon}</div>
              <div className="badge-title">{title}</div>
              <div className="badge-subtitle">{subtitle}</div>
              <div className="badge-desc">{desc}</div>
              {status === 'locked' && <div className="badge-lock-label">🔒 Locked</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ────────────────────────────────────────────── */}
      <section id="proof">
        <div className="section-tag">Sofian Voices</div>
        <h2>What Our <em>Community</em> Says</h2>
        <div className="testimonials-grid reveal">
          {[
            { name: 'Chidera O.', role: 'Blockchain Bootcamp Graduate', text: 'I went from knowing nothing about crypto to trading confidently and earning commissions from my referrals. The course actually makes sense.', xp: 'Validator · 620 XP' },
            { name: 'Fatima A.', role: 'Campus Ambassador, ABU Zaria', text: 'Sofe Node gave me a legit way to earn while studying. I referred 7 friends last semester and made enough to cover two semesters of fees.', xp: 'Crypto Knight · 2,100 XP' },
            { name: 'Emeka T.', role: 'Career Track — Development', text: 'The Smart Contract module is the real deal. I landed a remote internship with a DeFi protocol three weeks after completing the Career Track.', xp: 'Chain Architect · 4,800 XP' },
          ].map(({ name, role, text, xp }) => (
            <div className="testimonial-card" key={name}>
              <div className="testimonial-text">&ldquo;{text}&rdquo;</div>
              <div className="testimonial-meta">
                <div className="testimonial-avatar">{name[0]}</div>
                <div>
                  <div className="testimonial-name">{name}</div>
                  <div className="testimonial-role">{role}</div>
                </div>
                <div className="testimonial-xp">{xp}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA STRIP ───────────────────────────────────────────────── */}
      <div className="cta-strip" id="cta-strip">
        <div className="cta-strip-inner reveal">
          <div>
            <div className="cta-strip-tag">Ready to Start?</div>
            <h2>Your <em>Web3 Career</em> Starts Today.</h2>
            <p>Join 5,000+ Sofians already learning, earning, and building in the blockchain economy.</p>
          </div>
          <div className="cta-strip-btns">
            <Link href="/signup" className="btn-primary orange">Create Free Account →</Link>
            <Link href="/academy" className="btn-outline">Explore Academy</Link>
          </div>
        </div>
      </div>
    </>
  );
}
