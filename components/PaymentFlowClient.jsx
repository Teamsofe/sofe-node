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
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  serverTimestamp,
  ref,
  uploadBytes
} from '@/lib/firebase';

const FALLBACK_PAYMENT_COURSES = {
  'smart-contract-developer': {
    id: 'smart-contract-developer',
    title: 'Smart Contract Development',
    description: 'Learn to write, audit, and deploy secure smart contracts on leading blockchain networks to power decentralized applications.',
    tier: 'track',
    price: 200000
  },
  'smart-contract-development': {
    id: 'smart-contract-developer',
    title: 'Smart Contract Development',
    description: 'Learn to write, audit, and deploy secure smart contracts on leading blockchain networks to power decentralized applications.',
    tier: 'track',
    price: 200000
  },
  'foundation': {
    id: 'foundation',
    title: 'Blockchain & Cryptocurrency Foundation',
    description: 'Master the fundamentals of Web3, wallets, and smart contracts.',
    tier: 'foundation',
    price: 0
  }
};

export default function PaymentFlowClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get('course') || searchParams.get('id');
  const tierParam = searchParams.get('tier'); // 'premium' for $100 VIP badge
  const isPremiumCheckout = tierParam === 'premium' || courseIdParam === 'premium';

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [course, setCourse] = useState(null);
  const [settings, setSettings] = useState({});

  // Payment state
  const [selectedMethod, setSelectedMethod] = useState('paystack'); // 'paystack' | 'bank'
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountMsg, setDiscountMsg] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const VIP_ADMIN_WA = 'https://wa.me/2349034201114?text=Hello%20Admin,%20I%20have%20paid%20my%20$100%20Sofe%20Node%20Premium%20Membership%20fee.%20Please%20verify%20and%20add%20me%20to%20the%20VIP%20executive%20group.';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        const nextUrl = encodeURIComponent(window.location.pathname + window.location.search);
        router.replace(`/login?next=${nextUrl}`);
        return;
      }
      setCurrentUser(user);
      await loadProfileAndProduct(user);
    });

    return () => unsub();
  }, [courseIdParam, isPremiumCheckout, router]);

  const loadProfileAndProduct = async (user) => {
    try {
      try {
        const uSnap = await getDoc(doc(db, 'users', user.uid));
        if (uSnap.exists()) setUserProfile(uSnap.data());
      } catch (e) {}

      try {
        const setSnap = await getDoc(doc(db, 'settings', 'platform'));
        if (setSnap.exists()) setSettings(setSnap.data());
      } catch (e) {}

      if (isPremiumCheckout) {
        setCourse({
          id: 'premium_membership',
          title: 'Sofe Node Premium Membership ($100 VIP)',
          description: 'Lifetime VIP status, distinguished badge, exclusive executive mastermind WhatsApp group, and prioritized career bounties.',
          tier: 'executive',
          price: 150000 // ~$100 in NGN equivalent
        });
      } else if (courseIdParam) {
        let found = null;
        try {
          const cSnap = await getDoc(doc(db, 'courses', courseIdParam));
          if (cSnap.exists()) {
            found = { id: cSnap.id, ...cSnap.data() };
          } else {
            const qSnap = await getDocs(query(collection(db, 'courses'), where('slug', '==', courseIdParam)));
            if (!qSnap.empty) {
              found = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
            }
          }
        } catch (e) {}

        if (!found && FALLBACK_PAYMENT_COURSES[courseIdParam]) {
          found = FALLBACK_PAYMENT_COURSES[courseIdParam];
        }

        if (found) {
          setCourse(found);
        } else {
          // Default fallback
          setCourse({
            id: courseIdParam,
            title: courseIdParam.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
            description: 'Comprehensive Web3 career track curriculum with industry certification and mentorship.',
            tier: 'track',
            price: 200000
          });
        }
      } else {
        // Default to Foundation
        setCourse({
          id: 'foundation',
          title: 'Blockchain & Cryptocurrency Foundation',
          description: 'Master the fundamentals of Web3, wallets, and smart contracts.',
          tier: 'foundation',
          price: 0
        });
      }
    } catch (err) {
      console.error('Error loading checkout:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Discount code application
  const handleApplyDiscount = async () => {
    const code = discountCode.trim().toUpperCase();
    if (!code) return;

    try {
      const snap = await getDocs(query(collection(db, 'discount_codes'), where('code', '==', code), where('status', '==', 'active')));
      if (snap.empty) {
        setDiscountMsg({ type: 'error', text: 'Invalid or expired discount code.' });
        setAppliedDiscount(null);
        return;
      }

      const dData = snap.docs[0].data();
      setAppliedDiscount({ id: snap.docs[0].id, ...dData });
      setDiscountMsg({ type: 'success', text: `✓ Discount applied (${dData.type === 'percentage' ? `${dData.value}% off` : `₦${dData.value} off`})` });
    } catch (e) {
      setDiscountMsg({ type: 'error', text: 'Error verifying discount code.' });
    }
  };

  // Proof file upload to Firebase Storage
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max size is 5MB.');
      return;
    }
    setProofFile(file);
  };

  // Calculate net amount paid
  const originalPrice = course?.price || 0;
  let discountAmount = 0;
  if (appliedDiscount && originalPrice > 0) {
    if (appliedDiscount.type === 'percentage') {
      discountAmount = Math.round((originalPrice * appliedDiscount.value) / 100);
    } else {
      discountAmount = Math.min(appliedDiscount.value, originalPrice);
    }
  }
  const netPaid = Math.max(0, originalPrice - discountAmount);

  // Handle Free Enrolment Directly
  const handleFreeEnrol = async () => {
    setSubmitting(true);
    try {
      const enrolId = `${currentUser.uid}_${course.id}`;
      await setDoc(doc(db, 'enrolments', enrolId), {
        user_id: currentUser.uid,
        user_email: currentUser.email,
        course_id: course.id,
        course_title: course.title || course.id,
        status: 'active',
        progress_pct: 0,
        enrolled_at: serverTimestamp()
      }, { merge: true });

      if (course.id !== 'foundation') {
        const foundationEnrolId = `${currentUser.uid}_foundation`;
        await setDoc(doc(db, 'enrolments', foundationEnrolId), {
          user_id: currentUser.uid,
          user_email: currentUser.email,
          course_id: 'foundation',
          course_title: 'Blockchain & Cryptocurrency Foundation',
          status: 'active',
          progress_pct: 0,
          enrolled_at: serverTimestamp()
        }, { merge: true });

        await updateDoc(doc(db, 'users', currentUser.uid), {
          career_enrolled: true,
          updated_at: serverTimestamp()
        });
      }

      setSuccessData({
        title: 'Enrolment Activated!',
        message: 'You now have full access to your learning curriculum and the foundational course.'
      });
    } catch (err) {
      alert('Error activating free course: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Payment (Bank Transfer or Paystack)
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (originalPrice === 0) {
      return handleFreeEnrol();
    }

    if (selectedMethod === 'bank' && !proofFile) {
      alert('Please select and upload your payment transfer proof receipt.');
      return;
    }

    setSubmitting(true);
    try {
      let proofUrl = null;
      if (proofFile) {
        setProofUploading(true);
        const storageRef = ref(storage, `payment_proofs/${currentUser.uid}_${Date.now()}_${proofFile.name}`);
        const snap = await uploadBytes(storageRef, proofFile);
        proofUrl = snap.ref.fullPath;
        setProofUploading(false);
      }

      const reference = `SOFE_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

      // 1. Record in payments table
      await addDoc(collection(db, 'payments'), {
        user_id: currentUser.uid,
        user_email: currentUser.email,
        course_id: course.id,
        course_title: course.title,
        is_premium: isPremiumCheckout,
        original_amount: originalPrice,
        discount_amount: discountAmount,
        amount: netPaid,
        method: selectedMethod,
        reference: reference,
        proof_url: proofUrl,
        discount_code: appliedDiscount?.code || null,
        status: selectedMethod === 'bank' ? 'pending_verification' : 'successful',
        created_at: serverTimestamp()
      });

      // 2. If it's a course checkout, activate enrolment directly
      if (!isPremiumCheckout) {
        const enrolId = `${currentUser.uid}_${course.id}`;
        await setDoc(doc(db, 'enrolments', enrolId), {
          user_id: currentUser.uid,
          user_email: currentUser.email,
          course_id: course.id,
          course_title: course.title,
          status: 'active',
          progress_pct: 0,
          payment_ref: reference,
          enrolled_at: serverTimestamp()
        }, { merge: true });

        if (course.id !== 'foundation') {
          const foundationEnrolId = `${currentUser.uid}_foundation`;
          await setDoc(doc(db, 'enrolments', foundationEnrolId), {
            user_id: currentUser.uid,
            user_email: currentUser.email,
            course_id: 'foundation',
            course_title: 'Blockchain & Cryptocurrency Foundation',
            status: 'active',
            progress_pct: 0,
            enrolled_at: serverTimestamp()
          }, { merge: true });
        }
      } else {
        // Premium Membership Checkout: Grant Foundation course access directly
        const foundationEnrolId = `${currentUser.uid}_foundation`;
        await setDoc(doc(db, 'enrolments', foundationEnrolId), {
          user_id: currentUser.uid,
          user_email: currentUser.email,
          course_id: 'foundation',
          course_title: 'Blockchain & Cryptocurrency Foundation',
          status: 'active',
          progress_pct: 0,
          payment_ref: reference,
          enrolled_at: serverTimestamp()
        }, { merge: true });
      }

      // 3. Update user document — Upgrade to Premium & Level 2 - Affiliate
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...(course?.id !== 'foundation' && !isPremiumCheckout ? { career_enrolled: true } : {}),
        ...(isPremiumCheckout ? { is_premium: true, affiliate_tier: 'affiliate' } : {}),
        updated_at: serverTimestamp()
      });

      // 4. Commission logic
      if (userProfile?.referred_by && netPaid > 0) {
        try {
          const refSnap = await getDoc(doc(db, 'users', userProfile.referred_by));
          if (refSnap.exists()) {
            const refData = refSnap.data();
            const isAmbassadorRef = refData.affiliate_tier === 'ambassador' || refData.role === 'ambassador' || refData.role === 'node_lead' || refData.role === 'admin';
            const isAffiliateRef = isAmbassadorRef || refData.affiliate_tier === 'affiliate' || refData.is_premium || ((refData.qualified_refs_count || 0) >= 10);
            const directRate = (isAmbassadorRef || isAffiliateRef) ? 0.10 : 0.05;
            const directAmt = Math.round(netPaid * directRate);

            await addDoc(collection(db, 'commissions'), {
              user_id: userProfile.referred_by,
              payer_uid: currentUser.uid,
              payer_email: currentUser.email,
              course_id: course.id,
              net_paid: netPaid,
              rate: directRate,
              amount: directAmt,
              tier: isAmbassadorRef ? 'ambassador_10' : (isAffiliateRef ? 'affiliate_10' : 'newbie_5'),
              description: `${Math.round(directRate * 100)}% Direct commission from ${currentUser.email} on ${course.title}`,
              status: 'pending',
              created_at: serverTimestamp()
            });
          }
        } catch (commErr) {
          console.warn('Commission recording note:', commErr);
        }
      }

      setSuccessData({
        title: isPremiumCheckout ? '💎 Premium Membership Activated!' : 'Payment Received — Enrolled Successfully!',
        isPremium: isPremiumCheckout,
        message: isPremiumCheckout
          ? 'Your $100 VIP payment has been recorded. Connect with our VIP admin on WhatsApp to join the private mastermind group.'
          : selectedMethod === 'bank'
          ? "We've received your transfer proof. You have been enrolled in your course and the foundational course."
          : 'Your payment was successful! Your course and the foundational course are now active in your dashboard.'
      });
    } catch (err) {
      console.error('Payment submission failed:', err);
      alert('Error submitting payment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white, #fff)' }}>
        <p>Initializing secure checkout...</p>
      </div>
    );
  }

  return (
    <div className="payment-root-wrapper" style={{ background: '#040810', color: '#c8d7f0', minHeight: '100vh', fontFamily: 'Poppins, sans-serif', padding: '7.5rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* SUCCESS STATE */}
        {successData ? (
          <div className="payment-card" style={{
            background: '#0a1628',
            border: '1px solid rgba(20,40,255,0.25)',
            borderRadius: 16,
            padding: '3rem 2rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{successData.isPremium ? '💎' : '✅'}</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '0.6rem' }}>
              {successData.title}
            </h2>
            <p style={{ color: 'rgba(200,215,240,0.8)', fontSize: '0.9rem', maxWidth: 520, margin: '0 auto 2rem', lineHeight: 1.6 }}>
              {successData.message}
            </p>

            {successData.isPremium && (
              <div style={{ marginBottom: '2rem' }}>
                <a
                  href={VIP_ADMIN_WA}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#25D366',
                    color: '#000',
                    padding: '0.75rem 1.8rem',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>💬</span> Contact VIP Admin on WhatsApp →
                </a>
              </div>
            )}

            <div>
              <Link
                href="/dashboard"
                style={{
                  background: '#1428FF',
                  color: '#fff',
                  padding: '0.65rem 1.6rem',
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  textDecoration: 'none'
                }}
              >
                Go to Student Dashboard →
              </Link>
            </div>
          </div>
        ) : (
          /* CHECKOUT FORM */
          <div>
            <div style={{ marginBottom: '1.75rem' }}>
              <Link
                href="/academy"
                className="payment-back-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(20,40,255,0.08)',
                  border: '1px solid rgba(200,215,240,0.2)',
                  borderRadius: 6,
                  padding: '0.45rem 1rem',
                  fontSize: '0.78rem',
                  color: 'var(--white, #fff)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
              >
                ← Back to academy
              </Link>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--white, #fff)', marginBottom: '0.35rem' }}>
              Complete your enrolment
            </h1>
            <p style={{ color: 'var(--muted, #94a3b8)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
              Pay securely via Paystack or bank transfer.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
              {/* LEFT: PAYMENT METHOD & FORM */}
              <div>
                <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {originalPrice > 0 && (
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--white, #fff)', display: 'block', marginBottom: '0.6rem' }}>
                        Payment method
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedMethod('paystack')}
                          className={`payment-method-card ${selectedMethod === 'paystack' ? 'active' : ''}`}
                          style={{
                            background: selectedMethod === 'paystack' ? 'rgba(20,40,255,0.15)' : '#080E1A',
                            border: selectedMethod === 'paystack' ? '2px solid #FF8A00' : '1px solid rgba(200,215,240,0.15)',
                            borderRadius: 12,
                            padding: '1.25rem 1rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>💳</div>
                          <div className="method-title" style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>Card / Bank App</div>
                          <div className="method-sub" style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.65)', marginTop: '0.2rem' }}>Paystack — Instant access</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMethod('bank')}
                          className={`payment-method-card ${selectedMethod === 'bank' ? 'active' : ''}`}
                          style={{
                            background: selectedMethod === 'bank' ? 'rgba(20,40,255,0.15)' : '#080E1A',
                            border: selectedMethod === 'bank' ? '2px solid #FF8A00' : '1px solid rgba(200,215,240,0.15)',
                            borderRadius: 12,
                            padding: '1.25rem 1rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>🏛️</div>
                          <div className="method-title" style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>Bank Transfer</div>
                          <div className="method-sub" style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.65)', marginTop: '0.2rem' }}>Send to our account, upload proof</div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bank Account Details */}
                  {selectedMethod === 'bank' && originalPrice > 0 && (
                    <div className="payment-card" style={{ background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 10, padding: '1.2rem', fontSize: '0.82rem' }}>
                      <div style={{ color: '#FF8A00', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Transfer Settlement Details</div>
                      <div style={{ marginBottom: '0.3rem' }}>Bank: <strong>{settings.bank_name || 'Access Bank / GTBank'}</strong></div>
                      <div style={{ marginBottom: '0.3rem' }}>Account Number: <strong style={{ color: '#FF8A00', fontSize: '0.95rem' }}>{settings.bank_account_number || '0123456789'}</strong></div>
                      <div style={{ marginBottom: '0.5rem' }}>Account Name: <strong>{settings.bank_account_name || 'Sofe Group Limited'}</strong></div>
                      <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
                        Pay Exactly: ₦{netPaid.toLocaleString('en-NG')}
                      </div>
                    </div>
                  )}

                  {/* Discount Code Input */}
                  {originalPrice > 0 && (
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--white, #fff)', display: 'block', marginBottom: '0.5rem' }}>
                        Have a discount code?
                      </label>
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <input
                          type="text"
                          placeholder="Enter code (e.g., EARLYBIRD)"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          style={{
                            flex: 1,
                            background: '#080E1A',
                            border: '1px solid rgba(200,215,240,0.2)',
                            borderRadius: 8,
                            padding: '0.75rem 1rem',
                            color: '#fff',
                            fontSize: '0.82rem'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleApplyDiscount}
                          style={{
                            background: '#FF8A00',
                            border: 'none',
                            color: '#000',
                            borderRadius: 8,
                            padding: '0.75rem 1.4rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Apply
                        </button>
                      </div>
                      {discountMsg && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.74rem', color: discountMsg.type === 'success' ? '#10b981' : '#EF4444' }}>
                          {discountMsg.text}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Proof Upload */}
                  {selectedMethod === 'bank' && originalPrice > 0 && (
                    <div>
                      <label style={{ fontSize: '0.78rem', color: 'rgba(200,215,240,0.8)', display: 'block', marginBottom: '0.4rem' }}>
                        Upload Payment Proof (Receipt Screenshot / PDF)
                      </label>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        style={{ fontSize: '0.8rem', color: 'rgba(200,215,240,0.8)' }}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: '100%',
                      background: '#FF8A00',
                      color: '#000',
                      border: 'none',
                      borderRadius: 8,
                      padding: '1rem',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      marginTop: '0.5rem',
                      boxShadow: '0 4px 16px rgba(255,138,0,0.35)',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {submitting ? 'Processing Payment...' : originalPrice === 0 ? 'Activate Free Enrolment →' : 'Complete payment →'}
                  </button>

                  <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <span>🔒</span>
                    <span>Secure payment. Card data is handled by Paystack</span>
                  </div>
                </form>
              </div>

              {/* RIGHT: ORDER SUMMARY */}
              <div className="payment-card" style={{ background: '#080E1A', border: '1px solid rgba(200,215,240,0.15)', borderRadius: 16, padding: '2rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1.25rem' }}>Order summary</h3>

                <div className="payment-summary-box" style={{ background: 'rgba(20,40,255,0.08)', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'inline-block', background: 'rgba(255,138,0,0.15)', color: '#FF8A00', borderRadius: 4, padding: '0.2rem 0.5rem', fontSize: '0.68rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                    ◆ {course?.tier === 'foundation' ? 'FOUNDATION' : course?.tier === 'executive' ? 'EXECUTIVE' : 'CAREER TRACK'}
                  </div>
                  <div className="summary-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '0.4rem' }}>{course?.title}</div>
                  <div className="summary-desc" style={{ fontSize: '0.78rem', color: 'rgba(200,215,240,0.7)', lineHeight: 1.6, marginBottom: '0.8rem' }}>
                    {course?.description}
                  </div>
                  <div style={{ background: 'rgba(20,40,255,0.12)', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem 0.8rem', fontSize: '0.74rem', color: '#8DA6FF' }}>
                    ✓ Foundation Course included — must be completed before track modules unlock.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'rgba(200,215,240,0.85)', marginBottom: '0.8rem' }}>
                  <span>{course?.title}</span>
                  <strong>₦{originalPrice.toLocaleString('en-NG')}</strong>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#10b981', marginBottom: '0.8rem' }}>
                    <span>Discount:</span>
                    <strong>-₦{discountAmount.toLocaleString('en-NG')}</strong>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(200,215,240,0.15)',
                  paddingTop: '1rem',
                  marginTop: '1rem',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#FF8A00'
                }}>
                  <span>Total</span>
                  <span>₦{netPaid.toLocaleString('en-NG')}</span>
                </div>

                <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: 'rgba(200,215,240,0.6)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>💎</span>
                  <span>Lifetime access — learn at your own pace, no expiry.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
