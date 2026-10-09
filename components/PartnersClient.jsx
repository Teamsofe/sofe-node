'use client';
import React from 'react';
import Link from 'next/link';

export default function PartnersClient() {
  return (
    <>
      





{/*  PAGE HEADER  */}
<div className="page-header">
  <div className="breadcrumb">
    <a href="./">Home</a>
    <span className="breadcrumb-sep">&#8250;</span>
    <a href="/services">Services</a>
    <span className="breadcrumb-sep">&#8250;</span>
    <span>For Ecosystems</span>
  </div>
  <div className="page-tag">B2B &middot; Ecosystem Services</div>
  <h1>Your Gateway to the<br/><em>African Web3 Market.</em></h1>
  <p className="sub">We don&rsquo;t just offer &ldquo;brand awareness.&rdquo; We deliver active users, on-chain volume, and deep market penetration through our university node network across Africa.</p>
  <div className="header-btns">
    <a href="https://drive.google.com/drive/folders/1N4a3Wy3-1Vjx9sz7Gqdqqm7Cz75oC5R3?usp=sharing" target="_blank" className="btn-primary orange">View Pitch Deck &rarr;</a>
    <a href="#services" className="btn-outline">View All Services &darr;</a>
  </div>
</div>

{/*  CASE STUDY — Proof of Work, immediately after hero  */}
<section id="case-study" style={{"background":"var(--deep)","paddingTop":"3rem","paddingBottom":"3rem"}}>
  <div className="section-tag">Proof of Work</div>
  <h2>The <em>CoinW &times; Sofe Node</em> Case Study</h2>
  <div className="cs-wrap reveal" style={{"marginTop":"2rem"}}>
    <div className="cs-inner">
      <div className="cs-left">
        <div className="cs-logo">CoinW</div>
        <div className="cs-subtitle">Exchange &times; Sofe Node &mdash; Nigeria, 2024</div>
        <div className="cs-block">
          <div className="cs-block-label">&#9632; The Challenge</div>
          <p>CoinW Exchange needed to break into the highly competitive southeast Nigerian market.</p>
        </div>
        <div className="cs-block">
          <div className="cs-block-label">&#9632; The Sofe Solution</div>
          <p>We deployed our full Market Distribution Node: targeted campus activation across key universities.</p>
        </div>
        <div className="cs-block" style={{"marginBottom":"0"}}>
          <div className="cs-block-label">&#9632; Strategy Deployed</div>
          <p>3 IRL Campus Activation &bull; Trading Bootcamps &bull; Ambassador Seeding &bull; Community Retention</p>
        </div>
      </div>
      <div className="cs-right">
        <div className="cs-block-label" style={{"marginBottom":"1.2rem"}}>&#9632; The Results</div>
        <div className="cs-results-grid">
          <div className="cs-result"><span className="r-num">800+</span><div className="r-lbl">New Active Users</div></div>
          <div className="cs-result"><span className="r-num">$12M+</span><div className="r-lbl">Trading Volume</div></div>
          <div className="cs-result"><span className="r-num">$30K+</span><div className="r-lbl">New Liquidity</div></div>
          <div className="cs-result"><span className="r-num">100+</span><div className="r-lbl">Traders Trained</div></div>
        </div>
        <div className="cs-retention">
          <span className="cs-retention-icon">&#128279;</span>
          <p>Sustained community engagement well beyond the activation period &mdash; users remained active traders months after the initial event.</p>
        </div>
        <div style={{"marginTop":"1.8rem","paddingTop":"1.5rem","borderTop":"1px solid var(--border)"}}>
          <p style={{"fontFamily":"'Poppins',sans-serif","fontSize":".8rem","fontWeight":"300","color":"var(--muted)","marginBottom":"1rem","lineHeight":"1.7"}}>Ready to replicate these results for your protocol in the African market?</p>
          <a href="#cta-strip" className="btn-primary">Integrate The Sofe Node &rarr;</a>
        </div>
      </div>
    </div>
  </div>
</section>

{/*  WHY SOFE NODE  */}
<section id="why">
  <div className="section-tag">Why Choose Us</div>
  <h2>The <em>Node</em> Difference</h2>
  <p className="body-text">Most marketing agencies sell you impressions. We sell you outcomes &mdash; verified users, on-chain volume, and a retained community that keeps engaging long after the campaign ends.</p>
  <div className="why-grid">
    <div className="why-card reveal">
      <div className="why-icon">&#128200;</div>
      <h3>Measurable Outcomes, Not Vanity Metrics</h3>
      <p>Every engagement we run is measured in active wallets, trading volume, and user retention. We report what actually matters to your protocol.</p>
    </div>
    <div className="why-card reveal">
      <div className="why-icon">&#127979;</div>
      <h3>University Node Network</h3>
      <p>Our campus chapters across Nigeria give you direct access to the next generation of Web3 users &mdash; pre-qualified, educated, and ready to engage your ecosystem.</p>
    </div>
    <div className="why-card reveal">
      <div className="why-icon">&#9989;</div>
      <h3>Validated Talent Pipeline</h3>
      <p>We don&rsquo;t just onboard users. We train and verify them through our bootcamps &mdash; so you get developers and traders who actually understand your product.</p>
    </div>
  </div>
</section>

{/*  SERVICES  */}
<section id="services">
  <div className="section-tag orange">Ecosystem Services</div>
  <h2>Six Ways to <em className="orange">Plug In</em></h2>
  <p className="body-text">Every service is designed around the &ldquo;node&rdquo; model &mdash; your brand connects to our network and value flows directly to your ecosystem.</p>

  <div className="services-list">

    {/*  Service 1  */}
    <div className="svc-card reveal">
      <div className="svc-number">
        <span className="svc-num-text">01</span>
        <span className="svc-num-label">Service</span>
      </div>
      <div className="svc-body">
        <span className="svc-badge">Distribution</span>
        <h3>Ecosystem Distribution</h3>
        <p>Plug your product into our node networks for instant market penetration, liquidity, user adoption, and retention. We activate our full campus and community network around your protocol &mdash; creating real demand, not just awareness.</p>
        <div className="svc-features">
          <span className="svc-feat">Campus Campaigns</span>
          <span className="svc-feat">Trading Challenges</span>
          <span className="svc-feat">Community Building</span>
          <span className="svc-feat">On-chain Volume</span>
          <span className="svc-feat">Retention Programs</span>
        </div>
      </div>
      <div className="svc-cta">
        <a href="./contact.html">Contact Us &rarr;</a>
      </div>
    </div>

    {/*  Service 2  */}
    <div className="svc-card reveal">
      <div className="svc-number">
        <span className="svc-num-text">02</span>
        <span className="svc-num-label">Service</span>
      </div>
      <div className="svc-body">
        <span className="svc-badge">Talent</span>
        <h3>Talent Validation</h3>
        <p>We process raw talent through our bootcamps and certification programs to ptoduce professionals which can be tailored for your ecosystem. Sponsor a cohort and get a pipeline of trained, vetted professionals who are already familiar with your product category.</p>
        <div className="svc-features">
          <span className="svc-feat">Bootcamp Sponsorship</span>
          <span className="svc-feat">Branded Certification</span>
          <span className="svc-feat">Talent Pipeline</span>
          <span className="svc-feat">Developer Training</span>
          <span className="svc-feat">Ecosystem Readiness</span>
        </div>
      </div>
      <div className="svc-cta">
        <a href="./contact.html">Contact Us &rarr;</a>
      </div>
    </div>

    {/*  Service 3 — NEW: Sponsor a Bounty  */}
    <div className="svc-card reveal">
      <div className="svc-number">
        <span className="svc-num-text">03</span>
        <span className="svc-num-label">Service</span>
      </div>
      <div className="svc-body">
        <span className="svc-badge" style={{"background":"rgba(245,166,35,0.15)","color":"#F5A623","borderColor":"rgba(245,166,35,0.3)"}}>Bounty</span>
        <h3>Sponsor a Bounty</h3>
        <p>Post real, paid tasks directly to our credentialed community of Sofians. You define the objective, reward, and skill requirement &mdash; we handle distribution, vetting, and delivery. Access a pool of verified African Web3 talent motivated to do great work for your protocol.</p>
        <div className="svc-features">
          <span className="svc-feat">Skill-Gated Access</span>
          <span className="svc-feat">XP-Weighted Selection</span>
          <span className="svc-feat">Verified Submissions</span>
          <span className="svc-feat">Custom Reward Structure</span>
          <span className="svc-feat">Protocol-Confirmed Output</span>
        </div>
        <div style={{"marginTop":"1rem","padding":".75rem 1rem","background":"var(--blue-dim)","border":"1px solid var(--border)","borderRadius":"6px"}}>
          <p style={{"fontFamily":"'Poppins',sans-serif","fontSize":".75rem","fontWeight":"300","color":"var(--muted)","lineHeight":"1.6","margin":"0"}}>
            &#128161; Inspired by the <strong style={{"color":"var(--white)"}}>Superteam model</strong> &mdash; bounties are gated by Foundation certification and weighted by Monthly XP, ensuring only your most engaged talent get the opportunity to submit.
          </p>
        </div>
      </div>
      <div className="svc-cta">
        <a href="./contact.html">Post a Bounty &rarr;</a>
      </div>
    </div>

    {/*  Service 4  */}
    <div className="svc-card reveal">
      <div className="svc-number">
        <span className="svc-num-text">04</span>
        <span className="svc-num-label">Service</span>
      </div>
      <div className="svc-body">
        <span className="svc-badge">Activation</span>
        <h3>Campus Activation</h3>
        <p>We provide nationwide campus meet-ups and ambassador activation through our network of campus nodes. Your brand is presented in-person at universities across Nigeria by our trained ambassadors who are already trusted voices in their communities.</p>
        <div className="svc-features">
          <span className="svc-feat">University Meet-ups</span>
          <span className="svc-feat">Ambassador Program</span>
          <span className="svc-feat">Nationwide Coverage</span>
          <span className="svc-feat">IRL Events</span>
          <span className="svc-feat">Demo Days</span>
        </div>
      </div>
      <div className="svc-cta">
        <a href="./contact.html">Select a Node &rarr;</a>
      </div>
    </div>

    {/*  Service 5  */}
    <div className="svc-card reveal">
      <div className="svc-number">
        <span className="svc-num-text">05</span>
        <span className="svc-num-label">Service</span>
      </div>
      <div className="svc-body">
        <span className="svc-badge">Conference</span>
        <h3>Strategic Visibility - Annual BCE Conference</h3>
        <p>Get access to a high-value audience and visibility across all our node networks for your brand, product, or services. The Blockchain Career Expo is Africa&rsquo;s premier Web3 talent and Ecosystem event, with 500+ attendees, 20+ speakers, and full media coverage.</p>
        <div className="svc-features">
          <span className="svc-feat">Stage Presence</span>
          <span className="svc-feat">Exhibition Floor</span>
          <span className="svc-feat">Branded Sessions</span>
          <span className="svc-feat">500+ Attendees</span>
          <span className="svc-feat">Full Media Pack</span>
        </div>
      </div>
      <div className="svc-cta">
        <a href="./bce.html" className="orange">See Event Deck &rarr;</a>
      </div>
    </div>

    {/*  Service 6  */}
    <div className="svc-card reveal">
      <div className="svc-number">
        <span className="svc-num-text">06</span>
        <span className="svc-num-label">Service</span>
      </div>
      <div className="svc-body">
        <span className="svc-badge">Technology</span>
        <h3>Technical Support &amp; Consultation</h3>
        <p>Empower your idea or brand with cutting-edge Web2/Web3 development and consulting. From smart contract development to full-stack dApp builds, our technical team delivers production-ready solutions tailored for African market conditions.</p>
        <div className="svc-features">
          <span className="svc-feat">Smart Contracts</span>
          <span className="svc-feat">dApp Development</span>
          <span className="svc-feat">Web3 Consulting</span>
          <span className="svc-feat">Web2 Integration</span>
          <span className="svc-feat">Technical Audits</span>
        </div>
      </div>
      <div className="svc-cta">
        <a href="./contact.html">Book a Session &rarr;</a>
      </div>
    </div>

  </div>
</section>

{/*  HOW IT WORKS  */}
<section id="how">
  <div className="section-tag">The Process</div>
  <h2>From <em>Discovery</em> to <em>Results</em></h2>
  <p className="body-text">Our service process is built for speed and precision. Most activations go from first contact to live campaign within four weeks.</p>
  <div className="steps-grid reveal">
    <div className="step">
      <span className="step-number">01</span>
      <div className="step-dot">&#128172;</div>
      <h4>Discovery Call</h4>
      <p>We learn your goals, target user profile, budget, and timeline. We map the best service combination for your objectives.</p>
    </div>
    <div className="step">
      <span className="step-number">02</span>
      <div className="step-dot">&#128196;</div>
      <h4>Custom Strategy</h4>
      <p>We build a tailored activation plan &mdash; selecting the right campus nodes, content format, incentive structure, and KPIs.</p>
    </div>
    <div className="step">
      <span className="step-number">03</span>
      <div className="step-dot">&#128293;</div>
      <h4>Node Activation</h4>
      <p>We deploy across our campus network. Ambassadors, bootcamps, events, and digital campaigns run simultaneously.</p>
    </div>
    <div className="step">
      <span className="step-number">04</span>
      <div className="step-dot">&#128202;</div>
      <h4>Results &amp; Reporting</h4>
      <p>You receive a full post-campaign report: users acquired, volume generated, retention rates, and community growth metrics.</p>
    </div>
  </div>
</section>

{/*  CTA STRIP  */}
<section id="cta-strip">
  <div className="section-tag orange" style={{"justifyContent":"center"}}>Ready to Scale in Africa?</div>
  <h2>Let&rsquo;s Build Your <em className="orange">African Node.</em></h2>
  <p>Whether you&rsquo;re looking for your first 1,000 African users or you&rsquo;re ready to go nationwide, we have the network, the tools, and the track record to deliver.</p>
  <div className="cta-btns">
    <a href="https://drive.google.com/drive/folders/1N4a3Wy3-1Vjx9sz7Gqdqqm7Cz75oC5R3?usp=sharing" target="_blank" className="btn-primary orange">&#128196; View Pitch Deck</a>
    <a href="https://calendar.app.google/QPKfrcGkVH7VoQfu6" target="_blank" className="btn-primary">Book a Discovery Call &rarr;</a>
    <a href="./contact.html" className="btn-outline">CONTACT US TODAY &rarr;</a>
  </div>
</section>

{/*  FOOTER  */}





    </>
  );
}
