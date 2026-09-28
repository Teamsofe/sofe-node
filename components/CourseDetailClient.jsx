'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, doc, getDoc, collection, query, where, getDocs } from '@/lib/firebase';

export default function CourseDetailClient({ courseIdProp }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = courseIdProp || searchParams.get('id') || 'foundation';

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      setLoading(true);
      try {
        let cs = await getDoc(doc(db, 'courses', courseId));
        if (!cs.exists()) {
          // Try query by slug or is_foundation
          const qSnap = await getDocs(query(collection(db, 'courses'), where('slug', '==', courseId)));
          if (!qSnap.empty) {
            cs = qSnap.docs[0];
          }
        }

        if (cs.exists()) {
          setCourse({ id: cs.id, ...cs.data() });

          // Fetch modules
          const modSnap = await getDocs(query(collection(db, 'modules'), where('course_id', '==', cs.id)));
          setModules(modSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0)));
        } else {
          setError(true);
        }
      } catch (e) {
        console.error('Error fetching course:', e);
        setError(true);
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
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📚</div>
          <p style={{ color: 'rgba(238,244,255,0.6)' }}>Loading course syllabus...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{ minHeight: '70vh', padding: '5rem 2rem', textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Course Not Found</h2>
        <p style={{ color: 'rgba(238,244,255,0.6)', margin: '1rem 0 2rem' }}>
          This course doesn&apos;t exist or is undergoing syllabus updates.
        </p>
        <Link
          href="/courses"
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
  const tierLabel = course.tier === 'foundation' ? '★ Foundation Course' : course.tier === 'executive' ? '👑 Executive Program' : '◆ Career Track';
  const enrolUrl = course.tier === 'executive' ? `/cbie-application?course=${course.id}` : `/payment-flow?course=${course.id}`;

  return (
    <div style={{ background: '#04080F', color: '#EEF4FF', minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      <link rel="stylesheet" href="/css/course-detail.css" />

      {/* HERO SECTION */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(20,40,255,0.15), rgba(8,14,26,0.95))',
        borderBottom: '1px solid rgba(20,40,255,0.2)',
        padding: '4rem 1.5rem 3rem'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '3rem', alignItems: 'start' }}>
          <div>
            <div style={{
              display: 'inline-block',
              background: 'rgba(20,40,255,0.2)',
              color: '#6b8cff',
              border: '1px solid rgba(20,40,255,0.3)',
              borderRadius: 20,
              padding: '0.25rem 0.8rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: '1rem'
            }}>
              {tierLabel}
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '1rem' }}>
              {course.title}
            </h1>

            <p style={{ fontSize: '0.92rem', color: 'rgba(238,244,255,0.8)', lineHeight: 1.7, marginBottom: '1.5rem', maxWidth: 680 }}>
              {course.description}
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'rgba(238,244,255,0.7)', flexWrap: 'wrap' }}>
              {course.module_count && <span>📚 {course.module_count} Modules</span>}
              {course.duration_weeks && <span>📅 {course.duration_weeks} Weeks</span>}
              <span>🎓 Verified Certificate</span>
              <span>⚡ Live Mentorship</span>
            </div>
          </div>

          {/* SIDEBAR ENROLLMENT CARD */}
          <div style={{
            background: '#0D1526',
            border: '1px solid rgba(20,40,255,0.3)',
            borderRadius: 12,
            padding: '1.75rem',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#FF8A00', marginBottom: '0.2rem' }}>
              {priceDisplay}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'rgba(238,244,255,0.5)', marginBottom: '1.5rem' }}>
              {isFree ? 'Full access upon registration' : 'One-time investment · Lifetime alumni network'}
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.78rem', color: 'rgba(238,244,255,0.85)' }}>
              <li>✓ Live cohort training & recorded replays</li>
              <li>✓ Hands-on project submissions & grading</li>
              <li>✓ Direct mentorship & tutor office hours</li>
              <li>✓ Protocol bounty eligibility</li>
            </ul>

            <Link
              href={enrolUrl}
              style={{
                display: 'block',
                textAlign: 'center',
                background: 'linear-gradient(135deg, #1428FF, #0018CC)',
                color: '#fff',
                padding: '0.75rem',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(20,40,255,0.4)'
              }}
            >
              {isFree ? 'Start Learning for Free →' : 'Enrol Now →'}
            </Link>

            {course.tier !== 'foundation' && (
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,138,0,0.9)', marginTop: '0.8rem', textAlign: 'center', lineHeight: 1.5 }}>
                ★ Foundation course included — complete Foundation first to unlock track content.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CURRICULUM SYLLABUS SECTION */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '3.5rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Course Curriculum</h2>
        <p style={{ color: 'rgba(238,244,255,0.65)', fontSize: '0.82rem', marginBottom: '2rem' }}>
          Industry-vetted syllabus designed to turn curious talents into productive Web3 operators and engineers.
        </p>

        {modules.length === 0 ? (
          <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.18)', borderRadius: 10, padding: '2rem', textAlign: 'center', color: 'rgba(238,244,255,0.5)' }}>
            Curriculum modules are being finalized for the upcoming cohort.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modules.map((m, idx) => (
              <div
                key={m.id}
                style={{
                  background: '#0D1526',
                  border: '1px solid rgba(20,40,255,0.18)',
                  borderRadius: 10,
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem'
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(20,40,255,0.15)',
                  border: '1px solid rgba(20,40,255,0.3)',
                  color: '#6b8cff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}>
                  {idx + 1}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{m.title}</h3>
                  {m.description && (
                    <p style={{ fontSize: '0.78rem', color: 'rgba(238,244,255,0.65)', marginTop: '0.2rem' }}>
                      {m.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
