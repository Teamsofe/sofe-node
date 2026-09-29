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

/* ── Account-type configuration ───────────────────────────────────── */
const ACCOUNT_TYPES = [
  {
    key: 'sofian',
    label: 'User / Student',
    icon: '🎓',
    desc: 'Learn Web3, earn commissions, and build your career.',
    role: 'student',
  },
  {
    key: 'partner_org',
    label: 'Partner',
    icon: '🤝',
    desc: 'Partner with Sofe Node to distribute services or collaborate.',
    role: 'partner',
  },
  {
    key: 'protocol',
    label: 'Web3 Brand / Protocol',
    icon: '🌐',
    desc: 'Access our African node network for distribution and user acquisition.',
    role: 'partner',
  },
];

/* ── Left-panel content per account type ──────────────────────────── */
const BRAND_CONTENT = {
  sofian: {
    tag: 'Free to Join',
    heading: <>Learn, Earn &amp;<br />Build Your <em>Web3 Career.</em></>,
    subtitle: 'Join 5,000+ Africans who\u2019ve used Sofe Node to break into blockchain \u2014 for free. Your journey starts with one click.',
    benefits: [
      { icon: '📚', color: 'blue', title: 'Free Foundation Course', desc: 'Start with the Blockchain & Crypto Bootcamp \u2014 fully subsidised by our global partners.' },
      { icon: '💰', color: 'orange', title: 'Earn While You Learn', desc: 'Unlock your referral link on graduation. Earn 10% direct & 5% indirect commission.' },
      { icon: '🏆', color: 'green', title: 'Verified Certificates', desc: 'Download and share on-chain certificates to LinkedIn and your portfolio.' },
    ],
  },
  partner_org: {
    tag: 'Partner With Us',
    heading: <>Collaborate &amp;<br />Grow <em>Together.</em></>,
    subtitle: 'Become an official Sofe Node partner. Co-deliver services, share referral revenue, and expand your reach across African campuses.',
    benefits: [
      { icon: '🤝', color: 'blue', title: 'Revenue Sharing', desc: 'Earn commissions through our 2-tier referral system as you bring users to the ecosystem.' },
      { icon: '📡', color: 'orange', title: 'Node Network Access', desc: 'Plug into our university campus chapters across Nigeria for direct market reach.' },
      { icon: '📊', color: 'green', title: 'Dashboard & Analytics', desc: 'Track your referrals, commissions, and partner metrics from a dedicated dashboard.' },
    ],
  },
  protocol: {
    tag: 'For Ecosystems',
    heading: <>Distribute in<br />the <em>African Market.</em></>,
    subtitle: 'Get active users, on-chain volume, and deep market penetration through our university node network. We deliver outcomes, not impressions.',
    benefits: [
      { icon: '🚀', color: 'blue', title: 'User Acquisition', desc: 'We activate verified student ambassadors who become your first power users across campuses.' },
      { icon: '🎯', color: 'orange', title: 'Bounty Programmes', desc: 'Deploy bounties across our XP system and engage 5,000+ active Sofians.' },
      { icon: '📈', color: 'green', title: 'Measurable Outcomes', desc: 'Every engagement is measured in active wallets, trading volume, and user retention.' },
    ],
  },
};

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCodeFromUrl = searchParams.get('ref') || '';
  const nodeFromUrl = searchParams.get('node') || '';
  const typeFromUrl = searchParams.get('type') || '';

  // Resolve the initial account type from URL param (default: sofian)
  const initialType = ACCOUNT_TYPES.find(t => t.key === typeFromUrl) ? typeFromUrl : 'sofian';

  const [accountType, setAccountType] = useState(initialType);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    referralCode: refCodeFromUrl,
    campusNode: nodeFromUrl || 'online',
    orgName: '',
  });

  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdUser, setCreatedUser] = useState(null);
  const [nodeWhatsappLink, setNodeWhatsappLink] = useState('');

  const activeType = ACCOUNT_TYPES.find(t => t.key === accountType) || ACCOUNT_TYPES[0];
  const brandContent = BRAND_CONTENT[accountType] || BRAND_CONTENT.sofian;
  const isOrgAccount = accountType === 'partner_org' || accountType === 'protocol';

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
    if (isOrgAccount && !form.orgName.trim()) {
      setErrorMsg('Please enter your organisation / protocol name.');
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
        role: activeType.role,
        account_type: accountType,
        xp_total: 0,
        xp_tier: 'Genesis',
        wallet_balance: 0,
        referral_code: myRefCode,
        referred_by_code: form.referralCode.trim() || null,
        chapter_id: isOrgAccount ? null : form.campusNode,
        node_label: isOrgAccount ? null : (selectedChapter?.name || 'Online / Global Node'),
        org_name: isOrgAccount ? form.orgName.trim() : null,
        is_premium: false,
        bypass_foundation: false,
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

  /* ── Success screen ─────────────────────────────────────────────── */
  if (createdUser) {
    const successLabel = accountType === 'sofian'
      ? 'Sofian'
      : accountType === 'partner_org'
        ? 'Partner'
        : 'Ecosystem';

    return (
      <>
        <link rel="stylesheet" href="/css/signup.css" />
        <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '85vh', padding: '2rem 5vw' }}>
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '16px', padding: '3rem 2.5rem', maxWidth: '520px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--white)', marginBottom: '.5rem' }}>Welcome to Sofe Group!</h2>
            <p style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Your {successLabel} account has been successfully created. We&apos;ve sent a verification link to <strong style={{ color: 'var(--white)' }}>{createdUser.email}</strong>.
            </p>

            {nodeWhatsappLink && accountType === 'sofian' ? (
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
              Continue to Dashboard →
            </Link>
          </div>
        </div>
      </>
    );
  }

  /* ── Shared input styles ────────────────────────────────────────── */
  const inputStyle = { width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '.88rem' };
  const labelStyle = { display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' };

  return (
    <>
      <link rel="stylesheet" href="/css/signup.css" />

      <div className="auth-page">
        {/* LEFT panel — adapts based on account type */}
        <div className="auth-brand">
          <Link href="/" className="auth-brand-logo">
            <img src="/images/Nodes/SofeLogoHome.png" alt="Sofe Node" />
          </Link>
          <div className="auth-brand-body">
            <div className="auth-brand-tag">{brandContent.tag}</div>
            <h1>{brandContent.heading}</h1>
            <p>{brandContent.subtitle}</p>
            <div className="benefit-list">
              {brandContent.benefits.map(b => (
                <div className="benefit-item" key={b.title}>
                  <div className={`benefit-icon ${b.color}`}>{b.icon}</div>
                  <div>
                    <div className="benefit-title">{b.title}</div>
                    <div className="benefit-desc">{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT form panel */}
        <div className="auth-form-panel">
          <div className="auth-form-box">
            <div className="auth-mobile-logo" style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'none' }}>
              <Link href="/">
                <img src="/images/Nodes/SofeLogoHome.png" alt="Sofe Node" style={{ height: '38px', width: 'auto' }} />
              </Link>
            </div>
            <h2 className="auth-form-title">Create your account 🚀</h2>
            <p className="auth-form-sub">Already have an account? <Link href="/login">Log in here</Link></p>

            {/* ── Account Type Selector ────────────────────────────── */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={labelStyle}>I am signing up as…</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '.6rem' }}>
                {ACCOUNT_TYPES.map(t => {
                  const isActive = accountType === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setAccountType(t.key)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.3rem',
                        padding: '.75rem .5rem',
                        background: isActive ? 'rgba(59,130,246,.15)' : 'var(--deep)',
                        border: `2px solid ${isActive ? 'var(--blue)' : 'var(--border)'}`,
                        borderRadius: '10px',
                        color: isActive ? '#fff' : 'var(--muted)',
                        cursor: 'pointer',
                        transition: 'all .2s',
                        fontSize: '.78rem',
                        fontWeight: isActive ? 700 : 500,
                        textAlign: 'center',
                        lineHeight: 1.3,
                      }}
                    >
                      <span style={{ fontSize: '1.4rem' }}>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '.4rem', lineHeight: 1.4 }}>
                {activeType.desc}
              </p>
            </div>

            {errorMsg && (
              <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', padding: '.8rem 1rem', color: '#f87171', fontSize: '.85rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <span>⚠️</span> <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSignup} noValidate>
              {/* Org name — only for partner / protocol */}
              {isOrgAccount && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>{accountType === 'protocol' ? 'Protocol / Brand Name' : 'Organisation Name'}</label>
                  <input
                    type="text"
                    required
                    value={form.orgName}
                    onChange={e => setForm({ ...form, orgName: e.target.value })}
                    placeholder={accountType === 'protocol' ? 'e.g. Lido Finance' : 'e.g. Web3Bridge'}
                    style={inputStyle}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>{isOrgAccount ? 'Contact First Name' : 'First Name'}</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                    placeholder="Chukwuemeka"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>{isOrgAccount ? 'Contact Last Name' : 'Last Name'}</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Obi"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder={isOrgAccount ? 'partnerships@company.com' : 'emeka@email.com'}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Phone / WhatsApp Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+234 800 000 0000"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={labelStyle}>Password (min. 6 characters)</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  style={inputStyle}
                />
              </div>

              {/* Campus node — only for student/sofian */}
              {!isOrgAccount && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Select Your Campus Node / Region</label>
                  <select
                    value={form.campusNode}
                    onChange={e => setForm({ ...form, campusNode: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="online">Online / Global Node (Virtual)</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name || n.id}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Referral code — always visible */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Referral Code (Optional)</label>
                <input
                  type="text"
                  value={form.referralCode}
                  onChange={e => setForm({ ...form, referralCode: e.target.value })}
                  placeholder="e.g. shed1234"
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '.85rem', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '.95rem' }}
              >
                {loading
                  ? 'Creating Account…'
                  : isOrgAccount
                    ? `Register as ${activeType.label} →`
                    : 'Create Free Account →'
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
