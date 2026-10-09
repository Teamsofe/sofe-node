'use client';
import React from 'react';
import Link from 'next/link';

export default function BceClient() {
  return (
    <>
      





{/*  HERO  */}
<section className="bce-hero" id="bce-hero">
  <div className="bce-badge">🔥 Annual Flagship Event &middot; 2026 Edition</div>
  <h1 className="bce-h1">
    Blockchain<br /><em>Career</em> <span>Expo 2026</span><br />
  </h1>
  <p className="body-text" style={{"maxWidth":"580px","marginTop":"1.2rem"}}>
    Africa's premier Web3 career event. Keynotes, workshops, a live career fair, and protocol exhibitions
    — across our campus node networks. One day. Hundreds of opportunities.
  </p>
  <div className="countdown-wrap" id="countdown">
    <div className="cd-unit"><span className="cd-num" id="cd-days">--</span><span className="cd-label">Days</span></div>
    <div className="cd-unit"><span className="cd-num" id="cd-hours">--</span><span className="cd-label">Hours</span></div>
    <div className="cd-unit"><span className="cd-num" id="cd-mins">--</span><span className="cd-label">Minutes</span></div>
    <div className="cd-unit"><span className="cd-num" id="cd-secs">--</span><span className="cd-label">Seconds</span></div>
  </div>
  <div style={{"display":"flex","gap":"1rem","flexWrap":"wrap"}}>
    <a href="#tickets" className="btn-primary orange">Get Your Ticket</a>
    <a href="#schedule" className="btn-outline">View Schedule</a>
  </div>
  <p style={{"marginTop":"1rem","fontSize":".78rem","color":"var(--muted)"}}>📍 University of Nigeria, Nsukka &amp; Virtual &middot; November 2025</p>
</section>

{/*  STATS  */}
<div className="stats-wrap">
  <div className="stats-strip reveal">
    <div className="stat-cell"><span className="stat-num">1 Day</span><span className="stat-label">Conference</span></div>
    <div className="stat-cell"><span className="stat-num">2 Weeks</span><span className="stat-label">Dev, Trading And Content Hackathon</span></div>
    <div className="stat-cell"><span className="stat-num">2,000+</span><span className="stat-label">Expected Attendees</span></div>
    <div className="stat-cell"><span className="stat-num">20+</span><span className="stat-label">Protocol Exhibitors</span></div>
    <div className="stat-cell"><span className="stat-num">10+</span><span className="stat-label">Keynote Speakers</span></div>
    <div className="stat-cell"><span className="stat-num">5+</span><span className="stat-label">Node Participation</span></div>
  </div>
</div>

{/*  HIGHLIGHTS  */}
<section>
  <div className="section-tag orange-tag">Why Attend</div>
  <h2>One Day. <em className="orange">Unlimited</em> Opportunity.</h2>
  <div className="bce-highlights reveal">
    <div className="bce-hl-card">
      <div className="bce-hl-icon">🎤</div>
      <div className="bce-hl-num">10+</div>
      <div className="bce-hl-label">Keynote Speakers</div>
      <p className="body-text" style={{"fontSize":".82rem","marginTop":".8rem"}}>Industry leaders from Africa's top Web3 protocols, VCs, and developer ecosystems.</p>
    </div>
    <div className="bce-hl-card">
      <div className="bce-hl-icon">🏆</div>
      <div className="bce-hl-num">$3,000</div>
      <div className="bce-hl-label">Prize Pool</div>
      <p className="body-text" style={{"fontSize":".82rem","marginTop":".8rem"}}>Hackathon challenge with prizes for top Web3 builders, traders, and content creators.</p>
    </div>
    <div className="bce-hl-card">
      <div className="bce-hl-icon">💼</div>
      <div className="bce-hl-num">100+</div>
      <div className="bce-hl-label">Jobs Available</div>
      <p className="body-text" style={{"fontSize":".82rem","marginTop":".8rem"}}>Live career fair with global protocols actively hiring Web3 developers, marketers, and traders.</p>
    </div>
    <div className="bce-hl-card">
      <div className="bce-hl-icon">🛠️</div>
      <div className="bce-hl-num">5</div>
      <div className="bce-hl-label">Workshops</div>
      <p className="body-text" style={{"fontSize":".82rem","marginTop":".8rem"}}>Hands-on sessions: Smart contract dev, Tokenization, Web3 career strategy, Content Marketing, Crypto Trading.</p>
    </div>
    <div className="bce-hl-card">
      <div className="bce-hl-icon">🌍</div>
      <div className="bce-hl-num">5</div>
      <div className="bce-hl-label">Campus Nodes</div>
      <p className="body-text" style={{"fontSize":".82rem","marginTop":".8rem"}}>Node participation across UNN, UniJos, and 3 more campuses — plus a live-streamed virtual track.</p>
    </div>
    <div className="bce-hl-card">
      <div className="bce-hl-icon">🎓</div>
      <div className="bce-hl-num">FREE</div>
      <div className="bce-hl-label">Student Track</div>
      <p className="body-text" style={{"fontSize":".82rem","marginTop":".8rem"}}>Students with a valid .edu email attend the virtual track at zero cost. No excuses.</p>
    </div>
  </div>
</section>

{/*  SPONSORS  */}
<section>
  <div className="section-tag orange-tag">Our Event Sponsors</div>
  <h2>Powered By <em className="orange">Industry Leaders</em></h2>
  <p className="body-text" style={{"maxWidth":"540px","marginTop":".8rem"}}>These global protocols make the BCE possible — and are actively hiring at the career fair.</p>
  <div className="sponsors-grid reveal">
    <div className="sponsor-card" style={{"borderStyle":"dashed","cursor":"pointer"}} onClick="window.location='./contact.html'">
      <div style={{"fontSize":"1.2rem","marginBottom":".6rem"}}>🏅 TITLE SPONSOR</div>
      <div className="sponsor-name">$3,000</div>
      <div style={{"fontSize":".72rem","color":"var(--blue)","marginTop":".3rem"}}>Become a Sponsor →</div>
    </div>
    <div className="sponsor-card" style={{"borderStyle":"dashed","cursor":"pointer"}} onClick="window.location='./contact.html'">
      <div style={{"fontSize":"1.2rem","marginBottom":".6rem"}}>🏅GOLD SPONSOR</div>
      <div className="sponsor-name">$2,000</div>
      <div style={{"fontSize":".72rem","color":"var(--blue)","marginTop":".3rem"}}>Become a Sponsor →</div>
    </div>
    <div className="sponsor-card" style={{"borderStyle":"dashed","cursor":"pointer"}} onClick="window.location='./contact.html'">
      <div style={{"fontSize":"1.2rem","marginBottom":".6rem"}}>🥈SILVER SPONSOR</div>
      <div className="sponsor-name">$1,500</div>
      <div style={{"fontSize":".72rem","color":"var(--blue)","marginTop":".3rem"}}>Become a Sponsor →</div>
    </div>
    <div className="sponsor-card" style={{"borderStyle":"dashed","cursor":"pointer"}} onClick="window.location='./contact.html'">
      <div style={{"fontSize":"1.2rem","marginBottom":".6rem"}}>🥈BRONZE SPONSOR</div>
      <div className="sponsor-name">$1,000</div>
      <div style={{"fontSize":".72rem","color":"var(--blue)","marginTop":".3rem"}}>Become a Sponsor →</div>
    </div>
  </div>
  <div>
  <div className="section-tag orange-tag"></div>
  <h3 style={{"fontSize":"1.2rem"}}> Sponsor a <em className="orange">Two Weeks Hackathon</em> </h3>
  <p className="body-text" style={{"maxWidth":"540px","marginTop":".8rem"}}>Acquire high quality products, users, volume and marketing across our Hakathon Tracks</p>
  <div className="sponsors-grid reveal">
    <div className="sponsor-card" style={{"borderStyle":"dashed","cursor":"pointer"}} onClick="window.location='./contact.html'">
      <div style={{"fontSize":"1.2rem","marginBottom":".6rem"}}>💻 DEV. HACKATHON</div>
      <div className="sponsor-name">$2,000</div>
      <div style={{"fontSize":".72rem","color":"var(--blue)","marginTop":".3rem"}}>Become a Sponsor →</div>
    </div>
    <div className="sponsor-card" style={{"borderStyle":"dashed","cursor":"pointer"}} onClick="window.location='./contact.html'">
      <div style={{"fontSize":"1.2rem","marginBottom":".6rem"}}>📈TRADING HACKATHON</div>
      <div className="sponsor-name">$2,000</div>
      <div style={{"fontSize":".72rem","color":"var(--blue)","marginTop":".3rem"}}>Become a Sponsor →</div>
    </div>
    <div className="sponsor-card" style={{"borderStyle":"dashed","cursor":"pointer"}} onClick="window.location='./contact.html'">
      <div style={{"fontSize":"1.2rem","marginBottom":".6rem"}}>🎮GAMING HACKATHON</div>
      <div className="sponsor-name">$1,500</div>
      <div style={{"fontSize":".72rem","color":"var(--blue)","marginTop":".3rem"}}>Become a Sponsor →</div>
    </div>
    <div className="sponsor-card" style={{"borderStyle":"dashed","cursor":"pointer"}} onClick="window.location='./contact.html'">
      <div style={{"fontSize":"1.2rem","marginBottom":".6rem"}}>🎥CONTENT CREATION HACKATHON</div>
      <div className="sponsor-name">$1,500</div>
      <div style={{"fontSize":".72rem","color":"var(--blue)","marginTop":".3rem"}}>Become a Sponsor →</div>
    </div>
  </div>
  </div>
</section>

{/*  TICKETS  */}
<section id="tickets" style={{"background":"var(--deep)"}}>
  <div className="section-tag">Attend the BCE</div>
  <h2>Get Your <em>Ticket</em></h2>
  <p className="body-text" style={{"maxWidth":"540px","marginTop":".8rem"}}>Spaces are limited at physical locations. Secure your spot now.</p>
  <div className="ticket-grid reveal">
    <div className="ticket-card">
      <div className="ticket-tier">Virtual & Physical</div>
      <div className="ticket-price">Free <span>/ general</span></div>
      <div className="ticket-desc">Full virtual/physical access. Learn from every session, live.</div>
      <ul className="ticket-perks">
        <li>All keynote livestreams</li>
        <li>Virtual networking rooms</li>
        <li>Access to career fair &amp; booths</li>
        <li>Access to all workshop replays</li>
        <li>Digital attendance certificate</li>
      </ul>
      <a href="#" className="btn-outline" style={{"width":"100%","textAlign":"center","display":"block"}}>Register Free</a>
    </div>
    <div className="ticket-card featured">
      <div className="ticket-tier">In-Person</div>
      <div className="ticket-price">₦10,000 <span>/ professional</span></div>
      <div className="ticket-desc">Front Role physical access at your nearest node campus. The real experience.</div>
      <ul className="ticket-perks">
        <li>All keynotes &amp; panels (physical)</li>
        <li>All 6 workshops</li>
        <li>Lunch &amp; networking breakfast</li>
        <li>Access to replays of all sessions</li>
        <li>Physical certificate &amp; welcome pack</li>
      </ul>
      <a href="#" className="btn-primary orange" style={{"width":"100%","textAlign":"center","display":"block"}}>Get Ticket — ₦5,000</a>
    </div>
    <div className="ticket-card">
      <div className="ticket-tier">VIP / Corporate</div>
      <div className="ticket-price">₦30,000 <span>/ VIP</span></div>
      <div className="ticket-desc">Premium access for professionals, protocol reps, and hiring managers.</div>
      <ul className="ticket-perks">
        <li>Everything in In-Person</li>
        <li>VIP front-row seating</li>
        <li>Private 1:1 speaker meetings</li>
        <li>Protocol recruitment lounge access</li>
        <li>Post-event speaker dinner</li>
      </ul>
      <a href="/contact" className="btn-outline" style={{"width":"100%","textAlign":"center","display":"block"}}>Apply for VIP</a>
    </div>
  </div>
</section>

{/*  CTA  */}
<section style={{"textAlign":"center"}}>
  <div style={{"maxWidth":"640px","margin":"0 auto"}} className="reveal">
    <div className="section-tag orange-tag" style={{"justifyContent":"center"}}>Sponsor the BCE</div>
    <h2>Get Your Brand In Front of<br /><em className="orange">Africa's Top Web3 Talent.</em></h2>
    <p className="body-text" style={{"maxWidth":"480px","margin":"1rem auto 2rem"}}>
      The BCE is your direct access to 500+ verified Web3 professionals, students, and campus communities
      across Nigeria. Download our event pitch deck or contact us directly.
    </p>
    <div style={{"display":"flex","gap":"1rem","justifyContent":"center","flexWrap":"wrap"}}>
      <a href="#" className="btn-primary orange">Download Event Pitch Deck</a>
      <a href="./contact.html" className="btn-outline">Contact Us</a>
    </div>
  </div>
</section>







    </>
  );
}
