'use client';
import React from 'react';
import Link from 'next/link';

export default function TalentClient() {
  return (
    <>
      





{/*  PAGE HEADER  */}
<div className="page-header">
  <div className="breadcrumb">
    <a href="./">Home</a>
    <span className="breadcrumb-sep">&#8250;</span>
    <a href="./services">Services</a>
    <span className="breadcrumb-sep">&#8250;</span>
    <span>For Talent</span>
  </div>
  <div className="page-tag">B2C &middot; Education &amp; Careers</div>
  <h1>Don&rsquo;t Just Learn Crypto.<br/><em>Master It. Earn From It.</em></h1>
  <p className="sub">High-quality blockchain education, heavily subsidised by global ecosystem partners. Learn industry-standard skills, earn commissions referring friends, and launch your Web3 career &mdash; all from Africa.</p>
  <div className="header-btns">
    <a href="#courses" className="btn-primary orange">Join the Next Cohort &rarr;</a>
    <a href="#affiliate" className="btn-outline">Earn While You Learn &darr;</a>
  </div>
</div>

{/*  PROOF BAR  */}
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

{/*  COURSES  */}
<section id="courses" style={{"background":"var(--black)"}}>
  <div className="section-tag">Our Programmes</div>
  <h2>Two Paths.<br/><em>One Destination.</em></h2>
  <p className="body-text">Whether you&rsquo;re a complete beginner or ready to go professional, we have a structured programme designed to take you from where you are to where the opportunity is.</p>

  <div className="courses-grid">

    {/*  Course 1  */}
    <div className="course-card reveal">
      <span className="course-badge">Most Popular</span>
      <div className="course-card-top">
        <div className="course-level beginner">&#128312; Beginner &rarr; Intermediate &nbsp;<span style={{"color":"var(--orange)","fontWeight":"800"}}>(70% 0FF)</span></div>
        <h3>Blockchain &amp; Cryptocurrency Bootcamp</h3>
        <p>From newbie to intermediate — get a solid foundation on how to position and profit from blockchain and crypto from day one. No prior experience needed.</p>
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
        <div className="dual-cta">
          <a href="./academy.html" className="btn-outline" style={{"flex":"1","textAlign":"center"}}>Enrol Self-Paced</a>
          <a href="./academy.html" className="btn-primary orange" style={{"flex":"1","textAlign":"center"}}>Join Live Cohort &rarr;</a>
        </div>
      </div>
    </div>

    {/*  Course 2  */}
    <div className="course-card reveal">
      <span className="course-badge" style={{"background":"var(--blue)"}}>Professional</span>
      <div className="course-card-top">
        <div className="course-level professional">&#128188; Professional Track</div>
        <h3>Certified Blockchain Professional</h3>
        <p>Join the next generation of blockchain professionals through our career training programme, internship placement, and startup accelerator. Choose your specialisation track and go deep.</p>
      </div>
      <div className="course-card-body">
        <div className="track-table-label">Select Your Track &mdash; Core Focus</div>
        <div className="track-table">
          <div className="track-row">
            <div className="track-name">&#128187; Development</div>
            <div className="track-desc">Web, Mobile App &amp; Smart Contract Architecture (Solana/Rust &amp; EVM/Solidity)</div>
          </div>
          <div className="track-row">
            <div className="track-name">&#128202; Data Analysis</div>
            <div className="track-desc">AI & Automation, Prompt Engineering for Web3 workflows &amp; productivity</div>
          </div>
          <div className="track-row">
            <div className="track-name">&#129302; AI & Automation</div>
            <div className="track-desc">On-chain forensic analysis, Dune Analytics &amp; SQL for Web3 decision-making</div>
          </div>
          <div className="track-row">
            <div className="track-name">&#127912; Product &amp; Design</div>
            <div className="track-desc">Web3 UI/UX (Figma), Product Design &amp; dApp user-journey mapping</div>
          </div>
          <div className="track-row">
            <div className="track-name">&#128203; Management</div>
            <div className="track-desc">Web3 Project Management (Agile/Scrum), DAO Governance &amp; Tokenomics Strategy</div>
          </div>
          <div className="track-row" style={{"borderBottom":"none"}}>
            <div className="track-name">&#128227; Growth &amp; Media</div>
            <div className="track-desc">Content Creation, Digital Marketing (KOL/Ambassador Management) &amp; Community Building</div>
          </div>
        </div>
        <div className="course-meta" style={{"marginTop":"1.4rem"}}>
          <div className="course-meta-item"><span className="icon">&#128197;</span> 3–4 Months</div>
          <div className="course-meta-item"><span className="icon">&#127760;</span> Virtual</div>
          <div className="course-meta-item"><span className="icon">&#128188;</span> Internship Track</div>
          <div className="course-meta-item"><span className="icon">&#128640;</span> Accelerator Access</div>
        </div>
        <div className="cert-note">
          &#128279; Certificate verifiable on the blockchain &mdash; shareable directly to LinkedIn
        </div>
        {/*  LOCKED CTA — unlocks after Foundation cert  */}
        <div className="locked-cta">
          <div className="locked-cta-inner">
            <span>&#128274;</span>
            <p>Complete the <strong>Blockchain &amp; Cryptocurrency Bootcamp</strong> to enrol</p>
            <a href="academy.html" className="btn-primary orange">Start Bootcamp &rarr;</a>
          </div>
        </div>
      </div>
    </div>

  </div>
</section>

{/*  AFFILIATE / EARN  */}
<section id="affiliate">
  <div className="section-tag orange">The Sofian Partner Programme</div>
  <h2>Sponsor Your Own<br/><em className="orange">Education.</em></h2>

  <div className="affiliate-grid">
    <div className="reveal">
      <p className="body-text" style={{"marginBottom":"2rem"}}>Refer friends, earn cash commissions, and fund your own education while you study. Your referral link unlocks the moment you complete the Blockchain Basics course — ensuring every Sofian who earns, also knows what they&rsquo;re sharing.</p>

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
            <h4>Level 2 &mdash; Affiiate</h4>
            <p>Refer 10 people who complete the Foundation Course and enrol in at least one Career Track course. Commission rate doubles automatically once the milestone is reached.</p>
          </div>
          <div className="level-pct">10%</div>
        </div>

        <div className="level-card l2-card reveal">
          <div className="level-badge l2">&#127894;</div>
          <div className="level-info">
            <h4>Level 3 &mdash; Ambassador</h4>
            <p>Grow as an affilate <strong>to be recommended to represent Sofe Node in your local community.</strong> Our ambassadors are the face of Sofe Node &mdash; leading activations for talent, market entry &amp;distribution campaigns. Earn 10% on direct referrals and 5% on indirect</p>
          </div>
          <div className="level-pct">15%</div>
        </div>
      </div>

      <div style={{"marginTop":"1.6rem","padding":"1.2rem 1.4rem","background":"var(--blue-dim)","border":"1px solid var(--border)","borderRadius":"6px"}}>
        <p style={{"fontFamily":"'Poppins',sans-serif","fontSize":".82rem","fontWeight":"500","color":"var(--white)","marginBottom":".3rem"}}>&#128176; Payouts direct to your Nigerian bank</p>
        <p style={{"fontFamily":"'Poppins',sans-serif","fontSize":".78rem","fontWeight":"300","color":"var(--muted)"}}>Commissions are only paid on professional courses via Paystack &amp; Flutterwave — straight to your bank account, no crypto wallet needed.</p>
      </div>
    </div>

    {/*  Live mock widget  */}
    <div className="affiliate-visual reveal">
      <div style={{"fontFamily":"'Poppins',sans-serif","fontSize":".6rem","fontWeight":"700","letterSpacing":".12em","textTransform":"uppercase","color":"var(--muted)","marginBottom":"1.2rem"}}>Your Affiliate Dashboard Preview</div>
      <div className="aff-stat-row">
        <div className="aff-stat"><span className="num">45</span><span className="lbl">Link Clicks</span></div>
        <div className="aff-stat"><span className="num">3</span><span className="lbl">Signups</span></div>
        <div className="aff-stat"><span className="num">&#8358;15K</span><span className="lbl">Earned</span></div>
      </div>
      <div style={{"fontFamily":"'Poppins',sans-serif","fontSize":".7rem","fontWeight":"600","letterSpacing":".06em","textTransform":"uppercase","color":"var(--muted)","marginBottom":".7rem"}}>Your Referral Link</div>
      <div className="aff-ref-box">
        <span className="aff-ref-url">sofenode.com/ref/yourname</span>
        <button className="aff-copy-btn" onClick="this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',1500)">Copy</button>
      </div>
      <div className="aff-hook">&#127881; Refer your friends to unlock discounts and giveaways</div>
      <div style={{"marginTop":"1.4rem","paddingTop":"1.2rem","borderTop":"1px solid var(--border)"}}>
        <a href="signup.html" className="btn-primary orange" style={{"width":"100%","textAlign":"center","display":"block"}}>Create Free Account &rarr;</a>
      </div>
    </div>
  </div>
</section>

{/*  XP SYSTEM PREVIEW  */}
<section id="xp">
  <div className="section-tag orange">XP &amp; Reputation</div>
  <h2>Earn Your Rank.<br/><em>Unlock Your Rewards.</em></h2>
  <p className="body-text">XP is earned across every action on the platform. Your score determines your tier, your bounty access, and your share of partner airdrops and Sofe Node token rewards.</p>

  <div className="xp-grid">
    {/*  Left: earning actions  */}
    <div className="reveal">
      <div className="section-tag" style={{"marginBottom":"1rem"}}>How You Earn XP</div>

      <div style={{"fontFamily":"'Poppins',sans-serif","fontSize":".58rem","fontWeight":"700","letterSpacing":".12em","textTransform":"uppercase","color":"var(--muted)","marginBottom":".6rem","display":"flex","gap":"1rem","padding":"0 1.2rem"}}>
        <span style={{"flex":"1"}}>Action</span>
        <span>XP</span>
        <span style={{"width":"60px","textAlign":"right"}}>Track</span>
      </div>

      <div className="xp-actions">
        <div className="xp-action-row">
          <div className="xp-action-label"><strong>Complete Foundation Course &amp; pass exam</strong></div>
          <div className="xp-pts">500 XP</div>
          <span className="xp-track-tag total">Automatically + Total</span>
        </div>
        <div className="xp-action-row">
          <div className="xp-action-label"><strong>Connect wallet to account</strong></div>
          <div className="xp-pts">10 XP</div>
          <span className="xp-track-tag total">Total</span>
        </div>
        <div className="xp-action-row">
          <div className="xp-action-label"><strong>Earn a Career Track Certificate</strong> <em style={{"fontSize":".72rem"}}>(per cert)</em></div>
          <div className="xp-pts">100 XP</div>
          <span className="xp-track-tag total">Automatically + Total</span>
        </div>
        <div className="xp-action-row">
          <div className="xp-action-label"><strong>Referral signs up</strong> (after email verification)</div>
          <div className="xp-pts">5 XP</div>
          <span className="xp-track-tag both">Automatically + Total</span>
        </div>
        <div className="xp-action-row">
          <div className="xp-action-label"><strong>Referral completes Foundation Course</strong></div>
          <div className="xp-pts">20 XP</div>
          <span className="xp-track-tag both">Automatically + Total</span>
        </div>
        <div className="xp-action-row">
          <div className="xp-action-label"><strong>Referral completes a Career Track cert</strong></div>
          <div className="xp-pts">30 XP</div>
          <span className="xp-track-tag both">Automatically + Total</span>
        </div>
        <div className="xp-action-row">
          <div className="xp-action-label"><strong>Attend an AMA on Telegram (Awarded by Admin)</strong></div>
          <div className="xp-pts">10 - 20 XP</div>
          <span className="xp-track-tag both">Weekly + Total</span>
        </div>
         <div className="xp-action-row">
          <div className="xp-action-label"><strong>Attend Sofe Node Sponsored/Partner IRL Event (Awarded by Admin)</strong></div>
          <div className="xp-pts">30 XP</div>
          <span className="xp-track-tag both">periodically + Total</span>
        </div>
        <div className="xp-action-row">
          <div className="xp-action-label"><strong>Win a weekly quiz (Awarded by Admin)</strong></div>
          <div className="xp-pts">10 XP</div>
          <span className="xp-track-tag both">Weekly + Total</span>
        </div>
        <div className="xp-action-row">
          <div className="xp-action-label"><strong>Win a bounty</strong> (confirmed by protocol)</div>
          <div className="xp-pts">50 - 20 XP</div>
          <span className="xp-track-tag both">periodically + Total</span>
        </div>
      </div>

      <div style={{"marginTop":"1.4rem","padding":"1rem 1.2rem","background":"var(--blue-dim)","border":"1px solid var(--border)","borderRadius":"6px"}}>
        <p style={{"fontFamily":"'Poppins',sans-serif","fontSize":".78rem","fontWeight":"300","color":"var(--muted)","lineHeight":"1.65"}}>
          &#9432; XP has two tracks: <strong style={{"color":"var(--white)"}}>Total XP</strong> (never resets — determines your lifetime tier &amp; airdrop allocation) and <strong style={{"color":"var(--white)"}}>Monthly XP</strong> (resets 1st of each month — determines bounty selection priority &amp; monthly leaderboard).
        </p>
      </div>
    </div>

    {/*  Right: tier ladder  */}
    <div className="reveal">
      <div className="section-tag" style={{"marginBottom":"1rem"}}>XP Tiers</div>
      <div className="xp-tiers">
        <div className="xp-tier-row current-tier">
          <div className="xp-tier-emoji">&#127807;</div>
          <div className="xp-tier-name">Genesis Node<span>0 – 499 XP &mdash; Earned on signup</span></div>
          <div className="xp-tier-pts">0 XP</div>
        </div>
        <div className="xp-tier-row">
          <div className="xp-tier-emoji">&#9889;</div>
          <div className="xp-tier-name">Validator<span>500 – 1,499 XP &mdash; Complete Foundation</span></div>
          <div className="xp-tier-pts">500 XP</div>
        </div>
        <div className="xp-tier-row">
          <div className="xp-tier-emoji">&#9876;&#65039;</div>
          <div className="xp-tier-name">Crypto Knight<span>1,500 – 3,999 XP</span></div>
          <div className="xp-tier-pts">1,500 XP</div>
        </div>
        <div className="xp-tier-row">
          <div className="xp-tier-emoji">&#128293;</div>
          <div className="xp-tier-name">Chain Architect<span>4,000 – 7,999 XP</span></div>
          <div className="xp-tier-pts">4,000 XP</div>
        </div>
        <div className="xp-tier-row">
          <div className="xp-tier-emoji">&#127942;</div>
          <div className="xp-tier-name">Protocol Master<span>8,000 – 14,999 XP</span></div>
          <div className="xp-tier-pts">8,000 XP</div>
        </div>
        <div className="xp-tier-row">
          <div className="xp-tier-emoji">&#128081;</div>
          <div className="xp-tier-name">Node Sovereign<span>15,000+ XP &mdash; Top tier</span></div>
          <div className="xp-tier-pts">15,000 XP</div>
        </div>
      </div>
      <div style={{"marginTop":"1.2rem","padding":"1rem 1.2rem","background":"var(--orange-dim)","border":"1px solid rgba(255,138,0,.2)","borderRadius":"6px"}}>
        <p style={{"fontFamily":"'Poppins',sans-serif","fontSize":".78rem","fontWeight":"500","color":"var(--orange)","lineHeight":"1.6"}}>
          &#127381; Completing the Foundation cert instantly upgrades you from Genesis Node to Validator &mdash; a meaningful Day 1 reward.
        </p>
      </div>
    </div>
  </div>
</section>

{/*  HOW IT WORKS  */}
<section id="how" style={{"background":"var(--deep)"}}>
  <div className="section-tag">Your Journey</div>
  <h2>From <em>Zero</em> to <em>Web3 Pro</em></h2>
  <p className="body-text">A clear, structured path — no confusion, no gatekeeping. Just skills, credentials, and real earning potential.</p>
  <div className="steps-grid reveal" style={{"marginTop":"3rem"}}>
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

{/*  ACHIEVEMENT BADGES  */}
<section id="badges">
  <div className="section-tag">Achievement System</div>
  <h2>Earn Your <em>Badges.</em></h2>
  <p className="body-text">Every milestone you hit on the platform is recognised with a permanent badge on your Sofian profile — visible to protocols, employers, and the community.</p>

  <div className="badges-grid">
    <div className="badge-card reveal">
      <span className="badge-status earned">Earned on Signup</span>
      <span className="badge-emoji">&#127807;</span>
      <h4>Genesis Node</h4>
      <p>Create your Sofe Node account. Welcome to the network — your journey begins here.</p>
    </div>
    <div className="badge-card reveal">
      <span className="badge-status unlockable">Unlockable</span>
      <span className="badge-emoji">&#9889;</span>
      <h4>Validator</h4>
      <p>Complete the Foundation Course &amp; pass the exam. Earn 500 XP and unlock the full platform.</p>
    </div>
    <div className="badge-card locked-badge reveal">
      <span className="badge-status unlockable">Unlockable</span>
      <span className="badge-emoji">&#9876;&#65039;</span>
      <h4>Crypto Knight</h4>
      <p>Complete 5 Academy modules across the platform. Requires Foundation cert.</p>
    </div>
    <div className="badge-card locked-badge reveal">
      <span className="badge-status unlockable">Unlockable</span>
      <span className="badge-emoji">&#128293;</span>
      <h4>Chain Architect</h4>
      <p>Complete the full Career Track programme. Mastery recognised on-chain.</p>
    </div>
    <div className="badge-card locked-badge reveal">
      <span className="badge-status unlockable">Unlockable</span>
      <span className="badge-emoji">&#127942;</span>
      <h4>Node Operator</h4>
      <p>Earn your Certified Blockchain Professional credential. The mark of a professional Sofian.</p>
    </div>
    <div className="badge-card locked-badge reveal">
      <span className="badge-status unlockable">Unlockable</span>
      <span className="badge-emoji">&#128081;</span>
      <h4>Node Sovereign</h4>
      <p>Reach 15,000+ Total XP. The highest rank in the Sofian ecosystem — earned, never given.</p>
    </div>
  </div>
</section>

{/*  SOCIAL PROOF  */}
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

{/*  CTA STRIP  */}
<section id="cta-strip">
  <div className="section-tag orange" style={{"justifyContent":"center"}}>Your Next Step</div>
  <h2>Ready to Start Your<br/><em className="orange">Web3 Journey?</em></h2>
  <p>Seats in each cohort are limited. Join thousands of Sofians already learning, earning, and building their Web3 future.</p>
  <div className="cta-btns">
    <a href="academy.html" className="btn-primary orange">&#127891; Join the Next Cohort</a>
    <a href="dashboard.html" className="btn-primary">View Your Dashboard &rarr;</a>
    <a href="ecosystems.html" className="btn-outline">Are You a Web3 Ecosystem? &rarr;</a>
  </div>
</section>

{/*  FOOTER  */}





    </>
  );
}
