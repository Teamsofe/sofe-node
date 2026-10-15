'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  auth,
  db,
  storage,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  serverTimestamp,
  ref,
  uploadBytes
} from '@/lib/firebase';

const FALLBACK_COHORTS = [
  {
    id: 'cbie-q2-2026',
    name: 'Executive Cohort — May 2026',
    course_id: 'cbie',
    status: 'open',
    capacity: 50,
    enrolled_count: 18,
    scholarship_slots: 10,
    scholarship_granted_count: 3,
    start_date_str: 'May 11, 2026',
    deadline_str: 'May 4'
  },
  {
    id: 'cbie-q3-2026',
    name: 'Executive Cohort — July 2026',
    course_id: 'cbie',
    status: 'upcoming',
    capacity: 50,
    enrolled_count: 4,
    scholarship_slots: 10,
    scholarship_granted_count: 0,
    start_date_str: 'July 13, 2026',
    deadline_str: 'July 6'
  }
];

export default function CbieApplicationClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseParam = searchParams.get('course') || 'cbie';

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [existingApp, setExistingApp] = useState(null);
  const [settings, setSettings] = useState({});
  const [cohorts, setCohorts] = useState([]);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('paystack');

  // Step 1: About You
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [industry, setIndustry] = useState('');
  const [role, setRole] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [workplaceEmail, setWorkplaceEmail] = useState('');

  // Step 3: Motivation
  const [motivationIndustry, setMotivationIndustry] = useState('');
  const [motivationImpact, setMotivationImpact] = useState('');
  const [motivationOutcome, setMotivationOutcome] = useState('');
  const [scholarshipRequested, setScholarshipRequested] = useState(false);
  const [scholarshipReason, setScholarshipReason] = useState('');

  // Step 4: Payment
  const [proofFile, setProofFile] = useState(null);
  const [proofFileName, setProofFileName] = useState('');
  const [proofUploading, setProofUploading] = useState(false);
  const [uploadedProofPath, setUploadedProofPath] = useState('');
  const [copied, setCopied] = useState(false);

  // Flow & alerts
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async (u) => {
      setCurrentUser(u);
      if (!u) {
        setLoading(false);
        return;
      }

      try {
        if (db) {
          // Load Profile
          const uSnap = await getDoc(doc(db, 'users', u.uid));
          if (uSnap.exists()) {
            const data = uSnap.data();
            setUserProfile(data);
            setFirstName(data.first_name || '');
            setLastName(data.last_name || '');
            setEmail(data.email || u.email || '');
            setPhone(data.phone || '');
          } else {
            setEmail(u.email || '');
          }

          // Check for existing application
          const existingSnap = await getDocs(
            query(collection(db, 'applications'), where('user_id', '==', u.uid))
          );
          const blockingStatuses = [
            'submitted',
            'under_review',
            'accepted',
            'awaiting_balance',
            'payment_confirmed',
            'active',
            'enrolled'
          ];
          const found = existingSnap.docs.find((d) =>
            blockingStatuses.includes(d.data().status)
          );
          if (found) {
            setExistingApp({ id: found.id, ...found.data() });
            setLoading(false);
            return;
          }

          // Load Settings
          try {
            const sSnap = await getDoc(doc(db, 'settings', 'platform'));
            if (sSnap.exists()) {
              setSettings(sSnap.data());
            }
          } catch (e) {}

          // Load Cohorts
          try {
            let snap;
            try {
              snap = await getDocs(
                query(collection(db, 'cohorts'), where('course_id', '==', 'cbie'))
              );
            } catch (qe) {
              snap = await getDocs(collection(db, 'cohorts'));
            }

            const rawCohorts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            const valid = rawCohorts
              .filter((c) => {
                const matchCourse = c.course_id === 'cbie' || !c.course_id;
                const status = (c.status || '').toLowerCase();
                return matchCourse && ['open', 'upcoming'].includes(status);
              })
              .map((c) => ({
                ...c,
                start_date_str: c.start_date?.toDate
                  ? c.start_date.toDate().toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                  : c.start_date_str || 'TBD',
                deadline_str: c.application_deadline?.toDate
                  ? c.application_deadline.toDate().toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
                  : null
              }));

            if (valid.length > 0) {
              setCohorts(valid);
            } else {
              setCohorts(FALLBACK_COHORTS);
            }
          } catch (ce) {
            setCohorts(FALLBACK_COHORTS);
          }
        }
      } catch (err) {
        console.error('CBIE initialization error:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const fee = settings?.cbie_application_fee || 5000;
  const formattedFee = `₦${Number(fee).toLocaleString('en-NG')}`;

  const copyAccountNum = () => {
    const num = settings?.bank_account_number || '1023456789';
    navigator.clipboard?.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProofChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File too large. Maximum size is 5MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('File type not allowed. Please upload JPG, PNG, WEBP, or PDF.');
      return;
    }

    setProofFile(file);
    setProofFileName(file.name);
    setProofUploading(true);
    setErrorMsg('');

    try {
      if (storage && currentUser) {
        const ext = file.name.split('.').pop().toLowerCase();
        const path = `payment_proofs/${currentUser.uid}/${Date.now()}.${ext}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file, { contentType: file.type });
        setUploadedProofPath(path);
      } else {
        setUploadedProofPath('local_uploaded_' + file.name);
      }
    } catch (uploadErr) {
      console.error('Proof upload error:', uploadErr);
      setErrorMsg('Could not upload file: ' + (uploadErr.message || 'Please retry'));
      setProofFile(null);
      setProofFileName('');
    } finally {
      setProofUploading(false);
    }
  };

  const validateAndNext = (targetStep) => {
    setErrorMsg('');

    if (targetStep > step) {
      if (step === 1) {
        if (!firstName.trim() || !lastName.trim() || !phone.trim() || !industry || !role.trim()) {
          setErrorMsg('Please fill in all required fields (Name, Phone, Industry, Role).');
          return;
        }
        if (linkedinUrl && !linkedinUrl.includes('linkedin.com')) {
          setErrorMsg('Please enter a valid LinkedIn URL or leave it blank.');
          return;
        }
      }
      if (step === 2) {
        if (!selectedCohort) {
          setErrorMsg('Please select a cohort to proceed.');
          return;
        }
      }
      if (step === 3) {
        if (
          motivationIndustry.trim().length < 20 ||
          motivationImpact.trim().length < 20 ||
          motivationOutcome.trim().length < 20
        ) {
          setErrorMsg('Please provide a thoughtful answer for all three questions (at least 20 characters each).');
          return;
        }
        if (scholarshipRequested && scholarshipReason.trim().length < 30) {
          setErrorMsg('Please provide at least 30 characters explaining your scholarship request.');
          return;
        }
      }
    }

    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setErrorMsg('');

    if (selectedPaymentMethod === 'bank' && !uploadedProofPath) {
      setErrorMsg('Please upload your proof of bank transfer first, or choose Card / Paystack.');
      return;
    }

    setSubmitting(true);

    try {
      if (!currentUser) throw new Error('You must be signed in.');

      const appId = `${currentUser.uid}_${Date.now()}`;
      const appData = {
        application_id: appId,
        user_id: currentUser.uid,
        course_id: 'cbie',
        cohort_id: selectedCohort?.id || 'cbie-q2-2026',
        cohort_name: selectedCohort?.name || 'Executive Cohort',
        status: 'submitted',

        applicant_name: `${firstName.trim()} ${lastName.trim()}`,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: (userProfile?.email || currentUser.email || email).toLowerCase(),
        phone: phone.trim(),

        industry,
        role: role.trim(),
        linkedin_url: linkedinUrl.trim(),
        workplace_email: workplaceEmail.trim(),

        motivation_industry: motivationIndustry.trim(),
        motivation_impact: motivationImpact.trim(),
        motivation_outcome: motivationOutcome.trim(),

        scholarship_requested: scholarshipRequested,
        scholarship_reason: scholarshipRequested ? scholarshipReason.trim() : '',
        scholarship_granted: false,

        payment_method: selectedPaymentMethod,
        payment_proof_ref: uploadedProofPath || null,
        application_fee: fee,
        application_fee_paid: selectedPaymentMethod === 'bank',
        balance_paid: false,

        submitted_at: serverTimestamp(),
        created_at: serverTimestamp()
      };

      if (db) {
        await setDoc(doc(db, 'applications', appId), appData);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMsg(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <div>Loading CBIE application form…</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem' }}>
        <div style={{ background: '#0a1628', border: '1px solid rgba(200,215,240,.15)', borderRadius: 16, padding: '3.5rem 2rem', textAlign: 'center', maxWidth: 480, width: '100%' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '.6rem' }}>Sign in to Apply</h2>
          <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            CBIE applications are tied to your Sofe Node account so our admissions board can review your profile and follow up with you.
          </p>
          <Link href="/login?next=/cbie-application" className="btn btn-primary" style={{ padding: '.85rem 2rem', width: '100%' }}>
            Sign In or Create Account →
          </Link>
        </div>
      </div>
    );
  }

  if (existingApp) {
    const statusText = (existingApp.status || '').replace(/_/g, ' ');
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem' }}>
        <div style={{ background: '#0a1628', border: '1px solid rgba(200,215,240,.15)', borderRadius: 16, padding: '3rem 2rem', textAlign: 'center', maxWidth: 520, width: '100%' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {existingApp.status === 'enrolled' ? '🎉' : existingApp.status === 'awaiting_balance' ? '✅' : '📋'}
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '.6rem' }}>
            {existingApp.status === 'enrolled'
              ? "You're Enrolled in CBIE!"
              : existingApp.status === 'awaiting_balance'
              ? 'Application Approved!'
              : 'You have an active application'}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '.86rem', lineHeight: 1.6, marginBottom: '1.8rem' }}>
            Status: <strong style={{ color: '#FF8A00', textTransform: 'capitalize' }}>{statusText}</strong>
            <br />
            Cohort: <strong>{existingApp.cohort_name || 'Executive CBIE'}</strong>
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn btn-primary">Go to Dashboard →</Link>
            <Link href="/" className="btn btn-ghost">Home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem' }}>
        <div style={{ background: '#0a1628', border: '1px solid rgba(200,215,240,.15)', borderRadius: 16, padding: '3.5rem 2.5rem', textAlign: 'center', maxWidth: 540, width: '100%' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '.6rem' }}>Application Submitted!</h2>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.65, marginBottom: '2rem' }}>
            Thank you for applying to the Certified Blockchain Industry Expert (CBIE) program. Our admissions committee reviews applications on a rolling basis within 72 hours. We will email you with your decision and onboarding instructions.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: '.85rem 1.8rem' }}>Go to Dashboard →</Link>
            <Link href="/" className="btn btn-ghost" style={{ padding: '.85rem 1.8rem' }}>Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '7rem 1.5rem 5rem' }}>
      {/* ── HEADER ── */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '.4rem',
          fontSize: '.62rem', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
          background: 'linear-gradient(135deg, rgba(201,168,76,.15), rgba(201,168,76,.08))',
          color: '#C9A84C', border: '1px solid rgba(201,168,76,.35)',
          padding: '.35rem .85rem', borderRadius: 4, marginBottom: '1rem'
        }}>
          👑 Executive Tier · By Application Only
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '.6rem', color: '#fff' }}>
          Apply for the <span style={{ color: '#C9A84C' }}>CBIE</span> Program
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.92rem', lineHeight: 1.6, maxWidth: 580, margin: '0 auto' }}>
          Certified Blockchain Industry Expert — our flagship executive certification for working professionals. Foundation course included on enrolment.
        </p>
      </div>

      {/* ── STEP INDICATOR ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: 620, margin: '0 auto 2.5rem' }}>
        {[
          { num: 1, label: 'About You' },
          { num: 2, label: 'Cohort' },
          { num: 3, label: 'Motivation' },
          { num: 4, label: 'Pay Fee' }
        ].map((s, idx) => (
          <React.Fragment key={s.num}>
            <div
              onClick={() => s.num < step && validateAndNext(s.num)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem',
                cursor: s.num < step ? 'pointer' : 'default',
                opacity: s.num <= step ? 1 : 0.45,
                transition: 'opacity .2s'
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '.78rem', fontWeight: 800,
                border: s.num === step
                  ? '2px solid #C9A84C'
                  : s.num < step
                  ? '2px solid #00c864'
                  : '2px solid rgba(200,215,240,.2)',
                background: s.num === step
                  ? 'rgba(201,168,76,.15)'
                  : s.num < step
                  ? '#00c864'
                  : '#040810',
                color: s.num < step ? '#000' : s.num === step ? '#C9A84C' : 'var(--muted)'
              }}>
                {s.num < step ? '✓' : s.num}
              </div>
              <div style={{ fontSize: '.64rem', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: s.num === step ? '#C9A84C' : 'var(--muted)' }}>
                {s.label}
              </div>
            </div>

            {idx < 3 && (
              <div style={{
                flex: 1, height: 2, margin: '0 8px', transform: 'translateY(-10px)',
                background: idx + 1 < step ? '#00c864' : 'rgba(200,215,240,.12)'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── FORM CARD ── */}
      <div style={{ background: '#0a1628', border: '1px solid rgba(200,215,240,.12)', borderRadius: 16, padding: '2.5rem' }}>
        {errorMsg && (
          <div style={{ background: 'rgba(255,80,80,.08)', border: '1px solid rgba(255,80,80,.25)', borderRadius: 8, padding: '.85rem 1.1rem', color: '#ff7070', fontSize: '.84rem', marginBottom: '1.5rem', display: 'flex', gap: '.6rem', alignItems: 'center' }}>
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ═══════════════════ STEP 1: ABOUT YOU ═══════════════════ */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '.35rem' }}>Tell us about yourself</h2>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem', lineHeight: 1.55, marginBottom: '2rem' }}>
              We've pre-filled what we already have. Add or edit anything that's missing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', marginBottom: '.5rem' }}>First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ width: '100%', padding: '.8rem 1rem', background: '#040810', border: '1px solid rgba(200,215,240,.12)', borderRadius: 8, color: '#fff', fontSize: '.88rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', marginBottom: '.5rem' }}>Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ width: '100%', padding: '.8rem 1rem', background: '#040810', border: '1px solid rgba(200,215,240,.12)', borderRadius: 8, color: '#fff', fontSize: '.88rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', marginBottom: '.5rem' }}>Email Address</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  style={{ width: '100%', padding: '.8rem 1rem', background: 'rgba(200,215,240,.04)', border: '1px solid rgba(200,215,240,.1)', borderRadius: 8, color: 'rgba(200,215,240,.6)', fontSize: '.88rem', cursor: 'not-allowed' }}
                />
                <div style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: '.35rem' }}>Tied to your account — contact support to change.</div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', marginBottom: '.5rem' }}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="+234 801 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{ width: '100%', padding: '.8rem 1rem', background: '#040810', border: '1px solid rgba(200,215,240,.12)', borderRadius: 8, color: '#fff', fontSize: '.88rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', marginBottom: '.5rem' }}>Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  style={{ width: '100%', padding: '.8rem 1rem', background: '#040810', border: '1px solid rgba(200,215,240,.12)', borderRadius: 8, color: '#fff', fontSize: '.88rem' }}
                >
                  <option value="">— Select your industry —</option>
                  <option value="Banking & Finance">Banking &amp; Finance</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Technology / Software">Technology / Software</option>
                  <option value="Telecommunications">Telecommunications</option>
                  <option value="Energy / Oil & Gas">Energy / Oil &amp; Gas</option>
                  <option value="Healthcare / Pharma">Healthcare / Pharma</option>
                  <option value="Government / Public Sector">Government / Public Sector</option>
                  <option value="Education">Education</option>
                  <option value="Logistics & Supply Chain">Logistics &amp; Supply Chain</option>
                  <option value="Legal Services">Legal Services</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Media / Entertainment">Media / Entertainment</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', marginBottom: '.5rem' }}>Current Role / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Project Manager"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: '100%', padding: '.8rem 1rem', background: '#040810', border: '1px solid rgba(200,215,240,.12)', borderRadius: 8, color: '#fff', fontSize: '.88rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', marginBottom: '.5rem' }}>
                LinkedIn URL <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none' }}>(strongly recommended)</span>
              </label>
              <input
                type="url"
                placeholder="https://www.linkedin.com/in/yourname"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                style={{ width: '100%', padding: '.8rem 1rem', background: '#040810', border: '1px solid rgba(200,215,240,.12)', borderRadius: 8, color: '#fff', fontSize: '.88rem' }}
              />
              <div style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: '.35rem' }}>
                Applications with LinkedIn profiles are reviewed faster. We use this to verify your professional background.
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', marginBottom: '.5rem' }}>
                Workplace Email <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={workplaceEmail}
                onChange={(e) => setWorkplaceEmail(e.target.value)}
                style={{ width: '100%', padding: '.8rem 1rem', background: '#040810', border: '1px solid rgba(200,215,240,.12)', borderRadius: 8, color: '#fff', fontSize: '.88rem' }}
              />
              <div style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: '.35rem' }}>
                If different from your account email — adds credibility to your application.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => validateAndNext(2)}
                className="btn btn-primary"
                style={{ padding: '.85rem 2rem', background: 'linear-gradient(135deg, #C9A84C, #f0d080)', color: '#000', fontWeight: 800, borderRadius: 8, border: 'none', cursor: 'pointer' }}
              >
                Continue to Cohort →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════ STEP 2: COHORT ═══════════════════ */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '.35rem' }}>Pick your cohort</h2>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem', lineHeight: 1.55, marginBottom: '2rem' }}>
              Cohorts are small (capped at ~50 students) so applications are competitive. Pick the cohort that fits your timeline best.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {cohorts.map((c) => {
                const isSelected = selectedCohort?.id === c.id;
                const enrolled = c.enrolled_count || 0;
                const cap = c.capacity || 50;
                const isFull = enrolled >= cap;
                const slots = (c.scholarship_slots || 0) - (c.scholarship_granted_count || 0);

                return (
                  <div
                    key={c.id}
                    onClick={() => !isFull && setSelectedCohort(c)}
                    style={{
                      background: isSelected ? 'rgba(201,168,76,.1)' : '#040810',
                      border: isSelected ? '2px solid #C9A84C' : '1px solid rgba(200,215,240,.15)',
                      borderRadius: 10,
                      padding: '1.2rem',
                      cursor: isFull ? 'not-allowed' : 'pointer',
                      opacity: isFull ? 0.5 : 1,
                      transition: 'all .18s'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '.92rem', color: '#fff', marginBottom: '.4rem' }}>{c.name}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: '.7rem' }}>
                      📅 Starts {c.start_date_str} {c.deadline_str ? `· Apply by ${c.deadline_str}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', fontSize: '.64rem' }}>
                      <span style={{ background: 'rgba(200,215,240,.06)', padding: '.2rem .5rem', borderRadius: 50, color: 'var(--muted)' }}>
                        {enrolled}/{cap} enrolled
                      </span>
                      {slots > 0 && (
                        <span style={{ background: 'rgba(201,168,76,.15)', color: '#C9A84C', padding: '.2rem .5rem', borderRadius: 50, fontWeight: 700 }}>
                          🎓 {slots} scholarships
                        </span>
                      )}
                      {isFull && <span style={{ color: '#ff7070', fontWeight: 700 }}>FULL</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => validateAndNext(1)}
                style={{ padding: '.85rem 1.6rem', background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(200,215,240,.15)', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={!selectedCohort}
                onClick={() => validateAndNext(3)}
                style={{
                  padding: '.85rem 2rem',
                  background: selectedCohort ? 'linear-gradient(135deg, #C9A84C, #f0d080)' : 'rgba(200,215,240,.1)',
                  color: selectedCohort ? '#000' : 'rgba(200,215,240,.4)',
                  fontWeight: 800, borderRadius: 8, border: 'none',
                  cursor: selectedCohort ? 'pointer' : 'not-allowed'
                }}
              >
                Continue to Motivation →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════ STEP 3: MOTIVATION ═══════════════════ */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '.35rem' }}>Why CBIE?</h2>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem', lineHeight: 1.55, marginBottom: '2rem' }}>
              Three short answers help our admissions team understand your background and goals.
            </p>

            <div style={{ marginBottom: '1.4rem' }}>
              <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', marginBottom: '.4rem' }}>
                How does blockchain affect your industry today?
              </label>
              <textarea
                rows={3}
                value={motivationIndustry}
                onChange={(e) => setMotivationIndustry(e.target.value)}
                placeholder="Briefly — what is happening in your sector and why it matters."
                style={{ width: '100%', padding: '.8rem 1rem', background: '#040810', border: '1px solid rgba(200,215,240,.12)', borderRadius: 8, color: '#fff', fontSize: '.86rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '1.4rem' }}>
              <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', marginBottom: '.4rem' }}>
                How will blockchain change your work in the next 2 years?
              </label>
              <textarea
                rows={3}
                value={motivationImpact}
                onChange={(e) => setMotivationImpact(e.target.value)}
                placeholder="What opportunities or bottlenecks will you be addressing?"
                style={{ width: '100%', padding: '.8rem 1rem', background: '#040810', border: '1px solid rgba(200,215,240,.12)', borderRadius: 8, color: '#fff', fontSize: '.86rem', resize: 'vertical' }}
              />
            </div>

            <div style={{ marginBottom: '1.6rem' }}>
              <label style={{ display: 'block', fontSize: '.72rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#fff', marginBottom: '.4rem' }}>
                What will you do with this certification?
              </label>
              <textarea
                rows={3}
                value={motivationOutcome}
                onChange={(e) => setMotivationOutcome(e.target.value)}
                placeholder="Project deployment, role transition, business venture, or internal corporate initiative…"
                style={{ width: '100%', padding: '.8rem 1rem', background: '#040810', border: '1px solid rgba(200,215,240,.12)', borderRadius: 8, color: '#fff', fontSize: '.86rem', resize: 'vertical' }}
              />
            </div>

            {/* Scholarship toggle */}
            <div style={{ background: 'rgba(255,138,0,.05)', border: '1px solid rgba(255,138,0,.2)', borderRadius: 10, padding: '1.2rem', marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={scholarshipRequested}
                  onChange={(e) => setScholarshipRequested(e.target.checked)}
                  style={{ marginTop: '.25rem' }}
                />
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: '.88rem' }}>I'd like to apply for a scholarship</div>
                  <div style={{ fontSize: '.74rem', color: 'var(--muted)', marginTop: '.25rem', lineHeight: 1.5 }}>
                    Limited slots per cohort. If granted, you receive up to 50% tuition subsidy awarded based on merit, demonstrated need, and potential community impact.
                  </div>
                </div>
              </label>

              {scholarshipRequested && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,138,0,.15)' }}>
                  <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#fff', marginBottom: '.4rem' }}>
                    Why do you need a scholarship?
                  </label>
                  <textarea
                    rows={3}
                    value={scholarshipReason}
                    onChange={(e) => setScholarshipReason(e.target.value)}
                    placeholder="Be honest — current career stage, financial situation, and what value you will contribute back to the Sofian network."
                    style={{ width: '100%', padding: '.8rem 1rem', background: '#040810', border: '1px solid rgba(200,215,240,.15)', borderRadius: 8, color: '#fff', fontSize: '.86rem', resize: 'vertical' }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => validateAndNext(2)}
                style={{ padding: '.85rem 1.6rem', background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(200,215,240,.15)', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => validateAndNext(4)}
                style={{ padding: '.85rem 2rem', background: 'linear-gradient(135deg, #C9A84C, #f0d080)', color: '#000', fontWeight: 800, borderRadius: 8, border: 'none', cursor: 'pointer' }}
              >
                Continue to Payment →
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════ STEP 4: PAY FEE ═══════════════════ */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '.35rem' }}>Pay your application fee</h2>
            <p style={{ color: 'var(--muted)', fontSize: '.84rem', lineHeight: 1.55, marginBottom: '1.8rem' }}>
              A non-refundable application fee of <strong style={{ color: '#fff' }}>{formattedFee}</strong> is required to submit your executive application. If accepted, this counts toward your tuition balance.
            </p>

            {/* Summary Box */}
            <div style={{ background: '#040810', border: '1px solid rgba(200,215,240,.1)', borderRadius: 10, padding: '1.2rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '.65rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.7rem' }}>
                Your Application Summary
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', fontSize: '.82rem' }}>
                <span style={{ color: 'var(--muted)' }}>Cohort:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{selectedCohort?.name || 'Executive Cohort'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', fontSize: '.82rem', borderTop: '1px solid rgba(200,215,240,.06)' }}>
                <span style={{ color: 'var(--muted)' }}>Industry:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{industry || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', fontSize: '.82rem', borderTop: '1px solid rgba(200,215,240,.06)' }}>
                <span style={{ color: 'var(--muted)' }}>Scholarship Requested:</span>
                <span style={{ color: scholarshipRequested ? '#00c864' : '#fff', fontWeight: 600 }}>
                  {scholarshipRequested ? 'Yes (Pending Review)' : 'No'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', fontSize: '.85rem', borderTop: '1px solid rgba(200,215,240,.06)', marginTop: '.4rem', paddingTop: '.6rem' }}>
                <span style={{ color: '#fff', fontWeight: 700 }}>Application Fee:</span>
                <span style={{ color: '#C9A84C', fontWeight: 800 }}>{formattedFee}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff', marginBottom: '.6rem' }}>
                Payment Method
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div
                  onClick={() => setSelectedPaymentMethod('paystack')}
                  style={{
                    background: selectedPaymentMethod === 'paystack' ? 'rgba(201,168,76,.08)' : '#040810',
                    border: selectedPaymentMethod === 'paystack' ? '2px solid #C9A84C' : '1px solid rgba(200,215,240,.12)',
                    borderRadius: 10, padding: '1.2rem', cursor: 'pointer', textAlign: 'center', transition: 'all .15s'
                  }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '.4rem' }}>💳</div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#fff', marginBottom: '.2rem' }}>Card / Bank App</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)', lineHeight: 1.4 }}>Instant verification via Paystack (card, USSD, Apple Pay)</div>
                </div>

                <div
                  onClick={() => setSelectedPaymentMethod('bank')}
                  style={{
                    background: selectedPaymentMethod === 'bank' ? 'rgba(201,168,76,.08)' : '#040810',
                    border: selectedPaymentMethod === 'bank' ? '2px solid #C9A84C' : '1px solid rgba(200,215,240,.12)',
                    borderRadius: 10, padding: '1.2rem', cursor: 'pointer', textAlign: 'center', transition: 'all .15s'
                  }}
                >
                  <div style={{ fontSize: '1.8rem', marginBottom: '.4rem' }}>🏦</div>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#fff', marginBottom: '.2rem' }}>Bank Transfer</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)', lineHeight: 1.4 }}>Direct bank transfer & upload receipt proof</div>
                </div>
              </div>
            </div>

            {/* Bank details & proof upload if Bank selected */}
            {selectedPaymentMethod === 'bank' && (
              <div style={{ background: '#040810', border: '1px dashed rgba(201,168,76,.35)', borderRadius: 10, padding: '1.4rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.8rem' }}>
                  Bank Transfer Details
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', fontSize: '.82rem' }}>
                  <span style={{ color: 'var(--muted)' }}>Bank:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{settings?.bank_name || 'Guaranty Trust Bank (GTB)'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.4rem 0', fontSize: '.82rem', borderTop: '1px solid rgba(200,215,240,.06)' }}>
                  <span style={{ color: 'var(--muted)' }}>Account Number:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace' }}>{settings?.bank_account_number || '0123456789'}</span>
                    <button
                      type="button"
                      onClick={copyAccountNum}
                      style={{ background: 'transparent', border: '1px solid rgba(200,215,240,.2)', color: copied ? '#00c864' : 'var(--muted)', padding: '.2rem .5rem', borderRadius: 4, fontSize: '.65rem', cursor: 'pointer' }}
                    >
                      {copied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.4rem 0', fontSize: '.82rem', borderTop: '1px solid rgba(200,215,240,.06)' }}>
                  <span style={{ color: 'var(--muted)' }}>Account Name:</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{settings?.bank_account_name || 'Sofe Group Limited'}</span>
                </div>

                {/* Upload proof */}
                <div style={{ marginTop: '1.2rem', paddingTop: '1.2rem', borderTop: '1px solid rgba(200,215,240,.08)' }}>
                  <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#fff', marginBottom: '.5rem' }}>
                    Upload Proof of Payment (Receipt / Screenshot)
                  </label>
                  <label style={{
                    display: 'block', border: uploadedProofPath ? '2px solid #00c864' : '2px dashed rgba(200,215,240,.18)',
                    background: uploadedProofPath ? 'rgba(0,200,100,.04)' : '#080E1A',
                    borderRadius: 8, padding: '1.4rem', textAlign: 'center', cursor: 'pointer'
                  }}>
                    <input type="file" accept="image/*,application/pdf" onChange={handleProofChange} style={{ display: 'none' }} />
                    <div style={{ fontSize: '1.6rem', marginBottom: '.3rem' }}>{uploadedProofPath ? '✓' : '📄'}</div>
                    <div style={{ fontSize: '.84rem', fontWeight: 600, color: uploadedProofPath ? '#00c864' : '#fff' }}>
                      {proofUploading
                        ? 'Uploading file…'
                        : uploadedProofPath
                        ? `✓ ${proofFileName} (Ready)`
                        : 'Click to select receipt or PDF (Max 5MB)'}
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                onClick={() => validateAndNext(3)}
                style={{ padding: '.85rem 1.6rem', background: 'transparent', color: 'var(--muted)', border: '1px solid rgba(200,215,240,.15)', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={submitting || proofUploading}
                onClick={handleSubmit}
                style={{
                  padding: '.85rem 2.2rem',
                  background: 'linear-gradient(135deg, #C9A84C, #f0d080)',
                  color: '#000', fontWeight: 800, borderRadius: 8, border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Submitting Application…' : 'Submit Application →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
