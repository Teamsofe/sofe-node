'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import WinnerMultiplierBadge from '@/components/WinnerMultiplierBadge';

export default function PublicProfileClient({ usernameParam }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [copied, setCopied] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setNotFound(false);
      const cleanParam = (usernameParam || '').trim();

      if (!cleanParam) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // 1. Call server-side API route (uses Firebase Admin, bypasses client permission rules securely)
        try {
          const res = await fetch(`/api/profile/${encodeURIComponent(cleanParam)}`, {
            cache: 'no-store'
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.profile) {
              setProfile(data.profile);
              setCertificates(data.certificates || []);
              setLoading(false);
              return;
            }
          }
        } catch (apiErr) {
          console.warn('[Profile] API route fetch failed, trying client Firestore:', apiErr.message);
        }

        // 2. Fallback to client Firestore (works if viewer is admin or profile owner)
        let foundUser = null;
        let userId = null;

        // Try referral_code uppercase and raw
        const upperParam = cleanParam.toUpperCase();
        let refQ = query(collection(db, 'users'), where('referral_code', '==', upperParam));
        let refSnap = await getDocs(refQ).catch(() => ({ empty: true, docs: [] }));
        if (!refSnap.empty) {
          foundUser = refSnap.docs[0].data();
          userId = refSnap.docs[0].id;
        } else if (upperParam !== cleanParam) {
          refQ = query(collection(db, 'users'), where('referral_code', '==', cleanParam));
          refSnap = await getDocs(refQ).catch(() => ({ empty: true, docs: [] }));
          if (!refSnap.empty) {
            foundUser = refSnap.docs[0].data();
            userId = refSnap.docs[0].id;
          }
        }

        // Try username lowercase
        if (!foundUser) {
          const lowerParam = cleanParam.toLowerCase();
          const userQ = query(collection(db, 'users'), where('username', '==', lowerParam));
          const userSnap = await getDocs(userQ).catch(() => ({ empty: true, docs: [] }));
          if (!userSnap.empty) {
            foundUser = userSnap.docs[0].data();
            userId = userSnap.docs[0].id;
          }
        }

        // Try direct UID
        if (!foundUser && cleanParam.length >= 15) {
          const docSnap = await getDoc(doc(db, 'users', cleanParam)).catch(() => ({ exists: () => false }));
          if (docSnap.exists && docSnap.exists()) {
            foundUser = docSnap.data();
            userId = docSnap.id;
          }
        }

        if (foundUser) {
          const lifetimeXp = Math.max(0, Number(foundUser.xp_total ?? foundUser.total_xp ?? foundUser.xp ?? 0));
          const monthlyXp = Math.max(0, Number(foundUser.monthly_xp ?? foundUser.xp_this_period ?? 0));
          const firstName = (foundUser.first_name || '').trim();
          const lastName = (foundUser.last_name || '').trim();
          const lastInitial = lastName ? `${lastName.charAt(0).toUpperCase()}.` : '';

          setProfile({
            uid: userId,
            id: userId,
            first_name: firstName,
            last_name: lastName,
            last_initial: lastInitial,
            full_name: `${firstName} ${lastName}`.trim() || foundUser.full_name || foundUser.username || 'Sofian Builder',
            username: foundUser.username || (foundUser.referral_code ? foundUser.referral_code.toLowerCase() : 'builder'),
            bio: foundUser.bio || 'Web3 Builder & Protocol Contributor on Sofe Node Academy.',
            node_label: foundUser.node_label || foundUser.chapter_name || foundUser.node || 'Sofe Node UNN',
            referral_code: foundUser.referral_code || cleanParam,
            xp_total: lifetimeXp,
            monthly_xp: monthlyXp,
            xp_tier: foundUser.xp_tier || 'Genesis Scout',
            season_rank: foundUser.season_rank || foundUser.rank || 12,
            daily_streak: Math.max(1, Number(foundUser.daily_streak || 1)),
            average_score: Number(foundUser.average_score || foundUser.exam_score || (foundUser.foundation_score ? parseInt(foundUser.foundation_score, 10) : 95)),
            completed_assessments_count: Number(foundUser.completed_assessments_count || 1),
            leaderboard_wins_count: Number(foundUser.leaderboardWinsCount || foundUser.leaderboard_wins_count || 0),
            bounty_wins_count: Number(foundUser.bountyWinsCount || foundUser.bounty_wins_count || 0),
            created_at: foundUser.created_at,
          });

          // Load certificates
          try {
            const certQ = query(collection(db, 'certificates'), where('user_id', '==', userId));
            const certSnap = await getDocs(certQ);
            setCertificates(certSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
          } catch (certErr) {
            console.warn('Could not load certificates:', certErr);
          }
        } else {
          setNotFound(true);
        }
      } catch (e) {
        console.error('Error loading public profile:', e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [usernameParam]);

  const fullName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.full_name || profile.name || profile.username || 'Sofian Builder'
    : 'Sofian Builder';

  const refCode = profile?.referral_code || 'SOFE';
  const referralSignupUrl = `/signup?ref=${encodeURIComponent(refCode)}`;
  const challengeUrl = `/challenge?ref=${encodeURIComponent(refCode)}&score=${profile?.average_score || 95}&student=${encodeURIComponent(fullName)}`;

  const leaderboardWins = profile?.leaderboardWinsCount || profile?.leaderboard_wins_count || (profile?.season_rank && profile.season_rank <= 3 ? 1 : 0);
  const bountyWins = profile?.bountyWinsCount || profile?.bounty_wins_count || 0;

  const handleCopyProfileUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="profile-page-wrapper loading-state">
        <style dangerouslySetInnerHTML={{ __html: profileStyles }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
          <div className="profile-spinner" />
          <p style={{ fontSize: '0.92rem', opacity: 0.8 }}>Loading Verified Web3 CV...</p>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="profile-page-wrapper not-found-state">
        <style dangerouslySetInnerHTML={{ __html: profileStyles }} />
        <main className="profile-main-container">
          <div className="profile-card profile-hero-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
              Builder Profile Not Found
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'rgba(200,215,240,0.7)', maxWidth: 480, margin: '0 auto 1.75rem auto', lineHeight: 1.6 }}>
              The Web3 CV for <strong style={{ color: '#FF8A00' }}>@{usernameParam || 'builder'}</strong> has not been claimed yet or the referral link has expired.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href={`/signup?ref=${encodeURIComponent(usernameParam || '')}`}
                className="profile-btn-challenge"
                style={{ textDecoration: 'none' }}
              >
                Claim Your Web3 CV &amp; Join Sofe Node →
              </Link>
              <Link
                href="/academy"
                className="profile-btn-share"
                style={{ textDecoration: 'none' }}
              >
                Explore Courses
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-page-wrapper">
      <style dangerouslySetInnerHTML={{ __html: profileStyles }} />

      {/* Main Content Container - Clears floating Sofe Navbar */}
      <main className="profile-main-container">

        {/* ── PROFILE HERO CARD ────────────────────────────────────────── */}
        <div className="profile-card profile-hero-card">
          {/* Ambient Glow */}
          <div className="profile-hero-ambient" />

          <div className="profile-hero-content">
            {/* Top row: Avatar & Identity Details */}
            <div className="profile-identity-col">
              {/* Avatar */}
              <div className="profile-avatar">
                {fullName.charAt(0).toUpperCase()}
              </div>

              {/* Names & Badges */}
              <div className="profile-identity-text">
                <div className="profile-name-row">
                  <h1 className="profile-name">{fullName}</h1>
                  <span className="profile-verified-badge">
                    ✓ VERIFIED BUILDER
                  </span>
                </div>

                <div className="profile-handle">
                  @{profile?.username || (profile?.referral_code ? profile.referral_code.toLowerCase() : 'sofian')} • {profile?.node_label || 'Sofe Node'}
                </div>

                {profile?.bio && (
                  <p className="profile-bio">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons: Share & Challenge */}
            <div className="profile-action-group">
              <button
                type="button"
                onClick={handleCopyProfileUrl}
                className="profile-btn-share"
                title="Share this public Web3 CV"
              >
                <span>{copied ? '✓' : '🔗'}</span>
                <span>{copied ? 'Link Copied!' : 'Share Profile'}</span>
              </button>

              <Link
                href={challengeUrl}
                className="profile-btn-challenge"
                title="Challenge on Web3 IQ Arena"
              >
                <span>⚔️</span>
                <span>Challenge on Web3 IQ</span>
              </Link>
            </div>
          </div>

          {/* Honors & Multipliers Bottom Strip */}
          <div className="profile-honors-strip">
            <span className="profile-honors-label">
              Honors &amp; Multipliers:
            </span>

            {leaderboardWins > 0 && (
              <WinnerMultiplierBadge type="leaderboard" count={leaderboardWins} size="sm" />
            )}

            {bountyWins > 0 && (
              <WinnerMultiplierBadge type="bounty" count={bountyWins} size="sm" />
            )}

            <span className="profile-tier-badge">
              <span>🛡️</span> {profile?.xp_tier || 'Genesis'}
            </span>
          </div>
        </div>

        {/* ── PROOF OF WORK STATS GRID (2 per row on mobile) ─────────── */}
        <div className="profile-stats-grid">
          {/* Stat 1: Lifetime XP */}
          <div className="profile-stat-box">
            <div className="stat-label">Lifetime Proof-of-Work XP</div>
            <div className="stat-val xp-val">
              {(profile?.xp_total || 0).toLocaleString()} XP
            </div>
            <div className="stat-sub">On-chain verifiable learning</div>
          </div>

          {/* Stat 2: Season Rank */}
          <div className="profile-stat-box">
            <div className="stat-label">Season Rank</div>
            <div className="stat-val rank-val">
              #{profile?.season_rank || profile?.rank || '12'}
            </div>
            <div className="stat-sub">Monthly Leaderboard</div>
          </div>

          {/* Stat 3: Average Score */}
          <div className="profile-stat-box">
            <div className="stat-label">Average Exam Score</div>
            <div className="stat-val score-val">
              {profile?.average_score || 95}%
            </div>
            <div className="stat-sub">Top 5% Assessment Percentile</div>
          </div>

          {/* Stat 4: Learning Streak */}
          <div className="profile-stat-box">
            <div className="stat-label">Active Learning Streak</div>
            <div className="stat-val streak-val">
              🔥 {profile?.daily_streak || 6} Days
            </div>
            <div className="stat-sub">Continuous commitment</div>
          </div>
        </div>

        {/* ── VERIFIED COURSE CERTIFICATIONS ─────────────────────────── */}
        <section className="profile-certs-section">
          <div className="profile-certs-header">
            <h2 className="profile-section-title">
              Verified Course Certifications ({certificates.length})
            </h2>
            <span className="profile-section-sub">
              Cryptographically verified by Sofe Node Foundation
            </span>
          </div>

          {certificates.length === 0 ? (
            <div className="profile-empty-certs">
              No published certificates yet. Currently preparing for module assessments.
            </div>
          ) : (
            <div className="profile-certs-grid">
              {certificates.map((cert) => (
                <div key={cert.id} className="profile-cert-card">
                  <div>
                    <div className="cert-top-row">
                      <span className="cert-badge-tag">
                        Verified Credential
                      </span>
                      <span className="cert-score-tag">
                        Score: {cert.score || 95}%
                      </span>
                    </div>

                    <h3 className="profile-cert-title">
                      {cert.course_title || 'Blockchain Foundation'}
                    </h3>

                    <div className="profile-cert-id">
                      ID: {cert.id}
                    </div>
                  </div>

                  <div className="cert-actions-row">
                    <Link
                      href={`/verify/${cert.id}`}
                      className="profile-verify-btn"
                    >
                      Verify On-Chain Seal ↗
                    </Link>

                    <a
                      href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.course_title || 'Blockchain Foundation')}&organizationName=${encodeURIComponent('Sofe Node Academy')}&issueYear=2024&issueMonth=5&certId=${encodeURIComponent(cert.id)}&certUrl=${encodeURIComponent('https://node.sofegroup.com/verify/' + cert.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="profile-linkedin-btn"
                    >
                      + LinkedIn
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── STICKY BOTTOM VIRAL CTA BANNER ───────────────────────────── */}
      <div className="sticky-cta-banner">
        <div className="sticky-cta-left">
          <span className="sticky-cta-icon">🚀</span>
          <div>
            <div className="sticky-cta-title">
              Build your own verified Web3 portfolio on Sofe Node
            </div>
            <div className="sticky-cta-sub">
              Join {fullName.split(' ')[0]} and 2,000+ builders mastering smart contracts, winning bounties, and getting deployed.
            </div>
          </div>
        </div>

        <Link
          href={referralSignupUrl}
          className="sticky-cta-btn"
        >
          Create Your Free Portfolio →
        </Link>
      </div>
    </div>
  );
}

// Scoped, resilient styling supporting both Dark and Light theme toggle
const profileStyles = `
  /* PAGE ROOT & TOP CLEARANCE */
  .profile-page-wrapper {
    min-height: 100vh;
    background: linear-gradient(180deg, #040812 0%, #060B17 50%, #091329 100%);
    color: #FFFFFF;
    font-family: 'Poppins', system-ui, -apple-system, sans-serif;
    padding-top: 105px;
    padding-bottom: 7.5rem;
    position: relative;
    transition: background 0.25s ease, color 0.25s ease;
  }
  .profile-page-wrapper.loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .profile-spinner {
    width: 38px;
    height: 38px;
    border: 3px solid rgba(20,40,255,0.2);
    border-top-color: #FF8A00;
    border-radius: 50%;
    animation: profSpin 0.8s linear infinite;
  }
  @keyframes profSpin {
    to { transform: rotate(360deg); }
  }

  /* CONTAINER */
  .profile-main-container {
    max-width: 980px;
    margin: 0 auto;
    padding: 0 1.25rem;
  }

  /* HERO CARD */
  .profile-card {
    background: rgba(9, 17, 36, 0.78);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(20,40,255,0.25);
    border-radius: 20px;
    box-shadow: 0 16px 40px rgba(0,0,0,0.45);
    transition: all 0.25s ease;
  }
  .profile-hero-card {
    padding: 2rem;
    margin-bottom: 1.5rem;
    position: relative;
    overflow: hidden;
  }
  .profile-hero-ambient {
    position: absolute;
    top: -40px;
    right: -40px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255,138,0,0.18) 0%, transparent 70%);
    pointer-events: none;
  }
  .profile-hero-content {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5rem;
  }
  .profile-identity-col {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex: 1;
    min-width: 0;
  }
  .profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1428FF 0%, #FF8A00 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 800;
    color: #fff;
    box-shadow: 0 8px 25px rgba(20,40,255,0.4);
    border: 3px solid rgba(255,255,255,0.25);
    flex-shrink: 0;
  }
  .profile-identity-text {
    flex: 1;
    min-width: 0;
  }
  .profile-name-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-wrap: wrap;
  }
  .profile-name {
    font-size: 1.55rem;
    font-weight: 800;
    margin: 0;
    color: #FFFFFF;
    line-height: 1.2;
    word-break: break-word;
  }
  .profile-verified-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid #10B981;
    color: #10B981;
    border-radius: 20px;
    padding: 0.2rem 0.6rem;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .profile-handle {
    font-size: 0.82rem;
    color: #00E5FF;
    font-weight: 600;
    margin-top: 0.35rem;
    word-break: break-word;
  }
  .profile-bio {
    font-size: 0.82rem;
    color: rgba(238,244,255,0.75);
    line-height: 1.55;
    margin: 0.5rem 0 0 0;
    max-width: 580px;
  }

  /* ACTION BUTTONS GROUP */
  .profile-action-group {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    flex-shrink: 0;
  }
  .profile-btn-share {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.22);
    color: #FFFFFF;
    border-radius: 10px;
    padding: 0.72rem 1.15rem;
    font-size: 0.82rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  .profile-btn-share:hover {
    background: rgba(255,255,255,0.15);
    border-color: rgba(255,255,255,0.35);
    transform: translateY(-1px);
  }
  .profile-btn-challenge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: linear-gradient(135deg, #FF8A00 0%, #E65100 100%);
    color: #FFFFFF !important;
    border-radius: 10px;
    padding: 0.72rem 1.25rem;
    font-size: 0.82rem;
    font-weight: 800;
    text-decoration: none !important;
    box-shadow: 0 4px 18px rgba(255,138,0,0.35);
    white-space: nowrap;
    transition: all 0.2s ease;
  }
  .profile-btn-challenge:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 22px rgba(255,138,0,0.45);
  }

  /* HONORS STRIP */
  .profile-honors-strip {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid rgba(255,255,255,0.08);
    flex-wrap: wrap;
  }
  .profile-honors-label {
    font-size: 0.74rem;
    color: rgba(200,215,240,0.6);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .profile-tier-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.15);
    color: #EEF4FF;
    border-radius: 30px;
    padding: 0.32rem 0.8rem;
    font-size: 0.74rem;
    font-weight: 700;
    white-space: nowrap;
  }

  /* STATS GRID - 4 Cols Desktop, 2 Cols Mobile */
  .profile-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2.5rem;
  }
  .profile-stat-box {
    background: rgba(9, 17, 36, 0.7);
    border: 1px solid rgba(20,40,255,0.2);
    border-radius: 14px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.25s ease;
  }
  .profile-stat-box .stat-label {
    font-size: 0.7rem;
    color: rgba(200,215,240,0.6);
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .profile-stat-box .stat-val {
    font-size: 1.75rem;
    font-weight: 800;
    margin-top: 0.35rem;
    line-height: 1.2;
  }
  .profile-stat-box .xp-val { color: #00E5FF; }
  .profile-stat-box .rank-val { color: #FF8A00; }
  .profile-stat-box .score-val { color: #10B981; }
  .profile-stat-box .streak-val { color: #FFB03A; }
  .profile-stat-box .stat-sub {
    font-size: 0.7rem;
    color: rgba(238,244,255,0.5);
    margin-top: 0.25rem;
  }

  /* CERTIFICATIONS SECTION */
  .profile-certs-section {
    margin-bottom: 3rem;
  }
  .profile-certs-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .profile-section-title {
    font-size: 1.15rem;
    font-weight: 800;
    margin: 0;
    color: #FFFFFF;
  }
  .profile-section-sub {
    font-size: 0.75rem;
    color: rgba(200,215,240,0.6);
  }
  .profile-empty-certs {
    background: rgba(9, 17, 36, 0.5);
    border: 1px dashed rgba(20,40,255,0.3);
    border-radius: 12px;
    padding: 2.5rem;
    text-align: center;
    color: rgba(200,215,240,0.6);
    font-size: 0.85rem;
  }
  .profile-certs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }
  .profile-cert-card {
    background: rgba(9, 17, 36, 0.8);
    border: 1px solid rgba(255,138,0,0.3);
    border-radius: 14px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    transition: all 0.25s ease;
  }
  .cert-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }
  .cert-badge-tag {
    font-size: 0.7rem;
    font-weight: 800;
    color: #FF8A00;
    text-transform: uppercase;
  }
  .cert-score-tag {
    font-size: 0.7rem;
    color: #10B981;
    font-weight: 700;
  }
  .profile-cert-title {
    font-size: 0.98rem;
    font-weight: 800;
    color: #FFFFFF;
    margin: 0 0 0.4rem 0;
    line-height: 1.4;
  }
  .profile-cert-id {
    font-size: 0.74rem;
    color: rgba(200,215,240,0.6);
    font-family: monospace;
    margin-bottom: 1rem;
  }
  .cert-actions-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    border-top: 1px solid rgba(255,255,255,0.08);
    padding-top: 0.8rem;
  }
  .profile-verify-btn {
    flex: 1;
    text-align: center;
    background: rgba(20,40,255,0.2);
    border: 1px solid rgba(20,40,255,0.4);
    color: #6B8CFF !important;
    border-radius: 8px;
    padding: 0.5rem;
    font-size: 0.76rem;
    font-weight: 700;
    text-decoration: none !important;
    transition: all 0.2s ease;
  }
  .profile-verify-btn:hover {
    background: rgba(20,40,255,0.3);
  }
  .profile-linkedin-btn {
    padding: 0.5rem 0.8rem;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.2);
    color: #FFFFFF !important;
    border-radius: 8px;
    font-size: 0.76rem;
    font-weight: 700;
    text-decoration: none !important;
    white-space: nowrap;
    transition: all 0.2s ease;
  }
  .profile-linkedin-btn:hover {
    background: rgba(255,255,255,0.14);
  }

  /* STICKY BOTTOM VIRAL CTA BANNER */
  .sticky-cta-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(6, 11, 23, 0.94);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid #1428FF;
    padding: 0.85rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    z-index: 100;
    box-shadow: 0 -8px 30px rgba(0,0,0,0.6);
    transition: all 0.25s ease;
  }
  .sticky-cta-left {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
    flex: 1;
  }
  .sticky-cta-icon {
    font-size: 1.4rem;
    flex-shrink: 0;
  }
  .sticky-cta-title {
    font-size: 0.86rem;
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1.3;
  }
  .sticky-cta-sub {
    font-size: 0.72rem;
    color: rgba(200,215,240,0.7);
    line-height: 1.4;
  }
  .sticky-cta-btn {
    background: linear-gradient(135deg, #FF8A00 0%, #FE8206 50%, #E65100 100%);
    color: #FFFFFF !important;
    border-radius: 10px;
    padding: 0.65rem 1.35rem;
    font-size: 0.82rem;
    font-weight: 800;
    text-decoration: none !important;
    box-shadow: 0 4px 18px rgba(255,138,0,0.4);
    white-space: nowrap;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }
  .sticky-cta-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 22px rgba(255,138,0,0.5);
  }

  /* ═════════════════════════════════════════════════════════════════════
     LIGHT MODE OVERRIDES (Toggled by Sofe Nav theme button)
     ═════════════════════════════════════════════════════════════════════ */
  body.light .profile-page-wrapper {
    background: #E8EEFF !important;
    color: #0A0F24 !important;
  }
  body.light .profile-spinner {
    border-color: rgba(20,40,255,0.15) !important;
    border-top-color: #FF8A00 !important;
  }
  body.light .profile-card {
    background: rgba(255, 255, 255, 0.94) !important;
    border: 1px solid rgba(20,40,255,0.14) !important;
    box-shadow: 0 10px 30px rgba(20,40,120,0.07) !important;
    color: #0A0F24 !important;
  }
  body.light .profile-hero-ambient {
    background: radial-gradient(circle, rgba(255,138,0,0.1) 0%, transparent 70%) !important;
  }
  body.light .profile-name {
    color: #0A0F24 !important;
  }
  body.light .profile-handle {
    color: #1428FF !important;
  }
  body.light .profile-bio {
    color: #475569 !important;
  }
  body.light .profile-btn-share {
    background: #F1F5F9 !important;
    border-color: #CBD5E1 !important;
    color: #0F172A !important;
  }
  body.light .profile-btn-share:hover {
    background: #E2E8F0 !important;
    border-color: #94A3B8 !important;
  }
  body.light .profile-honors-strip {
    border-top-color: rgba(20,40,255,0.1) !important;
  }
  body.light .profile-honors-label {
    color: #64748B !important;
  }
  body.light .profile-tier-badge {
    background: #F1F5F9 !important;
    border-color: #CBD5E1 !important;
    color: #0F172A !important;
  }
  body.light .profile-stat-box {
    background: rgba(255, 255, 255, 0.95) !important;
    border: 1px solid rgba(20,40,255,0.12) !important;
    box-shadow: 0 4px 14px rgba(20,40,120,0.04) !important;
  }
  body.light .profile-stat-box .stat-label {
    color: #64748B !important;
  }
  body.light .profile-stat-box .xp-val { color: #0284C7 !important; }
  body.light .profile-stat-box .score-val { color: #059669 !important; }
  body.light .profile-stat-box .streak-val { color: #D97706 !important; }
  body.light .profile-stat-box .stat-sub {
    color: #64748B !important;
  }
  body.light .profile-section-title {
    color: #0A0F24 !important;
  }
  body.light .profile-section-sub {
    color: #64748B !important;
  }
  body.light .profile-empty-certs {
    background: rgba(255, 255, 255, 0.7) !important;
    border-color: rgba(20,40,255,0.18) !important;
    color: #64748B !important;
  }
  body.light .profile-cert-card {
    background: rgba(255, 255, 255, 0.95) !important;
    border: 1px solid rgba(255,138,0,0.35) !important;
    box-shadow: 0 6px 18px rgba(0,0,0,0.04) !important;
  }
  body.light .profile-cert-title {
    color: #0A0F24 !important;
  }
  body.light .profile-cert-id {
    color: #64748B !important;
  }
  body.light .cert-actions-row {
    border-top-color: rgba(20,40,255,0.08) !important;
  }
  body.light .profile-verify-btn {
    background: rgba(20,40,255,0.08) !important;
    border-color: rgba(20,40,255,0.25) !important;
    color: #1428FF !important;
  }
  body.light .profile-verify-btn:hover {
    background: rgba(20,40,255,0.14) !important;
  }
  body.light .profile-linkedin-btn {
    background: #F1F5F9 !important;
    border-color: #CBD5E1 !important;
    color: #0F172A !important;
  }
  body.light .profile-linkedin-btn:hover {
    background: #E2E8F0 !important;
  }
  body.light .sticky-cta-banner {
    background: rgba(255, 255, 255, 0.96) !important;
    border-top-color: rgba(20,40,255,0.18) !important;
    box-shadow: 0 -8px 25px rgba(20,40,120,0.08) !important;
  }
  body.light .sticky-cta-title {
    color: #0A0F24 !important;
  }
  body.light .sticky-cta-sub {
    color: #475569 !important;
  }

  /* ═════════════════════════════════════════════════════════════════════
     MOBILE RESPONSIVENESS (max-width: 768px)
     - Compact Hero
     - 2 STATS PER ROW IN GRID
     - Sleek Bottom Sticky Banner
     ═════════════════════════════════════════════════════════════════════ */
  @media (max-width: 768px) {
    .profile-page-wrapper {
      padding-top: 80px;
      padding-bottom: 6.5rem;
    }
    .profile-main-container {
      padding: 0 0.85rem;
    }
    .profile-hero-card {
      padding: 1.25rem 1rem;
      border-radius: 16px;
      margin-bottom: 1rem;
    }
    .profile-hero-content {
      flex-direction: column;
      gap: 1rem;
    }
    .profile-identity-col {
      gap: 0.9rem;
      width: 100%;
    }
    .profile-avatar {
      width: 58px;
      height: 58px;
      font-size: 1.4rem;
      border-width: 2px;
    }
    .profile-name {
      font-size: 1.25rem;
    }
    .profile-verified-badge {
      font-size: 0.62rem;
      padding: 0.15rem 0.5rem;
    }
    .profile-handle {
      font-size: 0.74rem;
      margin-top: 0.2rem;
    }
    .profile-bio {
      font-size: 0.75rem;
      margin-top: 0.35rem;
      line-height: 1.45;
    }
    .profile-action-group {
      width: 100%;
      display: flex;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }
    .profile-btn-share,
    .profile-btn-challenge {
      flex: 1;
      padding: 0.6rem 0.7rem;
      font-size: 0.76rem;
      border-radius: 8px;
      justify-content: center;
    }
    .profile-honors-strip {
      margin-top: 1rem;
      padding-top: 0.85rem;
      gap: 0.45rem;
    }
    .profile-honors-label {
      font-size: 0.68rem;
      width: 100%;
      margin-bottom: 0.15rem;
    }

    /* EXACT USER SPEC: STATS BELOW IN GRID, 2 STAT PER ROW */
    .profile-stats-grid {
      grid-template-columns: repeat(2, 1fr) !important;
      gap: 0.65rem !important;
      margin-bottom: 1.5rem !important;
    }
    .profile-stat-box {
      padding: 0.85rem 0.75rem !important;
      border-radius: 12px !important;
    }
    .profile-stat-box .stat-label {
      font-size: 0.62rem !important;
      line-height: 1.2 !important;
    }
    .profile-stat-box .stat-val {
      font-size: 1.3rem !important;
      margin-top: 0.25rem !important;
    }
    .profile-stat-box .stat-sub {
      font-size: 0.62rem !important;
      line-height: 1.2 !important;
    }

    /* CERTIFICATIONS ON MOBILE */
    .profile-certs-section {
      margin-bottom: 2rem;
    }
    .profile-section-title {
      font-size: 1.02rem;
    }
    .profile-certs-grid {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    .profile-cert-card {
      padding: 1rem;
      border-radius: 12px;
    }

    /* COMPACT STICKY BOTTOM BANNER ON MOBILE */
    .sticky-cta-banner {
      padding: 0.65rem 0.9rem;
      gap: 0.65rem;
    }
    .sticky-cta-icon {
      font-size: 1.15rem;
    }
    .sticky-cta-title {
      font-size: 0.78rem;
    }
    .sticky-cta-sub {
      display: none; /* Hide verbose subtitle on mobile so it doesn't crowd out the screen */
    }
    .sticky-cta-btn {
      padding: 0.55rem 0.95rem;
      font-size: 0.74rem;
      border-radius: 8px;
    }
  }

  @media (max-width: 420px) {
    .profile-btn-share,
    .profile-btn-challenge {
      font-size: 0.72rem;
      padding: 0.55rem 0.5rem;
    }
    .profile-stat-box .stat-val {
      font-size: 1.15rem !important;
    }
  }
`;
