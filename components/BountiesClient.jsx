'use client';
import React from 'react';
import Link from 'next/link';

export default function BountiesClient() {
  return (
    <>
      



{/*  Hero Section  */}
<section style={{"position":"relative","padding":"8rem 2rem 3rem","textAlign":"center","background":"linear-gradient(180deg, var(--deep) 0%, var(--black) 100%)"}}>
  <div style={{"maxWidth":"900px","margin":"0 auto"}}>
    {/*  Label  */}
    <div style={{"display":"inline-flex","alignItems":"center","gap":"0.5rem","padding":"0.5rem 1rem","background":"rgba(255,138,0,0.12)","border":"1px solid rgba(255,138,0,0.3)","borderRadius":"50px","marginBottom":"1.5rem"}}>
      <span style={{"fontSize":"1.2rem"}}>🎯</span>
      <span style={{"fontSize":"0.7rem","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase","color":"var(--orange)"}}>Sofe Bounties</span>
    </div>
    
    {/*  Headline  */}
    <h1 style={{"fontSize":"clamp(2.5rem, 6vw, 4rem)","fontWeight":"900","lineHeight":"1.1","marginBottom":"1rem"}}>
      Activate the Network.<br/>
      <span style={{"color":"var(--orange)"}}>Claim the Bounty.</span>
    </h1>
    
    {/*  Subtitle  */}
    <p style={{"fontSize":"clamp(1rem, 2vw, 1.2rem)","color":"var(--muted)","maxWidth":"680px","margin":"0 auto 2rem","lineHeight":"1.7"}}>
      Complete challenges, earn rewards, and build your Web3 portfolio — from referrals to development tasks.
    </p>
  </div>
</section>

{/*  Loading State  */}
<div id="loadingState" className="loading-state">
  <div style={{"fontSize":"3rem","marginBottom":"1rem"}}>⏳</div>
  Loading bounty campaigns...
</div>

{/*  Filters Section  */}
<div id="filtersSection" style={{"display":"none"}}>
  <div style={{"maxWidth":"1200px","margin":"0 auto","padding":"2rem 2rem 1rem"}}>
    
    {/*  Track Filters  */}
    <div style={{"marginBottom":"1rem"}}>
      <div style={{"fontSize":"0.75rem","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase","color":"var(--muted)","marginBottom":"0.75rem"}}>
        Filter by Track:
      </div>
      <div style={{"display":"flex","gap":"0.5rem","flexWrap":"wrap"}} id="trackFilters">
        <button className="filter-pill active" data-filter="all" onClick="filterByTrack('all', this)">All Tracks</button>
        <button className="filter-pill" data-filter="development" onClick="filterByTrack('development', this)">Development</button>
        <button className="filter-pill" data-filter="data-analysis" onClick="filterByTrack('data-analysis', this)">Data Analysis</button>
        <button className="filter-pill" data-filter="ai-automation" onClick="filterByTrack('ai-automation', this)">AI & Automation</button>
        <button className="filter-pill" data-filter="design" onClick="filterByTrack('design', this)">Design</button>
        <button className="filter-pill" data-filter="management" onClick="filterByTrack('management', this)">Management</button>
        <button className="filter-pill" data-filter="growth-media" onClick="filterByTrack('growth-media', this)">Growth & Media</button>
        <button className="filter-pill" data-filter="trading" onClick="filterByTrack('trading', this)">Trading</button>
      </div>
    </div>
    
    {/*  Status Filters  */}
    <div>
      <div style={{"fontSize":"0.75rem","fontWeight":"700","letterSpacing":"0.1em","textTransform":"uppercase","color":"var(--muted)","marginBottom":"0.75rem"}}>
        Status:
      </div>
      <div style={{"display":"flex","gap":"0.5rem","flexWrap":"wrap"}} id="statusFilters">
        <button className="filter-pill active" data-filter="all" onClick="filterByStatus('all', this)">All</button>
        <button className="filter-pill" data-filter="open" onClick="filterByStatus('open', this)">Open</button>
        <button className="filter-pill" data-filter="application" onClick="filterByStatus('application', this)">Application Required</button>
      </div>
    </div>
    
  </div>
</div>



{/*  Bounties List  */}
<div id="bountiesList" style={{"display":"none","maxWidth":"1200px","margin":"0 auto","padding":"2rem"}}>
</div>

{/*  Main Bounty Content (Hidden until loaded)  */}
<div id="bountyContent" style={{"display":"none"}}>
  
  {/*  Hero  */}
  <div className="bounty-hero">
    <div className="bounty-eyebrow">
      <span id="heroEyebrow">📚 Sofe Node Academy</span>
    </div>
    <h1 className="bounty-title">
      <span className="bounty-title-word" id="heroTitle1">THE REFERRAL</span>
      <span className="bounty-title-word blue" id="heroTitle2">BOUNTY</span>
      <span className="bounty-title-word live" id="heroTitle3">IS LIVE!</span>
    </h1>
    <div className="bounty-subtitle">
      <span className="bounty-icon">🚀</span>
      <span id="heroSubtitle1">ACTIVATE THE NETWORK</span>
      <span id="heroSubtitle2">CLAIM THE BOUNTY.</span>
    </div>
  </div>

  {/*  Main Container  */}
  <div className="bounty-container">
    
    {/*  Grid  */}
    <div className="bounty-grid">
      
      {/*  How to Win  */}
      <div className="bounty-card">
        <div className="bounty-card-header">How to Win:</div>
        <div id="requirementsList"></div>
      </div>
      
      {/*  Leaderboard Rewards  */}
      <div className="bounty-card">
        <div className="bounty-card-header rewards">The Leaderboard Rewards:</div>
        <div id="prizesList"></div>
      </div>
      
      {/*  Total Prize Pool  */}
      <div className="bounty-card">
        <div className="bounty-card-header pool">💰 Prize Pool</div>
        <div className="prize-pool">
          <div className="prize-pool-icon">🏆</div>
          <div className="prize-pool-label">Total Prize Pool:</div>
          <div className="prize-pool-amount" id="totalPrizePool">₦0</div>
        </div>
      </div>
      
    </div>
    
    {/*  Campaign Details  */}
    <div className="details-card bounty-card">
      <div className="bounty-card-header">📋 Campaign Details:</div>
      <div className="details-grid">
        
        <div className="detail-item">
          <div className="detail-icon">📅</div>
          <div className="detail-content">
            <h3>Duration:</h3>
            <div className="detail-value" id="campaignDuration">14 DAYS ONLY!</div>
            <div className="detail-text" id="campaignDates">Ends on...</div>
          </div>
        </div>
        
        <div className="detail-item">
          <div className="detail-icon">✅</div>
          <div className="detail-content">
            <h3>Validation:</h3>
            <div className="detail-text" id="validationRules">Only verified entries count toward the final leaderboard.</div>
          </div>
        </div>
        
      </div>
    </div>
    
    {/*  CTA  */}
    <div className="bounty-cta">
      <a href="#" className="cta-button" id="ctaButton">
        <span id="ctaText">START REFERRING NOW</span>
        <span>→</span>
      </a>
    </div>
    
    {/*  Live Leaderboard  */}
    <div className="leaderboard-section" id="leaderboardSection">
      <div className="leaderboard-header">
        <h2 className="leaderboard-title">🏆 Live Leaderboard</h2>
        <p className="leaderboard-subtitle">Top participants competing for prizes</p>
      </div>
      <div className="leaderboard-table" id="leaderboardTable"></div>
    </div>
    
  </div>
  
</div>

{/*  No Active Bounty State  */}
<div id="noBountyState" className="empty-state" style={{"display":"none"}}>
  <div style={{"fontSize":"4rem","marginBottom":"1rem"}}>📭</div>
  <h2>No Active Bounty Campaign</h2>
  <p style={{"marginTop":"1rem"}}>Check back soon for exciting bounty opportunities!</p>
</div>

{/*  FOOTER (would come from include)  */}




{/*  Universal navbar  */}



    </>
  );
}
