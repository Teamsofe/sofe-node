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

export default function PaymentFlowClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get('course');
  const tierParam = searchParams.get('tier'); // 'premium' for $100 VIP badge
  const isPremiumCheckout = tierParam === 'premium' || courseIdParam === 'premium';

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [course, setCourse] = useState(null);
  const [settings, setSettings] = useState({});

  // Payment state
  const [selectedMethod, setSelectedMethod] = useState('bank'); // 'bank' | 'paystack'
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountMsg, setDiscountMsg] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [proofUploading, setProofUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const VIP_ADMIN_WA = 'https://wa.me/2348123456789?text=Hello%20Admin,%20I%20have%20paid%20my%20$100%20Sofe%20Node%20Premium%20Membership%20fee.%20Please%20verify%20and%20add%20me%20to%20the%20VIP%20executive%20group.';

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
      const uSnap = await getDoc(doc(db, 'users', user.uid));
      if (uSnap.exists()) setUserProfile(uSnap.data());

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
        const cSnap = await getDoc(doc(db, 'courses', courseIdParam));
        if (cSnap.exists()) {
          setCourse({ id: cSnap.id, ...cSnap.data() });
        } else {
          setErrorMsg('Course not found. Please choose a valid course from the academy.');
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
        course_id: course.id,
        status: 'active',
        progress_pct: 0,
        enrolled_at: serverTimestamp()
      });

      setSuccessData({
        title: 'Enrolment Activated!',
        message: 'You now have full access to your learning curriculum.'
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

    setSubmitting(true);
    try {
      let proofUrl = '';
      if (selectedMethod === 'bank') {
        if (!proofFile) {
          alert('Please upload your payment receipt / bank transfer screenshot.');
          setSubmitting(false);
          return;
        }

        setProofUploading(true);
        const ext = proofFile.name.split('.').pop();
        const storagePath = `payment_proofs/${currentUser.uid}/${Date.now()}.${ext}`;
        const fileRef = ref(storage, storagePath);
        await uploadBytes(fileRef, proofFile, { contentType: proofFile.type });
        proofUrl = storagePath;
        setProofUploading(false);
      }

      const reference = `PAY-${isPremiumCheckout ? 'VIP' : course.id.toUpperCase()}-${Date.now()}`;

      // Create Payment Record
      await setDoc(doc(db, 'payments', reference), {
        user_id: currentUser.uid,
        user_email: currentUser.email,
        course_id: course.id,
        is_premium: isPremiumCheckout,
        original_amount: originalPrice,
        discount_code: appliedDiscount?.code || null,
        discount_amount: discountAmount,
        amount: netPaid, // NET PAID AMOUNT
        method: selectedMethod,
        bank_proof_url: proofUrl,
        status: selectedMethod === 'bank' ? 'pending_approval' : 'completed',
        created_at: serverTimestamp()
      });

      // Credit 2-tier commission waterfall based on NET PAID amount
      if (userProfile?.referred_by && netPaid > 0) {
        try {
          const directAmt = Math.round(netPaid * 0.10); // 10% direct
          const indirectAmt = Math.round(netPaid * 0.05); // 5% indirect

          // Direct Referrer
          await addDoc(collection(db, 'commissions'), {
            user_id: userProfile.referred_by,
            payer_uid: currentUser.uid,
            payer_email: currentUser.email,
            course_id: course.id,
            net_paid: netPaid,
            rate: 0.10,
            amount: directAmt,
            tier: 'direct_10',
            description: `10% Direct commission from ${currentUser.email} on ${course.title}`,
            status: 'pending',
            created_at: serverTimestamp()
          });

          // Check if direct referrer has an indirect parent referrer
          const refSnap = await getDoc(doc(db, 'users', userProfile.referred_by));
          if (refSnap.exists() && refSnap.data().referred_by) {
            await addDoc(collection(db, 'commissions'), {
              user_id: refSnap.data().referred_by,
              payer_uid: currentUser.uid,
              payer_email: currentUser.email,
              course_id: course.id,
              net_paid: netPaid,
              rate: 0.05,
              amount: indirectAmt,
              tier: 'indirect_5',
              description: `5% Indirect network commission from ${currentUser.email} on ${course.title}`,
              status: 'pending',
              created_at: serverTimestamp()
            });
          }
        } catch (commErr) {
          console.warn('Commission recording note:', commErr);
        }
      }

      // If Premium Membership, immediately mark is_premium on user doc
      if (isPremiumCheckout) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          is_premium: true,
          updated_at: serverTimestamp()
        });
      }

      setSuccessData({
        title: isPremiumCheckout ? '💎 Premium Membership Activated!' : 'Payment Received — Awaiting Verification',
        isPremium: isPremiumCheckout,
        message: isPremiumCheckout
          ? 'Your $100 VIP payment has been recorded. Connect with our VIP admin on WhatsApp to join the private mastermind group.'
          : selectedMethod === 'bank'
          ? "We've received your transfer proof. Admin verification usually takes 1-3 hours."
          : 'Your payment was successful and your course has been unlocked.'
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
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <p>Initializing secure checkout...</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#040810', color: '#c8d7f0', minHeight: '100vh', fontFamily: 'Poppins, sans-serif', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* SUCCESS STATE */}
        {successData ? (
          <div style={{
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
            {/* LEFT: PAYMENT FORM */}
            <div style={{ background: '#0a1628', border: '1px solid rgba(200,215,240,0.12)', borderRadius: 14, padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
                Checkout & Settlement
              </h2>

              <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {originalPrice > 0 && (
                  <div>
                    <label style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.7)', display: 'block', marginBottom: '0.4rem' }}>
                      Settlement Method
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('bank')}
                        style={{
                          background: selectedMethod === 'bank' ? 'rgba(20,40,255,0.2)' : '#060d1a',
                          border: selectedMethod === 'bank' ? '1px solid #1428FF' : '1px solid rgba(200,215,240,0.1)',
                          color: '#fff',
                          padding: '0.65rem',
                          borderRadius: 8,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        🏦 Bank Transfer
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('paystack')}
                        style={{
                          background: selectedMethod === 'paystack' ? 'rgba(20,40,255,0.2)' : '#060d1a',
                          border: selectedMethod === 'paystack' ? '1px solid #1428FF' : '1px solid rgba(200,215,240,0.1)',
                          color: '#fff',
                          padding: '0.65rem',
                          borderRadius: 8,
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        💳 Card / Paystack
                      </button>
                    </div>
                  </div>
                )}

                {/* Bank Account Details */}
                {selectedMethod === 'bank' && originalPrice > 0 && (
                  <div style={{ background: '#060d1a', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 8, padding: '1rem', fontSize: '0.78rem' }}>
                    <div style={{ color: '#FF8A00', fontWeight: 700, marginBottom: '0.4rem' }}>Transfer Settlement Details</div>
                    <div>Bank: <strong>{settings.bank_name || 'Access Bank / GTBank'}</strong></div>
                    <div>Account Number: <strong style={{ color: '#fff', fontSize: '0.85rem' }}>{settings.bank_account_number || '0123456789'}</strong></div>
                    <div>Account Name: <strong>{settings.bank_account_name || 'Sofe Group Limited'}</strong></div>
                    <div style={{ marginTop: '0.6rem', color: '#10b981', fontWeight: 700 }}>
                      Pay Exactly: ₦{netPaid.toLocaleString('en-NG')}
                    </div>
                  </div>
                )}

                {/* Discount Code Input */}
                {originalPrice > 0 && (
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)', display: 'block', marginBottom: '0.3rem' }}>
                      Promo / Discount Code
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        placeholder="ENTER CODE"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        style={{
                          flex: 1,
                          background: '#060d1a',
                          border: '1px solid rgba(20,40,255,0.25)',
                          borderRadius: 6,
                          padding: '0.55rem',
                          color: '#fff',
                          fontSize: '0.78rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyDiscount}
                        style={{
                          background: 'rgba(20,40,255,0.2)',
                          border: '1px solid #1428FF',
                          color: '#fff',
                          borderRadius: 6,
                          padding: '0.55rem 1rem',
                          fontSize: '0.76rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Apply
                      </button>
                    </div>
                    {discountMsg && (
                      <div style={{ fontSize: '0.7rem', marginTop: '0.3rem', color: discountMsg.type === 'success' ? '#10b981' : '#ff5555' }}>
                        {discountMsg.text}
                      </div>
                    )}
                  </div>
                )}

                {/* Proof Upload */}
                {selectedMethod === 'bank' && originalPrice > 0 && (
                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)', display: 'block', marginBottom: '0.3rem' }}>
                      Upload Payment Proof (Screenshot / PDF)
                    </label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      style={{ fontSize: '0.75rem', color: 'rgba(200,215,240,0.7)' }}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: '#1428FF',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0.8rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '0.5rem'
                  }}
                >
                  {submitting ? 'Processing Payment...' : originalPrice === 0 ? 'Activate Free Enrolment →' : `Pay ₦${netPaid.toLocaleString('en-NG')} Now →`}
                </button>
              </form>
            </div>

            {/* RIGHT: ORDER SUMMARY */}
            <div style={{ background: '#0a1628', border: '1px solid rgba(200,215,240,0.12)', borderRadius: 14, padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>Order Summary</h3>

              <div style={{ background: '#060d1a', border: '1px solid rgba(20,40,255,0.15)', borderRadius: 8, padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>{course?.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)', marginTop: '0.2rem' }}>
                  {course?.description?.slice(0, 100)}...
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(200,215,240,0.7)' }}>
                  <span>Original Fee:</span>
                  <span>₦{originalPrice.toLocaleString('en-NG')}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                    <span>Discount Deducted:</span>
                    <span>-₦{discountAmount.toLocaleString('en-NG')}</span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(200,215,240,0.1)',
                  paddingTop: '0.8rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#FF8A00'
                }}>
                  <span>Net Amount:</span>
                  <span>₦{netPaid.toLocaleString('en-NG')}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.5)', marginTop: '1.25rem', lineHeight: 1.5 }}>
                ✓ Secure encrypted 256-bit checkout. Referral commissions are calculated on the net amount paid after discounts.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
