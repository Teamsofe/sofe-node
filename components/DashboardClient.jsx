'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  addDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit
} from '@/lib/firebase';

const XP_TIERS = [
  { name: 'Genesis Node', min: 0, icon: '🌱' },
  { name: 'Validator', min: 500, icon: '⚡' },
  { name: 'Crypto Knight', min: 1500, icon: '⚔️' },
  { name: 'Chain Architect', min: 4000, icon: '🔥' },
  { name: 'Node Operator', min: 8000, icon: '🏆' },
  { name: 'Node Sovereign', min: 15000, icon: '👑' }
];

export default function DashboardClient() {
  const router = useRouter();

  // Loading & User State
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('classroom');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Stats & Progress
  const [enrolments, setEnrolments] = useState([]);
  const [coursesData, setCoursesData] = useState({});
  const [foundationDone, setFoundationDone] = useState(false);
  const [foundationPct, setFoundationPct] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [xpTotal, setXpTotal] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [claimedToday, setClaimedToday] = useState(false);

  // Business & Referrals
  const [referrals, setReferrals] = useState([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [unpaidCommissions, setUnpaidCommissions] = useState(0);
  const [bountyEarned, setBountyEarned] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Certificates
  const [certificates, setCertificates] = useState([]);
  const [selectedCertIdx, setSelectedCertIdx] = useState(0);

  // Leaderboard
  const [lbTab, setLbTab] = useState('xp');
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [lbLoading, setLbLoading] = useState(false);

  // Chapter & Settings
  const [chapters, setChapters] = useState([]);
  const [myChapter, setMyChapter] = useState(null);
  const [settingsForm, setSettingsForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    nodeLabel: '',
    bankName: '',
    accNumber: '',
    accName: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState(null);

  // Password Update
  const [pwdForm, setPwdForm] = useState({ oldPwd: '', newPwd: '', repeatPwd: '' });
  const [pwdMsg, setPwdMsg] = useState(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  // Payout Request Modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutToast, setPayoutToast] = useState(null);

  // VIP Admin WhatsApp link
  const VIP_ADMIN_WA = 'https://wa.me/2348123456789?text=Hello%20Admin,%20I%20have%20completed%20my%20Sofe%20Node%20Premium%20Membership%20payment%20and%20would%20like%20to%20be%20added%20to%20the%20VIP%20executive%20group.';

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setCurrentUser(user);
      await loadUserData(user);
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  // Load User Data & Related Collections
  const loadUserData = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        router.replace('/login');
        return;
      }

      const u = userSnap.data();
      setUserData(u);
      setWalletBalance(Number(u.wallet_balance) || 0);
      setXpTotal(Number(u.xp_total) || 0);
      setDailyStreak(Number(u.daily_streak) || 0);

      // Daily streak claim check
      if (u.last_daily_claim) {
        const todayUTC = new Date().toISOString().slice(0, 10);
        const lastUTC = u.last_daily_claim.toDate
          ? u.last_daily_claim.toDate().toISOString().slice(0, 10)
          : new Date(u.last_daily_claim).toISOString().slice(0, 10);
        setClaimedToday(lastUTC === todayUTC);
      }

      setSettingsForm({
        firstName: u.first_name || '',
        lastName: u.last_name || '',
        email: u.email || user.email || '',
        phone: u.phone || '',
        country: u.country || 'Nigeria',
        state: u.state || '',
        nodeLabel: u.node_label || u.chapter_name || u.node || '',
        bankName: u.bank_name || '',
        accNumber: u.account_number || '',
        accName: u.account_name || `${u.first_name || ''} ${u.last_name || ''}`.trim()
      });

      // Chapter lookup
      if (u.chapter_id) {
        try {
          const chSnap = await getDoc(doc(db, 'chapters', u.chapter_id));
          if (chSnap.exists()) {
            setMyChapter({ id: chSnap.id, ...chSnap.data() });
          }
        } catch (e) {
          console.error('Error fetching chapter:', e);
        }
      }

      // Load Enrolments
      await loadEnrolments(user.uid);

      // Load Referrals & Commissions
      await loadReferralsAndCommissions(user.uid, u.referral_code);

      // Load Notifications
      await loadNotifications(user.uid);

      // Load Certificates
      await loadCertificates(user.uid);

      // Load Chapters for dropdown
      loadAllChapters();
    } catch (err) {
      console.error('Error loading user profile:', err);
    }
  };

  const loadAllChapters = async () => {
    try {
      const snap = await getDocs(collection(db, 'chapters'));
      setChapters(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {}
  };

  const loadEnrolments = async (uid) => {
    try {
      const es = await getDocs(query(collection(db, 'enrolments'), where('user_id', '==', uid)));
      let allEnrols = es.docs.map((d) => ({ id: d.id, ...d.data() }));

      const fe = allEnrols.find((d) => (d.course_id === 'foundation' || !d.course_id) && d.status === 'active');
      const isDone = !!fe?.completed_at;
      const pct = fe?.progress_pct || 0;
      setFoundationDone(isDone);
      setFoundationPct(pct);

      const hasCbie = allEnrols.some((e) => e.course_id === 'cbie' || e.tier === 'executive');
      const hasFoundation = allEnrols.some((e) => e.course_id === 'foundation' || !e.course_id);

      if (hasCbie && !hasFoundation) {
        allEnrols = [
          {
            id: '__foundation_synthetic__',
            course_id: 'foundation',
            status: 'active',
            progress_pct: pct,
            completed_at: isDone ? true : null,
            _synthetic: true
          },
          ...allEnrols
        ];
      }

      setEnrolments(allEnrols);

      // Fetch metadata for these courses
      const courseIds = [...new Set(allEnrols.map((e) => e.course_id || 'foundation'))];
      const fetchedCourses = {};
      for (const cid of courseIds) {
        try {
          const cs = await getDoc(doc(db, 'courses', cid));
          if (cs.exists()) fetchedCourses[cid] = cs.data();
        } catch (e) {}
      }
      setCoursesData(fetchedCourses);
    } catch (e) {
      console.error('Error fetching enrolments:', e);
    }
  };

  const loadReferralsAndCommissions = async (uid, refCode) => {
    try {
      if (refCode) {
        const refsSnap = await getDocs(query(collection(db, 'referrals'), where('referrer_code', '==', refCode)));
        setReferrals(refsSnap.docs.map((d) => d.data()));
      }

      let earned = 0;
      let unpaid = 0;
      const commSnap = await getDocs(query(collection(db, 'commissions'), where('user_id', '==', uid), orderBy('created_at', 'desc')));
      const txList = [];
      commSnap.docs.forEach((d) => {
        const c = d.data();
        earned += c.amount || 0;
        if (c.status !== 'paid') unpaid += c.amount || 0;
        txList.push({ id: d.id, ...c });
      });
      setTransactions(txList);

      let bEarned = 0;
      try {
        const bountySnap = await getDocs(query(collection(db, 'bounty_earnings'), where('user_id', '==', uid)));
        bountySnap.docs.forEach((d) => {
          bEarned += d.data().amount || 0;
        });
      } catch (e) {}

      setTotalEarned(earned + bEarned);
      setUnpaidCommissions(unpaid);
      setBountyEarned(bEarned);
    } catch (e) {
      console.error('Error loading referrals:', e);
    }
  };

  const loadNotifications = async (uid) => {
    try {
      const snap = await getDocs(query(collection(db, 'notifications'), where('user_id', '==', uid), orderBy('created_at', 'desc'), limit(15)));
      const notifs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNotifications(notifs);
      setUnreadNotifsCount(notifs.filter((n) => !n.read).length);
    } catch (e) {}
  };

  const loadCertificates = async (uid) => {
    try {
      const snap = await getDocs(query(collection(db, 'certificates'), where('user_id', '==', uid)));
      setCertificates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {}
  };

  const loadLeaderboardData = async (type) => {
    setLbLoading(true);
    try {
      const snap = await getDocs(collection(db, 'leaderboard'));
      let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (type === 'xp') {
        rows.sort((a, b) => (Number(b.xp_this_period) || 0) - (Number(a.xp_this_period) || 0));
      } else if (type === 'commission') {
        rows = rows.filter((r) => (Number(r.commission_this_period) || 0) > 0);
        rows.sort((a, b) => (Number(b.commission_this_period) || 0) - (Number(a.commission_this_period) || 0));
      } else if (type === 'referral') {
        rows = rows.filter((r) => (Number(r.validated_referrals_this_period) || 0) > 0);
        rows.sort((a, b) => (Number(b.validated_referrals_this_period) || 0) - (Number(a.validated_referrals_this_period) || 0));
      }
      setLeaderboardRows(rows.slice(0, 20));
    } catch (e) {
      console.error('Error loading leaderboard:', e);
    } finally {
      setLbLoading(false);
    }
  };

  // Daily Streak Claim
  const handleDailyClaim = async () => {
    if (claimedToday || !currentUser) return;
    try {
      const newStreak = dailyStreak + 1;
      const bonus = newStreak % 7 === 0 ? 10 : 2;
      const newTotal = xpTotal + bonus;

      await updateDoc(doc(db, 'users', currentUser.uid), {
        xp_total: newTotal,
        daily_streak: newStreak,
        last_daily_claim: serverTimestamp()
      });

      setXpTotal(newTotal);
      setDailyStreak(newStreak);
      setClaimedToday(true);
      setPayoutToast(`⚡ +${bonus} XP claimed! Streak: ${newStreak} days.`);
      setTimeout(() => setPayoutToast(null), 4000);
    } catch (e) {
      alert('Could not record daily claim: ' + e.message);
    }
  };

  // Copy Referral Link
  const handleCopyRef = () => {
    const code = userData?.referral_code || '';
    if (!code) return;
    const url = `${window.location.origin}/signup?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        first_name: settingsForm.firstName,
        last_name: settingsForm.lastName,
        phone: settingsForm.phone,
        country: settingsForm.country,
        state: settingsForm.state,
        node_label: settingsForm.nodeLabel,
        bank_name: settingsForm.bankName,
        account_number: settingsForm.accNumber,
        account_name: settingsForm.accName,
        updated_at: serverTimestamp()
      });
      setSettingsMsg({ type: 'success', text: 'Profile updated successfully!' });
      setUserData((prev) => ({
        ...prev,
        first_name: settingsForm.firstName,
        last_name: settingsForm.lastName,
        phone: settingsForm.phone,
        node_label: settingsForm.nodeLabel,
        bank_name: settingsForm.bankName,
        account_number: settingsForm.accNumber,
        account_name: settingsForm.accName
      }));
    } catch (err) {
      setSettingsMsg({ type: 'error', text: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  // Change Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMsg(null);

    if (pwdForm.newPwd.length < 8) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 8 characters.' });
      setPwdLoading(false);
      return;
    }
    if (pwdForm.newPwd !== pwdForm.repeatPwd) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      setPwdLoading(false);
      return;
    }

    try {
      const cred = EmailAuthProvider.credential(currentUser.email, pwdForm.oldPwd);
      await reauthenticateWithCredential(currentUser, cred);
      await updatePassword(currentUser, pwdForm.newPwd);
      setPwdMsg({ type: 'success', text: 'Password changed successfully.' });
      setPwdForm({ oldPwd: '', newPwd: '', repeatPwd: '' });
    } catch (err) {
      let msg = err.message;
      if (err.code === 'auth/wrong-password') msg = 'Current password is incorrect.';
      setPwdMsg({ type: 'error', text: msg });
    } finally {
      setPwdLoading(false);
    }
  };

  // Handle Withdrawal Request Submission
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(payoutAmount);
    if (!amountNum || amountNum < 10000) {
      alert('Minimum withdrawal amount is ₦10,000.');
      return;
    }
    if (amountNum > walletBalance) {
      alert('Insufficient wallet balance.');
      return;
    }
    if (!settingsForm.accNumber || !settingsForm.bankName) {
      alert('Please fill and save your bank details in Settings before requesting a payout.');
      return;
    }

    setPayoutSubmitting(true);
    try {
      await addDoc(collection(db, 'disbursement_requests'), {
        user_id: currentUser.uid,
        requester_email: currentUser.email,
        amount: amountNum,
        method: payoutMethod,
        bank_name: settingsForm.bankName,
        account_number: settingsForm.accNumber,
        account_name: settingsForm.accName,
        notes: payoutNotes,
        status: 'pending',
        type: 'user_withdrawal',
        created_at: serverTimestamp()
      });

      setShowPayoutModal(false);
      setPayoutAmount('');
      setPayoutNotes('');
      setPayoutToast('✓ Withdrawal request submitted! Processing takes 24-48 business hours.');
      setTimeout(() => setPayoutToast(null), 5000);
    } catch (err) {
      alert('Could not submit withdrawal: ' + err.message);
    } finally {
      setPayoutSubmitting(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/login');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1.5s infinite linear' }}>⚡</div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading Sofian Dashboard...</p>
        </div>
      </div>
    );
  }

  const currentTier = XP_TIERS.slice().reverse().find((t) => xpTotal >= t.min) || XP_TIERS[0];
  const nextTier = XP_TIERS[XP_TIERS.indexOf(currentTier) + 1];
  const fullName = `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || userData?.email || 'Sofian';
  const isPremium = !!userData?.is_premium || userData?.account_type === 'premium';
  const isNodeLead = !!userData?.node_lead_for || userData?.role === 'node_lead';
  const isProtocol = userData?.account_type === 'protocol';
  const isPartner = userData?.account_type === 'partner_org' || userData?.role === 'partner';
  const isStaffOrAdmin = userData?.role === 'admin' || userData?.role === 'tutor' || !!userData?.admin_role || isNodeLead;

  const validatedRefs = referrals.filter((r) => r.foundation_complete === true).length;
  const verifiedRefs = referrals.filter((r) => r.email_verified === true || r.status === 'verified').length;
  const totalSignups = referrals.length;

  return (
    <div style={{ background: '#04080F', color: '#EEF4FF', minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      <link rel="stylesheet" href="/css/dashboard.css" />

      {/* TOAST MESSAGE */}
      {payoutToast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: 'linear-gradient(135deg, rgba(13,21,38,0.98), rgba(13,21,38,0.95))',
          border: '1px solid rgba(255,138,0,0.5)',
          borderRadius: 10,
          padding: '0.9rem 1.4rem',
          color: '#FFB800',
          fontWeight: 700,
          fontSize: '0.85rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
        }}>
          {payoutToast}
        </div>
      )}

      {/* TOP HEADER BAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(8,14,26,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(20,40,255,0.18)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'rgba(20,40,255,0.1)',
              border: '1px solid rgba(20,40,255,0.25)',
              color: '#fff',
              borderRadius: 6,
              padding: '0.4rem 0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <span>☰</span>
          </button>
          <Link href="/" style={{ textDecoration: 'none', color: '#fff', fontWeight: 800, fontSize: '1.15rem' }}>
            SOFE <span style={{ color: '#1428FF' }}>NODE</span>
          </Link>
          {isPremium && (
            <span style={{
              background: 'linear-gradient(135deg, rgba(255,138,0,0.2), rgba(255,215,0,0.25))',
              border: '1px solid #FF8A00',
              color: '#FFB800',
              borderRadius: 20,
              padding: '0.2rem 0.65rem',
              fontSize: '0.68rem',
              fontWeight: 700,
              letterSpacing: '0.04em'
            }}>
              💎 PREMIUM VIP
            </span>
          )}
          {isProtocol && (
            <span style={{
              background: 'rgba(20,40,255,0.2)',
              border: '1px solid #1428FF',
              color: '#7096FF',
              borderRadius: 20,
              padding: '0.2rem 0.65rem',
              fontSize: '0.68rem',
              fontWeight: 700
            }}>
              🌐 PROTOCOL
            </span>
          )}
          {isPartner && !isProtocol && (
            <span style={{
              background: 'rgba(0,200,100,0.15)',
              border: '1px solid #00c864',
              color: '#00c864',
              borderRadius: 20,
              padding: '0.2rem 0.65rem',
              fontSize: '0.68rem',
              fontWeight: 700
            }}>
              🤝 PARTNER
            </span>
          )}
          {isNodeLead && (
            <span style={{
              background: 'rgba(255,138,0,0.15)',
              border: '1px solid #FF8A00',
              color: '#FF8A00',
              borderRadius: 20,
              padding: '0.2rem 0.65rem',
              fontSize: '0.68rem',
              fontWeight: 700
            }}>
              🏫 NODE LEAD
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          {/* Daily Claim Quick Action */}
          <button
            onClick={handleDailyClaim}
            disabled={claimedToday}
            style={{
              background: claimedToday ? 'rgba(0,200,100,0.12)' : 'linear-gradient(135deg, #FF8A00, #E07800)',
              border: claimedToday ? '1px solid rgba(0,200,100,0.3)' : 'none',
              color: claimedToday ? '#00c864' : '#fff',
              borderRadius: 20,
              padding: '0.35rem 0.9rem',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: claimedToday ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>{claimedToday ? '✓' : '⚡'}</span>
            <span>{claimedToday ? `Streak: ${dailyStreak}d` : 'Claim +2 XP'}</span>
          </button>

          {/* Quick Referral Share */}
          {userData?.referral_code && (
            <button
              onClick={handleCopyRef}
              style={{
                background: 'rgba(20,40,255,0.12)',
                border: '1px solid rgba(20,40,255,0.3)',
                color: '#6b8cff',
                borderRadius: 6,
                padding: '0.35rem 0.8rem',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {copyFeedback ? '✓ Copied!' : '🔗 Copy Ref Link'}
            </button>
          )}

          {/* Notifications Toggle */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(200,215,240,0.2)',
                color: '#fff',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              🔔
              {unreadNotifsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -3,
                  right: -3,
                  background: '#FF8A00',
                  color: '#000',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div style={{
                position: 'absolute',
                top: 45,
                right: 0,
                width: 320,
                background: '#0D1526',
                border: '1px solid rgba(20,40,255,0.3)',
                borderRadius: 8,
                padding: '0.8rem',
                boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
                zIndex: 200
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.6rem', borderBottom: '1px solid rgba(200,215,240,0.1)', paddingBottom: '0.4rem' }}>
                  Notifications
                </div>
                {notifications.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: '0.72rem', textAlign: 'center', margin: '1rem 0' }}>No notifications yet.</p>
                ) : (
                  <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {notifications.map((n) => (
                      <div key={n.id} style={{ fontSize: '0.72rem', padding: '0.4rem', borderBottom: '1px solid rgba(200,215,240,0.06)' }}>
                        <strong>{n.title || 'Notification'}</strong>: {n.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Avatar */}
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1428FF, #FF8A00)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem'
          }}>
            {fullName.slice(0, 2).toUpperCase()}
          </div>
        </div>
      </header>

      {/* DASHBOARD LAYOUT */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 65px)' }}>
        {/* SIDEBAR NAVIGATION */}
        <aside style={{
          width: sidebarOpen ? 240 : 70,
          background: '#080E1A',
          borderRight: '1px solid rgba(20,40,255,0.15)',
          padding: '1.2rem 0.6rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.25s ease'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[
              { id: 'classroom', icon: '📚', label: 'Sofe Academy' },
              { id: 'business', icon: '💼', label: 'My Business' },
              { id: 'wallet', icon: '💰', label: 'Wallet' },
              { id: 'certificates', icon: '🎓', label: 'Certificate' },
              { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
              { id: 'settings', icon: '⚙️', label: 'Settings' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id === 'leaderboard') loadLeaderboardData(lbTab);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    padding: '0.65rem 0.8rem',
                    borderRadius: 8,
                    border: 'none',
                    background: isActive ? 'rgba(20,40,255,0.2)' : 'transparent',
                    color: isActive ? '#fff' : 'rgba(200,215,240,0.65)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
                  {sidebarOpen && <span>{tab.label}</span>}
                </button>
              );
            })}

            <Link
              href="/bounties"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                padding: '0.65rem 0.8rem',
                borderRadius: 8,
                color: '#FFB800',
                fontWeight: 600,
                fontSize: '0.8rem',
                textDecoration: 'none',
                width: '100%',
                overflow: 'hidden',
                whiteSpace: 'nowrap'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🎯</span>
              {sidebarOpen && <span>Bounties Board</span>}
            </Link>

            {isStaffOrAdmin && (
              <Link
                href="/admin-dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  padding: '0.65rem 0.8rem',
                  borderRadius: 8,
                  background: 'rgba(20,40,255,0.15)',
                  border: '1px solid rgba(20,40,255,0.3)',
                  color: '#7096FF',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textDecoration: 'none',
                  width: '100%',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  marginTop: '0.2rem'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>⚡</span>
                {sidebarOpen && <span>Admin Console</span>}
              </Link>
            )}
          </div>

          <div style={{ borderTop: '1px solid rgba(200,215,240,0.1)', paddingTop: '0.8rem' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                padding: '0.65rem 0.8rem',
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,100,100,0.8)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <span>↩</span>
              {sidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* MAIN BODY AREA */}
        <main style={{ flex: 1, padding: '2rem', overflowX: 'hidden' }}>
          {/* WELCOME / HERO STRIP */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(20,40,255,0.15), rgba(8,14,26,0.9))',
            border: '1px solid rgba(20,40,255,0.25)',
            borderRadius: 12,
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#FF8A00', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Sofian Success Portal
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '0.2rem' }}>
                Welcome Back, <span style={{ color: '#FF8A00' }}>{fullName}</span>!
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.4rem', fontSize: '0.78rem', color: 'rgba(200,215,240,0.7)' }}>
                <span>{currentTier.icon} {currentTier.name} ({xpTotal.toLocaleString()} XP)</span>
                <span>•</span>
                <span>ID: {userData?.sofian_id || currentUser.uid.slice(0, 8)}</span>
                {myChapter && (
                  <>
                    <span>•</span>
                    <span>🏛 Campus Node: <strong>{myChapter.name}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Stats Badges */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(8,14,26,0.8)', border: '1px solid rgba(200,215,240,0.15)', borderRadius: 8, padding: '0.6rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)' }}>Wallet Balance</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#00c864' }}>₦{walletBalance.toLocaleString('en-NG')}</div>
              </div>
              <div style={{ background: 'rgba(8,14,26,0.8)', border: '1px solid rgba(200,215,240,0.15)', borderRadius: 8, padding: '0.6rem 1rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)' }}>Validated Referrals</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FF8A00' }}>{validatedRefs}</div>
              </div>
            </div>
          </div>

          {/* 💎 $100 PREMIUM MEMBERSHIP BANNER */}
          {!isPremium ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,138,0,0.12), rgba(20,40,255,0.12))',
              border: '1px solid rgba(255,138,0,0.4)',
              borderRadius: 12,
              padding: '1.25rem 1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: '#FFB800' }}>
                  <span>💎</span> Become a Sofe Node Premium Member ($100 One-time)
                </div>
                <p style={{ fontSize: '0.78rem', color: 'rgba(200,215,240,0.8)', marginTop: '0.3rem', maxWidth: 680 }}>
                  Elevate your standing in the ecosystem. As a Premium Member, you receive a VIP badge, direct access to the executive WhatsApp leadership group, and priority career matching.
                  <em> (Note: Foundation course completion is still required to earn referral commissions).</em>
                </p>
              </div>
              <Link
                href="/payment-flow?tier=premium&amount=100"
                style={{
                  background: 'linear-gradient(135deg, #FF8A00, #E07800)',
                  color: '#fff',
                  padding: '0.6rem 1.4rem',
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                Upgrade to Premium ($100) →
              </Link>
            </div>
          ) : (
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,200,100,0.08), rgba(20,40,255,0.08))',
              border: '1px solid rgba(0,200,100,0.3)',
              borderRadius: 12,
              padding: '1rem 1.5rem',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💎</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#00c864' }}>
                    Active Sofe Node Premium Member
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.7)' }}>
                    Your $100 VIP membership is active. Connect directly with administrators for executive group entry.
                  </div>
                </div>
              </div>
              <a
                href={VIP_ADMIN_WA}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#25D366',
                  color: '#000',
                  padding: '0.5rem 1.2rem',
                  borderRadius: 8,
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>💬</span> Contact VIP Admin on WhatsApp
              </a>
            </div>
          )}

          {/* TAB 1: CLASSROOM (SOFE ACADEMY) */}
          {activeTab === 'classroom' && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>My Enrolled Courses</h2>
                <Link href="/courses" style={{ fontSize: '0.76rem', color: '#FF8A00', textDecoration: 'none' }}>
                  Browse All Courses →
                </Link>
              </div>

              {enrolments.length === 0 ? (
                <div style={{
                  background: '#0D1526',
                  border: '1px solid rgba(20,40,255,0.18)',
                  borderRadius: 10,
                  padding: '2.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>🌱</div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Ready to begin your Web3 journey?</h3>
                  <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.8rem', maxWidth: 500, margin: '0.5rem auto 1.5rem' }}>
                    Enroll in the free Blockchain & Cryptocurrency Foundation course to unlock tracks, bounties, and affiliate commissions.
                  </p>
                  <Link
                    href="/course-view?course=foundation"
                    style={{
                      background: '#1428FF',
                      color: '#fff',
                      padding: '0.65rem 1.6rem',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    Start Foundation Course (Free) →
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {enrolments.map((enrol) => {
                    const cid = enrol.course_id || 'foundation';
                    const c = coursesData[cid] || {};
                    const title = c.title || (cid === 'foundation' ? 'Blockchain & Cryptocurrency Foundation' : cid.toUpperCase());
                    const pct = enrol.progress_pct || 0;
                    const isDone = !!enrol.completed_at;

                    return (
                      <div
                        key={enrol.id}
                        style={{
                          background: '#0D1526',
                          border: '1px solid rgba(20,40,255,0.2)',
                          borderRadius: 10,
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                            <span style={{
                              background: 'rgba(20,40,255,0.15)',
                              color: '#6b8cff',
                              padding: '0.2rem 0.5rem',
                              borderRadius: 4,
                              fontSize: '0.64rem',
                              fontWeight: 700
                            }}>
                              {cid === 'foundation' ? '★ Foundation' : '◆ Career Track'}
                            </span>
                            {isDone && <span style={{ color: '#00c864', fontSize: '0.7rem', fontWeight: 700 }}>✓ Completed</span>}
                          </div>
                          <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0.4rem 0' }}>{title}</h3>
                          <p style={{ color: 'rgba(200,215,240,0.65)', fontSize: '0.74rem', marginBottom: '1rem' }}>
                            {c.description ? c.description.slice(0, 90) + '...' : 'Comprehensive training curriculum.'}
                          </p>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)', marginBottom: '0.3rem' }}>
                            <span>Progress</span>
                            <strong>{pct}%</strong>
                          </div>
                          <div style={{ background: 'rgba(200,215,240,0.1)', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: '1rem' }}>
                            <div style={{ background: '#FF8A00', height: '100%', width: `${pct}%` }}></div>
                          </div>
                          <Link
                            href={`/course-view?course=${cid}`}
                            style={{
                              display: 'block',
                              textAlign: 'center',
                              background: 'rgba(20,40,255,0.15)',
                              border: '1px solid #1428FF',
                              color: '#fff',
                              borderRadius: 6,
                              padding: '0.5rem',
                              fontSize: '0.76rem',
                              fontWeight: 600,
                              textDecoration: 'none'
                            }}
                          >
                            {isDone ? 'Review Course →' : pct > 0 ? 'Continue Learning →' : 'Start Course →'}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* TAB 2: MY BUSINESS (REFERRALS & COMMISSIONS) */}
          {activeTab === 'business' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Affiliate & Ambassador Business</h2>
                <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                  Earn 10% direct commission on career course enrollments, plus 5% indirect commissions from your referral network.
                </p>
              </div>

              {/* Foundation Qualification Requirement Notice */}
              {!foundationDone && (
                <div style={{
                  background: 'rgba(255,138,0,0.08)',
                  border: '1px solid rgba(255,138,0,0.3)',
                  borderRadius: 8,
                  padding: '0.9rem 1.2rem',
                  marginBottom: '1.5rem',
                  fontSize: '0.76rem',
                  color: '#FFB800'
                }}>
                  ⚠️ <strong>Validation Required:</strong> You must complete the Foundation Course to unlock commission payouts.
                  Your referrals will be tracked, but earnings will only activate once your account is validated.
                </div>
              )}

              {/* Referral Link Quick Copy Box */}
              <div style={{
                background: '#0D1526',
                border: '1px solid rgba(20,40,255,0.25)',
                borderRadius: 10,
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(200,215,240,0.7)', marginBottom: '0.5rem' }}>
                  YOUR UNIQUE REFERRAL LINK
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${userData?.referral_code || ''}` : ''}
                    style={{
                      flex: 1,
                      minWidth: 260,
                      background: 'rgba(8,14,26,0.8)',
                      border: '1px solid rgba(20,40,255,0.2)',
                      borderRadius: 6,
                      padding: '0.6rem 0.8rem',
                      color: '#fff',
                      fontSize: '0.8rem'
                    }}
                  />
                  <button
                    onClick={handleCopyRef}
                    style={{
                      background: '#1428FF',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '0.6rem 1.4rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {copyFeedback ? '✓ Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              {/* 4-Stat Metric Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#0D1526', border: '1px solid rgba(200,215,240,0.1)', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)' }}>Total Signups</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.3rem' }}>{totalSignups}</div>
                  <div style={{ fontSize: '0.64rem', color: 'rgba(200,215,240,0.5)', marginTop: '0.2rem' }}>
                    {verifiedRefs} email verified
                  </div>
                </div>

                <div style={{ background: '#0D1526', border: '1px solid rgba(200,215,240,0.1)', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)' }}>Validated (Foundation Done)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.3rem' }}>{validatedRefs}</div>
                  <div style={{ fontSize: '0.64rem', color: 'rgba(200,215,240,0.5)', marginTop: '0.2rem' }}>
                    Eligible for commissions
                  </div>
                </div>

                <div style={{ background: '#0D1526', border: '1px solid rgba(200,215,240,0.1)', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)' }}>Total Commissions Earned</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FF8A00', marginTop: '0.3rem' }}>
                    ₦{totalEarned.toLocaleString('en-NG')}
                  </div>
                </div>

                <div style={{ background: '#0D1526', border: '1px solid rgba(200,215,240,0.1)', borderRadius: 8, padding: '1rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)' }}>Unpaid Commissions</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6b8cff', marginTop: '0.3rem' }}>
                    ₦{unpaidCommissions.toLocaleString('en-NG')}
                  </div>
                </div>
              </div>

              {/* Commission Structure Explanation */}
              <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.18)', borderRadius: 10, padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.8rem' }}>How 2-Tier Commissions Work</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.76rem', color: 'rgba(200,215,240,0.8)' }}>
                  <div style={{ padding: '0.8rem', background: 'rgba(20,40,255,0.06)', borderRadius: 6, border: '1px solid rgba(20,40,255,0.15)' }}>
                    <strong style={{ color: '#fff' }}>Tier 1: 10% Direct Commission</strong>
                    <p style={{ marginTop: '0.3rem' }}>
                      Earn 10% on the net amount paid by anyone who signs up directly using your link when they purchase a paid track or CBIE certification.
                    </p>
                  </div>
                  <div style={{ padding: '0.8rem', background: 'rgba(255,138,0,0.06)', borderRadius: 6, border: '1px solid rgba(255,138,0,0.15)' }}>
                    <strong style={{ color: '#fff' }}>Tier 2: 5% Indirect Network Override</strong>
                    <p style={{ marginTop: '0.3rem' }}>
                      When people you referred refer others who enroll, you earn a 5% override on their net paid fees.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 3: WALLET */}
          {activeTab === 'wallet' && (
            <section>
              <div style={{
                background: 'linear-gradient(135deg, rgba(20,40,255,0.2), #0D1526)',
                border: '1px solid rgba(20,40,255,0.3)',
                borderRadius: 12,
                padding: '1.75rem',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.2rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Available Withdrawable Balance
                  </div>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
                    ₦{walletBalance.toLocaleString('en-NG')}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.65)', marginTop: '0.3rem' }}>
                    Minimum withdrawal threshold: <strong>₦10,000</strong>
                  </div>
                </div>

                <button
                  onClick={() => setShowPayoutModal(true)}
                  disabled={walletBalance < 10000}
                  style={{
                    background: walletBalance >= 10000 ? '#10b981' : 'rgba(200,215,240,0.1)',
                    border: 'none',
                    color: walletBalance >= 10000 ? '#fff' : 'rgba(200,215,240,0.4)',
                    padding: '0.75rem 1.6rem',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: walletBalance >= 10000 ? 'pointer' : 'not-allowed'
                  }}
                >
                  Request Payout →
                </button>
              </div>

              {/* Transactions History */}
              <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.18)', borderRadius: 10, padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem' }}>Transaction History</h3>
                {transactions.length === 0 ? (
                  <p style={{ color: 'rgba(200,215,240,0.6)', fontSize: '0.78rem', textAlign: 'center', padding: '1.5rem 0' }}>
                    No transactions yet. Complete course tasks or refer peers to earn.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.7rem 0.9rem',
                          background: 'rgba(8,14,26,0.6)',
                          borderRadius: 6,
                          fontSize: '0.78rem'
                        }}
                      >
                        <div>
                          <strong>{tx.description || 'Commission credit'}</strong>
                          <div style={{ fontSize: '0.66rem', color: 'rgba(200,215,240,0.5)' }}>
                            {tx.created_at?.toDate ? tx.created_at.toDate().toLocaleDateString('en-NG') : 'Recently'}
                          </div>
                        </div>
                        <div style={{ fontWeight: 700, color: '#10b981' }}>
                          +₦{Number(tx.amount || 0).toLocaleString('en-NG')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TAB 4: CERTIFICATES */}
          {activeTab === 'certificates' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Certificates & Credentials</h2>
                <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                  Verify, download, and share your earned blockchain certifications on LinkedIn.
                </p>
              </div>

              {certificates.length === 0 ? (
                <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.18)', borderRadius: 10, padding: '2.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>🎓</div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>No Certificates Earned Yet</h3>
                  <p style={{ color: 'rgba(200,215,240,0.65)', fontSize: '0.78rem', maxWidth: 450, margin: '0.5rem auto 1.5rem' }}>
                    Complete the Blockchain & Cryptocurrency Foundation course (100%) to earn your verified credential and unique certificate ID.
                  </p>
                  <Link
                    href="/course-view?course=foundation"
                    style={{
                      background: '#1428FF',
                      color: '#fff',
                      padding: '0.6rem 1.4rem',
                      borderRadius: 6,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    Go to Foundation Course →
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  {certificates.map((cert, idx) => (
                    <div
                      key={cert.id}
                      style={{
                        background: '#0D1526',
                        border: '1px solid rgba(20,40,255,0.25)',
                        borderRadius: 10,
                        padding: '1.25rem'
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏅</div>
                      <h3 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{cert.course_title || 'Foundation Certificate'}</h3>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)', margin: '0.3rem 0 1rem' }}>
                        ID: {cert.cert_number || `SOFE-CERT-${cert.id.slice(0, 6).toUpperCase()}`}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => alert('Certificate PDF generated for: ' + fullName)}
                          style={{
                            background: '#1428FF',
                            border: 'none',
                            color: '#fff',
                            borderRadius: 6,
                            padding: '0.45rem 0.9rem',
                            fontSize: '0.74rem',
                            cursor: 'pointer'
                          }}
                        >
                          ⬇ Download PDF
                        </button>
                        <a
                          href="https://www.linkedin.com/profile/add"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: 'rgba(200,215,240,0.1)',
                            border: '1px solid rgba(200,215,240,0.2)',
                            color: '#fff',
                            borderRadius: 6,
                            padding: '0.45rem 0.9rem',
                            fontSize: '0.74rem',
                            textDecoration: 'none'
                          }}
                        >
                          Share on LinkedIn
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 5: LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Monthly Sofian Leaderboard</h2>
                <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                  Leaderboard resets on the 1st of every month. Top performers receive bounty airdrops and ambassador bonuses.
                </p>
              </div>

              {/* Subtabs: XP, Commission, Referral */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {[
                  { id: 'xp', label: '⚡ Top XP' },
                  { id: 'commission', label: '💰 Top Earners' },
                  { id: 'referral', label: '🤝 Top Ambassadors' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setLbTab(t.id);
                      loadLeaderboardData(t.id);
                    }}
                    style={{
                      background: lbTab === t.id ? '#1428FF' : '#0D1526',
                      border: '1px solid rgba(20,40,255,0.25)',
                      color: lbTab === t.id ? '#fff' : 'rgba(200,215,240,0.7)',
                      borderRadius: 6,
                      padding: '0.5rem 1rem',
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.18)', borderRadius: 10, padding: '1rem', overflowX: 'auto' }}>
                {lbLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(200,215,240,0.5)', fontSize: '0.8rem' }}>
                    Loading leaderboard...
                  </div>
                ) : leaderboardRows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(200,215,240,0.5)', fontSize: '0.8rem' }}>
                    No leaderboard activity recorded yet this month.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(200,215,240,0.1)', textAlign: 'left', color: 'rgba(200,215,240,0.6)' }}>
                        <th style={{ padding: '0.6rem' }}>#</th>
                        <th style={{ padding: '0.6rem' }}>Sofian</th>
                        <th style={{ padding: '0.6rem' }}>Tier</th>
                        <th style={{ padding: '0.6rem', textAlign: 'right' }}>Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardRows.map((row, i) => {
                        const isMe = row.id === currentUser?.uid;
                        const rank = i + 1;
                        const name = `${row.first_name || ''} ${row.last_initial || ''}`.trim() || 'Sofian';
                        return (
                          <tr
                            key={row.id}
                            style={{
                              borderBottom: '1px solid rgba(200,215,240,0.06)',
                              background: isMe ? 'rgba(255,138,0,0.08)' : 'transparent'
                            }}
                          >
                            <td style={{ padding: '0.6rem', fontWeight: 700 }}>
                              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                            </td>
                            <td style={{ padding: '0.6rem' }}>
                              {name} {isMe && <span style={{ background: '#FF8A00', color: '#000', borderRadius: 4, padding: '1px 4px', fontSize: '0.6rem', marginLeft: 4 }}>YOU</span>}
                            </td>
                            <td style={{ padding: '0.6rem', color: 'rgba(200,215,240,0.7)' }}>{row.tier || 'Genesis Node'}</td>
                            <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 700, color: '#FF8A00' }}>
                              {lbTab === 'xp'
                                ? `${(Number(row.xp_this_period) || 0).toLocaleString()} XP`
                                : lbTab === 'commission'
                                ? `₦${(Number(row.commission_this_period) || 0).toLocaleString('en-NG')}`
                                : `${Number(row.validated_referrals_this_period) || 0} refs`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === 'settings' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Profile & Account Settings</h2>
                <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                  Manage personal details, Nigerian bank settlement info, and security credentials.
                </p>
              </div>

              {settingsMsg && (
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 6,
                  marginBottom: '1rem',
                  fontSize: '0.78rem',
                  background: settingsMsg.type === 'success' ? 'rgba(0,200,100,0.1)' : 'rgba(255,80,80,0.1)',
                  color: settingsMsg.type === 'success' ? '#00c864' : '#ff7070',
                  border: `1px solid ${settingsMsg.type === 'success' ? 'rgba(0,200,100,0.3)' : 'rgba(255,80,80,0.3)'}`
                }}>
                  {settingsMsg.text}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {/* Profile Form */}
                <form
                  onSubmit={handleSaveSettings}
                  style={{
                    background: '#0D1526',
                    border: '1px solid rgba(20,40,255,0.2)',
                    borderRadius: 10,
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                  }}
                >
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid rgba(200,215,240,0.1)', paddingBottom: '0.5rem' }}>
                    Personal & Node Information
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>First Name</label>
                      <input
                        type="text"
                        value={settingsForm.firstName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, firstName: e.target.value })}
                        style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Last Name</label>
                      <input
                        type="text"
                        value={settingsForm.lastName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, lastName: e.target.value })}
                        style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Phone Number</label>
                    <input
                      type="text"
                      value={settingsForm.phone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Campus Node / Institution</label>
                    <input
                      type="text"
                      value={settingsForm.nodeLabel}
                      onChange={(e) => setSettingsForm({ ...settingsForm, nodeLabel: e.target.value })}
                      list="chapterList"
                      placeholder="e.g. UNILAG, UNN, FUTO, or Other"
                      style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                    />
                    <datalist id="chapterList">
                      {chapters.map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                    </datalist>
                  </div>

                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid rgba(200,215,240,0.1)', paddingBottom: '0.5rem', marginTop: '0.5rem' }}>
                    Bank Settlement Details (NGN)
                  </h3>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Bank Name</label>
                    <input
                      type="text"
                      value={settingsForm.bankName}
                      placeholder="e.g. Access Bank, GTBank, Kuda"
                      onChange={(e) => setSettingsForm({ ...settingsForm, bankName: e.target.value })}
                      style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Account Number</label>
                      <input
                        type="text"
                        value={settingsForm.accNumber}
                        placeholder="10 digits"
                        onChange={(e) => setSettingsForm({ ...settingsForm, accNumber: e.target.value })}
                        style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Account Name</label>
                      <input
                        type="text"
                        value={settingsForm.accName}
                        onChange={(e) => setSettingsForm({ ...settingsForm, accName: e.target.value })}
                        style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingSettings}
                    style={{
                      background: '#1428FF',
                      border: 'none',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '0.65rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: '0.5rem'
                    }}
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </form>

                {/* Password Change Form */}
                <form
                  onSubmit={handleUpdatePassword}
                  style={{
                    background: '#0D1526',
                    border: '1px solid rgba(20,40,255,0.2)',
                    borderRadius: 10,
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    height: 'fit-content'
                  }}
                >
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid rgba(200,215,240,0.1)', paddingBottom: '0.5rem' }}>
                    Security & Password
                  </h3>

                  {pwdMsg && (
                    <div style={{
                      padding: '0.6rem 0.8rem',
                      borderRadius: 6,
                      fontSize: '0.74rem',
                      background: pwdMsg.type === 'success' ? 'rgba(0,200,100,0.1)' : 'rgba(255,80,80,0.1)',
                      color: pwdMsg.type === 'success' ? '#00c864' : '#ff7070'
                    }}>
                      {pwdMsg.text}
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Current Password</label>
                    <input
                      type="password"
                      value={pwdForm.oldPwd}
                      onChange={(e) => setPwdForm({ ...pwdForm, oldPwd: e.target.value })}
                      style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>New Password</label>
                    <input
                      type="password"
                      value={pwdForm.newPwd}
                      onChange={(e) => setPwdForm({ ...pwdForm, newPwd: e.target.value })}
                      style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Repeat New Password</label>
                    <input
                      type="password"
                      value={pwdForm.repeatPwd}
                      onChange={(e) => setPwdForm({ ...pwdForm, repeatPwd: e.target.value })}
                      style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={pwdLoading}
                    style={{
                      background: 'rgba(200,215,240,0.15)',
                      border: '1px solid rgba(200,215,240,0.25)',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '0.65rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: '0.5rem'
                    }}
                  >
                    {pwdLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* WITHDRAWAL REQUEST MODAL */}
      {showPayoutModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#0D1526',
            border: '1px solid rgba(20,40,255,0.3)',
            borderRadius: 12,
            padding: '1.75rem',
            width: '100%',
            maxWidth: 460
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.4rem' }}>Request Wallet Withdrawal</h3>
            <p style={{ fontSize: '0.76rem', color: 'rgba(200,215,240,0.7)', marginBottom: '1.25rem' }}>
              Funds will be disbursed to your saved settlement account: <strong>{settingsForm.bankName || 'Not Set'} ({settingsForm.accNumber || 'No Account'})</strong>
            </p>

            <form onSubmit={handlePayoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Amount (NGN)</label>
                <input
                  type="number"
                  min="10000"
                  max={walletBalance}
                  required
                  placeholder={`Min ₦10,000 (Max ₦${walletBalance.toLocaleString('en-NG')})`}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.85rem', marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Settlement Channel</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                >
                  <option value="bank">Nigerian Bank Account (Direct Transfer)</option>
                  <option value="crypto_usdt">USDT TRC-20 / BEP-20 (Crypto)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Notes / Wallet Address (if crypto)</label>
                <input
                  type="text"
                  placeholder="Optional notes or wallet address"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid rgba(200,215,240,0.2)',
                    color: 'rgba(200,215,240,0.7)',
                    borderRadius: 6,
                    padding: '0.65rem',
                    fontSize: '0.78rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payoutSubmitting}
                  style={{
                    flex: 1,
                    background: '#10b981',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '0.65rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {payoutSubmitting ? 'Submitting...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
