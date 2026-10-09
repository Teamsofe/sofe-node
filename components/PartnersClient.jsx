'use client';
import Link from 'next/link';

const services = [
  {
    num: '01',
    title: 'Market Distribution Nodes',
    tag: 'User Acquisition & Retention',
    desc: 'Plug your product into our campus node networks for instant market penetration, liquidity, user adoption, and retention. We activate verified student ambassadors who become your first power users.',
    bullets: ['Campus activation across university nodes', 'Ambassador seeding & community retention', 'On-chain volume and wallet onboarding', 'Full campaign reporting & analytics'],
    cta: 'Book a Session',
    ctaHref: '/contact',
  },
  {
    num: '02',
    title: 'Sponsor Talent Validation',
    tag: 'Developer & Trader Pipeline',
    desc: 'We process raw talent through our bootcamps, outputting verified developers and traders ready for your ecosystem. Sponsor a cohort and get your brand in front of the next wave of African Web3 builders.',
    bullets: ['Custom-branded bootcamp cohorts', 'Curriculum includes your protocol/product', 'Verified developer & trader graduates', 'Talent pipeline for internships & roles'],
    cta: 'Contact Us Today',
    ctaHref: '/contact',
  },
  {
    num: '03',
    title: 'Sponsor a Bounty Programme',
    tag: 'Community Engagement',
    desc: 'Deploy bounties across our XP system and engage our community of 5,000+ active Sofians. From testing to content creation to trading competitions — our bounty board gets results.',
    bullets: ['XP-rewarded tasks drive real engagement', 'Targeted at your specific user type', 'Transparent on-chain reporting', 'Quick deployment — live within 72 hours'],
    cta: 'Launch a Bounty',
    ctaHref: '/contact',
  },
  {
    num: '04',
    title: 'Campus Activation',
    tag: 'IRL Events & Ambassador Network',
    desc: 'We provide nationwide campus meet-ups and ambassador activation through our network of campus nodes. Every activation is a direct pipeline to a new cohort of engaged users.',
    bullets: ['IRL events at 5+ active university chapters', 'Branded materials & on-site representation', 'Post-event community follow-up', 'Scalable to multiple campuses simultaneously'],
    cta: 'Select a Node',
    ctaHref: '/contact',
  },
  {
    num: '05',
    title: 'Sponsor Our Annual Conference (BCE)',
    tag: 'High-Visibility Event Sponsorship',
    desc: 'Get access to a high-value Web3 audience and visibility across all our node networks. The Blockchain Career Expo (BCE) is Africa\'s premier annual Web3 event.',
    bullets: ['500+ pre-qualified attendees', '20+ industry speakers', 'Exhibition floor & branded stage', 'Amplified across all node networks'],
    cta: 'See Event Pitch Deck',
    ctaHref: '/bce',
  },
  {
    num: '06',
    title: 'IT Services & Consultation',
    tag: 'Web2 / Web3 Development',
    desc: 'Empower your idea or brand with cutting-edge web2/web3 development and consulting. From smart contracts to full-stack dApps, our vetted Sofian developers are ready.',
    bullets: ['Smart contract development & auditing', 'Full-stack dApp development', 'Web2 website & product builds', 'Web3 strategy consulting'],
    cta: 'Get a Quote',
    ctaHref: '/contact',
  },
];

export default function PartnersClient() {
  return (
    <>
      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span className="breadcrumb-sep">›</span>
          <Link href="/services">Services</Link>
          <span className="breadcrumb-sep">›</span>
          <span>For Partners</span>
        </div>
        <div className="page-tag">B2B &middot; Partnership Services</div>
        <h1>Your Gateway to the<br /><em>African Web3 Market.</em></h1>
        <p className="sub">We don&rsquo;t just offer &ldquo;brand awareness.&rdquo; We deliver active users, on-chain volume, and deep market penetration through our university node network across Africa.</p>
        <div className="header-btns">
          <Link href="/signup?type=protocol" className="btn-primary" style={{ background: 'var(--blue)' }}>Sign Up as Ecosystem →</Link>
          <Link href="#cta-strip" className="btn-primary orange">Download Partnership Deck →</Link>
          <Link href="#services" className="btn-outline">View All Services ↓</Link>
        </div>
      </div>

      {/* ── CASE STUDY ──────────────────────────────────────────────── */}
      <section id="case-study" style={{ background: 'var(--deep)', paddingTop: '3rem', paddingBottom: '3rem' }}>
        <div className="section-tag">Proof of Work</div>
        <h2>The <em>CoinW &times; Sofe Node</em> Case Study</h2>
        <div className="cs-wrap reveal" style={{ marginTop: '2rem' }}>
          <div className="cs-inner">
            <div className="cs-left">
              <div className="cs-logo">CoinW</div>
              <div className="cs-subtitle">Exchange &times; Sofe Node &mdash; Nigeria, 2024</div>
              {[
                { label: 'The Challenge', text: 'CoinW Exchange needed to break into the highly competitive southeast Nigerian market.' },
                { label: 'The Sofe Solution', text: 'We deployed our full Market Distribution Node: targeted campus activation across key universities.' },
                { label: 'Strategy Deployed', text: '3 IRL Campus Activations · Trading Bootcamps · Ambassador Seeding · Community Retention' },
              ].map(({ label, text }) => (
                <div className="cs-block" key={label}>
                  <div className="cs-block-label">▪ {label}</div>
                  <p>{text}</p>
                </div>
              ))}
            </div>
            <div className="cs-right">
              <div className="cs-block-label" style={{ marginBottom: '1.2rem' }}>▪ The Results</div>
              <div className="cs-results-grid">
                {[
                  { num: '800+', lbl: 'New Active Users' },
                  { num: '$12M+', lbl: 'Trading Volume' },
                  { num: '$30K+', lbl: 'New Liquidity' },
                  { num: '100+', lbl: 'Traders Trained' },
                ].map(({ num, lbl }) => (
                  <div className="cs-result" key={lbl}>
                    <span className="r-num">{num}</span>
                    <div className="r-lbl">{lbl}</div>
                  </div>
                ))}
              </div>
              <div className="cs-retention">
                <span className="cs-retention-icon">🔗</span>
                <p>Sustained community engagement well beyond the activation period — users remained active traders months after the initial event.</p>
              </div>
              <div style={{ marginTop: '1.8rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontFamily: 'Poppins,sans-serif', fontSize: '.8rem', fontWeight: 300, color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.7 }}>Ready to replicate these results for your protocol in the African market?</p>
                <Link href="#cta-strip" className="btn-primary">Start a Partnership →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY SOFE NODE ───────────────────────────────────────────── */}
      <section id="why">
        <div className="section-tag">Why Partner With Us</div>
        <h2>The <em>Node</em> Difference</h2>
        <p className="body-text">Most marketing agencies sell you impressions. We sell you outcomes — verified users, on-chain volume, and a retained community that keeps engaging long after the campaign ends.</p>
        <div className="why-grid">
          {[
            { icon: '📈', title: 'Measurable Outcomes, Not Vanity Metrics', desc: 'Every engagement we run is measured in active wallets, trading volume, and user retention. We report what actually matters to your protocol.' },
            { icon: '🏫', title: 'University Node Network', desc: 'Our campus chapters across Nigeria give you direct access to the next generation of Web3 users — pre-qualified, educated, and ready to engage your ecosystem.' },
            { icon: '✅', title: 'Validated Talent Pipeline', desc: "We don't just onboard users. We train and verify them through our bootcamps — so you get developers and traders who actually understand your product." },
          ].map(({ icon, title, desc }) => (
            <div className="why-card reveal" key={title}>
              <div className="why-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES ────────────────────────────────────────────────── */}
      <section id="services">
        <div className="section-tag orange">Partnership Services</div>
        <h2>Six Ways to <em className="orange">Plug In</em></h2>
        <p className="body-text">Every service is designed around the &ldquo;node&rdquo; model — your brand connects to our network and value flows directly to your ecosystem.</p>
        <div className="services-list">
          {services.map(({ num, title, tag, desc, bullets, cta, ctaHref }) => (
            <div className="svc-card reveal" key={num}>
              <div className="svc-number">
                <span className="svc-num-text">{num}</span>
                <span className="svc-num-label">Service</span>
              </div>
              <div className="svc-body">
                <div className="svc-tag">{tag}</div>
                <h3 className="svc-title">{title}</h3>
                <p className="svc-desc">{desc}</p>
                <ul className="svc-bullets">
                  {bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>
              </div>
              <div className="svc-cta">
                <Link href={ctaHref} className="btn-outline">{cta} →</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────── */}
      <section id="how">
        <div className="section-tag">Process</div>
        <h2>How a Partnership <em>Works</em></h2>
        <div className="steps-grid reveal">
          {[
            { num: '01', icon: '📩', title: 'Reach Out', desc: 'Fill in the contact form or download the partnership deck. Our team responds within 48 hours.' },
            { num: '02', icon: '🤝', title: 'Discovery Call', desc: 'We learn about your goals — target users, regions, product type, budget — and design a custom node activation plan.' },
            { num: '03', icon: '📋', title: 'Proposal & Agreement', desc: 'We send a detailed proposal with expected outcomes, timelines, and pricing. Once agreed, we move fast.' },
            { num: '04', icon: '🚀', title: 'Activation', desc: 'Your campaign goes live across our node network. Campus ambassadors, bootcamps, bounties, or events — depending on your package.' },
            { num: '05', icon: '📊', title: 'Report & Retain', desc: 'We deliver a full impact report with verified metrics. Most partners choose to continue after seeing the results.' },
          ].map(({ num, icon, title, desc }) => (
            <div className="step-card" key={num}>
              <div className="step-num">{num}</div>
              <div className="step-icon">{icon}</div>
              <h4>{title}</h4>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA STRIP ───────────────────────────────────────────────── */}
      <div className="cta-strip" id="cta-strip">
        <div className="cta-strip-inner reveal">
          <div>
            <div className="cta-strip-tag">Ready to Enter Africa?</div>
            <h2>Start Your <em>Node Activation</em> Today.</h2>
            <p>Join the protocols already winning in Africa. 800+ users, $12M+ volume — one campaign.</p>
          </div>
          <div className="cta-strip-btns">
            <Link href="/signup?type=protocol" className="btn-primary" style={{ background: 'var(--blue)' }}>Sign Up as Ecosystem →</Link>
            <Link href="/contact" className="btn-primary orange">Book a Discovery Call →</Link>
            <Link href="/contact#deck" className="btn-outline">Download Partnership Deck</Link>
          </div>
        </div>
      </div>
    </>
  );
}
