'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  auth,
  db,
  signInWithEmailAndPassword,
  doc,
  getDoc,
  signOut
} from '@/lib/firebase';

export default function AdminLoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (!auth || !db) throw new Error('Firebase is not initialized');
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = cred.user;

      // Check admin or tutor role in Firestore
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (!userSnap.exists()) {
        await signOut(auth);
        setErrorMsg('Access denied. No user profile found.');
        setLoading(false);
        return;
      }

      const uData = userSnap.data();
      const role = uData.admin_role || (uData.role === 'admin' ? 'admin' : (uData.role === 'tutor' ? 'tutor' : (uData.role === 'node_lead' ? 'node_lead' : null)));

      if (!role && uData.role !== 'admin' && uData.role !== 'tutor' && uData.role !== 'node_lead') {
        await signOut(auth);
        setErrorMsg('Access denied. This console is restricted to administrators, tutors, and node leads.');
        setLoading(false);
        return;
      }

      const finalRole = uData.admin_role || (uData.role === 'tutor' ? 'tutor' : (uData.role === 'node_lead' ? 'node_lead' : 'super_admin'));
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_role', finalRole);
        sessionStorage.setItem('admin_uid', user.uid);
      }

      router.push('/admin');
    } catch (err) {
      console.error('Admin login error:', err);
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#04080F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: '#0D1526', padding: '2.5rem', borderRadius: '16px', border: '1px solid rgba(20,40,255,0.2)', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/images/Nodes/SofeLogoHome.png" alt="Sofe Node" style={{ width: '60px', margin: '0 auto 1rem', display: 'block' }} />
          <h2 style={{ color: '#EEF4FF', fontSize: '1.4rem', fontWeight: 800, marginBottom: '.3rem' }}>Admin Console</h2>
          <p style={{ color: 'rgba(200,215,240,0.45)', fontSize: '.82rem' }}>Staff, Tutor &amp; Executive Access</p>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '.8rem', color: '#ff6b6b', fontSize: '.78rem', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            <span>⚠️</span> <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(200,215,240,0.5)', marginBottom: '.4rem' }}>
              Staff Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@sofegroup.com"
              style={{ width: '100%', background: '#060d1a', border: '1px solid rgba(200,215,240,0.1)', borderRadius: '7px', padding: '.75rem .9rem', color: '#c8d7f0', fontSize: '.85rem' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(200,215,240,0.5)', marginBottom: '.4rem' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', background: '#060d1a', border: '1px solid rgba(200,215,240,0.1)', borderRadius: '7px', padding: '.75rem .9rem', color: '#c8d7f0', fontSize: '.85rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#1428FF', color: '#fff', border: 'none', padding: '.85rem', borderRadius: '8px', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer' }}
          >
            {loading ? 'Authenticating…' : 'Sign In to Console →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.8rem' }}>
          <Link href="/" style={{ color: 'rgba(200,215,240,0.4)', fontSize: '.75rem', textDecoration: 'none' }}>
            ← Back to Sofe Node Main Site
          </Link>
        </div>
      </div>
    </div>
  );
}
