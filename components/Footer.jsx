import Link from 'next/link';

export default function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div className="footer-brand">
          <Link href="/" className="nav-logo" style={{ marginBottom: '.6rem' }}>
            <img src="/logo.png" className="logo-img" alt="Sofe Node Logo" />
            Sofe <span className="logo-word-node">Node</span>
          </Link>
          <p>A Sofe Group company. Empowering the next generation to lead Africa&apos;s tech revolution.</p>
          <div className="social-row">
            <a className="social-btn" href="https://twitter.com" target="_blank" rel="noopener noreferrer" title="X/Twitter">&#x1D54F;</a>
            <a className="social-btn" href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="LinkedIn">in</a>
            <a className="social-btn" href="https://facebook.com" target="_blank" rel="noopener noreferrer" title="Facebook">f</a>
            <a className="social-btn" href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram">&#9737;</a>
            <a className="social-btn" href="https://tiktok.com" target="_blank" rel="noopener noreferrer" title="TikTok">&#9835;</a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/services">Services</Link></li>
            <li><Link href="/bce">BCE</Link></li>
            <li><Link href="/dashboard">Dashboard</Link></li>
            <li><Link href="/verify">Verify Certificate</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
            <li><Link href="/affiliate-terms">Affiliate Terms</Link></li>
            <li><Link href="/cookies">Cookie Policy</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Web3 Job Alerts</h4>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: '.5rem', fontWeight: 300 }}>
            Get the latest Web3 opportunities in Africa, straight to your inbox.
          </p>
          <div className="newsletter-row">
            <input type="email" className="newsletter-input" placeholder="your@email.com" />
            <button className="newsletter-btn">Join</button>
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
