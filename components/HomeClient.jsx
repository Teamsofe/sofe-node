'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SofeIntro from './SofeIntro';

export default function HomeClient() {
  const [activeTab, setActiveTab] = useState('b2c');
  const [openFaq, setOpenFaq] = useState(0);

  function toggleFaq(i) {
    setOpenFaq(openFaq === i ? -1 : i);
  }

  const faqs = [
    {
      q: 'What is Sofe Node?',
      a: "Sofe Node is Africa's Web3 distribution infrastructure — connecting global protocols to African users and talent through campus activations, bootcamps, and our community network.",
    },
    {
      q: 'How do I join a bootcamp?',
      a: 'Click "Get Started Today" on the homepage to register for the next cohort. Bootcamps run regularly across physical and virtual formats, with tuition subsidized by our global partners.',
    },
    {
      q: 'How does the affiliate program work?',
      a: 'Once registered, you get a unique referral link. Earn 10% at Level 1 (Newbie) and 15% at Level 2 (Ambassador) on every successful signup. Commissions are paid directly to your Nigerian bank account via Paystack.',
    },
    {
      q: 'How can my brand partner with Sofe Node?',
      a: 'We offer market distribution, talent sponsorship, campus activation, and conference sponsorship packages. Click "Scale in Africa" or reach out via this form and our partnerships team will respond within 48 hours.',
    },
    {
      q: 'What is the BCE?',
      a: "The Blockchain Career Expo (BCE) is Sofe Node's annual flagship event — bringing together Web3 professionals, protocols, and talent for keynotes, a career fair, and an exhibition floor across our node networks.",
    },
  ];

  return (
    <>
      <SofeIntro />
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section id="hero" data-intro-hero>
        <div className="hero-content">
          <div className="hero-tag">Sofe Node &middot; A Sofe Group Company</div>
          <h1 className="hero-title-2lines">
            <span className="hero-line-1">Africa&apos;s <em>Web3 Talent &amp;</em></span>
            <span className="hero-line-2"><em>Distribution</em> Engine</span>
          </h1>
          <p className="hero-sub">
            For Ecosystems: market entry, active users and retention.<br />
            For talent: learn, earn, build reputation, and get rewarded.
          </p>
          <p className="hero-tagline">Validating Talent. Enhancing Growth.</p>
          <div className="hero-btns">
            <Link href="/for-talents" className="btn-primary">Get Started Today</Link>
            <Link href="/ecosystem" className="btn-outline">Scale in Africa</Link>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ──────────────────────────────────────────────────── */}
      <div id="trust">
        <div className="trust-inner">
          <div className="trust-label">Trusted by</div>
          <div className="trust-track">
            <div className="trust-scroll">
              <div className="trust-item"><img src="/images/Partners/SofeNodeCoinW.png" alt="CoinW" style={{ height: '32px', maxHeight: '32px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} /></div>
              <div className="trust-item"><img src="/images/Partners/SofeNodeRally.png" alt="Rally" style={{ height: '32px', maxHeight: '32px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} /></div>
              <div className="trust-item"><img src="/images/Partners/SofeNodeCoinEx.png" alt="CoinEx" style={{ height: '32px', maxHeight: '32px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} /></div>
              {/* Set 2 — duplicate for seamless loop */}
              <div className="trust-item"><img src="/images/Partners/SofeNodeCoinW.png" alt="CoinW" style={{ height: '32px', maxHeight: '32px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} /></div>
              <div className="trust-item"><img src="/images/Partners/SofeNodeRally.png" alt="Rally" style={{ height: '32px', maxHeight: '32px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} /></div>
              <div className="trust-item"><img src="/images/Partners/SofeNodeCoinEx.png" alt="CoinEx" style={{ height: '32px', maxHeight: '32px', width: 'auto', maxWidth: '120px', objectFit: 'contain' }} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CASE STUDY ─────────────────────────────────────────────────── */}
      <section id="case-study">
        <div className="section-tag">Live Case Study</div>
        <h2>How We Delivered for <em>CoinW</em></h2>
        <p className="body-text">Targeted campus activation and trading bootcamps as the distribution layer for real market penetration in Nigeria.</p>
        <div className="cs-grid reveal">
          <div className="cs-card">
            <div className="cs-logo">CoinW</div>
            <div className="cs-title">Exchange &times; Sofe Node &middot; Nigeria</div>
            <div className="cs-block">
              <h4>The Challenge</h4>
              <p>Breaking into the competitive Nigerian market and acquiring high-quality active traders at scale.</p>
            </div>
            <div className="cs-block">
              <h4>The Sofe Solution</h4>
              <p>Campus activation across university nodes + structured trading bootcamps turning raw talent into verified traders.</p>
            </div>
            <div className="cs-results">
              {[
                { num: '800+', lbl: 'New Active Users' },
                { num: '$12M+', lbl: 'Trading Volume' },
                { num: '$30K+', lbl: 'New Liquidity' },
                { num: '100+', lbl: 'Traders Trained' },
              ].map(({ num, lbl }) => (
                <div className="cs-result" key={lbl}>
                  <span className="num">{num}</span>
                  <span className="lbl">{lbl}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="cs-visual">
            <div className="network-visual">
              {/* Central SOFE NODE Hub */}
              <div className="nv-center" title="Sofe Node Hub">
                SOFE<br />NODE
              </div>

              {/* Connecting Lines */}
              <div className="nv-line nv-line-1" />
              <div className="nv-line nv-line-2" />
              <div className="nv-line nv-line-3" />
              <div className="nv-line nv-line-4" />
              <div className="nv-line nv-line-5" />

              {/* 5 University & Campus Node Satellites with Official Logos */}
              {[
                { name: 'UniJos Node', img: '/images/Nodes/SofeNodeUniJOS.png', cls: 'nv-node-1' },
                { name: 'UniBen Node', img: '/images/Nodes/SofeNodeUniBEN.png', cls: 'nv-node-2' },
                { name: 'FPNO Node',   img: '/images/Nodes/SofeNodeFPNO.png',   cls: 'nv-node-3' },
                { name: 'DSPG Node',   img: '/images/Nodes/SofeNodeDSPG.png',   cls: 'nv-node-4' },
                { name: 'UNN Node',    img: '/images/Nodes/SofeNodeUNN.png',    cls: 'nv-node-5' },
              ].map((node) => (
                <div className={`nv-node ${node.cls}`} key={node.name} title={node.name}>
                  <img
                    src={node.img}
                    alt={node.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '50%',
                      display: 'block'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────── */}
      <div className="stats-wrap">
        <div className="stats-strip reveal">
          {[
            { num: '5,000+', lbl: 'Onboarded to Web3' },
            { num: '20+', lbl: 'Bootcamps Run' },
            { num: '80+', lbl: 'Virtual Events' },
            { num: '6+', lbl: 'IRL Conferences' },
          ].map(({ num, lbl }) => (
            <div className="stat-cell" key={lbl}>
              <span className="stat-num">{num}</span>
              <span className="stat-label">{lbl}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ABOUT ──────────────────────────────────────────────────────── */}
      <section id="about">
        <div className="reveal">
          <div className="section-tag">About Sofe Node</div>
          <h2>The Validation <em>Layer</em> for Africa&apos;s Web3 Market</h2>
          <p className="body-text" style={{ marginBottom: '1.4rem' }}>
            Just as a node validates transactions on a blockchain, Sofe Node is an independent distribution network &mdash; acting as the on-ramp for global Web3 innovation, validating users and talent for market entry, acquisition and retention.
          </p>
          <p className="body-text">
            We pioneer blockchain adoption through virtual and IRL trainings, seminars and conferences. Our mission: build the framework and manpower to position Africa to lead tech innovation.
          </p>
          <div style={{ marginTop: '2rem' }}>
            <Link href="/about" className="btn-ghost">Learn More &rarr;</Link>
          </div>
        </div>
        <div className="about-visual reveal">
          <div className="about-quote">We don&apos;t just offer brand awareness. We deliver active users, on-chain volume, and deep market penetration through our university chapters.</div>
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: '.58rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '.8rem' }}>Aligned to UN SDGs</p>
            <div className="about-sdgs">
              {['SDG 1 · No Poverty', 'SDG 4 · Quality Education', 'SDG 8 · Decent Work', 'SDG 9 · Innovation', 'SDG 10 · Reduced Inequality'].map((s) => (
                <span className="sdg-chip" key={s}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE PROPS ────────────────────────────────────────────────── */}
      <section id="value">
        <div className="section-tag">Our Solutions</div>
        <h2>Built for <em>Protocols</em> &amp; People</h2>
        <div className="vp-tabs">
          <button className={`vp-tab${activeTab === 'b2c' ? ' active' : ''}`} onClick={() => setActiveTab('b2c')}>For Talent (B2C)</button>
          <button className={`vp-tab${activeTab === 'b2b' ? ' active' : ''}`} onClick={() => setActiveTab('b2b')}>For Ecosystems (B2B)</button>
        </div>

        {activeTab === 'b2c' && (
          <div className="vp-panel active reveal">
            <h3 style={{ fontFamily: 'Poppins,sans-serif', fontSize: '1.5rem', fontWeight: 800, marginBottom: '.5rem' }}>
              Don&apos;t Just Learn Crypto. <em style={{ color: 'var(--blue)', fontStyle: 'normal' }}>Master It. Earn From It.</em>
            </h3>
            <p className="body-text" style={{ marginBottom: '1.8rem' }}>High-quality blockchain education, heavily subsidized by our global partners.</p>
            <div className="feature-grid">
              {[
                { icon: '🎓', title: 'Industry-Standard Skills', body: 'From DeFi trading to Smart Contract development. Learn skills that are actually in demand globally.' },
                { icon: '💰', title: 'Subsidized Tuition', body: 'Our partners cover up to 80% of your fees. World-class training at a fraction of the real cost.' },
                { icon: '🔗', title: 'Sofian Partner Program', body: 'Earn 10–20% cash commissions by referring friends. Fund your education while you study.' },
              ].map(({ icon, title, body }) => (
                <div className="feat-card" key={title}>
                  <div className="feat-icon">{icon}</div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '2rem' }}>
              <Link href="/academy" className="btn-primary">Get Started Today &rarr;</Link>
            </div>
          </div>
        )}

        {activeTab === 'b2b' && (
          <div className="vp-panel active reveal">
            <h3 style={{ fontFamily: 'Poppins,sans-serif', fontSize: '1.5rem', fontWeight: 800, marginBottom: '.5rem' }}>
              Your Gateway to the <em style={{ color: 'var(--blue)', fontStyle: 'normal' }}>African Web3 Market.</em>
            </h3>
            <p className="body-text" style={{ marginBottom: '1.8rem' }}>
              We don&apos;t offer &ldquo;brand awareness.&rdquo; We deliver active users, on-chain volume, and deep market penetration through our university node network.
            </p>
            <div className="feature-grid">
              {[
                { icon: '🌍', title: 'Market Distribution Nodes', body: 'Plug your product into our campus node networks for instant market penetration, liquidity, and user adoption.' },
                { icon: '✅', title: 'Verified Talent Pipeline', body: 'We process raw talent through our bootcamps, outputting verified developers and traders ready for your ecosystem.' },
                { icon: '📊', title: 'Proven Track Record', body: '$12M+ trading volume, 800+ users, $30K+ liquidity delivered for CoinW in one activation cycle.' },
              ].map(({ icon, title, body }) => (
                <div className="feat-card" key={title}>
                  <div className="feat-icon">{icon}</div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '2rem' }}>
              <Link href="/ecosystem" className="btn-primary">Scale in Africa &rarr;</Link>
            </div>
          </div>
        )}
      </section>

      {/* ── BCE ────────────────────────────────────────────────────────── */}
      <section id="bce">
        <div className="section-tag orange-tag">Annual Event</div>
        <div className="bce-grid">
          <div className="reveal">
            <h2>Blockchain <em className="orange">Career Expo</em> (BCE)</h2>
            <p className="body-text" style={{ marginBottom: '2rem' }}>
              Africa&apos;s premier Web3 talent and partnership event. BCE brings together blockchain professionals, protocols, investors, and developers for a full day of panels, demos, and career opportunities.
            </p>
            {[
              { icon: '🎙️', title: 'Industry Panels & Keynotes', body: 'Top voices in African and global Web3 on stage — live and streamed.' },
              { icon: '🏢', title: 'Sponsor Exhibition Floor', body: 'Get your brand in front of a high-value, pre-qualified Web3 audience.' },
              { icon: '💼', title: 'Career Fair & Hiring Booths', body: 'Connect directly with verified Sofian talent ready for internships and roles.' },
              { icon: '🌍', title: 'Visibility Across All Node Networks', body: 'Amplified exposure across all campus nodes and our full digital community.' },
            ].map(({ icon, title, body }) => (
              <div className="bce-feature" key={title}>
                <div className="bce-icon">{icon}</div>
                <div><h4>{title}</h4><p>{body}</p></div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '2rem' }}>
              <Link href="/bce" className="btn-primary orange">See Event Pitch Deck &rarr;</Link>
              <Link href="/bce#sponsor" className="btn-outline">Become a Sponsor &rarr;</Link>
            </div>
          </div>
          <div className="reveal">
            <div className="bce-card">
              <div className="bce-card-top" />
              <div className="bce-card-body">
                <div className="bce-card-header">
                  <div><div className="bce-title">BCE 2025</div><div className="bce-sub">Blockchain Career Expo</div></div>
                  <div className="bce-badge">Annual Event</div>
                </div>
                <div className="bce-stats">
                  {[{ n: '500+', l: 'Attendees' }, { n: '20+', l: 'Speakers' }, { n: '10+', l: 'Sponsors' }].map(({ n, l }) => (
                    <div className="bce-stat" key={l}><div className="n">{n}</div><div className="l">{l}</div></div>
                  ))}
                </div>
                <div className="bce-tiers">
                  <div className="bce-tier-label">Sponsorship Tiers</div>
                  <div className="bce-tier gold"><span className="name">🥇 Title Sponsor</span><span className="desc">Full brand ownership</span></div>
                  <div className="bce-tier silver"><span className="name">🥈 Gold Sponsor</span><span className="desc">Stage + exhibition</span></div>
                  <div className="bce-tier bronze"><span className="name">🥉 Community Sponsor</span><span className="desc">Node network exposure</span></div>
                </div>
                <Link href="/bce" className="btn-primary orange" style={{ width: '100%', display: 'block', textAlign: 'center' }}>See Full Event Deck &rarr;</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DASHBOARD TEASER ───────────────────────────────────────────── */}
      <section id="dashboard">
        <div className="section-tag">Sofian Dashboard</div>
        <h2>Your Growth, <em>All in One Place.</em></h2>
        <div className="dash-grid">
          <div className="reveal">
            <p className="body-text" style={{ marginBottom: '1.8rem' }}>
              Track your learning progress, manage your affiliate referrals, and withdraw your earnings directly to your bank account &mdash; all from one student success portal.
            </p>
            <div style={{ marginBottom: '2rem' }}>
              {['Track course completion and earn achievement badges', 'Refer friends and earn 10–20% commissions', 'Withdraw earnings to your Nigerian bank via Paystack', 'Download certificates and share directly to LinkedIn'].map((txt) => (
                <div className="dash-bullet" key={txt}>
                  <div className="dash-bullet-dot" />
                  <span>{txt}</span>
                </div>
              ))}
            </div>
            <Link href="/signup" className="btn-primary">Create Free Account &rarr;</Link>
          </div>
          <div className="dash-mockup reveal">
            <div className="dash-topbar">
              <div className="d1" /><div className="d2" /><div className="d3" />
              <div className="dash-url">dashboard.sofenode.com</div>
            </div>
            <div className="dash-body">
              <div className="dash-sidebar">
                {['📚 Classroom', '💼 Business', '💳 Wallet', '🏆 Hall of Fame'].map((tab, i) => (
                  <div key={tab} className={`dash-tab${i === 0 ? ' active' : ''}`}>{tab}</div>
                ))}
              </div>
              <div className="dash-content">
                <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: '.48rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: '.8rem' }}>My Classroom</p>
                <div className="dash-stat-row">
                  {[{ val: '65%', lbl: 'Complete' }, { val: '₦15K', lbl: 'Earned' }, { val: '3', lbl: 'Referrals' }].map(({ val, lbl }) => (
                    <div className="dash-stat" key={lbl}><div className="ds-val">{val}</div><div className="ds-lbl">{lbl}</div></div>
                  ))}
                </div>
                <div className="dash-prog-label">DeFi Fundamentals &middot; Module 4/6</div>
                <div className="dash-prog-bar"><div className="dash-prog-fill" /></div>
                <div className="dash-badge">🎗️ Next Badge: Crypto Knight — Complete 2 more modules</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY PARTNERS ─────────────────────────────────────────── */}
      <section id="partners">
        <div className="section-tag orange-tag">Community Partners</div>
        <h2>Growing Africa&apos;s <em className="orange">Web3 Ecosystem</em> Together</h2>
        <p className="body-text">We collaborate with leading community organisations and event platforms advancing blockchain adoption across Africa.</p>
        <div className="partners-slider reveal">
          <div className="partners-track">
            {[
              { icon: '🏛️', name: 'Enugu Blockchain Week', type: 'Event Partner' },
              { icon: '🦁', name: 'Lion Science Park', type: 'Innovation Hub' },
              { icon: '🚀', name: 'Roar Hub Nigeria', type: 'Startup Hub' },
              { icon: '🎪', name: 'All Crypto Event', type: 'Event Partner' },
              { icon: '🌐', name: 'The Web3Tribe', type: 'Community Partner' },
            ].flatMap((p, i) => [
              <div className="partner-card" key={`${p.name}-a`}>
                <div className="partner-logo-wrap">{p.icon}</div>
                <div className="partner-name">{p.name}</div>
                <div className="partner-type">{p.type}</div>
              </div>,
              <div className="partner-card" key={`${p.name}-b`}>
                <div className="partner-logo-wrap">{p.icon}</div>
                <div className="partner-name">{p.name}</div>
                <div className="partner-type">{p.type}</div>
              </div>,
            ])}
          </div>
        </div>
        <div style={{ marginTop: '2rem', textAlign: 'center' }} className="reveal">
          <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: '.88rem', fontWeight: 300, color: 'var(--muted)', marginBottom: '1.2rem' }}>Interested in partnering with Sofe Node?</p>
          <Link href="/ecosystem#community" className="btn-outline">Become an Ecosystem Partner &rarr;</Link>
        </div>
      </section>

      {/* ── CONTACT + FAQ ──────────────────────────────────────────────── */}
      <section id="contact-faq">
        <div className="section-tag">Get In Touch</div>
        <h2>Contact Us &amp; <em>FAQs</em></h2>
        <div className="cf-grid reveal">
          <div className="cf-card">
            <h3>Send Us a Message</h3>
            <p className="cf-sub">Have a question, partnership inquiry, or just want to say hello? We&apos;d love to hear from you.</p>
            <div className="cf-form-row">
              <input type="text" className="cf-input" placeholder="First Name" />
              <input type="text" className="cf-input" placeholder="Last Name" />
            </div>
            <input type="email" className="cf-input" style={{ width: '100%', marginBottom: '1rem' }} placeholder="Email Address" />
            <input type="text" className="cf-input" style={{ width: '100%', marginBottom: '1rem' }} placeholder="Subject" />
            <textarea className="cf-input" placeholder="Your message..." />
            <button className="btn-primary" style={{ width: '100%' }}>Send Message &rarr;</button>
          </div>

          <div className="cf-card">
            <h3>Frequently Asked Questions</h3>
            <p className="cf-sub">Quick answers to what we hear most often. Can&apos;t find yours? Send us a message.</p>
            {faqs.map((faq, i) => (
              <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
                <div className="faq-q" onClick={() => toggleFaq(i)}>
                  {faq.q}
                  <span className="faq-chevron">&#9660;</span>
                </div>
                <div className="faq-a">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
