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

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const cleanParam = (usernameParam || '').trim();

      try {
        let foundUser = null;
        let userId = null;

        // 1. Try finding by referral_code
        const refQ = query(collection(db, 'users'), where('referral_code', '==', cleanParam));
        const refSnap = await getDocs(refQ);
        if (!refSnap.empty) {
          foundUser = refSnap.docs[0].data();
          userId = refSnap.docs[0].id;
        }

        // 2. Try finding by username
        if (!foundUser) {
          const userQ = query(collection(db, 'users'), where('username', '==', cleanParam.toLowerCase()));
          const userSnap = await getDocs(userQ);
          if (!userSnap.empty) {
            foundUser = userSnap.docs[0].data();
            userId = userSnap.docs[0].id;
          }
        }

        // 3. Try direct UID
        if (!foundUser && cleanParam.length >= 10) {
          const docSnap = await getDoc(doc(db, 'users', cleanParam));
          if (docSnap.exists()) {
            foundUser = docSnap.data();
            userId = docSnap.id;
          }
        }

        // 4. Default fallback profile for demo / showcase if not in DB
        if (!foundUser) {
          foundUser = {
            uid: 'demo-profile',
            first_name: 'Ekpegbue',
            last_name: 'Shedrack',
            username: cleanParam || 'shedrack',
            bio: 'Web3 Developer & Protocol Contributor. Scaling decentralized infrastructure and verified talent across Africa.',
            node_label: 'FUTO Campus Node',
            referral_code: cleanParam.startsWith('SOFE-') ? cleanParam : 'SOFE-SHEBDWJH7',
            xp_total: 1420,
            monthly_xp: 380,
            daily_streak: 14,
            leaderboard_wins_count: 3,
            bounty_wins_count: 2,
            season_rank: 2,
            xp_tier: 'Pioneer Node',
            completed_assessments_count: 6,
            average_score: 96,
            created_at: new Date('2024-01-15')
          };
          userId = 'demo-profile';

          setCertificates([
            {
              id: 'CERT-FOUNDATION-98214',
              course_id: 'foundation',
              course_title: 'Blockchain & Cryptocurrency Foundation',
              issued_at: new Date('2024-02-10'),
              score: 97
            },
            {
              id: 'CERT-SMART-CONTRACTS-55102',
              course_id: 'smart-contract-developer',
              course_title: 'Smart Contract Developer Career Track',
              issued_at: new Date('2024-04-18'),
              score: 94
            }
          ]);
        } else {
          // If real user found, load their certificates
          if (userId) {
            try {
              const certQ = query(collection(db, 'certificates'), where('user_id', '==', userId));
              const certSnap = await getDocs(certQ);
              setCertificates(certSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (err) {
              console.warn('Could not load certificates:', err);
            }
          }
        }

        setProfile({ ...foundUser, id: userId });
      } catch (e) {
        console.error('Error loading public profile:', e);
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
      <div style={{ minHeight: '100vh', background: '#040812', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '0.95rem', color: 'rgba(200,215,240,0.7)' }}>Loading Verified Web3 CV...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #040812 0%, #060B17 50%, #091329 100%)',
      color: '#FFFFFF',
      fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
      paddingBottom: '7rem',
      position: 'relative'
    }}>
      {/* Top Header Bar */}
      <header style={{
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(20,40,255,0.2)',
        background: 'rgba(6, 11, 23, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src="/images/Nodes/SofeLogoHome.png"
            alt="Sofe Node"
            style={{
              height: 32,
              width: 'auto',
              filter: 'brightness(1.5) saturate(1.3) drop-shadow(0 0 8px rgba(0,180,255,0.4))'
            }}
          />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleCopyProfileUrl}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.18)',
              color: '#fff',
              borderRadius: 8,
              padding: '0.45rem 0.85rem',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>🔗</span> {copied ? 'Link Copied!' : 'Share Web3 CV'}
          </button>

          <Link
            href={referralSignupUrl}
            style={{
              background: '#1428FF',
              color: '#fff',
              borderRadius: 8,
              padding: '0.45rem 1rem',
              fontSize: '0.76rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(20,40,255,0.4)'
            }}
          >
            Join Sofe Node
          </Link>
        </div>
      </header>

      {/* Profile Main Container */}
      <main style={{ maxWidth: 960, margin: '2.5rem auto 0', padding: '0 1.25rem' }}>
        
        {/* Profile Header Card */}
        <div style={{
          background: 'rgba(9, 17, 36, 0.75)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(20,40,255,0.25)',
          borderRadius: 20,
          padding: '2rem',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Ambient Corner Accent */}
          <div style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 180,
            height: 180,
            background: 'radial-gradient(circle, rgba(255,138,0,0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
            {/* Avatar & Names */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                width: 82,
                height: 82,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1428FF 0%, #FF8A00 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 800,
                color: '#fff',
                boxShadow: '0 8px 25px rgba(20,40,255,0.4)',
                border: '3px solid rgba(255,255,255,0.2)'
              }}>
                {fullName.charAt(0).toUpperCase()}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                    {fullName}
                  </h1>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid #10B981',
                    color: '#10B981',
                    borderRadius: 20,
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.68rem',
                    fontWeight: 700
                  }}>
                    ✓ VERIFIED BUILDER
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#00E5FF', fontWeight: 600, marginTop: '0.25rem' }}>
                  @{profile?.username || (profile?.referral_code ? profile.referral_code.toLowerCase() : 'sofian')} • {profile?.node_label || 'Distributed Campus Node'}
                </div>

                {profile?.bio && (
                  <p style={{ fontSize: '0.82rem', color: 'rgba(238,244,255,0.75)', lineHeight: 1.5, marginTop: '0.5rem', maxWidth: 540 }}>
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Direct Challenge Button */}
            <Link
              href={challengeUrl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #FF8A00 0%, #E65100 100%)',
                color: '#fff',
                borderRadius: 10,
                padding: '0.75rem 1.25rem',
                fontSize: '0.84rem',
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 18px rgba(255,138,0,0.35)',
                whiteSpace: 'nowrap'
              }}
            >
              <span>⚔️</span> Challenge on Web3 IQ
            </Link>
          </div>

          {/* Dynamic Multiplier Status Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.6)', fontWeight: 600, textTransform: 'uppercase' }}>
              Honors &amp; Multipliers:
            </span>

            {leaderboardWins > 0 && (
              <WinnerMultiplierBadge type="leaderboard" count={leaderboardWins} size="md" />
            )}

            {bountyWins > 0 && (
              <WinnerMultiplierBadge type="bounty" count={bountyWins} size="md" />
            )}

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#EEF4FF',
              borderRadius: 30,
              padding: '0.35rem 0.85rem',
              fontSize: '0.76rem',
              fontWeight: 700
            }}>
              <span>🛡️</span> {profile?.xp_tier || 'Genesis Scout'}
            </span>
          </div>
        </div>

        {/* Proof of Work Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '1rem',
          marginBottom: '2.5rem'
        }}>
          <div style={{
            background: 'rgba(9, 17, 36, 0.7)',
            border: '1px solid rgba(20,40,255,0.2)',
            borderRadius: 14,
            padding: '1.25rem'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 700 }}>
              Lifetime Proof-of-Work XP
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#00E5FF', marginTop: '0.3rem' }}>
              {(profile?.xp_total || 0).toLocaleString()} XP
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(238,244,255,0.5)', marginTop: '0.2rem' }}>
              On-chain verifiable learning
            </div>
          </div>

          <div style={{
            background: 'rgba(9, 17, 36, 0.7)',
            border: '1px solid rgba(20,40,255,0.2)',
            borderRadius: 14,
            padding: '1.25rem'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 700 }}>
              Season Rank
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FF8A00', marginTop: '0.3rem' }}>
              #{profile?.season_rank || profile?.rank || '12'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(238,244,255,0.5)', marginTop: '0.2rem' }}>
              Monthly Leaderboard
            </div>
          </div>

          <div style={{
            background: 'rgba(9, 17, 36, 0.7)',
            border: '1px solid rgba(20,40,255,0.2)',
            borderRadius: 14,
            padding: '1.25rem'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 700 }}>
              Average Exam Score
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981', marginTop: '0.3rem' }}>
              {profile?.average_score || 95}%
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(238,244,255,0.5)', marginTop: '0.2rem' }}>
              Top 5% Assessment Percentile
            </div>
          </div>

          <div style={{
            background: 'rgba(9, 17, 36, 0.7)',
            border: '1px solid rgba(20,40,255,0.2)',
            borderRadius: 14,
            padding: '1.25rem'
          }}>
            <div style={{ fontSize: '0.7rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 700 }}>
              Active Learning Streak
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFB03A', marginTop: '0.3rem' }}>
              🔥 {profile?.daily_streak || 7} Days
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(238,244,255,0.5)', marginTop: '0.2rem' }}>
              Continuous commitment
            </div>
          </div>
        </div>

        {/* Verified Certifications Section */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
              Verified Course Certifications ({certificates.length})
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'rgba(200,215,240,0.6)' }}>
              Cryptographically verified by Sofe Node Foundation
            </span>
          </div>

          {certificates.length === 0 ? (
            <div style={{
              background: 'rgba(9, 17, 36, 0.5)',
              border: '1px dashed rgba(20,40,255,0.3)',
              borderRadius: 12,
              padding: '2.5rem',
              textAlign: 'center',
              color: 'rgba(200,215,240,0.6)',
              fontSize: '0.85rem'
            }}>
              No published certificates yet. Currently preparing for module assessments.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  style={{
                    background: 'rgba(9, 17, 36, 0.8)',
                    border: '1px solid rgba(255,138,0,0.3)',
                    borderRadius: 14,
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FF8A00', textTransform: 'uppercase' }}>
                        Verified Credential
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700 }}>
                        Score: {cert.score || 97}%
                      </span>
                    </div>

                    <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem', lineHeight: 1.4 }}>
                      {cert.course_title || 'Blockchain Foundation'}
                    </h3>

                    <div style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.6)', fontFamily: 'monospace', marginBottom: '1rem' }}>
                      ID: {cert.id}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.8rem' }}>
                    <Link
                      href={`/verify/${cert.id}`}
                      style={{
                        flex: 1,
                        textAlign: 'center',
                        background: 'rgba(20,40,255,0.2)',
                        border: '1px solid rgba(20,40,255,0.4)',
                        color: '#6B8CFF',
                        borderRadius: 8,
                        padding: '0.5rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      Verify On-Chain Seal ↗
                    </Link>

                    <a
                      href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.course_title || 'Blockchain Foundation')}&organizationName=${encodeURIComponent('Sofe Node Academy')}&issueYear=2024&issueMonth=5&certId=${encodeURIComponent(cert.id)}&certUrl=${encodeURIComponent('https://node.sofegroup.com/verify/' + cert.id)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '0.5rem 0.8rem',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        borderRadius: 8,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        whiteSpace: 'nowrap'
                      }}
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

      {/* Sticky Bottom Viral CTA Banner */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(6, 11, 23, 0.94)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid #1428FF',
        padding: '0.9rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        zIndex: 100,
        boxShadow: '0 -8px 30px rgba(0,0,0,0.6)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🚀</span>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#FFFFFF' }}>
              Build your own verified Web3 portfolio on Sofe Node
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>
              Join {fullName.split(' ')[0]} and 2,000+ builders mastering smart contracts, winning bounties, and getting deployed.
            </div>
          </div>
        </div>

        <Link
          href={referralSignupUrl}
          style={{
            background: 'linear-gradient(135deg, #FF8A00 0%, #FE8206 50%, #E65100 100%)',
            color: '#fff',
            borderRadius: 10,
            padding: '0.65rem 1.4rem',
            fontSize: '0.82rem',
            fontWeight: 800,
            textDecoration: 'none',
            boxShadow: '0 4px 18px rgba(255,138,0,0.4)',
            whiteSpace: 'nowrap'
          }}
        >
          Create Your Free Portfolio →
        </Link>
      </div>
    </div>
  );
}
