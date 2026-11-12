'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const CHALLENGE_QUESTION_POOLS = {
  'mod-1': [
    {
      id: 'm1-q1',
      text: 'What makes a blockchain ledger fundamentally distinct from a centralized cloud database?',
      options: [
        'It requires no internet connection to query records',
        'It is immutable, append-only, and synchronized across distributed nodes',
        'It encrypts data with proprietary corporate passwords',
        'It only operates when run on government servers'
      ],
      correct: 1,
      explanation: 'Blockchains are append-only distributed ledgers maintained by independent nodes without a central gatekeeper.'
    },
    {
      id: 'm1-q2',
      text: 'What role does a cryptographic hash function (like SHA-256) play in a blockchain?',
      options: [
        'It calculates annual staking dividends automatically',
        'It converts transactions into fixed-length mathematical fingerprints that chain blocks together',
        'It compresses video files stored inside smart contracts',
        'It guarantees zero gas fees for miners'
      ],
      correct: 1,
      explanation: 'Hashes link each block to the previous block hash, making tampering computationally detectable.'
    },
    {
      id: 'm1-q3',
      text: 'If a malicious actor attempts to alter a transaction in a block 10 blocks in the past, what happens?',
      options: [
        'The blockchain automatically accepts the newest change',
        'Only that single block changes; later blocks remain valid',
        'The block hash changes, invalidating all subsequent block hashes and being rejected by the network consensus',
        'The miner receives a fine deducted from their wallet'
      ],
      correct: 2,
      explanation: 'Because every subsequent block references the previous hash, altering one block breaks the entire forward chain.'
    }
  ],
  'default': [
    {
      id: 'def-q1',
      text: 'In Web3 non-custodial wallets, what does your 12 or 24-word Secret Recovery Phrase represent?',
      options: [
        'A temporary password that resets every 30 days',
        'The master seed used to derive all your private keys and addresses',
        'The verification code sent via SMS by your wallet provider',
        'A public username you share to receive payments'
      ],
      correct: 1,
      explanation: 'Your seed phrase is the master mathematical root of your private keys. Anyone with it controls your assets.'
    },
    {
      id: 'def-q2',
      text: 'What is a "Smart Contract" in practical terms?',
      options: [
        'A legal PDF agreement signed using DocuSign',
        'Self-executing code deployed to a blockchain that runs exactly as programmed without intermediaries',
        'An AI algorithm that predicts cryptocurrency price swings',
        'A banking license issued by a central monetary authority'
      ],
      correct: 1,
      explanation: 'Smart contracts are immutable programs on-chain that automatically enforce rules and state transitions.'
    },
    {
      id: 'def-q3',
      text: 'Why do Web3 protocols reward validators and miners with native tokens?',
      options: [
        'To incentivize nodes to honestly secure the network and order transactions according to consensus',
        'Because traditional banks refuse to pay network electricity bills',
        'To artificially inflate market capitalization on social media',
        'To pay royalties to the original software inventors'
      ],
      correct: 0,
      explanation: 'Economic incentives align the self-interest of independent operators with the security of the decentralized network.'
    }
  ]
};

const MODULE_NAMES = {
  'mod-1': 'Introduction to Blockchain & Cryptography',
  'mod-2': 'Consensus Mechanisms & Smart Contracts',
  'mod-3': 'Wallets, Security & DeFi Architecture',
  'default': 'Blockchain & Web3 Foundation'
};

export default function ChallengeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const refCode = searchParams.get('ref') || 'SOFE';
  const moduleId = searchParams.get('module') || 'mod-1';
  const referrerScore = parseInt(searchParams.get('score') || '97', 10);
  const referrerName = searchParams.get('student') ? decodeURIComponent(searchParams.get('student')) : 'A Sofe Node Builder';

  const moduleTitle = MODULE_NAMES[moduleId] || MODULE_NAMES['default'];
  const questions = CHALLENGE_QUESTION_POOLS[moduleId] || CHALLENGE_QUESTION_POOLS['default'];

  // Game state: 'lobby' | 'playing' | 'results'
  const [phase, setPhase] = useState('lobby');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60);
  const timerRef = useRef(null);

  // Start the 60s timer
  const startChallenge = () => {
    setPhase('playing');
    setTimeLeft(60);
    setCurrentIdx(0);
    setUserAnswers({});

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase('results');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSelectAnswer = (optionIdx) => {
    const updated = { ...userAnswers, [currentIdx]: optionIdx };
    setUserAnswers(updated);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('results');
    }
  };

  // Calculate score
  let correctCount = 0;
  questions.forEach((q, idx) => {
    if (userAnswers[idx] === q.correct) correctCount++;
  });
  const userScorePct = Math.round((correctCount / questions.length) * 100);
  const didWin = userScorePct >= referrerScore;

  const signupUrl = `/signup?ref=${encodeURIComponent(refCode)}&challenge=completed&score=${userScorePct}&bonus=15&discount=CHALLENGE20`;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #040812 0%, #060B17 50%, #0A1329 100%)',
      color: '#FFFFFF',
      fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
      padding: '2rem 1.25rem 4rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Ambient Glows */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(20,40,255,0.18) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '15%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(255,138,0,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* Top Navbar */}
      <div style={{
        width: '100%',
        maxWidth: 680,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '2rem',
        zIndex: 2
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src="/images/Nodes/SofeLogoHome.png"
            alt="Sofe Node"
            style={{
              height: 34,
              width: 'auto',
              filter: 'brightness(1.5) saturate(1.3) drop-shadow(0 0 8px rgba(0,180,255,0.4))'
            }}
          />
        </Link>
        <span style={{
          fontSize: '0.74rem',
          fontWeight: 700,
          background: 'rgba(255,138,0,0.15)',
          border: '1px solid #FF8A00',
          color: '#FFB03A',
          padding: '0.35rem 0.85rem',
          borderRadius: 20,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          ⚡ Live Peer Challenge
        </span>
      </div>

      {/* Main Card Container */}
      <div style={{
        width: '100%',
        maxWidth: 680,
        background: 'rgba(9, 17, 36, 0.85)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(20, 40, 255, 0.3)',
        borderRadius: 20,
        padding: '2.25rem 2rem',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
        zIndex: 2
      }}>

        {/* ── PHASE 1: LOBBY ── */}
        {phase === 'lobby' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              background: 'rgba(0, 229, 255, 0.12)',
              border: '1px solid #00E5FF',
              borderRadius: 30,
              color: '#00E5FF',
              fontSize: '0.8rem',
              fontWeight: 700,
              marginBottom: '1.25rem'
            }}>
              <span>⚔️</span> Direct Student Challenge
            </div>

            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, lineHeight: 1.3, marginBottom: '0.75rem' }}>
              Think you know Web3 better than <span style={{ color: '#FF8A00' }}>{referrerName}</span>?
            </h1>

            <p style={{ color: 'rgba(238, 244, 255, 0.75)', fontSize: '0.92rem', lineHeight: 1.6, maxWidth: 520, margin: '0 auto 1.75rem' }}>
              {referrerName} just scored <strong>{referrerScore}%</strong> on the <em>{moduleTitle}</em> assessment on Sofe Node Academy.
              Answer 3 rapid-fire questions in 60 seconds to beat their score.
            </p>

            {/* Scorecard Callout Card */}
            <div style={{
              background: '#060B17',
              border: '1px solid rgba(255, 138, 0, 0.35)',
              borderRadius: 12,
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Referrer Score
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#00E5FF' }}>
                  {referrerScore}%
                </div>
              </div>

              <div style={{ height: 40, width: 1, background: 'rgba(255,255,255,0.1)' }} />

              <div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Challenge Clock
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#FF8A00' }}>
                  60s
                </div>
              </div>

              <div style={{ height: 40, width: 1, background: 'rgba(255,255,255,0.1)' }} />

              <div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Reward
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981', marginTop: '0.4rem' }}>
                  +15 XP & 20% OFF
                </div>
              </div>
            </div>

            <button
              onClick={startChallenge}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #FF8A00 0%, #FE8206 50%, #E65100 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                boxShadow: '0 8px 25px rgba(255,138,0,0.4)',
                transition: 'transform 0.15s ease'
              }}
            >
              Accept Challenge & Start 60s Clock ⚡
            </button>
          </div>
        )}

        {/* ── PHASE 2: PLAYING ── */}
        {phase === 'playing' && (
          <div>
            {/* Header info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#00E5FF' }}>
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span style={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: timeLeft < 15 ? '#FF5555' : '#FF8A00'
              }}>
                ⏱ {timeLeft}s remaining
              </span>
            </div>

            {/* Time progress bar */}
            <div style={{
              width: '100%',
              height: 6,
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 3,
              overflow: 'hidden',
              marginBottom: '1.75rem'
            }}>
              <div style={{
                height: '100%',
                width: `${(timeLeft / 60) * 100}%`,
                background: timeLeft < 15 ? '#FF5555' : 'linear-gradient(90deg, #00E5FF, #FF8A00)',
                transition: 'width 1s linear'
              }} />
            </div>

            {/* Question Card */}
            <h2 style={{
              fontSize: '1.15rem',
              fontWeight: 700,
              lineHeight: 1.5,
              marginBottom: '1.5rem',
              color: '#FFFFFF'
            }}>
              {questions[currentIdx].text}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {questions[currentIdx].options.map((opt, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handleSelectAnswer(optIdx)}
                  style={{
                    textAlign: 'left',
                    padding: '1rem 1.25rem',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(20,40,255,0.25)',
                    color: '#EEF4FF',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(20,40,255,0.2)';
                    e.currentTarget.style.borderColor = '#00E5FF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(20,40,255,0.25)';
                  }}
                >
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    flexShrink: 0
                  }}>
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span style={{ lineHeight: 1.4 }}>{opt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── PHASE 3: RESULTS & CONVERSION ── */}
        {phase === 'results' && (
          <div style={{ textAlign: 'center' }}>
            {/* Header Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.9rem',
              borderRadius: 20,
              fontSize: '0.78rem',
              fontWeight: 800,
              background: didWin ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 138, 0, 0.15)',
              border: `1px solid ${didWin ? '#10B981' : '#FF8A00'}`,
              color: didWin ? '#10B981' : '#FFB03A',
              marginBottom: '1rem'
            }}>
              {didWin ? '🏆 PEER CHALLENGE WON!' : '⚡ CHALLENGE COMPLETED!'}
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {didWin
                ? `You outperformed ${referrerName}!`
                : `Solid effort against ${referrerName}!`}
            </h1>

            <p style={{ color: 'rgba(238, 244, 255, 0.75)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
              {correctCount} of {questions.length} questions answered correctly.
            </p>

            {/* Head to Head Comparison */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '1.75rem'
            }}>
              <div style={{
                background: 'rgba(0, 229, 255, 0.08)',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                borderRadius: 12,
                padding: '1.25rem 1rem'
              }}>
                <div style={{ fontSize: '0.74rem', color: '#00E5FF', fontWeight: 700, textTransform: 'uppercase' }}>
                  Your Score
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#00E5FF', marginTop: '0.2rem' }}>
                  {userScorePct}%
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(238,244,255,0.6)', marginTop: '0.2rem' }}>
                  {correctCount}/{questions.length} Correct
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 138, 0, 0.08)',
                border: '1px solid rgba(255, 138, 0, 0.3)',
                borderRadius: 12,
                padding: '1.25rem 1rem'
              }}>
                <div style={{ fontSize: '0.74rem', color: '#FF8A00', fontWeight: 700, textTransform: 'uppercase' }}>
                  {referrerName}
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#FF8A00', marginTop: '0.2rem' }}>
                  {referrerScore}%
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(238,244,255,0.6)', marginTop: '0.2rem' }}>
                  Verified Assessment
                </div>
              </div>
            </div>

            {/* 24-HOUR DISCOUNT PROMO CARD */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(20,40,255,0.2) 0%, rgba(255,138,0,0.15) 100%)',
              border: '1px solid #FF8A00',
              borderRadius: 14,
              padding: '1.25rem 1.5rem',
              textAlign: 'left',
              marginBottom: '1.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FF8A00', textTransform: 'uppercase' }}>
                  🔥 24-Hour Special Reward
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'rgba(255, 85, 85, 0.2)',
                  border: '1px solid #FF5555',
                  color: '#FF8888',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 10
                }}>
                  ⏱ Expires in 24:00:00
                </span>
              </div>

              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.35rem' }}>
                20% Discount Unlocked: Foundational Web3 Course
              </div>

              <p style={{ fontSize: '0.78rem', color: 'rgba(238,244,255,0.8)', lineHeight: 1.5, margin: 0 }}>
                Create your account in 10 seconds to claim your <strong>+15 XP</strong>, lock in your leaderboard rank, and apply your <strong>20% discount</strong> to become a validated Web3 builder.
              </p>
            </div>

            {/* Big Action Button */}
            <button
              onClick={() => router.push(signupUrl)}
              style={{
                width: '100%',
                padding: '1.1rem',
                fontSize: '1rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #FF8A00 0%, #FE8206 50%, #E65100 100%)',
                color: '#FFFFFF',
                borderRadius: 12,
                border: 'none',
                boxShadow: '0 8px 30px rgba(255,138,0,0.4)',
                cursor: 'pointer',
                marginBottom: '0.75rem'
              }}
            >
              Claim +15 XP & 20% Discount on Enrollment →
            </button>

            <button
              onClick={startChallenge}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(200,215,240,0.65)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Retake Challenge
            </button>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div style={{
        marginTop: '2rem',
        fontSize: '0.74rem',
        color: 'rgba(200,215,240,0.5)',
        textAlign: 'center',
        zIndex: 2
      }}>
        Sofe Node Academy • Web3 Ecosystem • Verified Talent Network
      </div>
    </div>
  );
}
