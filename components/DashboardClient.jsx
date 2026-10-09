'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const searchParams = useSearchParams();

  // Loading & User State
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams?.get('tab');
    return tabParam || 'classroom';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);


  // ── WORKSPACE CONTEXT SWITCHER ──
  const [activeWorkspace, setActiveWorkspace] = useState('learner');
  const loadedWorkspacesRef = React.useRef(new Set(['learner']));

  // ── PROTOCOL CONSOLE STATE ──
  const [protocolBounties, setProtocolBounties] = useState([]);
  const [protocolApplicants, setProtocolApplicants] = useState([]);
  const [protocolLoading, setProtocolLoading] = useState(false);
  const [showCreateBountyModal, setShowCreateBountyModal] = useState(false);
  const [createBountyForm, setCreateBountyForm] = useState({
    title: '',
    category: 'dev',
    reward_usd: '',
    deadline: '',
    description: '',
    requirements: ''
  });
  const [createBountySubmitting, setCreateBountySubmitting] = useState(false);

  // ── NODE COMMAND STATE ──
  const [nodeStudents, setNodeStudents] = useState([]);
  const [nodeDisbursements, setNodeDisbursements] = useState([]);
  const [nodeTreasuryBalance, setNodeTreasuryBalance] = useState(150000);
  const [nodeLoading, setNodeLoading] = useState(false);
  const [showNodeDisbModal, setShowNodeDisbModal] = useState(false);
  const [nodeDisbForm, setNodeDisbForm] = useState({
    amount: '',
    purpose: '',
    bankName: '',
    accountNumber: '',
    accountName: ''
  });
  const [nodeDisbSubmitting, setNodeDisbSubmitting] = useState(false);

  // ── PARTNER PORTAL STATE ──
  const [partnerStudents, setPartnerStudents] = useState([]);
  const [partnerLoading, setPartnerLoading] = useState(false);

  // ── TUTOR DESK STATE ──
  const [tutorSubmissions, setTutorSubmissions] = useState([]);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [selectedSubForGrading, setSelectedSubForGrading] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradeScore, setGradeScore] = useState(100);
  const [gradePassed, setGradePassed] = useState(true);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradingSubmitting, setGradingSubmitting] = useState(false);

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

      // Workspace context restore & initial data load
      const availableWorkspaces = computeWorkspaces(u);
      let savedWs = typeof window !== 'undefined' ? localStorage.getItem('sofe_active_workspace') : null;
      if (savedWs === 'admin') {
        localStorage.removeItem('sofe_active_workspace');
        savedWs = null;
      }
      
      let targetWs = 'learner';
      if (savedWs && availableWorkspaces.some((w) => w.id === savedWs)) {
        targetWs = savedWs;
      } else if (u.account_type === 'protocol') {
        targetWs = 'protocol';
      } else if (u.account_type === 'partner_org' || u.role === 'partner') {
        targetWs = 'partner';
      } else if (u.node_lead_for || u.role === 'node_lead') {
        targetWs = 'node_lead';
      }

      if (targetWs !== 'learner') {
        setActiveWorkspace(targetWs);
        const wsObj = availableWorkspaces.find((w) => w.id === targetWs);
        if (wsObj) {
          setActiveTab(wsObj.defaultTab);
        }
      }
      loadWorkspaceData(targetWs, user.uid, u);
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
      const hasAnyEnrolment = allEnrols.length > 0;
      const hasFoundation = allEnrols.some((e) => e.course_id === 'foundation' || !e.course_id);

      if (hasAnyEnrolment && !hasFoundation) {
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
        const rawRefs = refsSnap.docs.map((d) => d.data());

        // Enrich with referee's live status
        const enriched = await Promise.all(
          rawRefs.map(async (r) => {
            const refUserId = r.referred_user_id || r.referee_id;
            if (refUserId) {
              try {
                const uDoc = await getDoc(doc(db, 'users', refUserId));
                if (uDoc.exists()) {
                  const uD = uDoc.data();
                  return {
                    ...r,
                    foundation_complete: r.foundation_complete || uD.foundation_complete || false,
                    career_enrolled: r.career_enrolled || uD.career_enrolled || false,
                    email_verified: r.email_verified || uD.email_verified || false
                  };
                }
              } catch (e) {}
            }
            return r;
          })
        );
        setReferrals(enriched);
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

  // ── WORKSPACE LOGIC & LAZY LOADERS ──
  const computeWorkspaces = (u) => {
    const list = [];
    const isSuperAdminUser = ['admin@sofenode.com', 'admin@sofegroup.com', 'superadmin@sofenode.com'].includes(u?.email?.toLowerCase()) || u?.role === 'admin' || u?.admin_role === 'super_admin';
    const isProtocol = u?.account_type === 'protocol';
    const isPartner = u?.account_type === 'partner_org' || u?.role === 'partner';
    
    // Check if user has ANY admin role
    const adminRole = u?.admin_role || (u?.role === 'admin' ? 'super_admin' : null);
    const hasAdminPanel = isSuperAdminUser || ['super_admin', 'admin', 'course_manager', 'finance_admin', 'community_manager', 'social_media_manager'].includes(adminRole);
    const isTutor = !isSuperAdminUser && (u?.role === 'tutor' || u?.admin_role === 'tutor');
    const isNodeLead = !isSuperAdminUser && (!!u?.node_lead_for || u?.role === 'node_lead' || u?.is_node_lead);

    // Protocol and Partner accounts only see 'Learner' if they have an assigned role (admin/tutor/node_lead)
    const isRestrictedExclusive = (isProtocol || isPartner) && !hasAdminPanel && !isTutor && !isNodeLead;

    if (!isRestrictedExclusive) {
      list.push({ id: 'learner', label: 'Learner Hub', icon: '🎓', defaultTab: 'classroom' });
    }

    if (hasAdminPanel) {
      list.push({ id: 'admin', label: 'Admin Console', icon: '⚡', defaultTab: 'admin-iframe' });
    }
    if (isProtocol && !isSuperAdminUser) {
      list.push({ id: 'protocol', label: 'Protocol Console', icon: '🌐', defaultTab: 'protocol-bounties' });
    }
    if (isPartner && !isSuperAdminUser) {
      list.push({ id: 'partner', label: 'Partner Portal', icon: '🤝', defaultTab: 'partner-analytics' });
    }
    if (isNodeLead) {
      list.push({ id: 'node_lead', label: 'Node Command', icon: '🌍', defaultTab: 'node-metrics' });
    }
    if (isTutor) {
      list.push({ id: 'tutor', label: 'Tutor Desk', icon: '✍️', defaultTab: 'tutor-queue' });
    }

    
    return list;
  };

  const handleSwitchWorkspace = (wsId) => {
    if (wsId === 'admin') {
      window.location.href = '/admin-dashboard-v2.html';
      return;
    }
    setActiveWorkspace(wsId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sofe_active_workspace', wsId);
    }
    const targetWs = computeWorkspaces(userData).find((w) => w.id === wsId);
    if (targetWs) {
      setActiveTab(targetWs.defaultTab);
    }
    loadWorkspaceData(wsId);
  };

  const loadWorkspaceData = async (wsId, uid = currentUser?.uid, u = userData) => {
    if (!uid) return;
    if (loadedWorkspacesRef.current.has(wsId)) return;
    loadedWorkspacesRef.current.add(wsId);

    if (wsId === 'protocol') {
      await loadProtocolConsoleData(uid);
    } else if (wsId === 'node_lead') {
      await loadNodeCommandData(uid, u);
    } else if (wsId === 'partner') {
      await loadPartnerPortalData(uid, u);
    } else if (wsId === 'tutor') {
      await loadTutorDeskData();
    }
  };

  const loadProtocolConsoleData = async (uid) => {
    setProtocolLoading(true);
    try {
      let q = query(collection(db, 'bounties'), where('created_by', '==', uid));
      let snap = await getDocs(q);
      let bounties = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (bounties.length === 0) {
        const allBountiesSnap = await getDocs(query(collection(db, 'bounties'), limit(15)));
        bounties = allBountiesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      setProtocolBounties(bounties);

      const appsSnap = await getDocs(collection(db, 'bounty_applications'));
      const allApps = appsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const bountyIds = new Set(bounties.map((b) => b.id));
      const relevantApps = allApps.filter((a) => bountyIds.has(a.bounty_id) || bounties.length === 0);
      setProtocolApplicants(relevantApps.length > 0 ? relevantApps : allApps.slice(0, 15));
    } catch (e) {
      console.error('Error loading protocol data:', e);
    } finally {
      setProtocolLoading(false);
    }
  };

  const handleCreateProtocolBounty = async (e) => {
    e.preventDefault();
    if (!createBountyForm.title || !createBountyForm.reward_usd) {
      alert('Please fill in title and reward amount.');
      return;
    }
    setCreateBountySubmitting(true);
    try {
      const rewardNum = Number(createBountyForm.reward_usd);
      const docRef = await addDoc(collection(db, 'bounties'), {
        title: createBountyForm.title,
        category: createBountyForm.category || 'dev',
        reward_usd: rewardNum,
        reward: `$${rewardNum.toLocaleString()}`,
        deadline: createBountyForm.deadline || '',
        description: createBountyForm.description || '',
        requirements: createBountyForm.requirements || '',
        created_by: currentUser.uid,
        created_by_name: userData?.company_name || userData?.organization_name || `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'Protocol Partner',
        status: 'open',
        applicants_count: 0,
        created_at: serverTimestamp()
      });

      const newBounty = {
        id: docRef.id,
        title: createBountyForm.title,
        category: createBountyForm.category,
        reward_usd: rewardNum,
        reward: `$${rewardNum.toLocaleString()}`,
        deadline: createBountyForm.deadline,
        description: createBountyForm.description,
        requirements: createBountyForm.requirements,
        created_by: currentUser.uid,
        status: 'open',
        applicants_count: 0
      };

      setProtocolBounties((prev) => [newBounty, ...prev]);
      setShowCreateBountyModal(false);
      setCreateBountyForm({ title: '', category: 'dev', reward_usd: '', deadline: '', description: '', requirements: '' });
      setPayoutToast('🎯 Bounty successfully published to Sofe Talent Pool!');
      setTimeout(() => setPayoutToast(null), 5000);
    } catch (e) {
      alert('Failed to create bounty: ' + e.message);
    } finally {
      setCreateBountySubmitting(false);
    }
  };

  const loadNodeCommandData = async (uid, u) => {
    setNodeLoading(true);
    try {
      const chapterId = u?.chapter_id || u?.node_lead_for;
      let students = [];
      if (chapterId) {
        const qStudents = query(collection(db, 'users'), where('chapter_id', '==', chapterId), limit(30));
        const snap = await getDocs(qStudents);
        students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      if (students.length === 0) {
        const snap = await getDocs(query(collection(db, 'users'), limit(20)));
        students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      setNodeStudents(students);

      const qDisb = query(collection(db, 'disbursement_requests'), where('type', '==', 'node_treasury'), limit(25));
      const disbSnap = await getDocs(qDisb);
      setNodeDisbursements(disbSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Error loading node data:', e);
    } finally {
      setNodeLoading(false);
    }
  };

  const handleNodeDisbSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(nodeDisbForm.amount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid disbursement amount.');
      return;
    }
    if (amountNum > nodeTreasuryBalance) {
      alert('Requested amount exceeds chapter treasury balance.');
      return;
    }
    setNodeDisbSubmitting(true);
    try {
      await addDoc(collection(db, 'disbursement_requests'), {
        requester_uid: currentUser.uid,
        requester_name: `${userData?.first_name || ''} ${userData?.last_name || ''}`.trim() || 'Node Lead',
        chapter_id: userData?.chapter_id || userData?.node_lead_for || '',
        chapter_name: myChapter?.name || userData?.node_label || 'Campus Node',
        amount: amountNum,
        purpose: nodeDisbForm.purpose,
        bank_name: nodeDisbForm.bankName,
        account_number: nodeDisbForm.accountNumber,
        account_name: nodeDisbForm.accountName,
        type: 'node_treasury',
        status: 'pending',
        created_at: serverTimestamp()
      });

      setShowNodeDisbModal(false);
      setNodeDisbForm({ amount: '', purpose: '', bankName: '', accountNumber: '', accountName: '' });
      setPayoutToast('✓ Chapter grant disbursement submitted to Core Council!');
      setTimeout(() => setPayoutToast(null), 5000);
      loadNodeCommandData(currentUser.uid, userData);
    } catch (e) {
      alert('Could not submit disbursement: ' + e.message);
    } finally {
      setNodeDisbSubmitting(false);
    }
  };

  const loadPartnerPortalData = async (uid, u) => {
    setPartnerLoading(true);
    try {
      let students = [];
      if (u?.referral_code) {
        const q = query(collection(db, 'users'), where('referred_by_code', '==', u.referral_code));
        const snap = await getDocs(q);
        students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      if (students.length === 0) {
        const snap = await getDocs(query(collection(db, 'users'), limit(20)));
        students = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      }
      setPartnerStudents(students);
    } catch (e) {
      console.error('Error loading partner data:', e);
    } finally {
      setPartnerLoading(false);
    }
  };

  const loadTutorDeskData = async () => {
    setTutorLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'submissions'), limit(30)));
      setTutorSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Error loading tutor data:', e);
    } finally {
      setTutorLoading(false);
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!selectedSubForGrading) return;
    setGradingSubmitting(true);
    try {
      await updateDoc(doc(db, 'submissions', selectedSubForGrading.id), {
        status: gradePassed ? 'approved' : 'rejected',
        score: Number(gradeScore),
        feedback: gradeFeedback,
        graded_by: currentUser.uid,
        graded_at: serverTimestamp()
      });

      setTutorSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubForGrading.id
            ? { ...s, status: gradePassed ? 'approved' : 'rejected', score: Number(gradeScore), feedback: gradeFeedback }
            : s
        )
      );

      setShowGradingModal(false);
      setSelectedSubForGrading(null);
      setPayoutToast(`✓ Submission graded: ${gradePassed ? 'Approved' : 'Needs Revision'}`);
      setTimeout(() => setPayoutToast(null), 4000);
    } catch (e) {
      alert('Grading failed: ' + e.message);
    } finally {
      setGradingSubmitting(false);
    }
  };

  const getDockItems = () => {
    if (activeWorkspace === 'protocol') {
      return [
        { id: 'protocol-bounties', icon: '🎯', label: 'Bounties' },
        { id: 'protocol-review', icon: '👥', label: 'Review' },
        { id: 'protocol-analytics', icon: '📊', label: 'Stats' },
        { id: 'settings', icon: '⚙️', label: 'Settings' }
      ];
    }
    if (activeWorkspace === 'node_lead') {
      return [
        { id: 'node-metrics', icon: '📊', label: 'Metrics' },
        { id: 'node-roster', icon: '👥', label: 'Roster' },
        { id: 'node-treasury', icon: '💰', label: 'Treasury' },
        { id: 'settings', icon: '⚙️', label: 'Settings' }
      ];
    }
    if (activeWorkspace === 'partner') {
      return [
        { id: 'partner-analytics', icon: '📈', label: 'Analytics' },
        { id: 'partner-roster', icon: '👥', label: 'Students' },
        { id: 'partner-payouts', icon: '💳', label: 'Payouts' },
        { id: 'settings', icon: '⚙️', label: 'Settings' }
      ];
    }
    if (activeWorkspace === 'tutor') {
      return [
        { id: 'tutor-queue', icon: '✍️', label: 'Queue' },
        { id: 'tutor-sessions', icon: '📅', label: 'Sessions' },
        { id: 'settings', icon: '⚙️', label: 'Settings' }
      ];
    }
    if (activeWorkspace === 'admin') {
      return [
        { id: 'admin-iframe', icon: '⚡', label: 'Admin' }
      ];
    }
    return [
      { id: 'classroom', icon: '📚', label: 'Courses' },
      { id: 'business', icon: '💼', label: 'Business' },
      { id: 'wallet', icon: '💰', label: 'Wallet' },
      { id: 'certificates', icon: '🎓', label: 'Certs' },
      { id: 'settings', icon: '⚙️', label: 'Settings' }
    ];
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
          <img src="/images/SofeIconTransparent.png" alt="Loading..." style={{ height: '50px', marginBottom: '1rem', animation: 'spin 1.5s infinite linear' }} />
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
  const isSuperAdminEmail = ['admin@sofenode.com', 'admin@sofegroup.com', 'superadmin@sofenode.com'].includes(userData?.email?.toLowerCase());
  const isStaffOrAdmin = isSuperAdminEmail || userData?.role === 'admin' || userData?.role === 'tutor' || !!userData?.admin_role || isNodeLead;

  const availableWorkspaces = computeWorkspaces(userData);

  const validatedRefs = referrals.filter((r) => r.foundation_complete === true).length;
  const verifiedRefs = referrals.filter((r) => r.email_verified === true || r.status === 'verified').length;
  const totalSignups = referrals.length;
  const qualifiedCount = referrals.filter((r) => r.foundation_complete === true && (r.career_enrolled === true || r.has_paid === true)).length;

  // Determine active affiliate tier
  const isAmbassador = userData?.affiliate_tier === 'ambassador' || userData?.role === 'ambassador' || isNodeLead || userData?.role === 'admin';
  const isAffiliate = isAmbassador || qualifiedCount >= 10 || userData?.affiliate_tier === 'affiliate';
  const activeAffiliateLevel = isAmbassador ? 'ambassador' : (isAffiliate ? 'affiliate' : 'newbie');

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

      

      {/* DASHBOARD LAYOUT */}
      <div style={{ display: 'flex', minHeight: '100vh', paddingTop: '85px', width: '100%', overflowX: 'hidden' }}>
        {/* SIDEBAR NAVIGATION */}
        <aside className="dash-desktop-sidebar" style={{
          display: activeWorkspace === 'admin' ? 'none' : 'flex',
          width: sidebarOpen ? 240 : 70,
          background: '#080E1A',
          borderRight: '1px solid rgba(20,40,255,0.15)',
          padding: '1.2rem 0.6rem',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.25s ease'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center', marginBottom: '1rem' }}>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ background: 'rgba(20,40,255,0.1)', border: '1px solid rgba(20,40,255,0.25)', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <span>☰</span>
              </button>
            </div>
            {/* WORKSPACE CONTEXT SWITCHER */}
            {availableWorkspaces.length > 1 && sidebarOpen && (
              <div style={{
                marginBottom: '0.6rem',
                paddingBottom: '0.6rem',
                borderBottom: '1px solid rgba(20,40,255,0.2)'
              }}>
                {sidebarOpen ? (
                  <div>
                    <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'rgba(200,215,240,0.5)', fontWeight: 700, marginBottom: '0.35rem', letterSpacing: '0.05em' }}>
                      Workspace
                    </div>
                    <select
                      value={activeWorkspace}
                      onChange={(e) => handleSwitchWorkspace(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#0D1526',
                        border: '1px solid rgba(20,40,255,0.4)',
                        color: '#FFB800',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                        borderRadius: 6,
                        padding: '0.4rem 0.5rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {availableWorkspaces.map((w) => (
                        <option key={w.id} value={w.id} style={{ background: '#080E1A', color: '#fff' }}>
                          {w.icon} {w.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <button
                    title={`Switch Workspace (Current: ${availableWorkspaces.find((w) => w.id === activeWorkspace)?.label})`}
                    onClick={() => {
                      const nextIdx = (availableWorkspaces.findIndex((w) => w.id === activeWorkspace) + 1) % availableWorkspaces.length;
                      handleSwitchWorkspace(availableWorkspaces[nextIdx].id);
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(20,40,255,0.18)',
                      border: '1px solid rgba(20,40,255,0.35)',
                      color: '#FFB800',
                      borderRadius: 6,
                      padding: '0.4rem 0',
                      fontSize: '1.05rem',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {availableWorkspaces.find((w) => w.id === activeWorkspace)?.icon || '💼'}
                  </button>
                )}
              </div>
            )}

            {/* DYNAMIC WORKSPACE NAV ITEMS */}
            {(activeWorkspace === 'protocol' ? [
              { id: 'protocol-bounties', icon: '🎯', label: 'Active Bounties' },
              { id: 'protocol-review', icon: '👥', label: 'Review Talent' },
              { id: 'protocol-analytics', icon: '📊', label: 'Ecosystem Reach' },
              { id: 'settings', icon: '⚙️', label: 'Settings' }
            ] : activeWorkspace === 'node_lead' ? [
              { id: 'node-metrics', icon: '📊', label: 'Chapter Overview' },
              { id: 'node-roster', icon: '👥', label: 'Student Roster' },
              { id: 'node-treasury', icon: '🏛️', label: 'Treasury & Grants' },
              { id: 'settings', icon: '⚙️', label: 'Settings' }
            ] : activeWorkspace === 'partner' ? [
              { id: 'partner-analytics', icon: '📈', label: 'Org Analytics' },
              { id: 'partner-roster', icon: '👥', label: 'Sponsored Talent' },
              { id: 'partner-payouts', icon: '💳', label: 'Payout Statements' },
              { id: 'settings', icon: '⚙️', label: 'Settings' }
            ] : activeWorkspace === 'tutor' ? [
              { id: 'tutor-queue', icon: '✍️', label: 'Grading Queue' },
              { id: 'tutor-sessions', icon: '📅', label: 'Office Hours' },
              { id: 'settings', icon: '⚙️', label: 'Settings' }
            ] : activeWorkspace === 'admin' ? [
              { id: 'admin-iframe', icon: '⚡', label: 'Admin Panels' }
            ] : [
              { id: 'classroom', icon: '📚', label: 'Sofe Academy' },
              { id: 'business', icon: '💼', label: 'My Business' },
              { id: 'wallet', icon: '💰', label: 'Wallet' },
              { id: 'certificates', icon: '🎓', label: 'Certificate' },
              { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
              { id: 'settings', icon: '⚙️', label: 'Settings' }
            ]).map((tab) => {
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

            {activeWorkspace === 'learner' && (
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
        <main className="dash-content" style={{ flex: 1, padding: '2rem', overflowX: 'hidden' }}>
          {activeWorkspace !== 'admin' && (
            <>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
                      Welcome Back, <span style={{ color: '#FF8A00' }}>{fullName}</span>!
                    </h1>
                    {userData?.is_premium && <span style={{ background: 'linear-gradient(135deg, #FF8A00, #E07800)', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>Premium VIP</span>}
                    {userData?.account_type === 'protocol' && <span style={{ background: '#1428FF', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>Protocol Partner</span>}
                    {isNodeLead && <span style={{ background: '#10b981', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>Node Lead</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.4rem', fontSize: '0.78rem', color: 'rgba(200,215,240,0.7)' }}>
                    <span>{currentTier?.icon} {currentTier?.name} ({xpTotal.toLocaleString()} XP)</span>
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

                {/* Quick Stats Badges & Actions */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={handleDailyClaim}
                    disabled={claimedToday}
                    style={{
                      background: claimedToday ? 'rgba(0,200,100,0.12)' : 'linear-gradient(135deg, #FF8A00, #E07800)',
                      border: claimedToday ? '1px solid rgba(0,200,100,0.3)' : 'none',
                      color: claimedToday ? '#00c864' : '#fff',
                      borderRadius: 20,
                      padding: '0.4rem 1rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: claimedToday ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      boxShadow: claimedToday ? 'none' : '0 4px 15px rgba(255,138,0,0.3)'
                    }}
                  >
                    <span>{claimedToday ? '✓' : '⚡'}</span>
                    <span>{claimedToday ? `Streak: ${dailyStreak}d` : 'Claim +2 XP'}</span>
                  </button>

                  {userData?.referral_code && (
                    <button
                      onClick={handleCopyRef}
                      style={{
                        background: 'rgba(20,40,255,0.12)',
                        border: '1px solid rgba(20,40,255,0.3)',
                        color: '#6b8cff',
                        borderRadius: 20,
                        padding: '0.4rem 1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      {copyFeedback ? '✓ Copied!' : '🔗 Copy Ref Link'}
                    </button>
                  )}

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
          </>
          )}

          {activeTab === 'admin-iframe' && (
            <iframe
              src="/admin-dashboard-v2.html"
              style={{
                width: '100%',
                height: 'calc(100vh - 65px)',
                border: 'none',
                background: '#04080F',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
              title="Admin Console"
            />
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

              {/* ── AFFILIATE LEVELS (from design) ── */}
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  marginBottom: '1rem',
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}>
                  Affiliate Levels
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '1.25rem'
                }}>
                  {/* Level 1: Newbie */}
                  <div style={{
                    background: activeAffiliateLevel === 'newbie'
                      ? 'linear-gradient(135deg, rgba(255,138,0,0.08), rgba(20,40,255,0.05))'
                      : '#0D1526',
                    border: activeAffiliateLevel === 'newbie'
                      ? '2px solid #FF8A00'
                      : '1px solid rgba(200,215,240,0.15)',
                    borderRadius: 12,
                    padding: '1.5rem',
                    position: 'relative',
                    boxShadow: activeAffiliateLevel === 'newbie' ? '0 4px 20px rgba(255,138,0,0.15)' : 'none'
                  }}>
                    {activeAffiliateLevel === 'newbie' && (
                      <span style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'rgba(0,200,100,0.15)',
                        border: '1px solid rgba(0,200,100,0.3)',
                        color: '#00c864',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 4,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em'
                      }}>
                        ✓ Active
                      </span>
                    )}
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>
                      ⭐ Level 1 — Newbie
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FF8A00', lineHeight: 1 }}>
                      5%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)', marginTop: '0.25rem', marginBottom: '1rem' }}>
                      Direct referral
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'rgba(200,215,240,0.8)', lineHeight: 1.6 }}>
                      Everyone starts here. You earn 5% commission on every successful referral — but you must <strong style={{ color: '#FF8A00' }}>complete the Foundation Course</strong> to receive payouts.
                    </p>
                  </div>

                  {/* Level 2: Affiliate */}
                  <div style={{
                    background: activeAffiliateLevel === 'affiliate'
                      ? 'linear-gradient(135deg, rgba(255,138,0,0.08), rgba(20,40,255,0.05))'
                      : '#0D1526',
                    border: activeAffiliateLevel === 'affiliate'
                      ? '2px solid #FF8A00'
                      : '1px solid rgba(200,215,240,0.15)',
                    borderRadius: 12,
                    padding: '1.5rem',
                    position: 'relative',
                    boxShadow: activeAffiliateLevel === 'affiliate' ? '0 4px 20px rgba(255,138,0,0.15)' : 'none'
                  }}>
                    {activeAffiliateLevel === 'affiliate' && (
                      <span style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'rgba(0,200,100,0.15)',
                        border: '1px solid rgba(0,200,100,0.3)',
                        color: '#00c864',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 4,
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '0.04em'
                      }}>
                        ✓ Active
                      </span>
                    )}
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>
                      🎯 Level 2 — Affiliate
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FF8A00', lineHeight: 1 }}>
                      10%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)', marginTop: '0.25rem', marginBottom: '1rem' }}>
                      Direct referral
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'rgba(200,215,240,0.8)', lineHeight: 1.6 }}>
                      Refer <strong>10 people</strong> who complete the Foundation Course <strong>and</strong> enrol in at least one Career Track course. Commission rate doubles automatically once the milestone is reached. <strong style={{ color: '#FF8A00' }}>({qualifiedCount}/10 qualified)</strong>
                    </p>
                  </div>

                  {/* Level 3: Ambassador */}
                  <div style={{
                    background: activeAffiliateLevel === 'ambassador'
                      ? 'linear-gradient(135deg, rgba(255,138,0,0.08), rgba(20,40,255,0.05))'
                      : '#0D1526',
                    border: activeAffiliateLevel === 'ambassador'
                      ? '2px solid #FF8A00'
                      : '1px solid rgba(200,215,240,0.15)',
                    borderRadius: 12,
                    padding: '1.5rem',
                    position: 'relative',
                    opacity: activeAffiliateLevel === 'ambassador' ? 1 : 0.65,
                    boxShadow: activeAffiliateLevel === 'ambassador' ? '0 4px 20px rgba(255,138,0,0.15)' : 'none'
                  }}>
                    <span style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: activeAffiliateLevel === 'ambassador' ? 'rgba(0,200,100,0.15)' : 'rgba(200,215,240,0.08)',
                      border: activeAffiliateLevel === 'ambassador' ? '1px solid rgba(0,200,100,0.3)' : '1px solid rgba(200,215,240,0.15)',
                      color: activeAffiliateLevel === 'ambassador' ? '#00c864' : 'rgba(200,215,240,0.6)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 4,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      letterSpacing: '0.04em'
                    }}>
                      {activeAffiliateLevel === 'ambassador' ? '✓ Active' : '🔒 Locked'}
                    </span>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>
                      🏆 Level 3 — Ambassador
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FF8A00', lineHeight: 1 }}>
                      10% + 5%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)', marginTop: '0.25rem', marginBottom: '1rem' }}>
                      Direct + indirect
                    </div>
                    <p style={{ fontSize: '0.76rem', color: 'rgba(200,215,240,0.8)', lineHeight: 1.6 }}>
                      For exceptional Sofians, Node Heads, and long-term contributors. <strong>By invitation only</strong> — activated by the Sofe Node team. Earn 10% on direct referrals and 5% on indirect (your referrals&apos; referrals).
                    </p>
                  </div>
                </div>
              </div>

              {/* Commission Structure Explanation */}
              <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.18)', borderRadius: 10, padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.8rem' }}>How 2-Tier Commissions Work</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', fontSize: '0.76rem', color: 'rgba(200,215,240,0.8)' }}>
                  <div style={{ padding: '0.8rem', background: 'rgba(20,40,255,0.06)', borderRadius: 6, border: '1px solid rgba(20,40,255,0.15)' }}>
                    <strong style={{ color: '#fff' }}>Direct Commissions</strong>
                    <p style={{ marginTop: '0.3rem' }}>
                      Earn 5% (Newbie) or 10% (Affiliate / Ambassador) on the net amount paid by anyone who signs up directly using your referral link.
                    </p>
                  </div>
                  <div style={{ padding: '0.8rem', background: 'rgba(255,138,0,0.06)', borderRadius: 6, border: '1px solid rgba(255,138,0,0.15)' }}>
                    <strong style={{ color: '#fff' }}>Indirect Network Override (Ambassadors)</strong>
                    <p style={{ marginTop: '0.3rem' }}>
                      Ambassadors and Node Leads earn a 5% override on the net paid fees when their referrals refer other paying students.
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
          {/* ═══════════════════════════════════════════ */}
          {/* ── WORKSPACE PANELS: PROTOCOL CONSOLE ── */}
          {/* ═══════════════════════════════════════════ */}

          {/* PROTOCOL TAB 1: ACTIVE BOUNTIES */}
          {activeTab === 'protocol-bounties' && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#1428FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🌐 Protocol Talent Operations
                  </div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>Protocol Bounties Console</h2>
                  <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.78rem' }}>
                    Deploy Web3 bounties, fund developer challenges, and source verified talent across Sofe Node chapters.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateBountyModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #1428FF, #0014C8)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 8,
                    padding: '0.65rem 1.4rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(20,40,255,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>+</span> Create New Bounty
                </button>
              </div>

              {/* Protocol Metrics Strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.2rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 600 }}>Total Bounties</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>{protocolBounties.length}</div>
                </div>
                <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.2rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 600 }}>Active / Open</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00c864', marginTop: '0.3rem' }}>
                    {protocolBounties.filter((b) => b.status === 'open').length}
                  </div>
                </div>
                <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.2rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 600 }}>Total Applicants</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFB800', marginTop: '0.3rem' }}>{protocolApplicants.length}</div>
                </div>
                <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.2rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 600 }}>Capital Deployed</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#7096FF', marginTop: '0.3rem' }}>
                    ${protocolBounties.reduce((sum, b) => sum + (Number(b.reward_usd) || 0), 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Bounties Listing */}
              <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 12, padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid rgba(200,215,240,0.1)', paddingBottom: '0.6rem' }}>
                  Protocol Bounties Pool
                </h3>

                {protocolLoading ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(200,215,240,0.6)' }}>
                    Loading bounties...
                  </div>
                ) : protocolBounties.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#080E1A', borderRadius: 8 }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>No Active Bounties Published Yet</div>
                    <p style={{ color: 'rgba(200,215,240,0.6)', fontSize: '0.78rem', maxWidth: 450, margin: '0 auto 1.25rem' }}>
                      Publish a bounty to tap into hundreds of certified smart contract developers, frontend builders, and technical researchers.
                    </p>
                    <button
                      onClick={() => setShowCreateBountyModal(true)}
                      style={{
                        background: 'linear-gradient(135deg, #FF8A00, #E07800)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: 6,
                        padding: '0.55rem 1.2rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Create First Bounty
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                    {protocolBounties.map((b) => (
                      <div key={b.id} style={{ background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 10, padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{
                              background: b.category === 'dev' ? 'rgba(20,40,255,0.25)' : 'rgba(255,138,0,0.2)',
                              color: b.category === 'dev' ? '#7096FF' : '#FFB800',
                              border: `1px solid ${b.category === 'dev' ? 'rgba(20,40,255,0.5)' : 'rgba(255,138,0,0.5)'}`,
                              borderRadius: 4,
                              padding: '0.15rem 0.5rem',
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              textTransform: 'uppercase'
                            }}>
                              {b.category || 'General'}
                            </span>
                            <span style={{ fontSize: '0.74rem', color: b.status === 'open' ? '#00c864' : '#FFB800', fontWeight: 700 }}>
                              ● {b.status?.toUpperCase() || 'OPEN'}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>{b.title}</h4>
                          <p style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.7)', lineHeight: 1.4, marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {b.description || 'No description provided.'}
                          </p>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(200,215,240,0.08)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.62rem', color: 'rgba(200,215,240,0.5)', textTransform: 'uppercase' }}>Reward</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#00c864' }}>
                              ${(Number(b.reward_usd) || 0).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab('protocol-review')}
                            style={{
                              background: 'rgba(20,40,255,0.18)',
                              border: '1px solid rgba(20,40,255,0.35)',
                              color: '#fff',
                              borderRadius: 6,
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Review ({protocolApplicants.filter((a) => a.bounty_id === b.id).length})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* PROTOCOL TAB 2: REVIEW TALENT APPLICANTS */}
          {activeTab === 'protocol-review' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#1428FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Talent Submissions & Milestone Review
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>Review Developer Deliverables</h2>
                <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.78rem' }}>
                  Inspect submissions, test code implementations, and approve reward disbursements.
                </p>
              </div>

              <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 12, padding: '1.5rem' }}>
                {protocolApplicants.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(200,215,240,0.6)' }}>
                    No applicant deliverables pending review at this time.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {protocolApplicants.map((app, idx) => (
                      <div key={app.id || idx} style={{ background: '#080E1A', border: '1px solid rgba(20,40,255,0.18)', borderRadius: 8, padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{app.applicant_name || app.applicant_email || 'Verified Sofian Builder'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)', marginTop: '0.2rem' }}>
                            Applied for: <strong>{app.bounty_title || 'Web3 Engineering Bounty'}</strong>
                          </div>
                          {app.repo_url && (
                            <a href={app.repo_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#7096FF', textDecoration: 'underline', marginTop: '0.25rem', display: 'inline-block' }}>
                              🔗 View GitHub / Deliverable
                            </a>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '0.72rem', background: 'rgba(255,138,0,0.15)', color: '#FFB800', border: '1px solid rgba(255,138,0,0.3)', borderRadius: 4, padding: '0.25rem 0.55rem', fontWeight: 600 }}>
                            {app.status || 'Under Review'}
                          </span>
                          <button
                            onClick={() => {
                              alert(`Deliverable for ${app.applicant_name || 'applicant'} approved! Reward disbursed.`);
                            }}
                            style={{ background: '#10b981', border: 'none', color: '#fff', borderRadius: 6, padding: '0.35rem 0.8rem', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            ✓ Approve
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* PROTOCOL TAB 3: ECOSYSTEM ANALYTICS */}
          {activeTab === 'protocol-analytics' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#1428FF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ecosystem Growth & Impact
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>Protocol Ecosystem Reach</h2>
                <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.78rem' }}>
                  Track adoption metrics, developer talent pipeline conversion, and grant efficiency across 50+ African university nodes.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 12, padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.6rem' }}>Regional Developer Footprint</h4>
                  <p style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.7)', marginBottom: '1rem' }}>Active applicants across key African technical hubs:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.76rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🇳🇬 Nigeria (UNILAG, UNN, OAU, FUTA)</span>
                      <strong style={{ color: '#00c864' }}>68%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🇰🇪 Kenya (UoN, Strathmore)</span>
                      <strong style={{ color: '#7096FF' }}>18%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🇬🇭 Ghana (UG Legon, KNUST)</span>
                      <strong style={{ color: '#FFB800' }}>10%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🌍 Other African Chapters</span>
                      <strong style={{ color: '#aaa' }}>4%</strong>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 12, padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.6rem' }}>Completion Velocity</h4>
                  <p style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.7)', marginBottom: '1rem' }}>Average deliverable lifecycle on Sofe Node:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.76rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Average Time to First Submission:</span>
                      <strong style={{ color: '#FFB800' }}>4.2 Days</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Acceptance & Pass Rate:</span>
                      <strong style={{ color: '#00c864' }}>92.4%</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Community Bounty Retention:</span>
                      <strong style={{ color: '#7096FF' }}>84.1%</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* ── WORKSPACE PANELS: NODE COMMAND ── */}
          {/* ═══════════════════════════════════════════ */}

          {/* NODE TAB 1: CHAPTER METRICS */}
          {activeTab === 'node-metrics' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#FF8A00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🌐 Campus Node Command
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>
                  Chapter Overview: <span style={{ color: '#FF8A00' }}>{myChapter?.name || userData?.node_label || 'Campus Node'}</span>
                </h2>
                <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.78rem' }}>
                  Real-time activity, builder progress, and upcoming campus meetups.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                <div style={{ background: '#0D1526', border: '1px solid rgba(255,138,0,0.25)', borderRadius: 10, padding: '1.2rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 600 }}>Node Students</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>{nodeStudents.length}</div>
                </div>
                <div style={{ background: '#0D1526', border: '1px solid rgba(255,138,0,0.25)', borderRadius: 10, padding: '1.2rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 600 }}>Foundation Certified</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00c864', marginTop: '0.3rem' }}>
                    {nodeStudents.filter((s) => s.foundation_complete).length}
                  </div>
                </div>
                <div style={{ background: '#0D1526', border: '1px solid rgba(255,138,0,0.25)', borderRadius: 10, padding: '1.2rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 600 }}>Chapter Treasury</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFB800', marginTop: '0.3rem' }}>
                    ₦{nodeTreasuryBalance.toLocaleString('en-NG')}
                  </div>
                </div>
              </div>

              <div style={{ background: '#0D1526', border: '1px solid rgba(255,138,0,0.25)', borderRadius: 12, padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem' }}>Next Campus Node Meetup</h3>
                <div style={{ background: '#080E1A', border: '1px solid rgba(200,215,240,0.1)', borderRadius: 8, padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Bi-Weekly Web3 Workshop & Hack Session</div>
                    <div style={{ fontSize: '0.76rem', color: 'rgba(200,215,240,0.7)', marginTop: '0.2rem' }}>
                      📍 Campus Innovation Hub • Saturday, 10:00 AM - 1:00 PM
                    </div>
                  </div>
                  <button
                    onClick={() => alert('Meetup details and RSVP link copied!')}
                    style={{ background: 'rgba(255,138,0,0.15)', border: '1px solid #FF8A00', color: '#FFB800', borderRadius: 6, padding: '0.45rem 1rem', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Share RSVP Link
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* NODE TAB 2: STUDENT ROSTER */}
          {activeTab === 'node-roster' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#FF8A00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Chapter Directory
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>Chapter Student Roster</h2>
                <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.78rem' }}>
                  Track student enrolment, learning velocity, and milestone progress.
                </p>
              </div>

              <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 12, padding: '1.25rem', overflowX: 'auto' }}>
                {nodeStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(200,215,240,0.6)' }}>
                    No students currently mapped to this chapter.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(200,215,240,0.1)', textAlign: 'left', color: 'rgba(200,215,240,0.6)' }}>
                        <th style={{ padding: '0.65rem' }}>Student</th>
                        <th style={{ padding: '0.65rem' }}>Email</th>
                        <th style={{ padding: '0.65rem' }}>Status</th>
                        <th style={{ padding: '0.65rem' }}>Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nodeStudents.map((st, i) => (
                        <tr key={st.id || i} style={{ borderBottom: '1px solid rgba(200,215,240,0.06)' }}>
                          <td style={{ padding: '0.65rem', fontWeight: 600 }}>{`${st.first_name || ''} ${st.last_name || ''}`.trim() || 'Sofian Student'}</td>
                          <td style={{ padding: '0.65rem', color: 'rgba(200,215,240,0.7)' }}>{st.email || '—'}</td>
                          <td style={{ padding: '0.65rem' }}>
                            <span style={{
                              background: st.foundation_complete ? 'rgba(0,200,100,0.15)' : 'rgba(255,138,0,0.15)',
                              color: st.foundation_complete ? '#00c864' : '#FFB800',
                              border: `1px solid ${st.foundation_complete ? 'rgba(0,200,100,0.3)' : 'rgba(255,138,0,0.3)'}`,
                              borderRadius: 4,
                              padding: '0.15rem 0.5rem',
                              fontSize: '0.66rem',
                              fontWeight: 700
                            }}>
                              {st.foundation_complete ? '✓ Certified' : 'Learning'}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem', color: '#7096FF' }}>{st.xp_total || 0} XP</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* NODE TAB 3: CHAPTER TREASURY */}
          {activeTab === 'node-treasury' && (
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#FF8A00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Financial Management
                  </div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>Chapter Treasury & Grants</h2>
                  <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.78rem' }}>
                    Request chapter operational budgets, venue rentals, and event disbursements.
                  </p>
                </div>
                <button
                  onClick={() => setShowNodeDisbModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #FF8A00, #E07800)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '0.65rem 1.4rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(255,138,0,0.35)'
                  }}
                >
                  + Request Node Grant
                </button>
              </div>

              <div style={{ background: '#0D1526', border: '1px solid rgba(255,138,0,0.25)', borderRadius: 12, padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 600 }}>Available Treasury Balance</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#00c864', marginTop: '0.4rem' }}>
                  ₦{nodeTreasuryBalance.toLocaleString('en-NG')}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.7)', marginTop: '0.3rem' }}>
                  Allocated by Sofe Core Council for {myChapter?.name || userData?.node_label || 'Campus Node'} activities.
                </div>
              </div>

              <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 12, padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem', borderBottom: '1px solid rgba(200,215,240,0.1)', paddingBottom: '0.5rem' }}>
                  Disbursement Requests History
                </h3>
                {nodeDisbursements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(200,215,240,0.5)', fontSize: '0.78rem' }}>
                    No disbursement requests filed yet.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {nodeDisbursements.map((d, idx) => (
                      <div key={d.id || idx} style={{ background: '#080E1A', border: '1px solid rgba(200,215,240,0.08)', borderRadius: 8, padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{d.purpose || 'Chapter Grant'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)' }}>To: {d.bank_name} ({d.account_number})</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: '#00c864', fontSize: '0.9rem' }}>₦{(Number(d.amount) || 0).toLocaleString('en-NG')}</div>
                          <span style={{ fontSize: '0.66rem', color: d.status === 'approved' ? '#00c864' : '#FFB800', fontWeight: 700 }}>
                            {d.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* ── WORKSPACE PANELS: PARTNER PORTAL ── */}
          {/* ═══════════════════════════════════════════ */}

          {/* PARTNER TAB 1: COHORT ANALYTICS */}
          {activeTab === 'partner-analytics' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#00c864', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🤝 Enterprise & Partner Operations
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>
                  Partner Cohort: <span style={{ color: '#00c864' }}>{userData?.organization_name || userData?.company_name || 'Organization Portal'}</span>
                </h2>
                <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.78rem' }}>
                  Monitor sponsored students, completion milestones, and institutional impact metrics.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
                <div style={{ background: '#0D1526', border: '1px solid rgba(0,200,100,0.25)', borderRadius: 10, padding: '1.2rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 600 }}>Sponsored Scholars</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>{partnerStudents.length}</div>
                </div>
                <div style={{ background: '#0D1526', border: '1px solid rgba(0,200,100,0.25)', borderRadius: 10, padding: '1.2rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 600 }}>Completion Rate</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00c864', marginTop: '0.3rem' }}>
                    {partnerStudents.length > 0 ? Math.round((partnerStudents.filter((s) => s.foundation_complete).length / partnerStudents.length) * 100) : 0}%
                  </div>
                </div>
                <div style={{ background: '#0D1526', border: '1px solid rgba(0,200,100,0.25)', borderRadius: 10, padding: '1.2rem' }}>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)', textTransform: 'uppercase', fontWeight: 600 }}>Career Placements</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFB800', marginTop: '0.3rem' }}>
                    {partnerStudents.filter((s) => s.career_enrolled).length}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* PARTNER TAB 2: SPONSORED ROSTER */}
          {activeTab === 'partner-roster' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#00c864', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Talent Cohort
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>Sponsored Learners Directory</h2>
              </div>
              <div style={{ background: '#0D1526', border: '1px solid rgba(0,200,100,0.25)', borderRadius: 12, padding: '1.25rem', overflowX: 'auto' }}>
                {partnerStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(200,215,240,0.6)' }}>
                    No students currently mapped under your organization's cohort.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(200,215,240,0.1)', textAlign: 'left', color: 'rgba(200,215,240,0.6)' }}>
                        <th style={{ padding: '0.65rem' }}>Scholar</th>
                        <th style={{ padding: '0.65rem' }}>Email</th>
                        <th style={{ padding: '0.65rem' }}>Foundation</th>
                        <th style={{ padding: '0.65rem' }}>Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerStudents.map((st, idx) => (
                        <tr key={st.id || idx} style={{ borderBottom: '1px solid rgba(200,215,240,0.06)' }}>
                          <td style={{ padding: '0.65rem', fontWeight: 600 }}>{`${st.first_name || ''} ${st.last_name || ''}`.trim() || 'Sponsored Scholar'}</td>
                          <td style={{ padding: '0.65rem', color: 'rgba(200,215,240,0.7)' }}>{st.email || '—'}</td>
                          <td style={{ padding: '0.65rem' }}>
                            <span style={{ color: st.foundation_complete ? '#00c864' : '#FFB800', fontWeight: 700 }}>
                              {st.foundation_complete ? '✓ Completed' : 'In Progress'}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem', color: '#7096FF' }}>{st.xp_total || 0} XP</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* PARTNER TAB 3: PAYOUT STATEMENTS */}
          {activeTab === 'partner-payouts' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#00c864', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Institutional Billing
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>Sponsorship Financial Statements</h2>
              </div>
              <div style={{ background: '#0D1526', border: '1px solid rgba(0,200,100,0.25)', borderRadius: 12, padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💳</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.3rem' }}>Institutional Grants Paid to Date</div>
                <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.78rem' }}>
                  All invoices and corporate CSR documentation are reconciled automatically upon milestone verification.
                </p>
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* ── WORKSPACE PANELS: TUTOR DESK ── */}
          {/* ═══════════════════════════════════════════ */}

          {/* TUTOR TAB 1: GRADING QUEUE */}
          {activeTab === 'tutor-queue' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#FF8A00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Academy Instruction
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>Assignment & Project Grading Queue</h2>
                <p style={{ color: 'rgba(200,215,240,0.7)', fontSize: '0.78rem' }}>
                  Review code deliverables, issue milestone badges, and guide learners.
                </p>
              </div>

              <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 12, padding: '1.25rem' }}>
                {tutorSubmissions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(200,215,240,0.6)' }}>
                    No student submissions waiting in queue.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {tutorSubmissions.map((sub, idx) => (
                      <div key={sub.id || idx} style={{ background: '#080E1A', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 8, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{sub.student_name || sub.user_email || 'Student Submission'}</div>
                          <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)', marginTop: '0.2rem' }}>
                            Course: <strong>{sub.course_id || 'Web3 Foundation'}</strong> • Task: {sub.task_id || 'Milestone Assessment'}
                          </div>
                          {sub.link && (
                            <a href={sub.link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#7096FF', textDecoration: 'underline', marginTop: '0.25rem', display: 'inline-block' }}>
                              🔗 View Student Submission Link
                            </a>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '0.72rem', color: sub.status === 'approved' ? '#00c864' : '#FFB800', fontWeight: 700 }}>
                            ● {sub.status?.toUpperCase() || 'PENDING'}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedSubForGrading(sub);
                              setShowGradingModal(true);
                            }}
                            style={{
                              background: '#1428FF',
                              border: 'none',
                              color: '#fff',
                              borderRadius: 6,
                              padding: '0.4rem 0.9rem',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Grade Deliverable
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* TUTOR TAB 2: OFFICE HOURS */}
          {activeTab === 'tutor-sessions' && (
            <section>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#FF8A00', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Mentorship Schedule
                </div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>Office Hours & Live Mentoring</h2>
              </div>
              <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 12, padding: '1.5rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'rgba(200,215,240,0.8)', marginBottom: '1rem' }}>
                  Your registered tutor mentoring slots for Sofe Academy students:
                </p>
                <div style={{ background: '#080E1A', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 8, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Weekly Smart Contract Q&A</div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)' }}>Wednesdays & Fridays • 4:00 PM - 6:00 PM WAT</div>
                  </div>
                  <button
                    onClick={() => alert('Live classroom link copied to clipboard!')}
                    style={{ background: 'rgba(20,40,255,0.2)', border: '1px solid #1428FF', color: '#7096FF', borderRadius: 6, padding: '0.4rem 0.8rem', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Open Live Room
                  </button>
                </div>
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
      {/* ── CREATE BOUNTY MODAL (PROTOCOL PORTAL) ── */}
      {showCreateBountyModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#0D1526',
            border: '1px solid rgba(20,40,255,0.4)',
            borderRadius: 12,
            padding: '1.75rem',
            width: '100%',
            maxWidth: 520,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Publish Protocol Bounty</h3>
              <button
                onClick={() => setShowCreateBountyModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'rgba(200,215,240,0.6)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'rgba(200,215,240,0.7)', marginBottom: '1.25rem' }}>
              Sofe builders across 50+ African university nodes will be alerted once published.
            </p>

            <form onSubmit={handleCreateProtocolBounty} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Bounty Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build an Escrow Smart Contract in Solidity"
                  value={createBountyForm.title}
                  onChange={(e) => setCreateBountyForm({ ...createBountyForm, title: e.target.value })}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.85rem', marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Category</label>
                  <select
                    value={createBountyForm.category}
                    onChange={(e) => setCreateBountyForm({ ...createBountyForm, category: e.target.value })}
                    style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                  >
                    <option value="dev">Smart Contract / Dev</option>
                    <option value="frontend">Frontend / DApp</option>
                    <option value="security">Security & Audit</option>
                    <option value="design">UI/UX Design</option>
                    <option value="content">Technical Writing</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Reward (USD) *</label>
                  <input
                    type="number"
                    required
                    min="50"
                    placeholder="e.g. 500"
                    value={createBountyForm.reward_usd}
                    onChange={(e) => setCreateBountyForm({ ...createBountyForm, reward_usd: e.target.value })}
                    style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.85rem', marginTop: 4 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Submission Deadline</label>
                <input
                  type="date"
                  value={createBountyForm.deadline}
                  onChange={(e) => setCreateBountyForm({ ...createBountyForm, deadline: e.target.value })}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Description & Objectives</label>
                <textarea
                  rows="3"
                  placeholder="Detail the scope of the deliverable..."
                  value={createBountyForm.description}
                  onChange={(e) => setCreateBountyForm({ ...createBountyForm, description: e.target.value })}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Requirements / Acceptance Criteria</label>
                <textarea
                  rows="2"
                  placeholder="e.g. GitHub repository with 100% test coverage and live testnet deployment"
                  value={createBountyForm.requirements}
                  onChange={(e) => setCreateBountyForm({ ...createBountyForm, requirements: e.target.value })}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateBountyModal(false)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid rgba(200,215,240,0.2)', color: 'rgba(200,215,240,0.7)', borderRadius: 6, padding: '0.65rem', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBountySubmitting}
                  style={{ flex: 1, background: '#1428FF', border: 'none', color: '#fff', borderRadius: 6, padding: '0.65rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {createBountySubmitting ? 'Deploying...' : 'Deploy Bounty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── NODE DISBURSEMENT REQUEST MODAL ── */}
      {showNodeDisbModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#0D1526',
            border: '1px solid rgba(255,138,0,0.4)',
            borderRadius: 12,
            padding: '1.75rem',
            width: '100%',
            maxWidth: 480
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem' }}>Request Chapter Grant</h3>
            <p style={{ fontSize: '0.76rem', color: 'rgba(200,215,240,0.7)', marginBottom: '1.25rem' }}>
              Available chapter balance: <strong>₦{nodeTreasuryBalance.toLocaleString('en-NG')}</strong>
            </p>

            <form onSubmit={handleNodeDisbSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Amount (NGN) *</label>
                <input
                  type="number"
                  required
                  min="5000"
                  max={nodeTreasuryBalance}
                  placeholder={`Max ₦${nodeTreasuryBalance.toLocaleString('en-NG')}`}
                  value={nodeDisbForm.amount}
                  onChange={(e) => setNodeDisbForm({ ...nodeDisbForm, amount: e.target.value })}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.85rem', marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Purpose / Event Logistics *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Venue sound system & refreshments for Saturday meetup"
                  value={nodeDisbForm.purpose}
                  onChange={(e) => setNodeDisbForm({ ...nodeDisbForm, purpose: e.target.value })}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Bank Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Access Bank"
                    value={nodeDisbForm.bankName}
                    onChange={(e) => setNodeDisbForm({ ...nodeDisbForm, bankName: e.target.value })}
                    style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Account Number</label>
                  <input
                    type="text"
                    required
                    placeholder="10-digit number"
                    value={nodeDisbForm.accountNumber}
                    onChange={(e) => setNodeDisbForm({ ...nodeDisbForm, accountNumber: e.target.value })}
                    style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="Account holder name"
                  value={nodeDisbForm.accountName}
                  onChange={(e) => setNodeDisbForm({ ...nodeDisbForm, accountName: e.target.value })}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowNodeDisbModal(false)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid rgba(200,215,240,0.2)', color: 'rgba(200,215,240,0.7)', borderRadius: 6, padding: '0.65rem', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={nodeDisbSubmitting}
                  style={{ flex: 1, background: '#FF8A00', border: 'none', color: '#fff', borderRadius: 6, padding: '0.65rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {nodeDisbSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── TUTOR GRADING MODAL ── */}
      {showGradingModal && selectedSubForGrading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: '#0D1526',
            border: '1px solid rgba(20,40,255,0.4)',
            borderRadius: 12,
            padding: '1.75rem',
            width: '100%',
            maxWidth: 480
          }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem' }}>Grade Student Assessment</h3>
            <p style={{ fontSize: '0.76rem', color: 'rgba(200,215,240,0.7)', marginBottom: '1.25rem' }}>
              Student: <strong>{selectedSubForGrading.student_name || selectedSubForGrading.user_email}</strong> • Task: <strong>{selectedSubForGrading.task_id || 'Milestone'}</strong>
            </p>

            <form onSubmit={handleGradeSubmission} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Outcome</label>
                  <select
                    value={gradePassed ? 'passed' : 'failed'}
                    onChange={(e) => setGradePassed(e.target.value === 'passed')}
                    style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                  >
                    <option value="passed">Approved / Pass</option>
                    <option value="failed">Needs Revision</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={gradeScore}
                    onChange={(e) => setGradeScore(e.target.value)}
                    style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.85rem', marginTop: 4 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Tutor Feedback / Notes</label>
                <textarea
                  rows="3"
                  placeholder="Provide constructive feedback to help the learner improve..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.6rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowGradingModal(false)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid rgba(200,215,240,0.2)', color: 'rgba(200,215,240,0.7)', borderRadius: 6, padding: '0.65rem', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gradingSubmitting}
                  style={{ flex: 1, background: '#10b981', border: 'none', color: '#fff', borderRadius: 6, padding: '0.65rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {gradingSubmitting ? 'Saving...' : 'Submit Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MOBILE FLOATING BOTTOM DOCK WITH TRACKING PILL ── */}
      <div className="dash-mobile-dock">
        {getDockItems().map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === 'leaderboard') loadLeaderboardData(lbTab);
              }}
              className={`dash-dock-item ${isActive ? 'active' : ''}`}
            >
              <span className="dash-dock-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
        {availableWorkspaces.length > 1 && (
          <button
            onClick={() => {
              const nextIdx = (availableWorkspaces.findIndex((w) => w.id === activeWorkspace) + 1) % availableWorkspaces.length;
              handleSwitchWorkspace(availableWorkspaces[nextIdx].id);
            }}
            className="dash-dock-item"
            title="Switch Workspace"
          >
            <span className="dash-dock-icon">🔄</span>
            <span>Switch</span>
          </button>
        )}
      </div>
    </div>
  );
}
