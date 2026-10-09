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
  const [isLight, setIsLight] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => {
      window.removeEventListener('scroll', onScroll);
      unsub();
    };
  }, []);

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
          <Link href="/" className="nav-logo" aria-label="Sofe Node">
            <img
              src="/images/Nodes/SofeLogoHome.png"
            className="logo-img"
            alt="Sofe Node"
            style={{ height: '38px', width: 'auto', objectFit: 'contain' }}
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
          <li className="nav-dropdown">
            <Link href="/services" className={isLinkActive('/services') ? 'active-pill' : ''}>
              Services
            </Link>
            <div className="nav-dropdown-menu">
              <div className="nav-dropdown-panel">
                <Link href="/services/talent">
                  <span className="dd-icon">🎓</span>
                  <span>For Talent</span>
                </Link>
                <div className="dd-sep" />
                <Link href="/services/partners">
                  <span className="dd-icon">🌍</span>
                  <span>For Partners</span>
                </Link>
              </div>
            </div>
          </li>
          <li className="nav-dropdown">
            <Link href="#" className={isLinkActive('/blog') || isLinkActive('/events') || isLinkActive('/about') ? 'active-pill' : ''}>
              Resources
            </Link>
            <div className="nav-dropdown-menu">
              <div className="nav-dropdown-panel">
                <Link href="/blog">
                  <span className="dd-icon">📝</span>
                  <span>Blog</span>
                </Link>
                <div className="dd-sep" />
                <Link href="/events">
                  <span className="dd-icon">📅</span>
                  <span>Events</span>
                </Link>
                <div className="dd-sep" />
                <Link href="/about">
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
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                style={{
                  background: 'linear-gradient(135deg, #1428FF, #FF8A00)',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'uppercase'
                }}
              >
                {user.email ? user.email.charAt(0) : 'U'}
              </button>
              {profileOpen && (
                <div style={{
                  position: 'absolute',
                  top: '120%',
                  right: 0,
                  background: 'rgba(8,14,26,0.95)',
                  border: '1px solid rgba(20,40,255,0.2)',
                  borderRadius: 12,
                  padding: '0.5rem 0',
                  minWidth: 160,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  zIndex: 999
                }}>
                  <Link href="/dashboard" style={{ display: 'block', padding: '0.6rem 1.2rem', color: '#fff', textDecoration: 'none', fontSize: '0.85rem' }} onClick={() => setProfileOpen(false)}>Dashboard</Link>
                  <Link href="/dashboard?tab=profile" style={{ display: 'block', padding: '0.6rem 1.2rem', color: '#fff', textDecoration: 'none', fontSize: '0.85rem' }} onClick={() => setProfileOpen(false)}>Profile</Link>
                  <Link href="/dashboard?tab=settings" style={{ display: 'block', padding: '0.6rem 1.2rem', color: '#fff', textDecoration: 'none', fontSize: '0.85rem' }} onClick={() => setProfileOpen(false)}>Settings</Link>

                  <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                  <button onClick={() => { signOut(auth); setProfileOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 1.2rem', color: '#FF4444', textDecoration: 'none', fontSize: '0.85rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>Logout</button>
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
          <li><Link href="/" onClick={closeMenu}>Home</Link></li>
          <li><Link href="/academy" onClick={closeMenu}>Academy</Link></li>
          <li><Link href="/cbie" onClick={closeMenu}>CBIE</Link></li>
          <li>
            <a
              className={`mob-services-toggle${mobServOpen ? ' open' : ''}`}
              onClick={(e) => { e.preventDefault(); setMobServOpen((v) => !v); }}
              href="#"
            >
              Services <span className="mob-chevron">&#9660;</span>
            </a>
            {mobServOpen && (
              <ul className="mob-sub">
                <li>
                  <Link href="/services/talent" onClick={closeMenu}>
                    <span className="dd-icon">🎓</span>For Talent
                  </Link>
                </li>
                <li>
                  <Link href="/services/partners" onClick={closeMenu}>
                    <span className="dd-icon">🌍</span>For Partners
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <a
              className={`mob-services-toggle${mobResOpen ? ' open' : ''}`}
              onClick={(e) => { e.preventDefault(); setMobResOpen((v) => !v); }}
              href="#"
            >
              Resources <span className="mob-chevron">&#9660;</span>
            </a>
            {mobResOpen && (
              <ul className="mob-sub">
                <li>
                  <Link href="/blog" onClick={closeMenu}>
                    <span className="dd-icon">📝</span>Blog
                  </Link>
                </li>
                <li>
                  <Link href="/events" onClick={closeMenu}>
                    <span className="dd-icon">📅</span>Events
                  </Link>
                </li>
                <li>
                  <Link href="/about" onClick={closeMenu}>
                    <span className="dd-icon">ℹ️</span>About Us
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li><Link href="/bounties" onClick={closeMenu}>Bounties</Link></li>
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
