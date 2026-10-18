'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobServOpen, setMobServOpen] = useState(false);
  const [mobResOpen, setMobResOpen] = useState(false);
  const [desktopServOpen, setDesktopServOpen] = useState(false);
  const [desktopResOpen, setDesktopResOpen] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

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
      if (!e.target.closest('.nav-right')) {
        setProfileOpen(false);
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
          {user ? (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
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
