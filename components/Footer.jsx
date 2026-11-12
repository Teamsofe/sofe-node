'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  if (
    pathname?.startsWith('/admin') ||
    pathname === '/login' ||
    pathname === '/signup'
  ) {
    return null;
  }

  const hasBottomDock = pathname?.startsWith('/dashboard') || pathname?.startsWith('/u/');

  return (
    <footer style={hasBottomDock ? { paddingBottom: '95px' } : undefined}>
      <div className="footer-grid">
        <div className="footer-brand">
          <Link href="/" className="nav-logo" style={{ marginBottom: '.6rem' }} aria-label="Sofe Node">
            <img src="/images/Nodes/SofeLogoHome.png" className="logo-img" alt="Sofe Node" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
          </Link>
          <p>A Sofe Group company. Empowering the next generation to lead Africa&apos;s tech revolution.</p>
          <div className="social-row" style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
            <a className="social-btn" href="https://x.com/sofenode" target="_blank" rel="noopener noreferrer" title="X/Twitter">
              <img src="/images/Social/SofeNodeX(twitter).png" alt="X/Twitter" style={{ width: '18px', height: '18px', maxWidth: '18px', maxHeight: '18px', objectFit: 'contain', display: 'block' }} />
            </a>
            <a className="social-btn" href="https://linkedin.com/company/sofe-group" target="_blank" rel="noopener noreferrer" title="LinkedIn">
              <img src="/images/Social/SofeNodeLInkedIn.png" alt="LinkedIn" style={{ width: '18px', height: '18px', maxWidth: '18px', maxHeight: '18px', objectFit: 'contain', display: 'block' }} />
            </a>
            <a className="social-btn" href="https://youtube.com/@sofegroupofficial" target="_blank" rel="noopener noreferrer" title="YouTube">
              <img src="/images/Social/SofeNodeYoutubelogo.png" alt="YouTube" style={{ width: '18px', height: '18px', maxWidth: '18px', maxHeight: '18px', objectFit: 'contain', display: 'block' }} />
            </a>
            <a className="social-btn" href="https://facebook.com/profile.php?id=100063995682203&mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" title="Facebook">
              <img src="/images/Social/SofeNodeFacebooklogo.png" alt="Facebook" style={{ width: '18px', height: '18px', maxWidth: '18px', maxHeight: '18px', objectFit: 'contain', display: 'block' }} />
            </a>
            <a className="social-btn" href="https://t.me/sofegroupofficial" target="_blank" rel="noopener noreferrer" title="Telegram">
              <img src="/images/Social/SofeNodeTelegram.png" alt="Telegram" style={{ width: '18px', height: '18px', maxWidth: '18px', maxHeight: '18px', objectFit: 'contain', display: 'block' }} />
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/ecosystem">For Ecosystems</Link></li>
            <li><Link href="/services/talent">For Talent</Link></li>
            <li><Link href="/academy">Academy</Link></li>
            <li><Link href="/bce">BCE Tour</Link></li>
            <li><Link href="/dashboard">Dashboard</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Legal & Policies</h4>
          <ul>
            <li><Link href="/about#legal">Privacy Policy</Link></li>
            <li><Link href="/about#legal">Terms of Service</Link></li>
            <li><Link href="/about#legal">Affiliate Terms</Link></li>
            <li><Link href="/about#legal">Cookie Policy</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Web3 Job Alerts</h4>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: '.5rem', fontWeight: 300 }}>
            Get the latest Web3 opportunities in Africa, straight to your inbox.
          </p>
          <div className="newsletter-row">
            <input type="email" className="newsletter-input" placeholder="your@email.com" />
            <button className="newsletter-btn" type="button" onClick={() => alert('Thank you for subscribing to Web3 opportunities!')}>Join</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Sofe Node &middot; A Sofe Group Company &middot; All rights reserved.</p>
        <p style={{ color: 'var(--orange)' }}>Africa&apos;s Node for Web3 Growth.</p>
      </div>
    </footer>
  );
}
