'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobServOpen, setMobServOpen] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/course-view')) {
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
  }

  return (
    <>
      <nav
        id="nav"
        style={scrolled ? { background: 'rgba(4,8,16,0.97)' } : undefined}
      >
        <Link href="/" className="nav-logo">
          <img src="/images/Nodes/SofeLogoHome.png" className="logo-img" alt="Sofe Node Logo" />
          <span>SOFE <span className="logo-word-node">NODE</span></span>
        </Link>

        <ul className="nav-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/about">About Us</Link></li>
          <li className="nav-dropdown">
            <Link href="/services">Services</Link>
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
          <li><Link href="/academy">Academy</Link></li>
          <li><Link href="/bce">BCE</Link></li>
          <li><Link href="/bounties">Bounties</Link></li>
          <li><Link href="/dashboard">Dashboard</Link></li>
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
          <Link href="/login" className="nav-cta">Login</Link>
          <button
            className={`hamburger${menuOpen ? ' open' : ''}`}
            id="hamburger"
            aria-label="Open menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      <div id="mobileMenu" className={menuOpen ? 'open' : ''}>
        <ul className="mob-links">
          <li><Link href="/" onClick={closeMenu}>Home</Link></li>
          <li><Link href="/about" onClick={closeMenu}>About Us</Link></li>
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
          <li><Link href="/academy" onClick={closeMenu}>Academy</Link></li>
          <li><Link href="/bce" onClick={closeMenu}>BCE</Link></li>
          <li><Link href="/bounties" onClick={closeMenu}>Bounties</Link></li>
          <li><Link href="/dashboard" onClick={closeMenu}>Dashboard</Link></li>
        </ul>
        <div className="mob-bottom">
          <Link href="/login" className="btn-primary" style={{ flex: 1, textAlign: 'center' }} onClick={closeMenu}>
            Login →
          </Link>
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
