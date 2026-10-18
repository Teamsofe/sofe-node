'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit
} from '@/lib/firebase';

export default function AdminDashboardClient() {
  const router = useRouter();

  // Auth & RBAC State
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [activePanel, setActivePanel] = useState('overview');
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Overview Metrics
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    validatedUsers: 0,
    cbieApps: 0,
    coursesCount: 0,
    pendingDisbursements: 0,
    pendingSubmissions: 0
  });

  // Data Collections
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  const [cbieApps, setCbieApps] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [bounties, setBounties] = useState([]);

  // Modals & Active Edit Objects
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userRoleForm, setUserRoleForm] = useState({
    role: 'student',
    admin_role: '',
    account_type: 'sofian',
    is_premium: false,
    bypass_foundation: false,
    can_post_bounties: false,
    node_lead_for: ''
  });

  // Grading Modal
  const [selectedSub, setSelectedSub] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradeScore, setGradeScore] = useState(100);
  const [gradePassed, setGradePassed] = useState(true);
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [gradingSubmitting, setGradingSubmitting] = useState(false);

  // Feedback Toast
  const [toast, setToast] = useState(null);

  // Settings & Roles State
  const [settingsSubTab, setSettingsSubTab] = useState('roles');
  const [inviteAdminEmail, setInviteAdminEmail] = useState('');
  const [inviteAdminRole, setInviteAdminRole] = useState('tutor');
  const [platformSettings, setPlatformSettings] = useState({
    bank_name: 'GTBank',
    account_number: '0123456789',
    account_name: 'Sofe Group Limited',
    referral_commission: 5000,
    min_withdrawal: 10000,
    paystack_public_key: 'pk_test_xxxxxxxxxxxxxxxxxxxxx',
    cbie_price: 100000,
    default_scholarship: 50
  });

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/admin/login');
        return;
      }
      setAdminUser(user);

      // Verify RBAC privileges
      try {
        const uSnap = await getDoc(doc(db, 'users', user.uid));
        if (!uSnap.exists()) {
          router.replace('/admin/login');
          return;
        }
        const uData = uSnap.data();
        const isSuperAdminEmail = ['admin@sofenode.com', 'admin@sofegroup.com', 'superadmin@sofenode.com'].includes(user.email?.toLowerCase());
        const hasAccess =
          isSuperAdminEmail ||
          uData.role === 'admin' ||
          uData.role === 'tutor' ||
          !!uData.admin_role ||
          uData.role === 'node_lead';

        if (!hasAccess) {
          alert('Unauthorized: You do not have staff or administrator privileges.');
          await signOut(auth);
          router.replace('/admin/login');
          return;
        }

        setAdminProfile(isSuperAdminEmail ? { ...uData, role: 'admin', admin_role: 'super_admin' } : uData);
        await loadAllAdminData();
      } catch (e) {
        console.error('RBAC validation error:', e);
        router.replace('/admin/login');
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const loadAllAdminData = async () => {
    try {
      // 1. Users
      const uSnap = await getDocs(collection(db, 'users'));
      const uList = uSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(uList);

      // 2. Courses
      const cSnap = await getDocs(collection(db, 'courses'));
      const cList = cSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCourses(cList);

      // 3. Submissions (Assignments / Projects)
      const sSnap = await getDocs(query(collection(db, 'session_submissions'), orderBy('submitted_at', 'desc'), limit(50)));
      const sList = sSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSubmissions(sList);

      // 4. Disbursements (Withdrawals & Node Treasury)
      const dSnap = await getDocs(query(collection(db, 'disbursement_requests'), orderBy('created_at', 'desc'), limit(50)));
      const dList = dSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDisbursements(dList);

      // 5. CBIE Applications
      const appSnap = await getDocs(query(collection(db, 'applications'), orderBy('created_at', 'desc'), limit(50)));
      const aList = appSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCbieApps(aList);

      // 6. Chapters / Campus Nodes
      const chSnap = await getDocs(collection(db, 'chapters'));
      const chList = chSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setChapters(chList);

      // 7. Bounties
      const bSnap = await getDocs(collection(db, 'bounties'));
      const bList = bSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setBounties(bList);

      // 8. Platform Settings
      try {
        const setSnap = await getDoc(doc(db, 'settings', 'platform'));
        if (setSnap.exists()) {
          setPlatformSettings((prev) => ({ ...prev, ...setSnap.data() }));
        }
      } catch (err) {
        console.warn('Settings load notice:', err.message);
      }

      // Compute Overview Metrics
      const validated = uList.filter((u) => u.foundation_complete === true).length;
      const verified = uList.filter((u) => u.email_verified === true).length;
      const pendingD = dList.filter((d) => d.status === 'pending').length;
      const pendingS = sList.filter((s) => s.status === 'pending' || !s.reviewed_at).length;

      setMetrics({
        totalUsers: uList.length,
        verifiedUsers: verified,
        validatedUsers: validated,
        cbieApps: aList.length,
        coursesCount: cList.length,
        pendingDisbursements: pendingD,
        pendingSubmissions: pendingS
      });
    } catch (err) {
      console.error('Error loading admin dataset:', err);
    }
  };

  // Invite / Assign Admin Role by Email
  const handleInviteAdmin = async (e) => {
    e.preventDefault();
    if (!inviteAdminEmail.trim()) {
      showToast('Please enter a user email address', 'error');
      return;
    }
    const targetEmail = inviteAdminEmail.trim().toLowerCase();
    const foundUser = users.find((u) => u.email?.toLowerCase() === targetEmail);

    if (!foundUser) {
      showToast(`No Sofian found with email: ${targetEmail}. User must create an account first.`, 'error');
      return;
    }

    try {
      const primaryRole = (inviteAdminRole === 'tutor' || inviteAdminRole === 'node_lead') 
        ? inviteAdminRole 
        : 'admin';

      await updateDoc(doc(db, 'users', foundUser.id), {
        role: primaryRole,
        admin_role: inviteAdminRole,
        updated_at: serverTimestamp()
      });

      showToast(`Assigned ${inviteAdminRole.replace(/_/g, ' ').toUpperCase()} role to ${foundUser.email}!`, 'success');
      setInviteAdminEmail('');
      loadAllAdminData();
    } catch (err) {
      console.error('Error assigning admin role:', err);
      showToast(`Failed to assign role: ${err.message}`, 'error');
    }
  };

  // Save Platform Settings
  const handleSavePlatformSettings = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'platform'), {
        ...platformSettings,
        updated_at: serverTimestamp()
      }, { merge: true });
      showToast('Platform settings saved successfully!', 'success');
    } catch (err) {
      console.error('Error saving settings:', err);
      showToast(`Failed to save settings: ${err.message}`, 'error');
    }
  };

  // Open User Edit Modal
  const handleOpenUserModal = (u) => {
    setSelectedUser(u);
    setUserRoleForm({
      role: u.role || 'student',
      admin_role: u.admin_role || '',
      account_type: u.account_type || 'sofian',
      affiliate_tier: u.affiliate_tier || 'newbie',
      is_premium: !!u.is_premium,
      bypass_foundation: !!u.bypass_foundation,
      foundation_complete: !!u.foundation_complete,
      can_post_bounties: !!u.can_post_bounties,
      node_lead_for: u.node_lead_for || ''
    });
    setShowUserModal(true);
  };

  // Save User Role Updates
  const handleSaveUserRole = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        role: userRoleForm.role,
        admin_role: userRoleForm.admin_role || null,
        account_type: userRoleForm.account_type,
        affiliate_tier: userRoleForm.affiliate_tier,
        is_premium: userRoleForm.is_premium,
        bypass_foundation: userRoleForm.bypass_foundation,
        foundation_complete: userRoleForm.foundation_complete,
        can_post_bounties: userRoleForm.can_post_bounties,
        node_lead_for: userRoleForm.node_lead_for || null,
        updated_at: serverTimestamp()
      });

      showToast(`User ${selectedUser.email} updated successfully!`, 'success');
      setShowUserModal(false);
      loadAllAdminData();
    } catch (err) {
      showToast('Error updating user: ' + err.message, 'error');
    }
  };

  // Open Grading Modal
  const handleOpenGrading = (sub) => {
    setSelectedSub(sub);
    setGradeScore(sub.score || 100);
    setGradePassed(sub.passed !== undefined ? sub.passed : true);
    setGradeFeedback(sub.feedback || '');
    setShowGradingModal(true);
  };

  // Submit Grading
  const handleSubmitGrading = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;
    setGradingSubmitting(true);
    try {
      await updateDoc(doc(db, 'session_submissions', selectedSub.id), {
        status: gradePassed ? 'approved' : 'rejected',
        passed: gradePassed,
        score: Number(gradeScore),
        feedback: gradeFeedback,
        reviewed_by: adminUser.email,
        reviewed_at: serverTimestamp(),
        graded_by: adminUser.email,
        graded_at: serverTimestamp()
      });

      showToast('Submission graded and saved!', 'success');
      setShowGradingModal(false);
      loadAllAdminData();
    } catch (err) {
      showToast('Error saving grade: ' + err.message, 'error');
    } finally {
      setGradingSubmitting(false);
    }
  };

  // Approve / Reject Disbursement Request
  const handleResolveDisbursement = async (reqId, newStatus) => {
    const notes = prompt(`Enter resolution notes for this ${newStatus} request:`, 'Bank transfer completed.');
    if (notes === null) return;

    try {
      await updateDoc(doc(db, 'disbursement_requests', reqId), {
        status: newStatus,
        resolved_by: adminUser.email,
        resolved_at: serverTimestamp(),
        notes: notes
      });

      showToast(`Disbursement request marked as ${newStatus}!`, 'success');
      loadAllAdminData();
    } catch (err) {
      showToast('Error updating disbursement: ' + err.message, 'error');
    }
  };

  // Approve / Reject Bounty
  const handleUpdateBountyStatus = async (bountyId, status) => {
    try {
      await updateDoc(doc(db, 'bounties', bountyId), {
        status: status,
        updated_at: serverTimestamp()
      });
      showToast(`Bounty status updated to ${status}!`, 'success');
      loadAllAdminData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace('/admin/login');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#04080F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1.5s infinite linear' }}>⚙️</div>
          <p style={{ color: 'rgba(200,215,240,0.6)' }}>Authenticating Admin Session...</p>
        </div>
      </div>
    );
  }

  const roleTitle = adminProfile?.admin_role
    ? adminProfile.admin_role.replace(/_/g, ' ').toUpperCase()
    : (adminProfile?.role || 'ADMIN').toUpperCase();

  const formatRoleBadge = (role, adminRole) => {
    if (adminRole) return adminRole.replace(/_/g, ' ').toUpperCase();
    return (role || 'STUDENT').replace(/_/g, ' ').toUpperCase();
  };

  return (
    <div className="admin-root-wrapper" style={{ minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      <link rel="stylesheet" href="/css/admin-dashboard-v2.css" />

      {/* TOAST MESSAGE */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: toast.type === 'error' ? 'rgba(255,80,80,0.95)' : toast.type === 'success' ? '#10b981' : '#1428FF',
          color: '#fff',
          borderRadius: 8,
          padding: '0.75rem 1.4rem',
          fontSize: '0.82rem',
          fontWeight: 700,
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
        }}>
          {toast.msg}
        </div>
      )}

      {/* ADMIN SHELL */}
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* SIDEBAR */}
        <aside className="admin-sidebar" style={{
          width: sidebarExpanded ? 240 : 70,
          background: '#080E1A',
          borderRight: '1px solid rgba(20,40,255,0.18)',
          padding: '1.25rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'width 0.2s'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem 0.6rem', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '1.3rem', color: '#1428FF' }}>⬡</span>
              {sidebarExpanded && (
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>SOFE ADMIN</div>
                  <div style={{ fontSize: '0.62rem', color: '#FF8A00', fontWeight: 700 }}>{roleTitle}</div>
                </div>
              )}
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {[
                { id: 'overview', icon: '📊', label: 'Overview' },
                { id: 'grading', icon: '📝', label: `Grading (${metrics.pendingSubmissions})` },
                { id: 'users', icon: '👥', label: 'Sofians & Roles' },
                { id: 'courses', icon: '📚', label: 'Courses & Modules' },
                { id: 'nodes', icon: '🏛', label: 'Campus Nodes' },
                { id: 'disbursements', icon: '💰', label: `Disbursements (${metrics.pendingDisbursements})` },
                { id: 'cbie', icon: '🎓', label: `CBIE Apps (${metrics.cbieApps})` },
                { id: 'bounties', icon: '🎯', label: 'Bounties' },
                { id: 'settings', icon: '⚙️', label: 'Settings & Roles' }
              ].map((item) => {
                const isActive = activePanel === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePanel(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.6rem 0.8rem',
                      borderRadius: 6,
                      border: 'none',
                      background: isActive ? 'rgba(20,40,255,0.2)' : 'transparent',
                      color: isActive ? '#fff' : 'rgba(200,215,240,0.65)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{item.icon}</span>
                    {sidebarExpanded && <span>{item.label}</span>}
                  </button>
                );
              })}
            </nav>
          </div>

          <div>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.8rem',
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: 'rgba(255,100,100,0.8)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <span>↩</span>
              {sidebarExpanded && <span>Logout</span>}
            </button>
          </div>
        </aside>

        {/* MAIN WORKSPACE */}
        <main style={{ flex: 1, padding: '2rem', overflowX: 'hidden' }}>
          {/* HEADER STRIP */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                {activePanel.toUpperCase()} CONTROL PANEL
              </h1>
              <p style={{ color: 'rgba(200,215,240,0.6)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                Signed in as: <strong>{adminProfile?.email}</strong> ({roleTitle})
              </p>
            </div>

            <button
              onClick={loadAllAdminData}
              style={{
                background: 'rgba(20,40,255,0.15)',
                border: '1px solid rgba(20,40,255,0.3)',
                color: '#6b8cff',
                borderRadius: 6,
                padding: '0.45rem 1rem',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ↻ Refresh Data
            </button>
          </div>

          {/* PANEL 1: OVERVIEW */}
          {activePanel === 'overview' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(200,215,240,0.6)' }}>Total Users</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>{metrics.totalUsers}</div>
                </div>

                <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(200,215,240,0.6)' }}>Validated Sofians (Foundation Done)</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '0.3rem' }}>{metrics.validatedUsers}</div>
                </div>

                <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(200,215,240,0.6)' }}>Pending Live Submissions</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FF8A00', marginTop: '0.3rem' }}>{metrics.pendingSubmissions}</div>
                </div>

                <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(200,215,240,0.6)' }}>Pending Disbursements</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#6b8cff', marginTop: '0.3rem' }}>{metrics.pendingDisbursements}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem' }}>Staff Action Center</h3>
                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setActivePanel('grading')}
                    style={{ background: '#1428FF', border: 'none', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Grade Assignments ({metrics.pendingSubmissions} pending) →
                  </button>
                  <button
                    onClick={() => setActivePanel('disbursements')}
                    style={{ background: '#10b981', border: 'none', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Review Disbursements ({metrics.pendingDisbursements} pending) →
                  </button>
                  <button
                    onClick={() => setActivePanel('users')}
                    style={{ background: '#FF8A00', border: 'none', color: '#000', padding: '0.6rem 1.2rem', borderRadius: 6, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Manage Sofian Roles & VIPs →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PANEL 2: LIVE ASSIGNMENT GRADING */}
          {activePanel === 'grading' && (
            <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Live Assignment & Project Submissions</h3>
                <span style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)' }}>Grading permissions: Super Admin, Course Manager, Tutor</span>
              </div>

              {submissions.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '3rem', color: 'rgba(200,215,240,0.5)', fontSize: '0.8rem' }}>No student submissions found.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(200,215,240,0.1)', textAlign: 'left', color: 'rgba(200,215,240,0.6)' }}>
                        <th style={{ padding: '0.6rem' }}>Type</th>
                        <th style={{ padding: '0.6rem' }}>Student UID</th>
                        <th style={{ padding: '0.6rem' }}>Session ID</th>
                        <th style={{ padding: '0.6rem' }}>Submission Link</th>
                        <th style={{ padding: '0.6rem' }}>Status</th>
                        <th style={{ padding: '0.6rem', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => {
                        const isPending = sub.status === 'pending' || !sub.reviewed_at;
                        return (
                          <tr key={sub.id} style={{ borderBottom: '1px solid rgba(200,215,240,0.06)' }}>
                            <td style={{ padding: '0.6rem' }}>
                              <span style={{
                                background: sub.type === 'assignment' ? 'rgba(20,40,255,0.15)' : 'rgba(255,138,0,0.15)',
                                color: sub.type === 'assignment' ? '#6b8cff' : '#FF8A00',
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontSize: '0.68rem',
                                fontWeight: 600
                              }}>
                                {sub.type?.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '0.6rem' }}>{sub.user_id?.slice(0, 10)}...</td>
                            <td style={{ padding: '0.6rem' }}>{sub.session_id}</td>
                            <td style={{ padding: '0.6rem' }}>
                              {sub.submission_url ? (
                                <a href={sub.submission_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1428FF', textDecoration: 'underline' }}>
                                  View Link ↗
                                </a>
                              ) : (
                                'No link'
                              )}
                            </td>
                            <td style={{ padding: '0.6rem' }}>
                              <span style={{
                                color: sub.passed ? '#00c864' : isPending ? '#FF8A00' : '#ff5555',
                                fontWeight: 700
                              }}>
                                {sub.passed ? `✓ Passed (${sub.score}%)` : isPending ? '⏳ Pending' : '✕ Failed'}
                              </span>
                            </td>
                            <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                              <button
                                onClick={() => handleOpenGrading(sub)}
                                style={{
                                  background: '#1428FF',
                                  border: 'none',
                                  color: '#fff',
                                  padding: '0.35rem 0.8rem',
                                  borderRadius: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                Grade / Review
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PANEL 3: USERS & RBAC ROLES */}
          {activePanel === 'users' && (
            <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Sofians & Role Delegation</h3>
                <span style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)' }}>Total: {users.length} registered accounts</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(200,215,240,0.1)', textAlign: 'left', color: 'rgba(200,215,240,0.6)' }}>
                      <th style={{ padding: '0.6rem' }}>Sofian</th>
                      <th style={{ padding: '0.6rem' }}>Email</th>
                      <th style={{ padding: '0.6rem' }}>Role</th>
                      <th style={{ padding: '0.6rem' }}>VIP / Premium</th>
                      <th style={{ padding: '0.6rem' }}>Node / Campus</th>
                      <th style={{ padding: '0.6rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Sofian';
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(200,215,240,0.06)' }}>
                          <td style={{ padding: '0.6rem', fontWeight: 600 }}>{name}</td>
                          <td style={{ padding: '0.6rem', color: 'rgba(200,215,240,0.7)' }}>{u.email}</td>
                          <td style={{ padding: '0.6rem' }}>
                            <span style={{
                              background: u.admin_role ? 'rgba(255,138,0,0.2)' : 'rgba(20,40,255,0.15)',
                              color: u.admin_role ? '#FF8A00' : '#6b8cff',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: '0.68rem',
                              fontWeight: 700
                            }}>
                              {u.admin_role || u.role || 'student'}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem' }}>
                            {u.is_premium ? (
                              <span style={{ color: '#FFB800', fontWeight: 700 }}>💎 $100 VIP</span>
                            ) : (
                              <span style={{ color: 'rgba(200,215,240,0.4)' }}>Standard</span>
                            )}
                          </td>
                          <td style={{ padding: '0.6rem' }}>{u.node_label || u.chapter_id || '—'}</td>
                          <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                            <button
                              onClick={() => handleOpenUserModal(u)}
                              style={{
                                background: 'rgba(20,40,255,0.2)',
                                border: '1px solid rgba(20,40,255,0.4)',
                                color: '#fff',
                                padding: '0.35rem 0.8rem',
                                borderRadius: 4,
                                fontSize: '0.72rem',
                                cursor: 'pointer'
                              }}
                            >
                              Edit Roles →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PANEL: COURSES & MODULES */}
          {activePanel === 'courses' && (
            <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Curriculum & Course Management</h3>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)' }}>
                    Permissions: Super Admin, Course Manager, Admin (Tutors can preview)
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const title = prompt('Enter Course Title:');
                    if (!title) return;
                    const slug = prompt('Enter Course URL Slug (e.g. solana-dev):', title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    if (!slug) return;
                    const desc = prompt('Enter Short Description:', 'Master advanced decentralized engineering.');
                    try {
                      await setDoc(doc(db, 'courses', slug), {
                        title,
                        slug,
                        description: desc || '',
                        status: 'draft',
                        display_order: courses.length + 1,
                        is_foundation: false,
                        created_at: serverTimestamp()
                      });
                      showToast(`Course "${title}" created as Draft!`, 'success');
                      loadAllAdminData();
                    } catch (err) {
                      showToast(`Error creating course: ${err.message}`, 'error');
                    }
                  }}
                  style={{ background: '#1428FF', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Add New Course
                </button>
              </div>

              {courses.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '3rem', color: 'rgba(200,215,240,0.5)', fontSize: '0.8rem' }}>No courses in database.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(200,215,240,0.1)', textAlign: 'left', color: 'rgba(200,215,240,0.6)' }}>
                        <th style={{ padding: '0.6rem' }}>Course Title</th>
                        <th style={{ padding: '0.6rem' }}>Slug / ID</th>
                        <th style={{ padding: '0.6rem' }}>Type</th>
                        <th style={{ padding: '0.6rem' }}>Status</th>
                        <th style={{ padding: '0.6rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((c) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(200,215,240,0.06)' }}>
                          <td style={{ padding: '0.6rem', fontWeight: 600 }}>{c.title || c.id}</td>
                          <td style={{ padding: '0.6rem', color: 'rgba(200,215,240,0.6)' }}><code>{c.slug || c.id}</code></td>
                          <td style={{ padding: '0.6rem' }}>
                            <span style={{
                              background: c.is_foundation ? 'rgba(255,138,0,0.15)' : 'rgba(20,40,255,0.15)',
                              color: c.is_foundation ? '#FF8A00' : '#6b8cff',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: '0.68rem',
                              fontWeight: 700
                            }}>
                              {c.is_foundation ? 'Foundation' : 'Specialization'}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem' }}>
                            <span style={{
                              color: c.status === 'published' ? '#10b981' : '#FF8A00',
                              fontWeight: 700
                            }}>
                              {c.status?.toUpperCase() || 'PUBLISHED'}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              <Link
                                href={`/course-view?course=${c.slug || c.id}`}
                                target="_blank"
                                style={{
                                  background: 'rgba(20,40,255,0.15)',
                                  border: '1px solid rgba(20,40,255,0.3)',
                                  color: '#6b8cff',
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: 4,
                                  textDecoration: 'none',
                                  fontSize: '0.7rem',
                                  fontWeight: 600
                                }}
                              >
                                Preview ↗
                              </Link>
                              <button
                                onClick={async () => {
                                  const newStatus = c.status === 'published' ? 'draft' : 'published';
                                  try {
                                    await updateDoc(doc(db, 'courses', c.id), {
                                      status: newStatus,
                                      updated_at: serverTimestamp()
                                    });
                                    showToast(`Course "${c.title || c.id}" status changed to ${newStatus}!`, 'success');
                                    loadAllAdminData();
                                  } catch (err) {
                                    showToast(`Failed to update status: ${err.message}`, 'error');
                                  }
                                }}
                                style={{
                                  background: c.status === 'published' ? 'rgba(255,138,0,0.15)' : 'rgba(16,185,129,0.15)',
                                  border: c.status === 'published' ? '1px solid rgba(255,138,0,0.3)' : '1px solid rgba(16,185,129,0.3)',
                                  color: c.status === 'published' ? '#FF8A00' : '#10b981',
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                  fontSize: '0.7rem',
                                  fontWeight: 600
                                }}
                              >
                                {c.status === 'published' ? 'Unpublish' : 'Publish'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PANEL 4: DISBURSEMENTS */}
          {activePanel === 'disbursements' && (
            <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Withdrawals & Node Treasury Disbursements</h3>
                <span style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)' }}>Permissions: Super Admin, Finance Admin</span>
              </div>

              {disbursements.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '3rem', color: 'rgba(200,215,240,0.5)', fontSize: '0.8rem' }}>No disbursement requests.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(200,215,240,0.1)', textAlign: 'left', color: 'rgba(200,215,240,0.6)' }}>
                        <th style={{ padding: '0.6rem' }}>Requester</th>
                        <th style={{ padding: '0.6rem' }}>Amount</th>
                        <th style={{ padding: '0.6rem' }}>Bank / Target</th>
                        <th style={{ padding: '0.6rem' }}>Status</th>
                        <th style={{ padding: '0.6rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disbursements.map((d) => (
                        <tr key={d.id} style={{ borderBottom: '1px solid rgba(200,215,240,0.06)' }}>
                          <td style={{ padding: '0.6rem' }}>{d.requester_email || d.user_id?.slice(0, 8)}</td>
                          <td style={{ padding: '0.6rem', fontWeight: 700, color: '#10b981' }}>
                            ₦{Number(d.amount || 0).toLocaleString('en-NG')}
                          </td>
                          <td style={{ padding: '0.6rem' }}>
                            {d.bank_name ? `${d.bank_name} - ${d.account_number} (${d.account_name})` : d.method}
                          </td>
                          <td style={{ padding: '0.6rem' }}>
                            <span style={{
                              color: d.status === 'approved' ? '#10b981' : d.status === 'rejected' ? '#ff5555' : '#FF8A00',
                              fontWeight: 700
                            }}>
                              {d.status?.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                            {d.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => handleResolveDisbursement(d.id, 'approved')}
                                  style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleResolveDisbursement(d.id, 'rejected')}
                                  style={{ background: '#ff5555', color: '#fff', border: 'none', padding: '0.3rem 0.6rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: 'rgba(200,215,240,0.5)' }}>Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PANEL 5: CAMPUS NODES */}
          {activePanel === 'nodes' && (
            <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Campus Nodes & Chapter Treasury</h3>
                <button
                  onClick={async () => {
                    const name = prompt('Enter Campus Node name (e.g. UNILAG Chapter):');
                    if (!name) return;
                    const wa = prompt('Enter Chapter WhatsApp Invite Link:');
                    await addDoc(collection(db, 'chapters'), {
                      name,
                      whatsapp_link: wa || '',
                      treasury_balance: 0,
                      created_at: serverTimestamp()
                    });
                    showToast('Campus node created!', 'success');
                    loadAllAdminData();
                  }}
                  style={{ background: '#1428FF', color: '#fff', border: 'none', padding: '0.4rem 0.9rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  + Add Campus Node
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {chapters.map((ch) => (
                  <div key={ch.id} style={{ background: '#080E1A', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 8, padding: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.3rem' }}>{ch.name}</h4>
                    <div style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.6)', marginBottom: '0.8rem' }}>
                      Treasury Balance: <strong style={{ color: '#10b981' }}>₦{(ch.treasury_balance || 0).toLocaleString('en-NG')}</strong>
                    </div>
                    {ch.whatsapp_link && (
                      <a href={ch.whatsapp_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#25D366', textDecoration: 'none' }}>
                        💬 WhatsApp Group Link ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PANEL 6: BOUNTIES */}
          {activePanel === 'bounties' && (
            <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Protocol Bounties Management</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {bounties.map((b) => (
                  <div key={b.id} style={{ background: '#080E1A', border: '1px solid rgba(20,40,255,0.18)', borderRadius: 8, padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{b.title}</h4>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)' }}>
                        Status: <strong>{b.status}</strong> • Prize: ₦{Number(b.prize_ngn || 0).toLocaleString('en-NG')}
                      </div>
                    </div>
                    {b.status === 'pending_approval' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleUpdateBountyStatus(b.id, 'open')}
                          style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.35rem 0.8rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.72rem' }}
                        >
                          Approve & Publish
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PANEL 7: CBIE APPS */}
          {activePanel === 'cbie' && (
            <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>CBIE Flagship Applications</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(200,215,240,0.1)', textAlign: 'left', color: 'rgba(200,215,240,0.6)' }}>
                      <th style={{ padding: '0.6rem' }}>Applicant</th>
                      <th style={{ padding: '0.6rem' }}>Track</th>
                      <th style={{ padding: '0.6rem' }}>Status</th>
                      <th style={{ padding: '0.6rem' }}>Scholarship %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cbieApps.map((a) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid rgba(200,215,240,0.06)' }}>
                        <td style={{ padding: '0.6rem' }}>{a.full_name || a.email}</td>
                        <td style={{ padding: '0.6rem' }}>{a.selected_track || 'Executive'}</td>
                        <td style={{ padding: '0.6rem' }}>{a.status || 'pending'}</td>
                        <td style={{ padding: '0.6rem' }}>{a.scholarship_percentage || 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PANEL 8: SETTINGS & ROLES */}
          {activePanel === 'settings' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Platform Settings & Admin Roles</h3>
                  <p style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.6)' }}>
                    Configure financial settings, payouts, CBIE defaults, and delegate admin privileges.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setSettingsSubTab('roles')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: 6,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid rgba(20,40,255,0.3)',
                      background: settingsSubTab === 'roles' ? '#1428FF' : 'transparent',
                      color: '#fff'
                    }}
                  >
                    👥 Admin Roles & Team
                  </button>
                  <button
                    onClick={() => setSettingsSubTab('platform')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: 6,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid rgba(20,40,255,0.3)',
                      background: settingsSubTab === 'platform' ? '#1428FF' : 'transparent',
                      color: '#fff'
                    }}
                  >
                    ⚙️ Platform & Banking
                  </button>
                  <button
                    onClick={() => setSettingsSubTab('payment')}
                    style={{
                      padding: '0.45rem 0.9rem',
                      borderRadius: 6,
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid rgba(20,40,255,0.3)',
                      background: settingsSubTab === 'payment' ? '#1428FF' : 'transparent',
                      color: '#fff'
                    }}
                  >
                    💳 Paystack & Gateways
                  </button>
                </div>
              </div>

              {/* Subtab: ROLES */}
              {settingsSubTab === 'roles' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Role Definitions Reference Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                    {[
                      { icon: '👑', name: 'Super Admin', desc: 'Full access to all panels and platform settings' },
                      { icon: '📚', name: 'Course Manager', desc: 'Courses · Modules · Sessions · Enrolments' },
                      { icon: '👨‍🏫', name: 'Tutor / Instructor', desc: 'Grading · Submissions · Review & Feedback' },
                      { icon: '🏛', name: 'Campus Node Lead', desc: 'Campus Chapters · Activations · Community Nodes' },
                      { icon: '💰', name: 'Finance Admin', desc: 'Payments · Commissions · Payouts & Proofs' },
                      { icon: '⚡', name: 'Community Manager', desc: 'Students · XP & Badges · Notifications' },
                      { icon: '✍', name: 'Social Media Manager', desc: 'Articles · Blog publications' }
                    ].map((r) => (
                      <div key={r.name} style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 8, padding: '0.9rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '1.2rem' }}>{r.icon}</span>
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{r.name}</div>
                          <div style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)', marginTop: 2 }}>{r.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Assign / Invite Admin Box */}
                  <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 10, padding: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.4rem' }}>Assign Admin Role to Sofian</h4>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.65)', marginBottom: '1rem' }}>
                      Enter the registered email of an existing Sofian account and select the administrative privilege to grant.
                    </p>
                    <form onSubmit={handleInviteAdmin} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div style={{ flex: '1 1 240px' }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)', marginBottom: 4 }}>Sofian Email</label>
                        <input
                          type="email"
                          placeholder="e.g. sofian@example.com"
                          value={inviteAdminEmail}
                          onChange={(e) => setInviteAdminEmail(e.target.value)}
                          required
                          style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.3)', borderRadius: 6, padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.78rem' }}
                        />
                      </div>
                      <div style={{ flex: '1 1 220px' }}>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)', marginBottom: 4 }}>Assign Role</label>
                        <select
                          value={inviteAdminRole}
                          onChange={(e) => setInviteAdminRole(e.target.value)}
                          style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.3)', borderRadius: 6, padding: '0.55rem 0.8rem', color: '#fff', fontSize: '0.78rem' }}
                        >
                          <option value="super_admin">👑 Super Admin - Full Platform Access</option>
                          <option value="course_manager">📚 Course Manager - Courses & Enrolments</option>
                          <option value="tutor">👨‍🏫 Tutor / Instructor - Grading & Submissions</option>
                          <option value="node_lead">🏛 Campus Node Lead - Chapter Activations</option>
                          <option value="finance_admin">💰 Finance Admin - Payments & Disbursements</option>
                          <option value="community_manager">⚡ Community Manager - Students, XP & Badges</option>
                          <option value="social_media_manager">✍ Social Media Manager - Blog Content</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        style={{
                          background: '#1428FF',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '0.6rem 1.25rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        + Assign Privileges
                      </button>
                    </form>
                  </div>

                  {/* Active Admin Table */}
                  <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Active Admin Team & Privileged Users</h4>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)' }}>
                        {users.filter((u) => u.role === 'admin' || u.role === 'tutor' || u.role === 'node_lead' || Boolean(u.admin_role)).length} assigned staff
                      </span>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.76rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid rgba(200,215,240,0.1)', textAlign: 'left', color: 'rgba(200,215,240,0.6)' }}>
                            <th style={{ padding: '0.6rem' }}>Name</th>
                            <th style={{ padding: '0.6rem' }}>Email</th>
                            <th style={{ padding: '0.6rem' }}>Role Privilege</th>
                            <th style={{ padding: '0.6rem' }}>Account Type</th>
                            <th style={{ padding: '0.6rem', textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users
                            .filter((u) => u.role === 'admin' || u.role === 'tutor' || u.role === 'node_lead' || Boolean(u.admin_role))
                            .map((u) => {
                              const badgeColor = 
                                u.admin_role === 'super_admin' ? '#ef4444' :
                                (u.role === 'tutor' || u.admin_role === 'tutor') ? '#3b82f6' :
                                (u.role === 'node_lead' || u.admin_role === 'node_lead') ? '#f59e0b' :
                                '#10b981';
                              return (
                                <tr key={u.id} style={{ borderBottom: '1px solid rgba(200,215,240,0.06)' }}>
                                  <td style={{ padding: '0.6rem', fontWeight: 600 }}>{u.first_name ? `${u.first_name} ${u.last_name || ''}` : 'Sofian'}</td>
                                  <td style={{ padding: '0.6rem', color: 'rgba(200,215,240,0.8)' }}>{u.email}</td>
                                  <td style={{ padding: '0.6rem' }}>
                                    <span style={{
                                      display: 'inline-block',
                                      padding: '0.2rem 0.55rem',
                                      borderRadius: 4,
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      background: `${badgeColor}22`,
                                      color: badgeColor,
                                      border: `1px solid ${badgeColor}44`
                                    }}>
                                      {formatRoleBadge(u.role, u.admin_role)}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.6rem', textTransform: 'capitalize', color: 'rgba(200,215,240,0.6)' }}>{u.account_type || 'sofian'}</td>
                                  <td style={{ padding: '0.6rem', textAlign: 'right' }}>
                                    <button
                                      onClick={() => handleOpenUserModal(u)}
                                      style={{
                                        background: 'rgba(20,40,255,0.2)',
                                        border: '1px solid rgba(20,40,255,0.3)',
                                        color: '#6b8cff',
                                        borderRadius: 4,
                                        padding: '0.25rem 0.6rem',
                                        fontSize: '0.7rem',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Edit Role
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab: PLATFORM */}
              {settingsSubTab === 'platform' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                  {/* Bank receiving account */}
                  <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.4rem' }}>Bank Receiving Account</h4>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.65)', marginBottom: '1rem' }}>
                      These bank details are displayed to Sofians and CBIE applicants choosing offline transfer.
                    </p>
                    <form onSubmit={handleSavePlatformSettings} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Bank Name</label>
                        <input
                          type="text"
                          value={platformSettings.bank_name || ''}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, bank_name: e.target.value })}
                          style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Account Number</label>
                        <input
                          type="text"
                          maxLength={10}
                          value={platformSettings.account_number || ''}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, account_number: e.target.value })}
                          style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Account Name</label>
                        <input
                          type="text"
                          value={platformSettings.account_name || ''}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, account_name: e.target.value })}
                          style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{ alignSelf: 'flex-start', background: '#1428FF', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginTop: 6 }}
                      >
                        Save Bank Details
                      </button>
                    </form>
                  </div>

                  {/* Referral & Commissions */}
                  <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.4rem' }}>Referral & CBIE Pricing</h4>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.65)', marginBottom: '1rem' }}>
                      Configure affiliate commission rates and default admission prices.
                    </p>
                    <form onSubmit={handleSavePlatformSettings} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Commission Per Referral (₦)</label>
                        <input
                          type="number"
                          value={platformSettings.referral_commission || 5000}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, referral_commission: Number(e.target.value) })}
                          style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>CBIE Full Price (₦)</label>
                        <input
                          type="number"
                          value={platformSettings.cbie_price || 100000}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, cbie_price: Number(e.target.value) })}
                          style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Default Scholarship (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={platformSettings.default_scholarship || 50}
                          onChange={(e) => setPlatformSettings({ ...platformSettings, default_scholarship: Number(e.target.value) })}
                          style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                        />
                      </div>
                      <button
                        type="submit"
                        style={{ alignSelf: 'flex-start', background: '#1428FF', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', marginTop: 6 }}
                      >
                        Save Pricing & Rates
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* Subtab: PAYMENT */}
              {settingsSubTab === 'payment' && (
                <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.25rem', maxWidth: 600 }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.4rem' }}>Paystack Payment Gateway Configuration</h4>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.65)', marginBottom: '1.2rem' }}>
                    Configure client-side Paystack keys for course enrolments and CBIE checkout.
                  </p>
                  <form onSubmit={handleSavePlatformSettings} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Paystack Public Key (Frontend)</label>
                      <input
                        type="text"
                        placeholder="pk_test_xxxxxxxxxxxxxxxxxxxxx or pk_live_..."
                        value={platformSettings.paystack_public_key || ''}
                        onChange={(e) => setPlatformSettings({ ...platformSettings, paystack_public_key: e.target.value })}
                        style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.78rem', marginTop: 4 }}
                      />
                      <span style={{ fontSize: '0.66rem', color: 'rgba(200,215,240,0.5)', marginTop: 4, display: 'block' }}>
                        Safe to expose on client browsers. For live transactions, switch to <code>pk_live_...</code>
                      </span>
                    </div>
                    <button
                      type="submit"
                      style={{ alignSelf: 'flex-start', background: '#1428FF', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.1rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Save Gateway Key
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* USER ROLE DELEGATION MODAL */}
      {showUserModal && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.3)', borderRadius: 12, padding: '1.75rem', width: '100%', maxWidth: 500 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.3rem' }}>Edit Sofian Roles & Privileges</h3>
            <p style={{ fontSize: '0.76rem', color: 'rgba(200,215,240,0.7)', marginBottom: '1.25rem' }}>User: {selectedUser.email}</p>

            <form onSubmit={handleSaveUserRole} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Primary Role</label>
                <select
                  value={userRoleForm.role}
                  onChange={(e) => setUserRoleForm({ ...userRoleForm, role: e.target.value })}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                >
                  <option value="student">Student / Sofian</option>
                  <option value="tutor">Tutor / Instructor</option>
                  <option value="admin">Platform Administrator</option>
                  <option value="node_lead">⬡ Campus Node Lead</option>
                  <option value="ambassador">Ambassador / Node Head</option>
                  <option value="partner">Partner Org</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Admin Staff Role (if admin/tutor)</label>
                <select
                  value={userRoleForm.admin_role}
                  onChange={(e) => setUserRoleForm({ ...userRoleForm, admin_role: e.target.value })}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                >
                  <option value="">None (Standard)</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="course_manager">Course Manager</option>
                  <option value="tutor">Tutor</option>
                  <option value="finance_admin">Finance Admin</option>
                  <option value="community_manager">Community Manager</option>
                  <option value="social_media_manager">Social Media Manager</option>
                  <option value="node_lead">Node Lead</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Account Classification</label>
                <select
                  value={userRoleForm.account_type}
                  onChange={(e) => setUserRoleForm({ ...userRoleForm, account_type: e.target.value })}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                >
                  <option value="sofian">Sofian (Individual)</option>
                  <option value="protocol">Protocol Partner (Can post bounties)</option>
                  <option value="partner_org">Corporate / Partner Org</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Affiliate Program Level</label>
                <select
                  value={userRoleForm.affiliate_tier || 'newbie'}
                  onChange={(e) => setUserRoleForm({ ...userRoleForm, affiliate_tier: e.target.value })}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                >
                  <option value="newbie">Level 1 — Newbie (5% Direct)</option>
                  <option value="affiliate">Level 2 — Affiliate (10% Direct)</option>
                  <option value="ambassador">Level 3 — Ambassador (10% Direct + 5% Indirect)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '0.5rem 0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={userRoleForm.is_premium}
                    onChange={(e) => setUserRoleForm({ ...userRoleForm, is_premium: e.target.checked })}
                  />
                  <span>💎 Premium Member ($100 VIP Badge)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={userRoleForm.bypass_foundation}
                    onChange={(e) => setUserRoleForm({ ...userRoleForm, bypass_foundation: e.target.checked })}
                  />
                  <span>★ Bypass Foundation Prerequisite (Direct Access)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.76rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={userRoleForm.foundation_complete}
                    onChange={(e) => setUserRoleForm({ ...userRoleForm, foundation_complete: e.target.checked })}
                  />
                  <span>🎓 Foundation Completed (Commission Payouts Activated)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid rgba(200,215,240,0.2)', color: 'rgba(200,215,240,0.7)', borderRadius: 6, padding: '0.6rem', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, background: '#1428FF', border: 'none', color: '#fff', borderRadius: 6, padding: '0.6rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRADING MODAL */}
      {showGradingModal && selectedSub && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#0D1526', border: '1px solid rgba(20,40,255,0.3)', borderRadius: 12, padding: '1.75rem', width: '100%', maxWidth: 480 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.4rem' }}>Grade Submission</h3>
            <div style={{ fontSize: '0.76rem', color: 'rgba(200,215,240,0.7)', marginBottom: '1rem' }}>
              Submission Link:{' '}
              <a href={selectedSub.submission_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1428FF' }}>
                {selectedSub.submission_url}
              </a>
            </div>

            <form onSubmit={handleSubmitGrading} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Score (0 - 100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Verdict</label>
                <select
                  value={gradePassed ? 'pass' : 'fail'}
                  onChange={(e) => setGradePassed(e.target.value === 'pass')}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                >
                  <option value="pass">✓ Passed (Score &gt;= 70%)</option>
                  <option value="fail">✕ Failed / Needs Revision</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.7)' }}>Feedback to Student</label>
                <textarea
                  rows={3}
                  placeholder="Provide constructive feedback..."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  style={{ width: '100%', background: '#080E1A', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 6, padding: '0.55rem', color: '#fff', fontSize: '0.8rem', marginTop: 4 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowGradingModal(false)}
                  style={{ flex: 1, background: 'transparent', border: '1px solid rgba(200,215,240,0.2)', color: 'rgba(200,215,240,0.7)', borderRadius: 6, padding: '0.6rem', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gradingSubmitting}
                  style={{ flex: 1, background: '#10b981', border: 'none', color: '#fff', borderRadius: 6, padding: '0.6rem', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {gradingSubmitting ? 'Saving...' : 'Save Grade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
