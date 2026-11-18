'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  auth,
  db,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc
} from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobServOpen, setMobServOpen] = useState(false);
  const [mobResOpen, setMobResOpen] = useState(false);
  const [desktopServOpen, setDesktopServOpen] = useState(false);
  const [desktopResOpen, setDesktopResOpen] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Notifications State
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifTab, setNotifTab] = useState('all'); // 'all' | 'personal' | 'broadcast'
  const [personalNotifs, setPersonalNotifs] = useState([]);
  const [broadcastNotifs, setBroadcastNotifs] = useState([]);
  const [readBroadcastIds, setReadBroadcastIds] = useState([]);

  // Load seen broadcast IDs from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sofe_read_broadcasts') || '[]');
      setReadBroadcastIds(stored);
    } catch (_) {}
  }, []);

  // Real-time Firestore notifications listener for logged-in user
  useEffect(() => {
    if (!user) {
      setPersonalNotifs([]);
      setBroadcastNotifs([]);
      return;
    }

    let unsubPersonal = null;
    let unsubBroadcast = null;

    try {
      const qPersonal = query(
        collection(db, 'notifications'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
        limit(20)
      );
      unsubPersonal = onSnapshot(qPersonal, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data(), _kind: 'personal' }));
        setPersonalNotifs(items);
      }, (err) => {
        console.warn('[Nav Notifications] Personal query error:', err.message);
      });
    } catch (err) {
      console.warn('[Nav Notifications] Setup personal error:', err.message);
    }

    try {
      const qBroadcast = query(
        collection(db, 'notifications'),
        where('type', '==', 'broadcast'),
        orderBy('created_at', 'desc'),
        limit(20)
      );
      unsubBroadcast = onSnapshot(qBroadcast, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data(), _kind: 'broadcast' }));
        setBroadcastNotifs(items);
      }, (err) => {
        console.warn('[Nav Notifications] Broadcast query error:', err.message);
      });
    } catch (err) {
      console.warn('[Nav Notifications] Setup broadcast error:', err.message);
    }

    return () => {
      if (unsubPersonal) unsubPersonal();
      if (unsubBroadcast) unsubBroadcast();
    };
  }, [user]);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('sofe_theme');
      if (savedTheme === 'light' || document.body.classList.contains('light')) {
        setIsLight(true);
        document.body.classList.add('light');
        const canvas = document.getElementById('hexCanvas');
        if (canvas) canvas.style.opacity = '0.18';
      }
    } catch (_) {}

    const onScroll = () => setScrolled(window.scrollY > 40);
    const onDocClick = (e) => {
      if (!e.target.closest('.nav-dropdown')) {
        setDesktopServOpen(false);
        setDesktopResOpen(false);
      }
      if (!e.target.closest('.nav-profile-wrap')) {
        setProfileOpen(false);
      }
      if (!e.target.closest('.nav-bell-wrap')) {
        setNotifsOpen(false);
      }
      if (!e.target.closest('#mobileMenu') && !e.target.closest('#hamburger')) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('scroll', onScroll);
    window.addEventListener('click', onDocClick);
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('click', onDocClick);
      unsub();
    };
  }, []);

  useEffect(() => {
    setDesktopServOpen(false);
    setDesktopResOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/course-view') ||
    pathname === '/login' ||
    pathname === '/signup'
  ) {
    return null;
  }

  function toggleTheme() {
    const next = !isLight;
    setIsLight(next);
    document.body.classList.toggle('light', next);
    try {
      localStorage.setItem('sofe_theme', next ? 'light' : 'dark');
    } catch (_) {}
    const canvas = document.getElementById('hexCanvas');
    if (canvas) canvas.style.opacity = next ? '0.18' : '1';
  }

  function closeMenu() {
    setMenuOpen(false);
    setMobServOpen(false);
    setMobResOpen(false);
  }


  const isLinkActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const unreadPersonal = personalNotifs.filter(n => !n.read).length;
  const unreadBroadcast = broadcastNotifs.filter(n => !readBroadcastIds.includes(n.id)).length;
  const totalUnread = unreadPersonal + unreadBroadcast;

  const getMillis = (ts) => {
    if (!ts) return 0;
    if (ts.toMillis) return ts.toMillis();
    if (ts.toDate) return ts.toDate().getTime();
    if (ts instanceof Date) return ts.getTime();
    return new Date(ts).getTime() || 0;
  };

  const mergedNotifs = [...personalNotifs, ...broadcastNotifs].sort(
    (a, b) => getMillis(b.created_at) - getMillis(a.created_at)
  ).slice(0, 25);

  const filteredNotifs = notifTab === 'personal'
    ? mergedNotifs.filter(n => n._kind === 'personal')
    : notifTab === 'broadcast'
    ? mergedNotifs.filter(n => n._kind === 'broadcast')
    : mergedNotifs;

  const handleMarkAllRead = async () => {
    const unread = personalNotifs.filter(n => !n.read);
    for (const n of unread) {
      try {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      } catch (err) {
        console.warn('[Nav Notifications] Mark read error:', err.message);
      }
    }
    const bcastIds = broadcastNotifs.map(n => n.id);
    const updated = Array.from(new Set([...readBroadcastIds, ...bcastIds]));
    setReadBroadcastIds(updated);
    try {
      localStorage.setItem('sofe_read_broadcasts', JSON.stringify(updated.slice(-200)));
    } catch (_) {}
  };

  const handleNotifClick = async (notif) => {
    if (notif._kind === 'personal' && !notif.read) {
      try {
        await updateDoc(doc(db, 'notifications', notif.id), { read: true });
      } catch (_) {}
    } else if (notif._kind === 'broadcast' && !readBroadcastIds.includes(notif.id)) {
      const updated = Array.from(new Set([...readBroadcastIds, notif.id]));
      setReadBroadcastIds(updated);
      try {
        localStorage.setItem('sofe_read_broadcasts', JSON.stringify(updated.slice(-200)));
      } catch (_) {}
    }
    setNotifsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  function formatTimeAgo(ts) {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts));
    if (isNaN(date.getTime())) return '';
    const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (sec < 60) return 'Just now';
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    if (sec < 604800) return `${Math.floor(sec / 86400)}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  return (
    <>
      <nav id="nav">
        <div className="nav-inner">
          <Link href="/" className="nav-logo" aria-label="Sofe Node" data-intro-target style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <img
              src="/images/Nodes/SofeLogoHome.png"
              className="logo-img"
              alt="Sofe Node"
            />
          </Link>

        <ul className="nav-links">
          <li>
            <Link href="/" className={isLinkActive('/') && pathname === '/' ? 'active-pill' : ''}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/academy" className={isLinkActive('/academy') ? 'active-pill' : ''}>
              Academy
            </Link>
          </li>
          <li>
            <Link href="/cbie" className={isLinkActive('/cbie') ? 'active-pill' : ''}>
              CBIE
            </Link>
          </li>
          <li className={`nav-dropdown${desktopServOpen ? ' open' : ''}`}>
            <a
              href="/services"
              className={isLinkActive('/services') || isLinkActive('/ecosystem') ? 'active-pill' : ''}
              onClick={(e) => {
                e.preventDefault();
                setDesktopServOpen((v) => !v);
                setDesktopResOpen(false);
              }}
            >
              Services <span className="nav-chevron">&#9660;</span>
            </a>
            <div className="nav-dropdown-menu">
              <div className="nav-dropdown-panel">
                <Link href="/services/talent" onClick={() => setDesktopServOpen(false)}>
                  <span className="dd-icon">🎓</span>
                  <span>For Talent</span>
                </Link>
                <div className="dd-sep" />
                <Link href="/ecosystem" onClick={() => setDesktopServOpen(false)}>
                  <span className="dd-icon">🌍</span>
                  <span>For Ecosystems</span>
                </Link>
              </div>
            </div>
          </li>
          <li className={`nav-dropdown${desktopResOpen ? ' open' : ''}`}>
            <a
              href="#"
              className={isLinkActive('/blog') || isLinkActive('/events') || isLinkActive('/about') ? 'active-pill' : ''}
              onClick={(e) => {
                e.preventDefault();
                setDesktopResOpen((v) => !v);
                setDesktopServOpen(false);
              }}
            >
              Resources <span className="nav-chevron">&#9660;</span>
            </a>
            <div className="nav-dropdown-menu">
              <div className="nav-dropdown-panel">
                <Link href="/blog" onClick={() => setDesktopResOpen(false)}>
                  <span className="dd-icon">📝</span>
                  <span>Blog</span>
                </Link>
                <div className="dd-sep" />
                <Link href="/events" onClick={() => setDesktopResOpen(false)}>
                  <span className="dd-icon">📅</span>
                  <span>Events</span>
                </Link>
                <div className="dd-sep" />
                <Link href="/about" onClick={() => setDesktopResOpen(false)}>
                  <span className="dd-icon">ℹ️</span>
                  <span>About Us</span>
                </Link>
              </div>
            </div>
          </li>
          <li>
            <Link href="/bounties" className={isLinkActive('/bounties') ? 'active-pill' : ''}>
              Bounties
            </Link>
          </li>
        </ul>

        <div className="nav-right">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label="Toggle light mode"
          >
            {isLight ? '🌙' : '☀️'}
          </button>

          {/* Notification Bell (Visible when user is logged in) */}
          {user && (
            <div className={`nav-bell-wrap ${notifsOpen ? 'open' : ''}`} style={{ position: 'relative' }}>
              <button
                className={`nav-bell-btn ${totalUnread > 0 ? 'has-unread' : ''}`}
                id="navBellBtn"
                onClick={() => {
                  setNotifsOpen(!notifsOpen);
                  if (profileOpen) setProfileOpen(false);
                }}
                aria-label="Notifications"
                title="Notifications"
                type="button"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
                {totalUnread > 0 && (
                  <span className="nav-bell-badge">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                )}
              </button>

              {notifsOpen && (
                <div className="nav-bell-panel" role="menu" aria-label="Notifications">
                  <div className="nav-bell-header">
                    <div className="nav-bell-title">
                      Notifications {totalUnread > 0 && <span className="nav-bell-title-badge">{totalUnread} new</span>}
                    </div>
                    <button
                      className="nav-bell-mark-all"
                      onClick={handleMarkAllRead}
                      type="button"
                      disabled={totalUnread === 0}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="nav-bell-tabs" role="tablist">
                    <button
                      className={`nav-bell-tab ${notifTab === 'all' ? 'active' : ''}`}
                      onClick={() => setNotifTab('all')}
                      type="button"
                    >
                      All ({mergedNotifs.length})
                    </button>
                    <button
                      className={`nav-bell-tab ${notifTab === 'personal' ? 'active' : ''}`}
                      onClick={() => setNotifTab('personal')}
                      type="button"
                    >
                      Personal ({personalNotifs.length})
                    </button>
                    <button
                      className={`nav-bell-tab ${notifTab === 'broadcast' ? 'active' : ''}`}
                      onClick={() => setNotifTab('broadcast')}
                      type="button"
                    >
                      Updates ({broadcastNotifs.length})
                    </button>
                  </div>

                  <div className="nav-bell-list">
                    {filteredNotifs.length === 0 ? (
                      <div className="nav-bell-empty">
                        <div className="nav-bell-empty-icon">🔔</div>
                        <div>
                          {notifTab === 'personal' ? 'No personal notifications yet' : notifTab === 'broadcast' ? 'No platform updates yet' : 'No notifications yet'}
                        </div>
                      </div>
                    ) : (
                      filteredNotifs.map((n) => {
                        const isUnr = n._kind === 'personal' ? !n.read : !readBroadcastIds.includes(n.id);
                        return (
                          <div
                            key={n.id}
                            className={`nav-bell-item ${isUnr ? 'unread' : ''}`}
                            onClick={() => handleNotifClick(n)}
                          >
                            <div className="nav-bell-item-row">
                              <span className="nav-bell-item-title">{n.title || 'Notification'}</span>
                              <span className="nav-bell-item-time">{formatTimeAgo(n.created_at)}</span>
                            </div>
                            {n.message && <div className="nav-bell-item-msg">{n.message}</div>}
                            <span className={`nav-bell-item-tag ${n._kind === 'broadcast' ? 'broadcast' : 'personal'}`}>
                              {n._kind === 'broadcast' ? 'Announcement' : (n.category || 'Direct')}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="nav-profile-wrap" style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  if (notifsOpen) setNotifsOpen(false);
                }}
                style={{
                  background: 'linear-gradient(135deg, #1428FF, #FF8A00)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'uppercase',
                  flexShrink: 0
                }}
              >
                {user.email ? user.email.charAt(0) : 'U'}
              </button>
              {profileOpen && (
                <div className="nav-profile-menu">
                  <Link href="/dashboard" className="nav-profile-item" onClick={() => setProfileOpen(false)}>Dashboard</Link>
                  <Link href="/dashboard?tab=profile" className="nav-profile-item" onClick={() => setProfileOpen(false)}>Profile</Link>
                  <Link href="/dashboard?tab=settings" className="nav-profile-item" onClick={() => setProfileOpen(false)}>Settings</Link>
                  <div className="nav-profile-sep" />
                  <button className="nav-profile-logout" onClick={() => { signOut(auth); setProfileOpen(false); }}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="nav-cta">Sign In</Link>
          )}
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            id="hamburger"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div id="mobileMenu" className={menuOpen ? 'open' : ''}>
        <ul className="mob-links">
          <li><Link href="/" onClick={closeMenu} className={pathname === '/' ? 'active-pill' : ''}>Home</Link></li>
          <li><Link href="/academy" onClick={closeMenu} className={isLinkActive('/academy') ? 'active-pill' : ''}>Academy</Link></li>
          <li><Link href="/cbie" onClick={closeMenu} className={isLinkActive('/cbie') ? 'active-pill' : ''}>CBIE</Link></li>
          <li>
            <a
              className={`mob-services-toggle${mobServOpen ? ' open' : ''}${isLinkActive('/services') || isLinkActive('/ecosystem') ? ' active-pill' : ''}`}
              onClick={(e) => { e.preventDefault(); setMobServOpen((v) => !v); }}
              href="#"
            >
              Services <span className="mob-chevron">&#9660;</span>
            </a>
            {mobServOpen && (
              <ul className="mob-sub">
                <li>
                  <Link href="/services/talent" onClick={closeMenu} className={isLinkActive('/services/talent') ? 'active-pill' : ''}>
                    <span className="dd-icon">🎓</span>For Talent
                  </Link>
                </li>
                <li>
                  <Link href="/ecosystem" onClick={closeMenu} className={isLinkActive('/ecosystem') ? 'active-pill' : ''}>
                    <span className="dd-icon">🌍</span>For Ecosystems
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <a
              className={`mob-services-toggle${mobResOpen ? ' open' : ''}${isLinkActive('/blog') || isLinkActive('/events') || isLinkActive('/about') ? ' active-pill' : ''}`}
              onClick={(e) => { e.preventDefault(); setMobResOpen((v) => !v); }}
              href="#"
            >
              Resources <span className="mob-chevron">&#9660;</span>
            </a>
            {mobResOpen && (
              <ul className="mob-sub">
                <li>
                  <Link href="/blog" onClick={closeMenu} className={isLinkActive('/blog') ? 'active-pill' : ''}>
                    <span className="dd-icon">📝</span>Blog
                  </Link>
                </li>
                <li>
                  <Link href="/events" onClick={closeMenu} className={isLinkActive('/events') ? 'active-pill' : ''}>
                    <span className="dd-icon">📅</span>Events
                  </Link>
                </li>
                <li>
                  <Link href="/about" onClick={closeMenu} className={isLinkActive('/about') ? 'active-pill' : ''}>
                    <span className="dd-icon">ℹ️</span>About Us
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li><Link href="/bounties" onClick={closeMenu} className={isLinkActive('/bounties') ? 'active-pill' : ''}>Bounties</Link></li>
        </ul>
        <div className="mob-bottom">
          {user ? (
            <Link href="/dashboard" className="btn-primary" style={{ flex: 1, textAlign: 'center' }} onClick={closeMenu}>
              Dashboard →
            </Link>
          ) : (
            <Link href="/login" className="btn-primary" style={{ flex: 1, textAlign: 'center' }} onClick={closeMenu}>
              Sign In →
            </Link>
          )}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label="Toggle light mode"
          >
            {isLight ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </>
  );
}
