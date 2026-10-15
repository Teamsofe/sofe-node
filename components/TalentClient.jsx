'use client';

import React from 'react';
import Link from 'next/link';

export default function TalentClient() {
  return (
    <>
      <link rel="stylesheet" href="/css/for-talent.css" />

      {/* ── PAGE HEADER ── */}
      <div className="page-header">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">&#8250;</span>
          <Link href="/services">Services</Link>
          <span className="breadcrumb-sep">&#8250;</span>
          <span>For Talent</span>
        </div>
        <div className="page-tag">B2C &middot; Education &amp; Careers</div>
        <h1>
          Don&rsquo;t Just Learn Crypto.<br />
          <em>Master It. Earn From It.</em>
        </h1>
        <p className="sub">
          High-quality blockchain education, heavily subsidised by global ecosystem partners. Learn industry-standard skills, earn commissions referring friends, and launch your Web3 career &mdash; all from Africa.
        </p>
        <div className="header-btns">
          <Link href="#courses" className="btn-primary orange">
            Join the Next Cohort &rarr;
          </Link>
          <Link href="#affiliate" className="btn-outline">
            Earn While You Learn &darr;
          </Link>
        </div>
      </div>

      {/* ── PROOF BAR ── */}
      <div className="proof-bar reveal">
        <div className="proof-stat">
          <span className="proof-num">5,000+</span>
          <div className="proof-label">Sofians Onboarded to Web3</div>
        </div>
        <div className="proof-stat">
          <span className="proof-num">20+</span>
          <div className="proof-label">Bootcamps Delivered</div>
        </div>
        <div className="proof-stat">
          <span className="proof-num">80%</span>
          <div className="proof-label">Tuition Subsidised by Ecosystem Partners</div>
        </div>
        <div className="proof-stat">
          <span className="proof-num">5–10%</span>
          <div className="proof-label">Affiliate Commission Rate</div>
        </div>
      </div>

      {/* ── COURSES ── */}
      <section id="courses" style={{ background: 'var(--black)' }}>
        <div className="section-tag">Our Programmes</div>
        <h2>
          Two Paths.<br />
          <em>One Destination.</em>
        </h2>
        <p className="body-text">
          Whether you&rsquo;re a complete beginner or ready to go professional, we have a structured programme designed to take you from where you are to where the opportunity is.
        </p>

        <div className="courses-grid">
          {/* Course 1 */}
          <div className="course-card reveal">
            <span className="course-badge">Most Popular</span>
            <div className="course-card-top">
              <div className="course-level beginner">
                &#128312; Beginner &rarr; Intermediate &nbsp;
                <span style={{ color: 'var(--orange)', fontWeight: 800 }}>(70% OFF)</span>
              </div>
              <h3>Blockchain &amp; Cryptocurrency Bootcamp</h3>
              <p>
                From newbie to intermediate — get a solid foundation on how to position and profit from blockchain and crypto from day one. No prior experience needed.
              </p>
            </div>
            <div className="course-card-body">
              <ul className="course-modules">
                <li>Introduction to Blockchain and its Applications</li>
                <li>Cryptocurrency, types and trends</li>
                <li>Wallet and Security</li>
                <li>Crypto Incentives: Airdrop, Testnets &amp; Bounties</li>
                <li>Crypto Research and Analytics</li>
                <li>DeFi and DAO</li>
                <li>Risk Management &amp; Portfolio Building</li>
                <li>Spot and Futures Trading Basics</li>
                <li>Career Opportunities and How to Get Started</li>
              </ul>
              <div className="course-meta">
                <div className="course-meta-item"><span className="icon">&#128197;</span> 4 Weeks</div>
                <div className="course-meta-item"><span className="icon">&#127760;</span> Virtual</div>
                <div className="course-meta-item"><span className="icon">&#127891;</span> Certificate Included</div>
                <div className="course-meta-item"><span className="icon">&#128176;</span> &#8358;5,000 ($4) Certificate</div>
              </div>
              <div className="cert-note">
                &#128279; Certificate verifiable on the blockchain &mdash; shareable directly to LinkedIn
              </div>
              <div className="dual-cta" style={{ display: 'flex', gap: '.8rem', marginTop: '1.2rem' }}>
                <Link href="/academy" className="btn-outline" style={{ flex: 1, textAlign: 'center' }}>
                  Enrol Self-Paced
                </Link>
                <Link href="/academy" className="btn-primary orange" style={{ flex: 1, textAlign: 'center' }}>
                  Join Live Cohort &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Course 2 */}
          <div className="course-card reveal">
            <span className="course-badge" style={{ background: 'var(--blue)' }}>Professional</span>
            <div className="course-card-top">
              <div className="course-level professional">&#128188; Professional Track</div>
              <h3>Certified Blockchain Professional</h3>
              <p>
                Join the next generation of blockchain professionals through our career training programme, internship placement, and startup accelerator. Choose your specialisation track and go deep.
              </p>
            </div>
            <div className="course-card-body">
              <div style={{ marginBottom: '1.2rem' }}>
                <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '.7rem' }}>
                  Choose Your Specialisation
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                  {[
                    'Technical Writing',
                    'Product Management',
                    'Graphic Design & Branding',
                    'DeFi & Research Analyst',
                    'Smart Contract Development',
                    'Community & DevRel'
                  ].map((track) => (
                    <div key={track} style={{ background: 'var(--deep)', padding: '.5rem .7rem', borderRadius: 4, fontSize: '.75rem', color: 'var(--white)' }}>
                      &bull; {track}
                    </div>
                  ))}
                </div>
              </div>
              <div className="course-meta">
                <div className="course-meta-item"><span className="icon">&#128197;</span> 12 Weeks</div>
                <div className="course-meta-item"><span className="icon">&#127760;</span> Hybrid / Virtual</div>
                <div className="course-meta-item"><span className="icon">&#128188;</span> Internship Track</div>
                <div className="course-meta-item"><span className="icon">&#128640;</span> Accelerator Access</div>
              </div>
              <div className="cert-note">
                &#127891; Includes career coaching, portfolio building, and protocol partner referrals
              </div>
              <div className="dual-cta" style={{ display: 'flex', gap: '.8rem', marginTop: '1.2rem' }}>
                <Link href="/cbie-application?course=cbie" className="btn-primary" style={{ width: '100%', textAlign: 'center', background: 'var(--blue)' }}>
                  Apply for Career Track &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AFFILIATE / EARN ── */}
      <section id="affiliate">
        <div className="section-tag orange">The Sofian Partner Programme</div>
        <h2>
          Sponsor Your Own<br />
          <em className="orange">Education.</em>
        </h2>

        <div className="affiliate-grid">
          <div className="reveal">
            <p className="body-text" style={{ marginBottom: '2rem' }}>
              Refer friends, earn cash commissions, and fund your own education while you study. Your referral link unlocks the moment you complete the Blockchain Basics course — ensuring every Sofian who earns, also knows what they&rsquo;re sharing.
            </p>

            <div className="affiliate-levels">
              <div className="level-card reveal">
                <div className="level-badge l1">&#9733;</div>
                <div className="level-info">
                  <h4>Level 1 &mdash; Newbie</h4>
                  <p>Everyone starts here. You earn 5% commission on every successful referral — but you must complete the Foundation Course to receive payouts.</p>
                </div>
                <div className="level-pct">5%</div>
              </div>

              <div className="level-card l2-card reveal">
                <div className="level-badge l2">&#11088;</div>
                <div className="level-info">
                  <h4>Level 2 &mdash; Affiliate</h4>
                  <p>Refer 10 people who complete the Foundation Course and enrol in at least one Career Track course. Commission rate doubles automatically once the milestone is reached.</p>
                </div>
                <div className="level-pct">10%</div>
              </div>

              <div className="level-card l2-card reveal">
                <div className="level-badge l2">&#127894;</div>
                <div className="level-info">
                  <h4>Level 3 &mdash; Ambassador</h4>
                  <p>
                    Grow as an affiliate <strong>to be recommended to represent Sofe Node in your local community.</strong> Our ambassadors are the face of Sofe Node &mdash; leading activations for talent, market entry &amp; distribution campaigns. Earn 10% on direct referrals and 5% on indirect.
                  </p>
                </div>
                <div className="level-pct">15%</div>
              </div>
            </div>

            <div style={{ marginTop: '1.6rem', padding: '1.2rem 1.4rem', background: 'var(--blue-dim)', border: '1px solid var(--border)', borderRadius: 6 }}>
              <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: '.82rem', fontWeight: 500, color: 'var(--white)', marginBottom: '.3rem' }}>
                &#128176; Payouts direct to your Nigerian bank
              </p>
              <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: '.78rem', fontWeight: 300, color: 'var(--muted)' }}>
                Commissions are paid on professional courses straight to your bank account — no crypto wallet required.
              </p>
            </div>
          </div>

          {/* Live mock widget */}
          <div className="affiliate-visual reveal">
            <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: '.6rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '1.2rem' }}>
              Your Affiliate Dashboard Preview
            </div>
            <div className="aff-stat-row">
              <div className="aff-stat"><span className="num">45</span><span className="lbl">Link Clicks</span></div>
              <div className="aff-stat"><span className="num">3</span><span className="lbl">Signups</span></div>
              <div className="aff-stat"><span className="num">&#8358;15K</span><span className="lbl">Earned</span></div>
            </div>
            <div style={{ fontFamily: 'Poppins,sans-serif', fontSize: '.7rem', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '.7rem' }}>
              Your Referral Link
            </div>
            <div className="aff-ref-box">
              <span className="aff-ref-url">sofenode.com/ref/yourname</span>
              <button className="aff-copy-btn" onClick={(e) => { e.currentTarget.textContent = 'Copied!'; setTimeout(() => e.currentTarget.textContent = 'Copy', 1500); }}>
                Copy
              </button>
            </div>
            <div className="aff-hook">&#127881; Refer your friends to unlock discounts and giveaways</div>
            <div style={{ marginTop: '1.4rem', padding: '1.2rem 0 0', borderTop: '1px solid var(--border)' }}>
              <Link href="/signup" className="btn-primary orange" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                Create Free Account &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── XP SYSTEM PREVIEW ── */}
      <section id="xp">
        <div className="section-tag orange">XP &amp; Reputation</div>
        <h2>
          Earn Your Rank.<br />
          <em>Unlock Your Rewards.</em>
        </h2>
        <p className="body-text">
          XP is earned across every action on the platform. Your score determines your tier, your bounty access, and your share of partner airdrops and Sofe Node token rewards.
        </p>

        <div className="xp-grid">
          {/* Left: earning actions */}
          <div className="reveal">
            <div className="section-tag" style={{ marginBottom: '1rem' }}>How You Earn XP</div>
            <div className="xp-actions">
              {[
                { action: 'Complete Foundation Course & pass exam', pts: '500 XP', tag: 'Automatically + Total' },
                { action: 'Connect wallet to account', pts: '10 XP', tag: 'Total' },
                { action: 'Earn a Career Track Certificate (per cert)', pts: '100 XP', tag: 'Automatically + Total' },
                { action: 'Referral signs up (after email verification)', pts: '5 XP', tag: 'Automatically + Total' },
                { action: 'Referral completes Foundation Course', pts: '20 XP', tag: 'Automatically + Total' },
                { action: 'Referral completes a Career Track cert', pts: '30 XP', tag: 'Automatically + Total' },
                { action: 'Attend an AMA on Telegram (Awarded by Admin)', pts: '10 - 20 XP', tag: 'Weekly + Total' },
                { action: 'Attend Sofe Node Sponsored/Partner IRL Event', pts: '30 XP', tag: 'Periodically + Total' },
                { action: 'Win a weekly quiz', pts: '10 XP', tag: 'Weekly + Total' },
                { action: 'Win a bounty (confirmed by protocol)', pts: '50 - 200 XP', tag: 'Periodically + Total' }
              ].map((row, i) => (
                <div className="xp-action-row" key={i}>
                  <div className="xp-action-label"><strong>{row.action}</strong></div>
                  <div className="xp-pts">{row.pts}</div>
                  <span className="xp-track-tag total">{row.tag}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: tier ladder */}
          <div className="reveal">
            <div className="section-tag" style={{ marginBottom: '1rem' }}>XP Tiers</div>
            <div className="xp-tiers">
              {[
                { emoji: '🌱', name: 'Genesis Node', sub: '0 – 499 XP — Earned on signup', pts: '0 XP' },
                { emoji: '⚡', name: 'Validator', sub: '500 – 1,499 XP — Complete Foundation', pts: '500 XP' },
                { emoji: '⚔️', name: 'Crypto Knight', sub: '1,500 – 3,999 XP', pts: '1,500 XP' },
                { emoji: '🔥', name: 'Chain Architect', sub: '4,000 – 7,999 XP', pts: '4,000 XP' },
                { emoji: '🏆', name: 'Protocol Master', sub: '8,000 – 14,999 XP', pts: '8,000 XP' },
                { emoji: '👑', name: 'Node Sovereign', sub: '15,000+ XP — Top tier', pts: '15,000 XP' }
              ].map((tier, i) => (
                <div className={`xp-tier-row${i === 0 ? ' current-tier' : ''}`} key={tier.name}>
                  <div className="xp-tier-emoji">{tier.emoji}</div>
                  <div className="xp-tier-name">
                    {tier.name}
                    <span>{tier.sub}</span>
                  </div>
                  <div className="xp-tier-pts">{tier.pts}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ background: 'var(--deep)' }}>
        <div className="section-tag">Your Journey</div>
        <h2>From <em>Zero</em> to <em>Web3 Pro</em></h2>
        <p className="body-text">A clear, structured path — no confusion, no gatekeeping. Just skills, credentials, and real earning potential.</p>
        <div className="steps-grid reveal" style={{ marginTop: '3rem' }}>
          <div className="step">
            <span className="step-number">01</span>
            <div className="step-dot">&#128221;</div>
            <h4>Register Free</h4>
            <p>Sign up and get your unique referral link instantly. Choose your programme and secure your spot in the next cohort.</p>
          </div>
          <div className="step">
            <span className="step-number">02</span>
            <div className="step-dot">&#128218;</div>
            <h4>Learn &amp; Earn</h4>
            <p>Complete your modules at your pace. Share your referral link and earn 10% commission on every friend who joins.</p>
          </div>
          <div className="step">
            <span className="step-number">03</span>
            <div className="step-dot">&#127891;</div>
            <h4>Get Certified</h4>
            <p>Pass your assessments and receive your Sofe Node certificate — verifiable on-chain and shareable directly to LinkedIn.</p>
          </div>
          <div className="step">
            <span className="step-number">04</span>
            <div className="step-dot">&#128640;</div>
            <h4>Launch Your Career</h4>
            <p>Access internship placements, the startup accelerator, and our partner ecosystem. Your Web3 career starts here.</p>
          </div>
        </div>
      </section>

      {/* ── ACHIEVEMENT BADGES ── */}
      <section id="badges">
        <div className="section-tag">Achievement System</div>
        <h2>Earn Your <em>Badges.</em></h2>
        <p className="body-text">Every milestone you hit on the platform is recognised with a permanent badge on your Sofian profile — visible to protocols, employers, and the community.</p>

        <div className="badges-grid">
          {[
            { emoji: '🌱', title: 'Genesis Node', desc: 'Create your Sofe Node account. Welcome to the network — your journey begins here.', status: 'Earned on Signup', earned: true },
            { emoji: '⚡', title: 'Validator', desc: 'Complete the Foundation Course & pass the exam. Earn 500 XP and unlock the full platform.', status: 'Unlockable', earned: false },
            { emoji: '⚔️', title: 'Crypto Knight', desc: 'Complete 5 Academy modules across the platform. Requires Foundation cert.', status: 'Unlockable', earned: false },
            { emoji: '🔥', title: 'Chain Architect', desc: 'Complete the full Career Track programme. Mastery recognised on-chain.', status: 'Unlockable', earned: false },
            { emoji: '🏆', title: 'Node Operator', desc: 'Earn your Certified Blockchain Professional credential. The mark of a professional Sofian.', status: 'Unlockable', earned: false },
            { emoji: '👑', title: 'Node Sovereign', desc: 'Reach 15,000+ Total XP. The highest rank in the Sofian ecosystem — earned, never given.', status: 'Unlockable', earned: false }
          ].map((b) => (
            <div className={`badge-card reveal${!b.earned ? ' locked-badge' : ''}`} key={b.title}>
              <span className={`badge-status ${b.earned ? 'earned' : 'unlockable'}`}>{b.status}</span>
              <span className="badge-emoji">{b.emoji}</span>
              <h4>{b.title}</h4>
              <p>{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section id="proof">
        <div className="section-tag">Sofian Voices</div>
        <h2>What Our <em>Community</em> Says</h2>
        <p className="body-text">5,000+ Sofians have come through our programmes. Here&rsquo;s a glimpse of the impact.</p>
        <div className="proof-grid">
          <div className="proof-card reveal">
            <div className="proof-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p>&ldquo;Before Sofe Node I had zero understanding of crypto. After the bootcamp I was actively trading, earning, and I&rsquo;ve already referred 4 friends. The affiliate commission paid for my entire course.&rdquo;</p>
            <div className="proof-author">
              <div className="proof-avatar">&#128100;</div>
              <div className="proof-author-info">
                <h5>Chukwuemeka O.</h5>
                <span>Bootcamp Graduate &mdash; UNN</span>
              </div>
            </div>
          </div>
          <div className="proof-card reveal">
            <div className="proof-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p>&ldquo;The career programme placed me in an internship with a DeFi protocol within 3 months of graduating. I&rsquo;m now a full-time smart contract developer. This programme changed my trajectory.&rdquo;</p>
            <div className="proof-author">
              <div className="proof-avatar">&#128100;</div>
              <div className="proof-author-info">
                <h5>Amina B.</h5>
                <span>Career Programme Graduate &mdash; UniJos</span>
              </div>
            </div>
          </div>
          <div className="proof-card reveal">
            <div className="proof-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p>&ldquo;What sets Sofe Node apart is that it&rsquo;s practical. You don&rsquo;t just learn theory — you trade, you build, you earn. And the community keeps pushing you long after the bootcamp ends.&rdquo;</p>
            <div className="proof-author">
              <div className="proof-avatar">&#128100;</div>
              <div className="proof-author-info">
                <h5>David A.</h5>
                <span>Ambassador &mdash; Level 2 Affiliate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <section id="cta-strip">
        <div className="section-tag orange" style={{ justifyContent: 'center' }}>Your Next Step</div>
        <h2>Ready to Start Your<br /><em className="orange">Web3 Journey?</em></h2>
        <p>Seats in each cohort are limited. Join thousands of Sofians already learning, earning, and building their Web3 future.</p>
        <div className="cta-btns">
          <Link href="/academy" className="btn-primary orange">&#127891; Join the Next Cohort</Link>
          <Link href="/dashboard" className="btn-primary">View Your Dashboard &rarr;</Link>
          <Link href="/services/partners" className="btn-outline">Are You a Web3 Ecosystem? &rarr;</Link>
        </div>
      </section>
    </>
  );
}
