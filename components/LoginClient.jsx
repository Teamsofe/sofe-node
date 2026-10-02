'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged
} from '@/lib/firebase';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, user => {
      if (user) {
        router.push(redirectTarget);
      }
    });
    return () => unsub();
  }, [router, redirectTarget]);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (!auth) throw new Error('Firebase Auth not available');
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setSuccessMsg('Login successful! Redirecting…');
      router.push(redirectTarget);
    } catch (err) {
      console.error('Login error:', err);
      let msg = 'Invalid email or password. Please try again.';
      if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
      if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
      if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Please try again later.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setErrorMsg('');
    try {
      if (!auth) throw new Error('Firebase Auth not available');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccessMsg('Signed in with Google! Redirecting…');
      router.push(redirectTarget);
    } catch (err) {
      console.error('Google login error:', err);
      setErrorMsg(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setErrorMsg('Please enter your email above to reset password.');
      return;
    }
    try {
      if (!auth) throw new Error('Firebase Auth not available');
      await sendPasswordResetEmail(auth, email.trim());
      setSuccessMsg(`✓ Password reset link sent to ${email}`);
    } catch (err) {
      setErrorMsg(err.message || 'Could not send reset email');
    }
  }

  return (
    <>
      <div className="auth-page">
        {/* LEFT: Branding */}
        <div className="auth-brand">
          <Link href="/" className="auth-brand-logo">
            <img src="/images/Nodes/SofeLogoHome.png" alt="Sofe Node" />
          </Link>
          <div className="auth-brand-body">
            <div className="auth-brand-tag">Sofian Dashboard</div>
            <h1>Your Web3 Journey<br />Starts <em>Right Here.</em></h1>
            <p>Track your learning, manage your referrals, earn commissions, and withdraw directly to your bank — all in one place.</p>
            <div className="auth-stats">
              <div>
                <div className="auth-stat-num">5,000+</div>
                <div className="auth-stat-label">Sofians Enrolled</div>
              </div>
              <div>
                <div className="auth-stat-num">₦2.4M+</div>
                <div className="auth-stat-label">Commissions Paid</div>
              </div>
              <div>
                <div className="auth-stat-num">6</div>
                <div className="auth-stat-label">Career Tracks</div>
              </div>
            </div>
          </div>
          <div className="auth-quote">
            <p>&ldquo;I enrolled with zero crypto knowledge. Three months later I had my Blockchain Fundamentals cert and had already earned ₦45,000 in referral commissions.&rdquo;</p>
            <div className="auth-quote-author">
              <div className="auth-q-avatar">AO</div>
              <div>
                <div className="auth-q-name">Amaka Okonkwo</div>
                <div className="auth-q-role">Sofian &middot; Chain Architect Tier &middot; Lagos</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Login Form */}
        <div className="auth-form-panel">
          <div className="auth-form-box">
            <div className="auth-mobile-logo" style={{ textAlign: 'center', marginBottom: '1.5rem', display: 'none' }}>
              <Link href="/">
                <img src="/images/Nodes/SofeLogoHome.png" alt="Sofe Node" style={{ height: '38px', width: 'auto' }} />
              </Link>
            </div>
            <h2 className="auth-form-title">Welcome back 👋</h2>
            <p className="auth-form-sub">Don&apos;t have an account? <Link href="/signup">Sign up free</Link></p>

            {errorMsg && (
              <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', padding: '.8rem 1rem', color: '#f87171', fontSize: '.85rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <span>⚠️</span> <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)', borderRadius: '8px', padding: '.8rem 1rem', color: '#10b981', fontSize: '.85rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <span>✓</span> <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} noValidate>
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem' }}>Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="emeka@email.com"
                  style={{ width: '100%', padding: '.8rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '.88rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label className="form-label" style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{ width: '100%', padding: '.8rem 2.8rem .8rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '.88rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem' }}
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: '.78rem', cursor: 'pointer' }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '.85rem', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '.95rem', marginBottom: '1.2rem' }}
              >
                {loading ? 'Logging in…' : 'Log In to Sofian Dashboard →'}
              </button>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{ width: '100%', padding: '.8rem', background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--white)', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.6rem' }}
              >
                <span>🌐</span> Continue with Google
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
