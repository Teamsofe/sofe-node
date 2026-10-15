'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, collection, query, where, orderBy, getDocs } from '@/lib/firebase';

const STATIC_POSTS = [
  {
    id: 'why-africa-poised-to-lead-web3',
    title: "Why Africa Is Poised to Lead the Next Wave of Web3 Adoption",
    snippet: "With over 1.4 billion people, a median age of 19, and fast smartphone penetration, Africa is uniquely positioned to leapfrog traditional finance into decentralised systems.",
    category: 'africa',
    author: 'Chidi Nwosu',
    readTime: '8 min read',
    date: 'March 18, 2026',
    emoji: '🌍'
  },
  {
    id: 'blockchain-basics-first-timer',
    title: 'Blockchain Basics: What Every First-Timer in Nigeria Needs to Know',
    snippet: 'Starting your Web3 journey can feel overwhelming. We break down the five core concepts every beginner must understand before touching a crypto wallet.',
    category: 'education',
    author: 'Amaka Obi',
    readTime: '5 min read',
    date: 'March 14, 2026',
    emoji: '📚'
  },
  {
    id: 'how-to-land-remote-web3-job',
    title: 'How to Land a Remote Web3 Job from Africa in 2026',
    snippet: 'The demand for technical and non-technical blockchain talent has never been higher. Here is our step-by-step roadmap to building proof-of-work that gets you hired globally.',
    category: 'career',
    author: 'Tobi Alabi',
    readTime: '6 min read',
    date: 'March 10, 2026',
    emoji: '💼'
  },
  {
    id: 'understanding-crypto-bounties',
    title: 'Understanding Crypto Bounties: How Students Earn While Learning',
    snippet: 'Protocol partner bounties allow ambitious African students to solve real-world problems and earn USDT while still studying in university.',
    category: 'web3',
    author: 'Sofe Research',
    readTime: '7 min read',
    date: 'March 5, 2026',
    emoji: '🎯'
  }
];

export default function BlogClient() {
  const [posts, setPosts] = useState(STATIC_POSTS);
  const [activeCat, setActiveCat] = useState('all');

  useEffect(() => {
    async function loadDynamicPosts() {
      try {
        const snap = await getDocs(query(collection(db, 'posts'), where('status', '==', 'published'), orderBy('created_at', 'desc')));
        if (!snap.empty) {
          const remote = snap.docs.map((d) => ({
            id: d.id,
            title: d.data().title,
            snippet: d.data().snippet || d.data().summary || '',
            category: d.data().category || 'web3',
            author: d.data().author || 'Sofe Editorial',
            readTime: d.data().read_time || '5 min read',
            date: d.data().published_at?.toDate ? d.data().published_at.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent',
            emoji: d.data().emoji || '📝'
          }));
          setPosts([...remote, ...STATIC_POSTS]);
        }
      } catch (e) {}
    }
    loadDynamicPosts();
  }, []);

  const filtered = activeCat === 'all' ? posts : posts.filter((p) => p.category === activeCat);

  return (
    <div style={{ background: '#040810', color: '#c8d7f0', minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      <link rel="stylesheet" href="/css/blog.css" />

      {/* HEADER */}
      <section style={{
        padding: '8.5rem 1.5rem 2.5rem',
        textAlign: 'center',
        background: 'radial-gradient(circle at 50% 20%, rgba(20,40,255,.12), transparent 60%)'
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FF8A00', marginBottom: '0.8rem' }}>
          Sofe Node Blog
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, color: '#fff', marginBottom: '0.8rem' }}>
          Web3 Insights for <span style={{ color: '#FF8A00' }}>Africa</span>
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'rgba(200,215,240,0.65)', maxWidth: 580, margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Education, industry news, career guides and on-chain analysis — written for the next generation of African blockchain talent.
        </p>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { id: 'all', label: 'All Posts' },
            { id: 'web3', label: 'Web3 & Blockchain' },
            { id: 'education', label: 'Education' },
            { id: 'career', label: 'Careers' },
            { id: 'africa', label: 'Africa Focus' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              style={{
                background: activeCat === cat.id ? '#1428FF' : '#0a1628',
                border: '1px solid rgba(200,215,240,0.15)',
                color: activeCat === cat.id ? '#fff' : 'rgba(200,215,240,0.65)',
                borderRadius: 50,
                padding: '0.45rem 1.1rem',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* BLOG POSTS GRID */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filtered.map((p) => (
            <article
              key={p.id}
              style={{
                background: '#0a1628',
                border: '1px solid rgba(200,215,240,0.12)',
                borderRadius: 12,
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '1.4rem' }}>{p.emoji}</span>
                  <span style={{
                    background: 'rgba(20,40,255,0.15)',
                    color: '#6b8cff',
                    padding: '0.2rem 0.5rem',
                    borderRadius: 4,
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {p.category}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  {p.title}
                </h2>

                <p style={{ fontSize: '0.78rem', color: 'rgba(200,215,240,0.65)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  {p.snippet}
                </p>
              </div>

              <div style={{ borderTop: '1px solid rgba(200,215,240,0.08)', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'rgba(200,215,240,0.5)' }}>
                <div>
                  <strong>{p.author}</strong> • {p.date}
                </div>
                <span>{p.readTime}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
