'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, doc, getDoc, collection, query, where, getDocs } from '@/lib/firebase';

const FALLBACK_COURSES = {
  'smart-contract-developer': {
    id: 'smart-contract-developer',
    title: 'Smart Contract Development',
    description: 'Learn to write, audit, and deploy secure smart contracts on leading blockchain networks to power decentralized applications.',
    tier: 'track',
    price: 200000,
    duration_weeks: 12,
    cohort_based: true,
    modules: [
      { id: 'm1', title: 'Ethereum & EVM Primitives', description: 'Deep dive into accounts, state trie, gas dynamics, opcodes, and bytecode execution.' },
      { id: 'm2', title: 'Solidity Core & Advanced Architecture', description: 'Data structures, inheritance, events, custom errors, immutables, and interfaces.' },
      { id: 'm3', title: 'Smart Contract Security & Vulnerabilities', description: 'Reentrancy, integer overflows, oracle manipulation, flash loan resistance, and formal verification.' },
      { id: 'm4', title: 'Token Standards & DeFi Engineering', description: 'Architecting ERC20, ERC721, ERC1155, Automated Market Makers (AMM), and yield vaults.' },
      { id: 'm5', title: 'Hardhat, Foundry & Comprehensive Testing', description: 'Unit testing, invariant testing, fuzz testing, and mainnet fork simulations.' },
      { id: 'm6', title: 'Upgradable Contracts & Proxy Patterns', description: 'Transparent, UUPS, and Beacon proxy patterns with storage collision avoidance.' },
      { id: 'm7', title: 'Layer 2 Rollups & Cross-Chain Oracles', description: 'Deploying to Arbitrum, Base, Optimism, and integrating Chainlink oracles.' },
      { id: 'm8', title: 'Capstone Protocol: Production Audit & Deployment', description: 'Build and audit a full-fledged DeFi or NFT protocol ready for mainnet launch.' }
    ]
  },
  'smart-contract-development': {
    id: 'smart-contract-developer',
    title: 'Smart Contract Development',
    description: 'Learn to write, audit, and deploy secure smart contracts on leading blockchain networks to power decentralized applications.',
    tier: 'track',
    price: 200000,
    duration_weeks: 12,
    cohort_based: true
  },
  'foundation': {
    id: 'foundation',
    title: 'Blockchain & Cryptocurrency Foundation',
    description: 'Master the fundamental primitives of blockchain architecture, digital wallets, decentralized protocols, and crypto economics.',
    tier: 'foundation',
    price: 0,
    duration_weeks: 4,
    cohort_based: false,
    modules: [
      { id: 'f1', title: 'Introduction to Blockchain & Cryptography', description: 'Decentralization, consensus mechanisms, hashing, and public-private key cryptography.' },
      { id: 'f2', title: 'Digital Wallets & Transaction Dynamics', description: 'Setting up self-custodial wallets, transaction signing, gas fees, and blockchain explorers.' },
      { id: 'f3', title: 'Smart Contracts & Decentralized Applications (dApps)', description: 'How smart contracts run on EVM, interaction models, and Web3 browsing.' },
      { id: 'f4', title: 'Ecosystem Safety, Tokenomics & Career Pathways', description: 'Avoiding scams, understanding token utility, and navigating career tracks in Web3.' }
    ]
  }
};

export default function CourseDetailClient({ courseIdProp }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathId = typeof window !== 'undefined' ? window.location.pathname.split('/').filter(Boolean)[1] : null;
  const courseId = (courseIdProp && courseIdProp !== 'general') ? courseIdProp : (searchParams.get('id') || searchParams.get('course') || pathId || 'foundation');

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      setLoading(true);
      setError(false);
      try {
        let cs = null;
        try {
          const docSnap = await getDoc(doc(db, 'courses', courseId));
          if (docSnap.exists()) {
            cs = { id: docSnap.id, ...docSnap.data() };
          } else {
            const qSnap = await getDocs(query(collection(db, 'courses'), where('slug', '==', courseId)));
            if (!qSnap.empty) {
              cs = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
            }
          }
        } catch (e) {
          console.warn('Firestore course query note:', e);
        }

        // Check fallback
        if (!cs && FALLBACK_COURSES[courseId]) {
          cs = FALLBACK_COURSES[courseId];
        }

        if (cs) {
          setCourse(cs);

          // Fetch modules from Firestore if available
          let fetchedModules = [];
          try {
            const modSnap = await getDocs(query(collection(db, 'modules'), where('course_id', '==', cs.id)));
            if (!modSnap.empty) {
              fetchedModules = modSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
            }
          } catch (e) {}

          // Fallback modules
          if (fetchedModules.length === 0 && FALLBACK_COURSES[cs.id]?.modules) {
            fetchedModules = FALLBACK_COURSES[cs.id].modules;
          } else if (fetchedModules.length === 0 && FALLBACK_COURSES[courseId]?.modules) {
            fetchedModules = FALLBACK_COURSES[courseId].modules;
          }

          setModules(fetchedModules);
        } else {
          setError(true);
        }
      } catch (e) {
        console.error('Error loading course:', e);
        if (FALLBACK_COURSES[courseId]) {
          setCourse(FALLBACK_COURSES[courseId]);
          setModules(FALLBACK_COURSES[courseId].modules || []);
        } else {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    }

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white, #fff)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📚</div>
          <p style={{ color: 'var(--muted, rgba(238,244,255,0.6))' }}>Loading course syllabus...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{ minHeight: '70vh', padding: '5rem 2rem', textAlign: 'center', color: 'var(--white, #fff)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Course Not Found</h2>
        <p style={{ color: 'var(--muted, rgba(238,244,255,0.6))', margin: '1rem 0 2rem' }}>
          This course doesn&apos;t exist or is undergoing syllabus updates.
        </p>
        <Link
          href="/academy"
          style={{
            background: '#1428FF',
            color: '#fff',
            padding: '0.65rem 1.6rem',
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          ← Browse All Courses
        </Link>
      </div>
    );
  }

  const isFree = !course.price || course.price === 0;
  const priceDisplay = isFree ? 'FREE' : `₦${Number(course.price).toLocaleString('en-NG')}`;
  const tierClass = course.tier === 'foundation' ? 'foundation' : course.tier === 'executive' ? 'executive' : 'track';
  const tierLabel = course.tier === 'foundation' ? 'Foundation Course' : course.tier === 'executive' ? 'Executive Program' : 'Career Track';
  const enrolUrl = course.tier === 'executive' ? `/cbie-application?course=${course.id}` : `/payment-flow?course=${course.id}`;

  return (
    <div className="course-detail-root" style={{ minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      <link rel="stylesheet" href="/css/course-detail.css" />

      {/* HERO SECTION */}
      <section className="course-hero">
        <div className="course-hero-content">
          <div className="course-main-info">
            <div className={`course-tier-badge ${tierClass}`}>
              {tierLabel}
            </div>

            <h1>{course.title}</h1>

            <p className="course-description">
              {course.description}
            </p>

            <div className="course-meta">
              <div className="meta-item">
                <div className="meta-icon">📅</div>
                <div className="meta-text">
                  <span className="meta-label">Duration</span>
                  <span className="meta-value">{course.duration_weeks || 12} weeks</span>
                </div>
              </div>
              <div className="meta-item">
                <div className="meta-icon">👥</div>
                <div className="meta-text">
                  <span className="meta-label">Learning Mode</span>
                  <span className="meta-value">{course.cohort_based ? 'Cohort-based' : 'Self-paced'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR SALES CARD */}
          <div className="course-sidebar-card">
            <div className="sidebar-price">
              <div className="price-main">{priceDisplay}</div>
              <div className="price-sub">{isFree ? 'Self-Paced Access' : 'One-time Payment'}</div>
            </div>

            <div className="sidebar-includes">
              <h3>What&apos;s Included:</h3>
              <div className="sidebar-includes-item">
                <span className="check-icon">✓</span>
                <span>Foundation Course included</span>
              </div>
              <div className="sidebar-includes-item">
                <span className="check-icon">✓</span>
                <span>Industry-specific training</span>
              </div>
              <div className="sidebar-includes-item">
                <span className="check-icon">✓</span>
                <span>Capstone project</span>
              </div>
              <div className="sidebar-includes-item">
                <span className="check-icon">✓</span>
                <span>Job-ready certificate</span>
              </div>
            </div>

            <Link href={enrolUrl} style={{ textDecoration: 'none' }}>
              <button className="enrol-btn">
                {isFree ? 'Start Free Course →' : 'ENROL NOW →'}
              </button>
            </Link>

            {course.tier !== 'foundation' && (
              <div className="foundation-notice">
                <span>✓</span>
                <span>Foundation Course included — must be completed before track modules unlock.</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CURRICULUM SYLLABUS SECTION */}
      <section className="course-content">
        <div className="content-section">
          <h2 className="section-title">Course Curriculum</h2>
          <p style={{ color: 'var(--sn-muted)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
            Industry-vetted syllabus designed to turn curious talents into productive Web3 operators and engineers.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modules.map((m, idx) => (
              <div
                key={m.id || idx}
                style={{
                  background: 'var(--sn-panel)',
                  border: '1px solid var(--sn-border)',
                  borderRadius: 12,
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem'
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--sn-orange-dim)',
                  border: '1px solid rgba(255,138,0,0.3)',
                  color: 'var(--sn-orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--sn-text)' }}>{m.title}</h3>
                  {m.description && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--sn-muted)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                      {m.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
