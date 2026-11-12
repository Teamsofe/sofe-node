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
    subtitle: 'Join 5,000+ Africans who’ve used Sofe Node to break into blockchain. Your journey starts with one click.',
    benefits: [
      { icon: '📚', color: 'blue', title: 'Subsidized Foundation Course', desc: 'Start with the Blockchain & Crypto Bootcamp — subsidized by our global partners.' },
      { icon: '💰', color: 'orange', title: 'Earn While You Learn', desc: 'Unlock your referral link on graduation. Earn 10% direct & 5% indirect commission.' },
      { icon: '🏆', color: 'green', title: 'Verified Certificates', desc: 'Download and share on-chain certificates to LinkedIn and your portfolio.' },
      { icon: '🚀', color: 'blue', title: '6 Career Tracks', desc: 'Development, Data, Design, Management, Growth & AI — choose your specialisation.' },
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

/* ── Pre-seeded Geographic Data (Instant Zero-Latency Fallback) ────── */
const NIGERIA_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
];

const DEFAULT_COUNTRIES = [
  { name: 'Nigeria', states: NIGERIA_STATES },
  { name: 'Ghana', states: ['Greater Accra', 'Ashanti', 'Central', 'Eastern', 'Western', 'Volta', 'Northern', 'Upper East', 'Upper West', 'Bono', 'Ahafo', 'Oti', 'Savannah'] },
  { name: 'Kenya', states: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kiambu', 'Machakos', 'Uasin Gishu'] },
  { name: 'South Africa', states: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'] },
  { name: 'Rwanda', states: ['Kigali', 'Eastern Province', 'Northern Province', 'Southern Province', 'Western Province'] },
  { name: 'Uganda', states: ['Central', 'Eastern', 'Northern', 'Western'] },
  { name: 'Cameroon', states: ['Centre', 'Littoral', 'North-West', 'South-West', 'West', 'Adamawa', 'East', 'Far North', 'North', 'South'] },
  { name: 'Egypt', states: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez'] },
  { name: 'United Kingdom', states: ['England', 'Scotland', 'Wales', 'Northern Ireland'] },
  { name: 'United States', states: ['California', 'New York', 'Texas', 'Florida', 'Georgia', 'Illinois', 'Washington', 'Massachusetts', 'Other'] },
  { name: 'Canada', states: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Nova Scotia', 'Saskatchewan'] },
  { name: 'Germany', states: ['Berlin', 'Bavaria', 'Baden-Württemberg', 'North Rhine-Westphalia', 'Hesse', 'Hamburg', 'Saxony'] },
];

export default function SignupClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCodeFromUrl = searchParams.get('ref') || '';
  const nodeFromUrl = searchParams.get('node') || '';
  const typeFromUrl = searchParams.get('type') || '';
  const isChallengeVisitor = searchParams.get('challenge') === 'completed' || !!searchParams.get('discount');

  const initialType = ACCOUNT_TYPES.find(t => t.key === typeFromUrl) ? typeFromUrl : 'sofian';

  const [accountType, setAccountType] = useState(initialType);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    country: 'Nigeria',
    state: '',
    referralCode: refCodeFromUrl,
    source: '',
    campusNode: nodeFromUrl || '',
    customCampus: '',
    isCustomNode: false,
    termsAccepted: false,
    marketingOk: true,
    orgName: '',
  });

  // Country & State Datalists
  const [countriesList, setCountriesList] = useState(DEFAULT_COUNTRIES);
  const [availableStates, setAvailableStates] = useState(NIGERIA_STATES);

  // Campus nodes / chapters
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdUser, setCreatedUser] = useState(null);
  const [nodeWhatsappLink, setNodeWhatsappLink] = useState('');

  const activeType = ACCOUNT_TYPES.find(t => t.key === accountType) || ACCOUNT_TYPES[0];
  const brandContent = BRAND_CONTENT[accountType] || BRAND_CONTENT.sofian;
  const isOrgAccount = accountType === 'partner_org' || accountType === 'protocol';

  // Load active chapters from Firestore
  useEffect(() => {
    async function fetchChapters() {
      if (!db) return;
      try {
        const snap = await getDocs(collection(db, 'chapters'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setNodes(list);
      } catch (err) {
        console.warn('Could not load chapters:', err);
      }
    }
    fetchChapters();
  }, []);

  // Fetch global countries and states from API
  useEffect(() => {
    let isMounted = true;
    fetch('https://countriesnow.space/api/v0.1/countries/states')
      .then(res => res.json())
      .then(json => {
        if (isMounted && json && !json.error && Array.isArray(json.data)) {
          const remoteCountries = json.data.map(c => ({
            name: c.name,
            states: (c.states || []).map(s => s.name.replace(/\s+State$/i, ''))
          }));
          // Merge keeping Nigeria as top priority
          const merged = [
            DEFAULT_COUNTRIES[0],
            ...remoteCountries.filter(c => c.name.toLowerCase() !== 'nigeria')
          ];
          setCountriesList(merged);
          // If Nigeria is currently selected, ensure states remain full
          const curr = form.country || 'Nigeria';
          const match = merged.find(c => c.name.toLowerCase() === curr.toLowerCase());
          if (match && match.states.length > 0) {
            setAvailableStates(match.states);
          }
        }
      })
      .catch(() => {
        // Fallback already pre-seeded
      });
    return () => { isMounted = false; };
  }, [form.country]);

  // Handle Country Selection / Input change
  const handleCountryChange = (selectedCountryName) => {
    setForm(prev => ({ ...prev, country: selectedCountryName, state: '' }));
    const match = countriesList.find(c => c.name.toLowerCase() === selectedCountryName.trim().toLowerCase());
    if (match && Array.isArray(match.states) && match.states.length > 0) {
      setAvailableStates(match.states);
    } else {
      setAvailableStates([]);
    }
  };

  // Step 1 Validation
  const validateStep1 = () => {
    setErrorMsg('');
    if (!form.firstName.trim()) {
      setErrorMsg('First name is required.');
      return false;
    }
    if (!form.lastName.trim()) {
      setErrorMsg('Last name is required.');
      return false;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return false;
    }
    if (!form.phone.trim()) {
      setErrorMsg('Phone / WhatsApp number is required.');
      return false;
    }
    if (!form.password || form.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return false;
    }
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    setErrorMsg('');
    if (!form.country.trim()) {
      setErrorMsg('Please select or enter your country.');
      return false;
    }
    if (!form.state.trim()) {
      setErrorMsg('Please select or enter your state or region.');
      return false;
    }
    return true;
  };

  // Navigation between steps
  const nextStep = (step) => {
    if (step === 1) {
      if (validateStep1()) {
        setErrorMsg('');
        setCurrentStep(2);
      }
    } else if (step === 2) {
      if (validateStep2()) {
        setErrorMsg('');
        setCurrentStep(3);
      }
    }
  };

  const prevStep = (step) => {
    setErrorMsg('');
    setCurrentStep(step - 1);
  };

  // Main Signup Handler
  async function handleSignup(e) {
    if (e) e.preventDefault();

    if (!isOrgAccount) {
      if (!validateStep1()) {
        setCurrentStep(1);
        return;
      }
      if (!validateStep2()) {
        setCurrentStep(2);
        return;
      }
      if (!form.termsAccepted) {
        setErrorMsg('You must agree to the Terms of Service and Privacy Policy to continue.');
        return;
      }
    } else {
      if (!form.firstName || !form.lastName || !form.email || !form.password) {
        setErrorMsg('Please fill in all required fields.');
        return;
      }
      if (!form.orgName.trim()) {
        setErrorMsg('Please enter your organisation / protocol name.');
        return;
      }
      if (form.password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (!auth || !db) throw new Error('Firebase is not initialized');

      // 1. Create auth user in Firebase
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

      // 5. Resolve campus node / chapter
      let resolvedNodeLabel = '';
      let resolvedChapterId = null;
      let whatsapp = '';

      if (!isOrgAccount) {
        const rawNodeVal = form.isCustomNode || form.campusNode === '__custom__'
          ? (form.customCampus.trim() || 'Online / Global Node')
          : (form.campusNode || 'Online / Global Node');

        const matchedChapter = nodes.find(
          n => n.id === rawNodeVal || n.name?.toLowerCase().trim() === rawNodeVal.toLowerCase().trim()
        );

        if (matchedChapter) {
          resolvedChapterId = matchedChapter.id;
          resolvedNodeLabel = matchedChapter.name;
          whatsapp = matchedChapter.whatsapp_link || '';
        } else {
          resolvedChapterId = null;
          resolvedNodeLabel = rawNodeVal;
        }
      }

      setNodeWhatsappLink(whatsapp);

      // 6. Create user document in Firestore (Country & State reflect directly into user dashboard settings)
      const userDocData = {
        uid: user.uid,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        country: form.country.trim() || 'Nigeria',
        state: form.state.trim() || '',
        role: activeType.role,
        account_type: accountType,
        xp_total: 0,
        xp_this_period: 0,
        monthly_xp: 0,
        daily_streak: 0,
        xp_tier: 'Genesis',
        wallet_balance: 0,
        referral_code: myRefCode,
        referred_by_code: form.referralCode.trim() ? form.referralCode.trim().toUpperCase() : null,
        chapter_id: isOrgAccount ? null : resolvedChapterId,
        node_label: isOrgAccount ? null : resolvedNodeLabel,
        source: form.source || '',
        marketing_ok: form.marketingOk !== false,
        org_name: isOrgAccount ? form.orgName.trim() : null,
        is_premium: false,
        bypass_foundation: false,
        email_verified: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), userDocData);

      // 7. Record referral if referrer code exists
      const cleanRefCode = form.referralCode.trim().toUpperCase();
      if (cleanRefCode) {
        try {
          const refSnap = await getDocs(query(collection(db, 'users'), where('referral_code', '==', cleanRefCode)));
          if (!refSnap.empty) {
            const referrerDoc = refSnap.docs[0];
            const refData = referrerDoc.data();
            await addDoc(collection(db, 'referrals'), {
              referrer_id: referrerDoc.id,
              referrer_name: `${refData.first_name || ''} ${refData.last_name || ''}`.trim() || refData.email,
              referrer_code: cleanRefCode,
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
            <p style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Your {successLabel} account has been successfully created. We&apos;ve sent a verification link to <strong style={{ color: 'var(--white)' }}>{createdUser.email}</strong>.
            </p>

            <div style={{
              background: 'rgba(20,40,255,0.08)',
              border: '1px solid rgba(20,40,255,0.2)',
              borderRadius: 8,
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.82rem',
              color: 'var(--white)',
              textAlign: 'left'
            }}>
              <div>📍 <strong>Location:</strong> {createdUser.state ? `${createdUser.state}, ` : ''}{createdUser.country || 'Nigeria'}</div>
              {createdUser.node_label && (
                <div style={{ marginTop: '0.35rem' }}>🏛️ <strong>Campus Node:</strong> {createdUser.node_label}</div>
              )}
            </div>

            {nodeWhatsappLink && accountType === 'sofian' ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <a
                  href={nodeWhatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem', background: '#25D366', color: '#062f1a', textDecoration: 'none', fontWeight: 800, fontSize: '.95rem', padding: '.9rem 1.8rem', borderRadius: '50px', boxShadow: '0 4px 15px rgba(37,211,102,0.3)' }}
                >
                  <span>💬</span> Join Your Campus WhatsApp Node
                </a>
              </div>
            ) : null}

            {/* ── 24-Hour 20% Discount Enrollment Banner ── */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(20,40,255,0.25) 0%, rgba(255,138,0,0.2) 100%)',
              border: '1.5px solid #FF8A00',
              borderRadius: 12,
              padding: '1.25rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#FF8A00', textTransform: 'uppercase' }}>
                  ⚡ 24-Hour Limited Reward
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: 'rgba(255,85,85,0.2)',
                  border: '1px solid #FF5555',
                  color: '#FF8888',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 8
                }}>
                  ⏱ Expires in 24:00:00
                </span>
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', marginBottom: '0.3rem' }}>
                20% Off: Blockchain &amp; Cryptocurrency Foundation
              </div>
              <p style={{ fontSize: '0.78rem', color: 'rgba(238,244,255,0.85)', lineHeight: 1.5, marginBottom: '1rem' }}>
                {isChallengeVisitor
                  ? 'Your +15 XP bonus is locked in. Use your 24-hour challenge discount to enroll in the Foundation Course and become a validated Web3 talent.'
                  : 'Get subsidized admission with code CHALLENGE20 to master Web3, earn on-chain credentials, and deploy across our campus network.'}
              </p>
              <Link
                href="/payment-flow?course=foundation&discount=CHALLENGE20"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #FF8A00 0%, #FE8206 50%, #E65100 100%)',
                  color: '#fff',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: '0.86rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 15px rgba(255,138,0,0.3)',
                  marginBottom: '0.5rem'
                }}
              >
                <span>🎓</span> Enroll with 20% Discount (Become Validated) →
              </Link>
            </div>

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

  /* ── Input Styling ──────────────────────────────────────────────── */
  const inputStyle = { width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '.88rem', outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.35rem' };

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

            <div className="xp-strip" style={{ marginTop: '2.5rem' }}>
              <span className="xp-chip">🌱 Genesis Scout</span>
              <span className="xp-chip">⚡ Validator</span>
              <span className="xp-chip">⚔️ Crypto Knight</span>
              <span className="xp-chip">🔥 Chain Architect</span>
              <span className="xp-chip">👑 Node Sovereign</span>
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

            {isChallengeVisitor && (
              <div style={{
                background: 'rgba(255,138,0,0.12)',
                border: '1px solid #FF8A00',
                borderRadius: 8,
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                fontSize: '0.8rem',
                color: '#FFB03A',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <span style={{ fontSize: '1.1rem' }}>⚔️</span>
                <span>
                  <strong>Peer Challenge Verified:</strong> Your <strong>+15 XP</strong> and <strong>24-hour 20% discount</strong> on the Foundational Web3 Course will activate immediately upon signup!
                </span>
              </div>
            )}

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
                      onClick={() => {
                        setAccountType(t.key);
                        setCurrentStep(1);
                        setErrorMsg('');
                      }}
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

            {/* ── 3-Stage Step Progress Bar (For User / Student) ──── */}
            {!isOrgAccount && (
              <div className="step-bar" style={{ display: 'flex', alignItems: 'center', marginBottom: '1.8rem' }}>
                <div className={`step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <div className="step-num" style={{
                    width: 26, height: 26, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.72rem', fontWeight: 800,
                    background: currentStep > 1 ? '#00c864' : currentStep === 1 ? 'var(--blue)' : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: `1px solid ${currentStep > 1 ? '#00c864' : currentStep === 1 ? 'var(--blue)' : 'var(--border)'}`
                  }}>
                    {currentStep > 1 ? '✓' : '1'}
                  </div>
                  <div className="step-label" style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: currentStep >= 1 ? '#fff' : 'var(--muted)' }}>
                    Account
                  </div>
                </div>

                <div className="step-line" style={{ flex: 1, height: 1, background: currentStep > 1 ? '#00c864' : 'var(--border)', margin: '0 .6rem' }} />

                <div className={`step ${currentStep === 2 ? 'active' : currentStep > 2 ? 'done' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <div className="step-num" style={{
                    width: 26, height: 26, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.72rem', fontWeight: 800,
                    background: currentStep > 2 ? '#00c864' : currentStep === 2 ? 'var(--blue)' : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: `1px solid ${currentStep > 2 ? '#00c864' : currentStep === 2 ? 'var(--blue)' : 'var(--border)'}`
                  }}>
                    {currentStep > 2 ? '✓' : '2'}
                  </div>
                  <div className="step-label" style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: currentStep >= 2 ? '#fff' : 'var(--muted)' }}>
                    Profile
                  </div>
                </div>

                <div className="step-line" style={{ flex: 1, height: 1, background: currentStep > 2 ? '#00c864' : 'var(--border)', margin: '0 .6rem' }} />

                <div className={`step ${currentStep === 3 ? 'active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <div className="step-num" style={{
                    width: 26, height: 26, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.72rem', fontWeight: 800,
                    background: currentStep === 3 ? 'var(--blue)' : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: `1px solid ${currentStep === 3 ? 'var(--blue)' : 'var(--border)'}`
                  }}>
                    3
                  </div>
                  <div className="step-label" style={{ fontSize: '.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: currentStep === 3 ? '#fff' : 'var(--muted)' }}>
                    Node
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', padding: '.8rem 1rem', color: '#f87171', fontSize: '.85rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <span>⚠️</span> <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSignup} noValidate>
              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STAGE 1: ACCOUNT DETAILS                                   */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {(isOrgAccount || currentStep === 1) && (
                <div>
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
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        style={{ ...inputStyle, paddingRight: '2.8rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem' }}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {!isOrgAccount && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={labelStyle}>Confirm Password</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={form.confirmPassword}
                          onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                          placeholder="Repeat password"
                          style={{ ...inputStyle, paddingRight: '2.8rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem' }}
                        >
                          {showConfirmPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                  )}

                  {!isOrgAccount ? (
                    <button
                      type="button"
                      onClick={() => nextStep(1)}
                      style={{ width: '100%', padding: '.85rem', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '.95rem' }}
                    >
                      Continue to Profile →
                    </button>
                  ) : (
                    <>
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
                        {loading ? 'Creating Account…' : `Register as ${activeType.label} →`}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STAGE 2: PROFILE & LIVE LOCATION (COUNTRY & STATE)         */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {!isOrgAccount && currentStep === 2 && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    {/* Country Selector */}
                    <div>
                      <label style={labelStyle}>Country</label>
                      <input
                        type="text"
                        list="countryDatalist"
                        value={form.country}
                        onChange={e => handleCountryChange(e.target.value)}
                        placeholder="Select Country..."
                        style={inputStyle}
                      />
                      <datalist id="countryDatalist">
                        {countriesList.map(c => (
                          <option key={c.name} value={c.name} />
                        ))}
                      </datalist>
                      <span style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: 3, display: 'block' }}>
                        Select or type your country.
                      </span>
                    </div>

                    {/* Live State Selector */}
                    <div>
                      <label style={labelStyle}>State / Region</label>
                      <input
                        type="text"
                        list="stateDatalist"
                        value={form.state}
                        onChange={e => setForm({ ...form, state: e.target.value })}
                        placeholder={availableStates.length > 0 ? "Select or type state..." : "Type your state/region"}
                        style={inputStyle}
                      />
                      <datalist id="stateDatalist">
                        {availableStates.map((st, i) => (
                          <option key={`${st}-${i}`} value={st} />
                        ))}
                      </datalist>
                      <span style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: 3, display: 'block' }}>
                        {availableStates.length > 0
                          ? `Live states for ${form.country || 'selected country'}`
                          : 'Enter your region/province'}
                      </span>
                    </div>
                  </div>

                  {/* Referral Code */}
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={labelStyle}>Referral Code (Optional)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '.9rem', top: '50%', transform: 'translateY(-50%)', fontSize: '.68rem', fontWeight: 800, color: 'var(--orange)', background: 'rgba(255,138,0,0.12)', border: '1px solid rgba(255,138,0,0.25)', padding: '.2rem .4rem', borderRadius: 4, letterSpacing: '.05em' }}>
                        REF
                      </span>
                      <input
                        type="text"
                        value={form.referralCode}
                        onChange={e => setForm({ ...form, referralCode: e.target.value })}
                        placeholder="e.g. shed1234"
                        style={{ ...inputStyle, paddingLeft: '3.6rem', textTransform: 'uppercase' }}
                      />
                    </div>
                    <span style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: 3, display: 'block' }}>
                      If someone referred you, their code will automatically link your bonus rewards.
                    </span>
                  </div>

                  {/* How did you hear about us? */}
                  <div style={{ marginBottom: '1.8rem' }}>
                    <label style={labelStyle}>How did you hear about Sofe Node?</label>
                    <select
                      value={form.source}
                      onChange={e => setForm({ ...form, source: e.target.value })}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">— Select an Option —</option>
                      <option value="friend">A friend / referral link</option>
                      <option value="twitter">Twitter / X</option>
                      <option value="instagram">Instagram</option>
                      <option value="whatsapp">WhatsApp community</option>
                      <option value="telegram">Telegram group</option>
                      <option value="youtube">YouTube</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="campus_event">University campus event</option>
                      <option value="search">Online search (Google etc.)</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '.8rem' }}>
                    <button
                      type="button"
                      onClick={() => prevStep(2)}
                      style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '.85rem 1.4rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => nextStep(2)}
                      style={{ flex: 1, background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', padding: '.85rem', fontSize: '.95rem' }}
                    >
                      Continue to Campus Node →
                    </button>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* STAGE 3: CAMPUS NODE & TERMS                               */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {!isOrgAccount && currentStep === 3 && (
                <div>
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={labelStyle}>Select Your Campus Node / Institution</label>
                    <select
                      value={form.isCustomNode ? '__custom__' : form.campusNode}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '__custom__') {
                          setForm({ ...form, isCustomNode: true, campusNode: '__custom__' });
                        } else {
                          setForm({ ...form, isCustomNode: false, campusNode: val });
                        }
                      }}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="">-- Select Active Campus Node --</option>
                      <option value="online">Online / Global Node (Virtual)</option>
                      {nodes.filter(n => n.active !== false).map(n => (
                        <option key={n.id} value={n.name || n.id}>
                          {n.name || n.id} {n.state ? `(${n.state})` : ''}
                        </option>
                      ))}
                      <option value="__custom__">➕ Other / Not Listed (Type campus name)</option>
                    </select>

                    {/* Option to type custom campus name */}
                    {(form.isCustomNode || form.campusNode === '__custom__') && (
                      <div style={{ marginTop: '0.8rem' }}>
                        <label style={{ ...labelStyle, color: '#FFB800' }}>Enter Your Campus / Institution Name</label>
                        <input
                          type="text"
                          required
                          value={form.customCampus}
                          onChange={e => setForm({ ...form, customCampus: e.target.value })}
                          placeholder="e.g. University of Benin, Covenant University..."
                          style={{ ...inputStyle, borderColor: 'rgba(255,138,0,0.4)' }}
                        />
                      </div>
                    )}
                    <span style={{ fontSize: '.68rem', color: 'var(--muted)', marginTop: 4, display: 'block' }}>
                      Choose your university or type your campus to request a campus community node.
                    </span>
                  </div>

                  {/* Terms & Conditions Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.65rem', marginBottom: '1.2rem' }}>
                    <input
                      type="checkbox"
                      id="termsAccepted"
                      checked={form.termsAccepted}
                      onChange={e => setForm({ ...form, termsAccepted: e.target.checked })}
                      style={{ marginTop: '.2rem', accentColor: 'var(--blue)', width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <label htmlFor="termsAccepted" style={{ fontSize: '.76rem', color: 'var(--muted)', lineHeight: 1.5, cursor: 'pointer' }}>
                      I agree to the <Link href="/terms" target="_blank" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>Terms of Service</Link>, <Link href="/privacy" target="_blank" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>Privacy Policy</Link>, and Affiliate Terms. I confirm I am 18 years or older.
                    </label>
                  </div>

                  {/* Marketing Checkbox */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.65rem', marginBottom: '1.8rem' }}>
                    <input
                      type="checkbox"
                      id="marketingOk"
                      checked={form.marketingOk}
                      onChange={e => setForm({ ...form, marketingOk: e.target.checked })}
                      style={{ marginTop: '.2rem', accentColor: 'var(--blue)', width: 16, height: 16, cursor: 'pointer' }}
                    />
                    <label htmlFor="marketingOk" style={{ fontSize: '.76rem', color: 'var(--muted)', lineHeight: 1.5, cursor: 'pointer' }}>
                      Send me Web3 course updates, career opportunities, and Sofe Node community news. <span style={{ opacity: 0.7 }}>(optional)</span>
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '.8rem' }}>
                    <button
                      type="button"
                      onClick={() => prevStep(3)}
                      style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--muted)', padding: '.85rem 1.4rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      style={{ flex: 1, background: 'linear-gradient(135deg, #FF8A00, #E07800)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', padding: '.85rem', fontSize: '.95rem', boxShadow: '0 4px 16px rgba(255,138,0,0.35)' }}
                    >
                      {loading ? 'Creating Account…' : 'Create Free Account 🚀'}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
