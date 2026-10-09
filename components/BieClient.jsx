'use client';
import React from 'react';
import Link from 'next/link';

export default function BieClient() {
  return (
    <>
      





{/*  HERO  */}
<section id="hero">
  <div className="hero-content">
    <div className="hero-tag">Sofe Node &middot; A Sofe Group Company</div>
    <h1>Become a <em>Certified</em> <br/><em>Blockchain</em> Industrial Expert.</h1>
    <p className="hero-sub">A six-weeks intensive certification program designed for professionals ready to leverage blockchain to increase productivity, reduce costs, and build absolute trust in their industry.</p>
    <div className="hero-btns">
      <a href="./cbie-application.html?course=cbie" className="btn-primary">Apply Now</a>
      <a href="./about.html" className="btn-outline">About Us</a>
    </div>
  </div>
</section>

{/*  TRUST BAR  */}
<div id="trust">
  <div className="trust-inner">
    <div className="trust-label">Trusted by</div>
    <div className="trust-track">
      <div className="trust-scroll">
        {/*  Set 1  */}
        <div className="trust-item"><img src="./images/Partners/SofeNodeCoinW.png" alt="CoinW" /></div>
        <div className="trust-item"><img src="./images/Partners/SofeNodeRally.png" alt="Rally" /></div>
        <div className="trust-item"><img src="./images/Partners/SofeNodeCoinEx.png" alt="CoinEx" /></div>
        {/*  Set 2 — duplicate for seamless loop  */}
        <div className="trust-item"><img src="./images/Partners/SofeNodeCoinW.png" alt="CoinW" /></div>
        <div className="trust-item"><img src="./images/Partners/SofeNodeRally.png" alt="Rally" /></div>
        <div className="trust-item"><img src="./images/Partners/SofeNodeCoinEx.png" alt="CoinEx" /></div>
      </div>
    </div>
  </div>
</div>

{/*  CASE STUDY  */}
<section id="case-study">
  <div className="section-tag">The Opportunity</div>
  <h2>Don't Just Observe the Future. <em>Lead It.</em></h2>
  <p className="body-text">Blockchain is no longer a concept; it is the infrastructure transforming real estate, finance, supply chain, healthcare, and governance. To remain competitive, you cannot just know about it—you must know how to use it.</p>
  <div className="cs-grid reveal">
    <div className="cs-card">
      <div className="cs-logo">Program Overview</div>
      <div className="cs-title">Strategic, Industry-Specific, and Flexible.</div>
      <div className="cs-block">
        <h4>The Opportunity</h4>
        <p>Blockchain technology will disrupt traditional industry structures and create new opportunities for those who know how to help companies leverage it.</p>
      </div>
      <div className="cs-block">
        <h4>Our Solution</h4>
        <p>Bridge the gap between blockchain technical complexity and industrial application for professionals ready to drive real-world blockchain adoption in their industries..</p>
      </div>
      <div className="cs-results">
        <div className="cs-result"><span className="num">6 weeks</span><span className="lbl">A time-conscious, high-impact curriculum designed for busy professionals.</span></div>
        <div className="cs-result"><span className="num">Choose Your Pace</span><span className="lbl">Flexible learning with both Live Online and Self-Paced study options to fit your schedule.</span></div>
        <div className="cs-result"><span className="num">Real-World Capstone</span><span className="lbl">You will complete an Industry Specific Capstone Project solving a real problem in your specific field.</span></div>
        <div className="cs-result"><span className="num">Certification & Graduation</span><span className="lbl">Gain the prestigious "Blockchain Industrial Expert" certification and join our graduation ceremony.</span></div>
      </div>
    </div>
    <div className="cs-visual">
      <div className="network-visual">
        <div className="nv-node"><img src="./images/cbie.png" alt="cbie image" /></div>
       
      </div>
    </div>
  </div>
</section>

{/*  CTA STRIP  */}
<section id="cta-strip">
  <div className="section-tag orange" style={{"justifyContent":"center"}}>Your Next Step</div>
  <h2>Ready to lead Blockchain Applications<br/><em className="orange">in your Industry?</em></h2>
  <p>Seats in each cohort are limited. Join professionals globaly building the future in their industry.</p>
  <div className="cta-btns">
    <a href="./cbie-application.html?course=cbie" className="btn-primary orange">&#127891; Apply Now</a>
    <a href="./academy.html" className="btn-primary">Explore Other COurses &rarr;</a>
    <a href="./for-ecosystems.html" className="btn-outline">Are You a Brand? &rarr;</a>
  </div>
</section>

{/*  FOOTER  */}



{/*  Universal navbar  */}


    </>
  );
}
