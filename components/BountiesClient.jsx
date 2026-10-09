'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  db,
  auth,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  doc,
  getDoc,
  onAuthStateChanged
} from '@/lib/firebase';

export default function BountiesClient() {
  const [bounties, setBounties] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // New bounty modal for Protocol Partners
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBounty, setNewBounty] = useState({
    title: '',
    category: 'dev',
    reward_usd: '',
    deadline: '',
    description: '',
    requirements: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async u => {
      setCurrentUser(u);
      if (u && db) {
        try {
          const uDoc = await getDoc(doc(db, 'users', u.uid));
          if (uDoc.exists()) setUserProfile(uDoc.data());
        } catch (e) {}
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchBounties() {
      if (!db) return;
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'bounties'), orderBy('created_at', 'desc')));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setBounties(list);
      } catch (err) {
        // Fallback without orderBy if index is building
        try {
          const snap2 = await getDocs(collection(db, 'bounties'));
          setBounties(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e2) {
          console.warn('Error fetching bounties:', e2);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchBounties();
  }, []);

  async function handleCreateBounty(e) {
    e.preventDefault();
    if (!newBounty.title || !newBounty.reward_usd) return;
    setSubmitting(true);
    setMsg('');

    try {
      if (!db || !currentUser) throw new Error('Authentication required');

      await addDoc(collection(db, 'bounties'), {
        title: newBounty.title.trim(),
        category: newBounty.category,
        reward_usd: Number(newBounty.reward_usd) || 0,
        deadline: newBounty.deadline || null,
        description: newBounty.description.trim(),
        requirements: newBounty.requirements.trim(),
        status: userProfile?.role === 'admin' ? 'active' : 'pending_approval',
        posted_by: currentUser.uid,
        creator_name: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : currentUser.email,
        creator_email: currentUser.email,
        created_at: serverTimestamp(),
        applicants_count: 0,
      });

      setMsg('✓ Bounty submitted successfully! It will be reviewed by admin before going live.');
      setNewBounty({ title: '', category: 'dev', reward_usd: '', deadline: '', description: '', requirements: '' });
      setTimeout(() => setShowCreateModal(false), 2000);
    } catch (err) {
      console.error('Error creating bounty:', err);
      setMsg('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const isProtocolPartner = userProfile?.account_type === 'protocol' || userProfile?.role === 'admin';

  const filtered = bounties.filter(b => {
    const matchCat = category === 'all' || (b.category || '').toLowerCase() === category.toLowerCase();
    const matchSearch = (b.title || '').toLowerCase().includes(search.toLowerCase()) ||
                        (b.description || '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <link rel="stylesheet" href="/css/bounties.css" />

      {/* ── HERO ── */}
      <section className="bounty-hero" style={{ padding: '8rem 5vw 4rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(20,40,255,.12)', color: '#6b8cff', border: '1px solid rgba(20,40,255,.3)', padding: '.35rem 1rem', borderRadius: '20px', fontSize: '.78rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.2rem' }}>
            Earn On-Chain Rewards
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.6rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1.2rem' }}>
            Sofe Node <span style={{ color: 'var(--orange)' }}>Bounty</span> Campaigns
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            Contribute to leading Web3 protocols, complete technical and creative quests, build your on-chain reputation, and earn bounties paid in crypto &amp; fiat.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="#explore" style={{ padding: '.8rem 1.8rem', background: 'var(--blue)', color: '#fff', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }}>
              Explore Active Bounties →
            </Link>
            {isProtocolPartner && (
              <button
                onClick={() => setShowCreateModal(true)}
                style={{ padding: '.8rem 1.8rem', background: 'var(--orange)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}
              >
                + Post Protocol Bounty
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── FILTER & LISTING ── */}
      <section id="explore" style={{ padding: '3rem 5vw 6rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
              {['all', 'dev', 'design', 'growth', 'content'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '.5rem 1.1rem',
                    borderRadius: '20px',
                    border: category === cat ? '1px solid var(--blue)' : '1px solid var(--border)',
                    background: category === cat ? 'var(--blue)' : 'var(--panel)',
                    color: '#fff',
                    fontSize: '.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search bounties…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '.6rem 1.2rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '25px', color: '#fff', fontSize: '.85rem', width: '280px' }}
            />
          </div>

          {/* Bounty Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted)' }}>Loading active bounties…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--muted)' }}>
              No bounties found matching your search.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.8rem' }}>
              {filtered.map(b => (
                <div key={b.id} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ background: 'rgba(20,40,255,.15)', color: '#6b8cff', padding: '.25rem .7rem', borderRadius: '5px', fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {b.category || 'General'}
                      </span>
                      <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
                        {b.deadline ? `Due: ${b.deadline}` : 'Open'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--white)', marginBottom: '.6rem' }}>
                      {b.title}
                    </h3>
                    <p style={{ color: 'var(--muted)', fontSize: '.85rem', lineHeight: 1.6, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {b.description || 'Complete this task to earn bounty rewards.'}
                    </p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Reward</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--orange)' }}>
                          ${(b.reward_usd || 0).toLocaleString()}
                        </div>
                      </div>
                      <Link
                        href={`/bounties/${b.id}`}
                        style={{ padding: '.55rem 1.2rem', background: 'var(--blue)', color: '#fff', borderRadius: '6px', fontSize: '.8rem', fontWeight: 700, textDecoration: 'none' }}
                      >
                        Apply / View →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CREATE BOUNTY MODAL (FOR PROTOCOL PARTNERS) */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '14px', maxWidth: '600px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--white)' }}>Post Protocol Bounty</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {msg && (
              <div style={{ background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', borderRadius: '6px', padding: '.8rem', color: '#10b981', fontSize: '.85rem', marginBottom: '1.2rem' }}>
                {msg}
              </div>
            )}

            <form onSubmit={handleCreateBounty}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.3rem' }}>Bounty Title</label>
                <input
                  type="text"
                  required
                  value={newBounty.title}
                  onChange={e => setNewBounty({ ...newBounty, title: e.target.value })}
                  placeholder="e.g. Build an Open-Source Staking Dashboard"
                  style={{ width: '100%', padding: '.75rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.3rem' }}>Category</label>
                  <select
                    value={newBounty.category}
                    onChange={e => setNewBounty({ ...newBounty, category: e.target.value })}
                    style={{ width: '100%', padding: '.75rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="dev">Development</option>
                    <option value="design">Design / UI</option>
                    <option value="growth">Growth &amp; Marketing</option>
                    <option value="content">Content &amp; Research</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.3rem' }}>Prize Pool (USD)</label>
                  <input
                    type="number"
                    required
                    value={newBounty.reward_usd}
                    onChange={e => setNewBounty({ ...newBounty, reward_usd: e.target.value })}
                    placeholder="500"
                    style={{ width: '100%', padding: '.75rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.3rem' }}>Deadline Date</label>
                <input
                  type="date"
                  value={newBounty.deadline}
                  onChange={e => setNewBounty({ ...newBounty, deadline: e.target.value })}
                  style={{ width: '100%', padding: '.75rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.3rem' }}>Description &amp; Deliverables</label>
                <textarea
                  rows={4}
                  required
                  value={newBounty.description}
                  onChange={e => setNewBounty({ ...newBounty, description: e.target.value })}
                  placeholder="Outline the scope and submission instructions..."
                  style={{ width: '100%', padding: '.75rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff' }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ width: '100%', padding: '.85rem', background: 'var(--orange)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '.9rem' }}
              >
                {submitting ? 'Submitting…' : 'Submit Bounty for Review →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
