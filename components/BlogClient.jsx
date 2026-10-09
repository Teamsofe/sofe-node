'use client';
import React from 'react';
import Link from 'next/link';

export default function BlogClient() {
  return (
    <>
      





{/*  PAGE HEADER  */}
<div className="page-header">
  <div className="page-tag">Sofe Node Blog</div>
  <h1>Web3 Insights for <em>Africa</em></h1>
  <p>Education, industry news, career guides and on-chain analysis — written for the next generation of African blockchain talent.</p>
</div>

{/*  BLOG BODY  */}
<div className="blog-body">

  {/*  Category filter  */}
  <div className="cat-bar reveal">
    <button className="cat-btn active" onClick="filterCat(this,'all')">All Posts</button>
    <button className="cat-btn" onClick="filterCat(this,'web3')">Web3 &amp; Blockchain</button>
    <button className="cat-btn" onClick="filterCat(this,'education')">Education</button>
    <button className="cat-btn" onClick="filterCat(this,'career')">Careers</button>
    <button className="cat-btn orange" onClick="filterCat(this,'africa')">Africa</button>
    <button className="cat-btn" onClick="filterCat(this,'defi')">DeFi</button>
    <button className="cat-btn" onClick="filterCat(this,'ai')">AI &amp; Web3</button>
  </div>

  {/*  Featured post  */}
  <div className="featured-post reveal" onClick="window.location='#'">
    <div className="feat-img">
      <span className="feat-img-emoji">🌍</span>
    </div>
    <div className="feat-content">
      <div>
        <div className="feat-meta">
          <span className="post-cat africa">Africa</span>
          <span className="post-cat web3">Web3</span>
          <span className="post-date">March 18, 2026</span>
        </div>
        <h2>Why Africa Is Poised to Lead the Next Wave of Web3 Adoption</h2>
        <p>With over 1.4 billion people, a median age of 19, and one of the world's fastest-growing smartphone penetration rates, the African continent is uniquely positioned to leapfrog traditional finance and embrace decentralised systems. Here's why the world's next blockchain revolution will be built in Africa — and why Sofe Node is at the centre of it.</p>
      </div>
      <div className="feat-footer">
        <div className="author-row">
          <div className="author-avatar">CN</div>
          <div>
            <div className="author-name">Chidi Nwosu</div>
            <div className="read-time">8 min read</div>
          </div>
        </div>
        <a href="#" className="read-btn">Read Article →</a>
      </div>
    </div>
  </div>

  {/*  Main blog layout: posts grid + sidebar  */}
  <div className="blog-layout">

    {/*  Posts grid  */}
    <div>
      <div className="posts-grid">

        {/*  Post 1  */}
        <div className="post-card reveal" data-cat="education" onClick="window.location='#'">
          <div className="post-thumb t-blue">📚</div>
          <div className="post-body">
            <div className="post-meta">
              <span className="post-cat education">Education</span>
              <span className="post-date">Mar 14, 2026</span>
            </div>
            <h3>Blockchain Basics: What Every First-Timer in Nigeria Needs to Know</h3>
            <p>Starting your Web3 journey can feel overwhelming. We break down the five core concepts every beginner must understand before they touch a crypto wallet.</p>
            <div className="post-card-footer">
              <div className="author-row">
                <div className="author-avatar" style={{"background":"rgba(0,200,100,.1)","color":"#00c864","borderColor":"rgba(0,200,100,.2)","fontSize":".6rem"}}>AO</div>
                <div>
                  <div className="author-name" style={{"fontSize":".68rem"}}>Amaka Obi</div>
                  <div className="read-time">5 min</div>
                </div>
              </div>
              <a href="#" className="read-btn" style={{"fontSize":".64rem"}}>Read →</a>
            </div>
          </div>
        </div>

        {/*  Post 2  */}
        <div className="post-card reveal" data-cat="defi" onClick="window.location='#'">
          <div className="post-thumb t-orange">💱</div>
          <div className="post-body">
            <div className="post-meta">
              <span className="post-cat defi">DeFi</span>
              <span className="post-date">Mar 10, 2026</span>
            </div>
            <h3>DeFi vs. CeFi: Which Is Safer for the African Retail Trader?</h3>
            <p>Centralised and decentralised finance each carry distinct risks in African markets. We compare liquidity, custody, regulation and user experience side by side.</p>
            <div className="post-card-footer">
              <div className="author-row">
                <div className="author-avatar" style={{"background":"rgba(255,138,0,.1)","color":"var(--orange)","borderColor":"rgba(255,138,0,.2)","fontSize":".6rem"}}>KA</div>
                <div>
                  <div className="author-name" style={{"fontSize":".68rem"}}>Kunle Adeyemi</div>
                  <div className="read-time">7 min</div>
                </div>
              </div>
              <a href="#" className="read-btn" style={{"fontSize":".64rem"}}>Read →</a>
            </div>
          </div>
        </div>

        {/*  Post 3  */}
        <div className="post-card reveal" data-cat="career" onClick="window.location='#'">
          <div className="post-thumb t-green">🚀</div>
          <div className="post-body">
            <div className="post-meta">
              <span className="post-cat career">Career</span>
              <span className="post-date">Mar 6, 2026</span>
            </div>
            <h3>6 High-Paying Web3 Roles You Can Land Without a Computer Science Degree</h3>
            <p>Web3 is one of the few industries where your skills — not your certificate — determine your income. Here are six roles hiring right now across Africa and globally.</p>
            <div className="post-card-footer">
              <div className="author-row">
                <div className="author-avatar" style={{"background":"rgba(0,200,100,.1)","color":"#00c864","borderColor":"rgba(0,200,100,.2)","fontSize":".6rem"}}>FI</div>
                <div>
                  <div className="author-name" style={{"fontSize":".68rem"}}>Fatima Ibrahim</div>
                  <div className="read-time">6 min</div>
                </div>
              </div>
              <a href="#" className="read-btn" style={{"fontSize":".64rem"}}>Read →</a>
            </div>
          </div>
        </div>

        {/*  Post 4  */}
        <div className="post-card reveal" data-cat="ai" onClick="window.location='#'">
          <div className="post-thumb t-teal">🤖</div>
          <div className="post-body">
            <div className="post-meta">
              <span className="post-cat ai">AI &amp; Web3</span>
              <span className="post-date">Feb 28, 2026</span>
            </div>
            <h3>How AI Agents Are Changing On-Chain Trading — and What It Means for You</h3>
            <p>AI-powered trading bots, autonomous DeFi agents and prompt-driven analytics are reshaping how crypto markets work. Here's what everyday traders need to understand.</p>
            <div className="post-card-footer">
              <div className="author-row">
                <div className="author-avatar" style={{"background":"rgba(26,188,156,.1)","color":"#1ABC9C","borderColor":"rgba(26,188,156,.2)","fontSize":".6rem"}}>TO</div>
                <div>
                  <div className="author-name" style={{"fontSize":".68rem"}}>Tolu Okoye</div>
                  <div className="read-time">9 min</div>
                </div>
              </div>
              <a href="#" className="read-btn" style={{"fontSize":".64rem"}}>Read →</a>
            </div>
          </div>
        </div>

        {/*  Post 5  */}
        <div className="post-card reveal" data-cat="africa" onClick="window.location='#'">
          <div className="post-thumb t-purple">🏛️</div>
          <div className="post-body">
            <div className="post-meta">
              <span className="post-cat africa">Africa</span>
              <span className="post-date">Feb 22, 2026</span>
            </div>
            <h3>Nigeria's Crypto Regulation in 2026: What's Changed and What's Next</h3>
            <p>From the SEC's Digital Assets framework to CBN's evolving stance on P2P trading — we break down every major regulatory update affecting Nigerian crypto users this year.</p>
            <div className="post-card-footer">
              <div className="author-row">
                <div className="author-avatar" style={{"background":"rgba(155,89,182,.1)","color":"#C39BD3","borderColor":"rgba(155,89,182,.2)","fontSize":".6rem"}}>EB</div>
                <div>
                  <div className="author-name" style={{"fontSize":".68rem"}}>Emeka Bello</div>
                  <div className="read-time">10 min</div>
                </div>
              </div>
              <a href="#" className="read-btn" style={{"fontSize":".64rem"}}>Read →</a>
            </div>
          </div>
        </div>

        {/*  Post 6  */}
        <div className="post-card reveal" data-cat="web3" onClick="window.location='#'">
          <div className="post-thumb t-red">⛓️</div>
          <div className="post-body">
            <div className="post-meta">
              <span className="post-cat web3">Web3</span>
              <span className="post-date">Feb 15, 2026</span>
            </div>
            <h3>Solana vs Ethereum in 2026: Which Chain Should African Developers Build On?</h3>
            <p>Transaction fees, ecosystem grants, community size, and job demand — we run a full comparison to help African developers choose their primary blockchain stack.</p>
            <div className="post-card-footer">
              <div className="author-row">
                <div className="author-avatar" style={{"background":"rgba(231,76,60,.1)","color":"#ff5555","borderColor":"rgba(231,76,60,.2)","fontSize":".6rem"}}>DA</div>
                <div>
                  <div className="author-name" style={{"fontSize":".68rem"}}>David Aina</div>
                  <div className="read-time">8 min</div>
                </div>
              </div>
              <a href="#" className="read-btn" style={{"fontSize":".64rem"}}>Read →</a>
            </div>
          </div>
        </div>

      </div>{/*  end posts-grid  */}

      {/*  Pagination  */}
      <div className="pagination reveal">
        <button className="pg-btn pg-arrow">&#8592;</button>
        <button className="pg-btn active">1</button>
        <button className="pg-btn" onClick="this.closest('.pagination').querySelectorAll('.pg-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">2</button>
        <button className="pg-btn" onClick="this.closest('.pagination').querySelectorAll('.pg-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">3</button>
        <button className="pg-btn" style={{"fontSize":".7rem","letterSpacing":".04em"}}>…</button>
        <button className="pg-btn" onClick="this.closest('.pagination').querySelectorAll('.pg-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active')">8</button>
        <button className="pg-btn pg-arrow">&#8594;</button>
      </div>

    </div>{/*  end posts main  */}

    {/*  Sidebar  */}
    <aside className="sidebar">

      {/*  Trending  */}
      <div className="sidebar-card reveal">
        <div className="sidebar-title">Trending Now</div>
        <div className="trend-item">
          <div className="trend-num">01</div>
          <div>
            <div className="trend-text">Why Africa Is Poised to Lead the Next Wave of Web3</div>
            <div className="trend-cat">Africa · Web3</div>
          </div>
        </div>
        <div className="trend-item">
          <div className="trend-num">02</div>
          <div>
            <div className="trend-text">6 High-Paying Web3 Roles Without a CS Degree</div>
            <div className="trend-cat">Career</div>
          </div>
        </div>
        <div className="trend-item">
          <div className="trend-num">03</div>
          <div>
            <div className="trend-text">How AI Agents Are Changing On-Chain Trading</div>
            <div className="trend-cat">AI &amp; Web3</div>
          </div>
        </div>
        <div className="trend-item">
          <div className="trend-num">04</div>
          <div>
            <div className="trend-text">Nigeria's Crypto Regulation in 2026</div>
            <div className="trend-cat">Africa · Regulation</div>
          </div>
        </div>
        <div className="trend-item">
          <div className="trend-num">05</div>
          <div>
            <div className="trend-text">Solana vs Ethereum: Which Chain for African Devs?</div>
            <div className="trend-cat">Development</div>
          </div>
        </div>
      </div>

      {/*  Topics  */}
      <div className="sidebar-card reveal">
        <div className="sidebar-title">Browse Topics</div>
        <div style={{"display":"flex","flexWrap":"wrap","gap":".5rem"}}>
          <a href="#" style={{"fontSize":".66rem","fontWeight":"600","color":"var(--muted)","textDecoration":"none","border":"1px solid var(--border)","borderRadius":"100px","padding":".3rem .75rem","transition":"all .2s"}} onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--white)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">Blockchain Basics</a>
          <a href="#" style={{"fontSize":".66rem","fontWeight":"600","color":"var(--muted)","textDecoration":"none","border":"1px solid var(--border)","borderRadius":"100px","padding":".3rem .75rem","transition":"all .2s"}} onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--white)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">DeFi</a>
          <a href="#" style={{"fontSize":".66rem","fontWeight":"600","color":"var(--muted)","textDecoration":"none","border":"1px solid var(--border)","borderRadius":"100px","padding":".3rem .75rem","transition":"all .2s"}} onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--white)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">Careers</a>
          <a href="#" style={{"fontSize":".66rem","fontWeight":"600","color":"var(--muted)","textDecoration":"none","border":"1px solid var(--border)","borderRadius":"100px","padding":".3rem .75rem","transition":"all .2s"}} onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--white)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">Nigeria</a>
          <a href="#" style={{"fontSize":".66rem","fontWeight":"600","color":"var(--muted)","textDecoration":"none","border":"1px solid var(--border)","borderRadius":"100px","padding":".3rem .75rem","transition":"all .2s"}} onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--white)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">NFTs</a>
          <a href="#" style={{"fontSize":".66rem","fontWeight":"600","color":"var(--muted)","textDecoration":"none","border":"1px solid var(--border)","borderRadius":"100px","padding":".3rem .75rem","transition":"all .2s"}} onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--white)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">AI &amp; Web3</a>
          <a href="#" style={{"fontSize":".66rem","fontWeight":"600","color":"var(--muted)","textDecoration":"none","border":"1px solid var(--border)","borderRadius":"100px","padding":".3rem .75rem","transition":"all .2s"}} onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--white)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">Trading</a>
          <a href="#" style={{"fontSize":".66rem","fontWeight":"600","color":"var(--muted)","textDecoration":"none","border":"1px solid var(--border)","borderRadius":"100px","padding":".3rem .75rem","transition":"all .2s"}} onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--white)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">Regulation</a>
          <a href="#" style={{"fontSize":".66rem","fontWeight":"600","color":"var(--muted)","textDecoration":"none","border":"1px solid var(--border)","borderRadius":"100px","padding":".3rem .75rem","transition":"all .2s"}} onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--white)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">DAO</a>
          <a href="#" style={{"fontSize":".66rem","fontWeight":"600","color":"var(--muted)","textDecoration":"none","border":"1px solid var(--border)","borderRadius":"100px","padding":".3rem .75rem","transition":"all .2s"}} onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--white)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">Solana</a>
          <a href="#" style={{"fontSize":".66rem","fontWeight":"600","color":"var(--muted)","textDecoration":"none","border":"1px solid var(--border)","borderRadius":"100px","padding":".3rem .75rem","transition":"all .2s"}} onmouseover="this.style.borderColor='var(--blue)';this.style.color='var(--white)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted)'">Ethereum</a>
        </div>
      </div>

      {/*  Enrol CTA  */}
      <div className="sidebar-card reveal" style={{"background":"linear-gradient(135deg,rgba(20,40,255,.1),rgba(255,138,0,.07))","borderColor":"rgba(255,138,0,.25)","textAlign":"center"}}>
        <div style={{"fontSize":"2rem","marginBottom":".8rem"}}>🎓</div>
        <div style={{"fontSize":".88rem","fontWeight":"800","color":"var(--white)","marginBottom":".4rem"}}>Start Learning Web3 Today</div>
        <p style={{"fontSize":".74rem","color":"var(--muted)","lineHeight":"1.6","marginBottom":"1rem"}}>Join 5,000+ Sofians who've launched their blockchain journey with our free Foundation Course.</p>
        <a href="./talent.html" style={{"display":"block","background":"var(--orange)","color":"#fff","borderRadius":"5px","padding":".65rem","fontFamily":"'Poppins',sans-serif","fontSize":".72rem","fontWeight":"700","letterSpacing":".06em","textTransform":"uppercase","textDecoration":"none","transition":"opacity .2s"}} onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">Enrol Today →</a>
      </div>

    </aside>
  </div>{/*  end blog-layout  */}

  {/*  Newsletter CTA  */}
  <div className="newsletter-cta reveal">
    <h3>Get Web3 Insights <em>Straight to Your Inbox</em></h3>
    <p>Weekly articles, career opportunities, and on-chain analysis — curated for African blockchain talent.</p>
    <div className="newsletter-form">
      <input type="email" placeholder="your@email.com" />
      <button onClick="this.textContent='Subscribed ✓';this.style.background='#00c864';setTimeout(()=>{this.textContent='Subscribe';this.style.background='var(--orange)'},3000)">Subscribe</button>
    </div>
  </div>

</div>{/*  end blog-body  */}

{/*  FOOTER  */}





    </>
  );
}
