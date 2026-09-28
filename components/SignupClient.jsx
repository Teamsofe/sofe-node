'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  setDoc,
  doc,
  addDoc,
  collection,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp
} from '@/lib/firebase';

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCodeFromUrl = searchParams.get('ref') || '';
  const nodeFromUrl = searchParams.get('node') || '';

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    referralCode: refCodeFromUrl,
    campusNode: nodeFromUrl || 'online',
  });

  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdUser, setCreatedUser] = useState(null);
  const [nodeWhatsappLink, setNodeWhatsappLink] = useState('');

  // Load campus nodes / chapters
  useEffect(() => {
    async function fetchChapters() {
      if (!db) return;
      try {
        const snap = await getDocs(collection(db, 'chapters'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setNodes(list);
      } catch (err) {
        console.warn('Could not load chapters:', err);
      }
    }
    fetchChapters();
  }, []);

  async function handleSignup(e) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    if (form.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (!auth || !db) throw new Error('Firebase is not initialized');

      // 1. Create auth user
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      const user = cred.user;

      // 2. Set display name
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
      await updateProfile(user, { displayName: fullName });

      // 3. Send email verification
      try {
        await sendEmailVerification(user);
      } catch (eVer) {
        console.warn('Could not send verification email:', eVer);
      }

      // 4. Generate unique referral code: first 4 letters of firstname + random 4 digits
      const cleanFirst = form.firstName.trim().toLowerCase().replace(/[^a-z]/g, '').slice(0, 4) || 'sofe';
      const myRefCode = `${cleanFirst}${Math.floor(1000 + Math.random() * 9000)}`;

      // 5. Create user document in Firestore
      const selectedChapter = nodes.find(n => n.id === form.campusNode);
      const whatsapp = selectedChapter?.whatsapp_link || '';
      setNodeWhatsappLink(whatsapp);

      const userDocData = {
        uid: user.uid,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: 'student',
        xp_total: 0,
        xp_tier: 'Genesis',
        wallet_balance: 0,
        referral_code: myRefCode,
        referred_by_code: form.referralCode.trim() || null,
        chapter_id: form.campusNode,
        node_label: selectedChapter?.name || 'Online / Global Node',
        email_verified: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), userDocData);

      // 6. Record referral if referrer code exists
      if (form.referralCode.trim()) {
        try {
          const refSnap = await getDocs(query(collection(db, 'users'), where('referral_code', '==', form.referralCode.trim())));
          if (!refSnap.empty) {
            const referrerDoc = refSnap.docs[0];
            const refData = referrerDoc.data();
            await addDoc(collection(db, 'referrals'), {
              referrer_id: referrerDoc.id,
              referrer_name: `${refData.first_name || ''} ${refData.last_name || ''}`.trim() || refData.email,
              referrer_code: form.referralCode.trim(),
              referred_user_id: user.uid,
              referee_id: user.uid,
              referred_name: fullName,
              referred_email: form.email.trim(),
              status: 'signed_up',
              commission_amount: 0,
              created_at: serverTimestamp(),
            });
          }
        } catch (eRef) {
          console.warn('Could not record referral:', eRef);
        }
      }

      setCreatedUser(userDocData);
    } catch (err) {
      console.error('Signup error:', err);
      let msg = err.message || 'Signup failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') msg = 'An account with this email already exists. Please log in.';
      if (err.code === 'auth/weak-password') msg = 'Password is too weak. Please use at least 6 characters.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  // If successfully created, show welcome / WhatsApp group screen
  if (createdUser) {
    return (
      <>
        <link rel="stylesheet" href="/css/signup.css" />
        <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '2rem 5vw' }}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '16px', padding: '3rem 2.5rem', maxWidth: '520px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--white)', marginBottom: '.5rem' }}>Welcome to Sofe Group!</h2>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Your Sofian account has been successfully created. We&apos;ve sent a verification link to <strong style={{ color: 'var(--white)' }}>{createdUser.email}</strong>.
            </p>

            {nodeWhatsappLink ? (
              <div style={{ marginBottom: '2rem' }}>
                <a
                  href={nodeWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', background: '#25D366', color: '#062f1a', textDecoration: 'none', fontWeight: 800, fontSize: '.95rem', padding: '.9rem 1.8rem', borderRadius: '50px' }}
                >
                  <span>💬</span> Join Your Campus WhatsApp Node
                </a>
              </div>
            ) : null}

            <Link
              href="/dashboard"
              style={{ display: 'block', padding: '.85rem', background: 'var(--blue)', color: '#fff', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', fontSize: '.95rem' }}
            >
              Continue to Sofian Dashboard →
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="/css/signup.css" />

      <div className="auth-page">
        {/* LEFT panel */}
        <div className="auth-brand">
          <Link href="/" className="auth-brand-logo">
            <img src="/images/Nodes/SofeLogoHome.png" alt="Sofe Node" />
          </Link>
          <div className="auth-brand-body">
            <div className="auth-brand-tag">Free to Join</div>
            <h1>Learn, Earn &amp;<br />Build Your <em>Web3 Career.</em></h1>
            <p>Join 5,000+ Africans who&apos;ve used Sofe Node to break into blockchain — for free. Your journey starts with one click.</p>
            <div className="benefit-list">
              <div className="benefit-item">
                <div className="benefit-icon blue">📚</div>
                <div>
                  <div className="benefit-title">Free Foundation Course</div>
                  <div className="benefit-desc">Start with the Blockchain &amp; Crypto Bootcamp — fully subsidised by our global partners.</div>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon orange">💰</div>
                <div>
                  <div className="benefit-title">Earn While You Learn</div>
                  <div className="benefit-desc">Unlock your referral link on graduation. Earn 10% direct &amp; 5% indirect commission.</div>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon green">🏆</div>
                <div>
                  <div className="benefit-title">Verified Certificates</div>
                  <div className="benefit-desc">Download and share on-chain certificates to LinkedIn and your portfolio.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT form panel */}
        <div className="auth-form-panel">
          <div className="auth-form-box">
            <h2 className="auth-form-title">Create your account 🚀</h2>
            <p className="auth-form-sub">Already have an account? <Link href="/login">Log in here</Link></p>

            {errorMsg && (
              <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', padding: '.8rem 1rem', color: '#f87171', fontSize: '.85rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <span>⚠️</span> <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSignup} noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>First Name</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Chukwuemeka"
                    style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '.88rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>Last Name</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Obi"
                    style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '.88rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="emeka@email.com"
                  style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>Phone / WhatsApp Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+234 800 000 0000"
                  style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>Password (min. 6 characters)</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '.88rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>Select Your Campus Node / Region</label>
                <select
                  value={form.campusNode}
                  onChange={e => setForm({ ...form, campusNode: e.target.value })}
                  style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '.88rem' }}
                >
                  <option value="online">Online / Global Node (Virtual)</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.name || n.id}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' }}>Referral Code (Optional)</label>
                <input
                  type="text"
                  value={form.referralCode}
                  onChange={e => setForm({ ...form, referralCode: e.target.value })}
                  placeholder="e.g. shed1234"
                  style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '.88rem' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '.85rem', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '.95rem' }}
              >
                {loading ? 'Creating Account…' : 'Create Free Account →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
