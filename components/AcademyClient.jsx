'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db, auth, onAuthStateChanged, collection, query, where, getDocs } from '@/lib/firebase';

const FILTERS = [
  { id: 'all', label: 'All Courses' },
  { id: 'foundation', label: 'Foundation' },
  { id: 'development', label: 'Development' },
  { id: 'data-security', label: 'Data & Security' },
  { id: 'ai-automation', label: 'AI & Automation' },
  { id: 'design', label: 'Design' },
  { id: 'management', label: 'Management' },
  { id: 'growth-media', label: 'Growth & Media' },
  { id: 'trading', label: 'Trading' },
  { id: 'executive', label: 'Executive' }
];

export default function AcademyClient() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [userEnrolments, setUserEnrolments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const snap = await getDocs(query(collection(db, 'enrolments'), where('user_id', '==', user.uid)));
          const ids = snap.docs.map((d) => d.data().course_id);
          if (ids.length > 0 && !ids.includes('foundation')) {
            ids.push('foundation');
          }
          setUserEnrolments(ids);
        } catch (e) {}
      }
      fetchCourses();
    });

    return () => unsub();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let list = [];
      try {
        const snap = await getDocs(query(collection(db, 'courses'), where('status', '==', 'published')));
        list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        const snap = await getDocs(collection(db, 'courses'));
        list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      list.sort((a, b) => (a.display_order || 99) - (b.display_order || 99));
      setCourses(list);
      setFilteredCourses(list);
    } catch (e) {
      console.error('Error fetching courses:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (filterId) => {
    setActiveFilter(filterId);
    if (filterId === 'all') {
      setFilteredCourses(courses);
    } else if (filterId === 'foundation' || filterId === 'executive') {
      setFilteredCourses(courses.filter((c) => c.tier === filterId));
    } else {
      setFilteredCourses(
        courses.filter((c) => {
          const track = (c.track || '').toLowerCase().replace(/\s+/g, '-').replace(/&/g, '');
          return track === filterId;
        })
      );
    }
  };

  return (
    <div style={{ background: '#040810', color: '#c8d7f0', minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      {/* HERO SECTION */}
      <section style={{
        padding: '5rem 1.5rem 3rem',
        textAlign: 'center',
        background: 'radial-gradient(circle at 20% 20%, rgba(20,40,255,.12), transparent 50%), radial-gradient(circle at 80% 30%, rgba(255,138,0,.08), transparent 50%)'
      }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#FF8A00', marginBottom: '0.8rem' }}>
          📚 Sofe Academy
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem', color: '#fff' }}>
          Master Web3. Build Your <span style={{ color: '#FF8A00' }}>Career.</span>
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'rgba(200,215,240,0.65)', maxWidth: 620, margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          From blockchain fundamentals to industry-grade certifications — courses designed for the African market, recognised globally.
        </p>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: 900, margin: '0 auto' }}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => handleFilter(f.id)}
                style={{
                  background: isActive ? '#1428FF' : '#0a1628',
                  border: '1px solid rgba(200,215,240,0.15)',
                  color: isActive ? '#fff' : 'rgba(200,215,240,0.65)',
                  padding: '0.45rem 1rem',
                  borderRadius: 50,
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* COURSES GRID */}
      <section style={{ maxWidth: 1240, margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(200,215,240,0.5)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            Loading courses catalogue...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(200,215,240,0.5)', background: '#0a1628', borderRadius: 12, border: '1px solid rgba(200,215,240,0.1)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.4rem' }}>No courses in this category yet</h3>
            <p style={{ fontSize: '0.82rem' }}>We&apos;re preparing the curriculum for this track. Please check back soon or join our community.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filteredCourses.map((c) => {
              const tier = c.tier || 'track';
              const price = c.price !== undefined ? c.price : 0;
              const isFree = price === 0;
              const priceMain = isFree ? 'FREE' : `₦${Number(price).toLocaleString('en-NG')}`;
              const isEnrolled = userEnrolments.includes(c.id);
              const tierLabel = tier === 'foundation' ? '★ Foundation' : tier === 'executive' ? '👑 Executive Program' : '◆ Career Track';
              const href = isEnrolled ? '/dashboard' : tier === 'executive' ? `/cbie-application?course=${c.id}` : `/courses/${c.id}`;

              return (
                <article
                  key={c.id}
                  style={{
                    background: '#0a1628',
                    border: '1px solid rgba(200,215,240,0.12)',
                    borderRadius: 12,
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s, border-color 0.2s'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{
                        background: 'rgba(20,40,255,0.15)',
                        color: '#6b8cff',
                        padding: '0.25rem 0.6rem',
                        borderRadius: 4,
                        fontSize: '0.68rem',
                        fontWeight: 700
                      }}>
                        {tierLabel}
                      </span>
                      {isEnrolled && <span style={{ color: '#00c864', fontSize: '0.72rem', fontWeight: 700 }}>✓ Enrolled</span>}
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                      {c.title || 'Untitled Course'}
                    </h3>

                    <p style={{ fontSize: '0.78rem', color: 'rgba(200,215,240,0.65)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                      {c.description ? c.description.slice(0, 120) + (c.description.length > 120 ? '...' : '') : ''}
                    </p>

                    <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.72rem', color: 'rgba(200,215,240,0.5)', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                      {c.duration_weeks && <span>📅 {c.duration_weeks} weeks</span>}
                      {c.module_count && <span>📚 {c.module_count} modules</span>}
                      <span>{c.cohort_based ? '👥 Cohort-based' : '⏱ Self-paced'}</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(200,215,240,0.08)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FF8A00' }}>{priceMain}</div>
                      <div style={{ fontSize: '0.66rem', color: 'rgba(200,215,240,0.45)' }}>
                        {isFree ? 'self-paced access' : 'one-time payment'}
                      </div>
                    </div>

                    <Link
                      href={href}
                      style={{
                        background: isEnrolled ? 'rgba(0,200,100,0.15)' : '#1428FF',
                        border: isEnrolled ? '1px solid rgba(0,200,100,0.3)' : 'none',
                        color: isEnrolled ? '#00c864' : '#fff',
                        padding: '0.55rem 1.1rem',
                        borderRadius: 6,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        textDecoration: 'none'
                      }}
                    >
                      {isEnrolled ? 'Continue →' : 'Learn More →'}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
