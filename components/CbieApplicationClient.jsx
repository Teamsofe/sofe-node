'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  db,
  auth,
  collection,
  addDoc,
  serverTimestamp,
  onAuthStateChanged,
  doc,
  getDoc
} from '@/lib/firebase';

export default function CbieApplicationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseParam = searchParams.get('course') || 'cbie';

  const [currentUser, setCurrentUser] = useState(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'Nigeria',
    state: '',
    linkedin: '',
    industry: 'Financial Services',
    jobTitle: '',
    yearsExp: '3-5 years',
    goal: '',
    scholarshipNeed: 'no',
  });

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async u => {
      setCurrentUser(u);
      if (u && db) {
        try {
          const uSnap = await getDoc(doc(db, 'users', u.uid));
          if (uSnap.exists()) {
            const data = uSnap.data();
            setForm(prev => ({
              ...prev,
              firstName: data.first_name || prev.firstName,
              lastName: data.last_name || prev.lastName,
              email: data.email || u.email || prev.email,
              phone: data.phone || prev.phone,
              state: data.state || prev.state,
            }));
          }
        } catch (e) {}
      }
    });
    return () => unsub();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!currentUser) {
      router.push(`/login?redirect=/cbie-application?course=${courseParam}`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      if (!db) throw new Error('Database is not initialized');

      await addDoc(collection(db, 'applications'), {
        user_id: currentUser.uid,
        course_id: courseParam,
        program_name: 'Certified Blockchain Industrial Expert (CBIE)',
        applicant_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        country: form.country,
        state: form.state.trim(),
        linkedin: form.linkedin.trim(),
        industry: form.industry,
        job_title: form.jobTitle.trim(),
        years_experience: form.yearsExp,
        statement_of_purpose: form.goal.trim(),
        requested_scholarship: form.scholarshipNeed === 'yes',
        status: 'submitted',
        submitted_at: serverTimestamp(),
        created_at: serverTimestamp(),
      });

      setSubmitted(true);
    } catch (err) {
      console.error('Application submission error:', err);
      setErrorMsg(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 5vw' }}>
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '16px', padding: '3.5rem 2.5rem', maxWidth: '580px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🏆</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--white)', marginBottom: '.5rem' }}>Application Received!</h2>
          <p style={{ color: 'var(--muted)', fontSize: '.92rem', lineHeight: 1.7, marginBottom: '2rem' }}>
            Thank you for applying to the Certified Blockchain Industrial Expert (CBIE) program. Our admissions board reviews applications on a rolling basis. You will receive an email decision within 48 hours.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/dashboard" style={{ padding: '.85rem 1.8rem', background: 'var(--blue)', color: '#fff', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }}>
              Go to Sofian Dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '8rem 5vw 6rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'inline-block', background: 'rgba(201,168,76,.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,.35)', padding: '.35rem 1rem', borderRadius: '4px', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem' }}>
          CBIE Executive Cohort 2026
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '.8rem' }}>
          Apply for <span style={{ color: '#C9A84C' }}>CBIE Certification</span>
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto' }}>
          Join Africa&apos;s leading network of verified blockchain industrial professionals. 6 weeks. Real-world capstone. Global recognition.
        </p>
      </div>

      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2.5rem' }}>
        {errorMsg && (
          <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', padding: '.8rem 1rem', color: '#f87171', fontSize: '.85rem', marginBottom: '1.5rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal & Contact */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1.2rem', paddingBottom: '.5rem', borderBottom: '1px solid var(--border)' }}>
            1. Applicant Details
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>First Name</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={e => setForm({ ...form, firstName: e.target.value })}
                style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>Last Name</label>
              <input
                type="text"
                required
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>Phone / WhatsApp</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>

          {/* Step 2: Professional Background */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1.2rem', paddingBottom: '.5rem', borderBottom: '1px solid var(--border)' }}>
            2. Professional Background
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>Primary Industry</label>
              <select
                value={form.industry}
                onChange={e => setForm({ ...form, industry: e.target.value })}
                style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
              >
                <option value="Financial Services">Banking &amp; Financial Services</option>
                <option value="Technology">Tech &amp; Software Development</option>
                <option value="Supply Chain">Supply Chain &amp; Logistics</option>
                <option value="Legal & Regulatory">Legal, Compliance &amp; Policy</option>
                <option value="Healthcare">Healthcare &amp; Pharma</option>
                <option value="Energy & Commodities">Energy &amp; Commodities</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>Current Role / Title</label>
              <input
                type="text"
                required
                value={form.jobTitle}
                onChange={e => setForm({ ...form, jobTitle: e.target.value })}
                placeholder="e.g. Senior Business Analyst"
                style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>Years of Experience</label>
              <select
                value={form.yearsExp}
                onChange={e => setForm({ ...form, yearsExp: e.target.value })}
                style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
              >
                <option value="0-2 years">0 – 2 years (Early Career)</option>
                <option value="3-5 years">3 – 5 years (Mid-Level)</option>
                <option value="6-10 years">6 – 10 years (Senior / Lead)</option>
                <option value="10+ years">10+ years (Executive / Director)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>LinkedIn Profile URL</label>
              <input
                type="url"
                value={form.linkedin}
                onChange={e => setForm({ ...form, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/..."
                style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
          </div>

          {/* Step 3: Motivation */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '1.2rem', paddingBottom: '.5rem', borderBottom: '1px solid var(--border)' }}>
            3. Goals &amp; Expectations
          </h3>

          <div style={{ marginBottom: '1.8rem' }}>
            <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>Why do you want to join CBIE and how will you apply it?</label>
            <textarea
              rows={4}
              required
              value={form.goal}
              onChange={e => setForm({ ...form, goal: e.target.value })}
              placeholder="Describe your goals and how enterprise blockchain applies to your career or organisation..."
              style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', resize: 'vertical' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ width: '100%', padding: '.95rem', background: '#C9A84C', color: '#060d1a', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}
          >
            {submitting ? 'Submitting Application…' : 'Submit CBIE Application →'}
          </button>
        </form>
      </div>
    </div>
  );
}
