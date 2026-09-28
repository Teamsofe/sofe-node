/* ──────────────────────────────────────────────────────────────────────────
   sofe-navbar.js
   Sofe Node universal navigation bar
   
   USAGE:
     1. Add a placeholder div anywhere in your HTML <body>:
        <div id="sofe-navbar"></div>
     
     2. Add this script tag (before </body>):
        <script type="module" src="./js/sofe-navbar.js"></script>
     
     3. Make sure firebase.js is at ./firebase.js
   ────────────────────────────────────────────────────────────────────────── */

import { auth, onAuthStateChanged } from '../firebase.js';
// Firestore helpers are imported dynamically inside setupNotifications()
// so the navbar still loads even if firebase.js doesn't export them yet.

const NAV_HTML = `
<style id="sofe-nav-styles">
  /* ── Sofe Node Universal Navbar ── */
  .sofe-nav {
    position: fixed; top: 0; left: 0; right: 0;
    z-index: 1000;
    background: rgba(4, 8, 16, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(200,215,240,0.08);
    font-family: 'Poppins', system-ui, sans-serif;
  }
  /* Push body content down so the fixed navbar doesn't overlap */
  body { padding-top: 70px; }
  /* Page-header sections — body padding-top already clears the navbar; this is just design buffer */
  .page-header { padding-top: 1.5rem !important; }
  @media (max-width: 768px) {
    .page-header { padding-top: 1rem !important; }
  }
  .sofe-nav-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 1.5rem;
    height: 70px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 1.5rem;
  }
  .sofe-nav-logo {
    display: flex; align-items: center; gap: 0.55rem;
    text-decoration: none;
    flex-shrink: 0;
  }
  .sofe-nav-logo img {
    height: 1.7rem;
    width: auto;
    object-fit: contain;
  }

  /* Desktop links */
  .sofe-nav-links {
    display: flex; align-items: center;
    gap: 0.4rem;
    flex: 1;
    justify-content: center;
  }
  .sofe-nav-link {
    color: rgba(200,215,240,0.7);
    text-decoration: none;
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    padding: 0.5rem 0.9rem;
    border-radius: 6px;
    transition: color .18s, background .18s;
    white-space: nowrap;
    display: flex; align-items: center; gap: 0.3rem;
  }
  .sofe-nav-link:hover { color: #fff; background: rgba(255,255,255,0.04); }
  .sofe-nav-link.active { color: #FF8A00; }

  .sofe-nav-link .caret {
    font-size: 0.55rem;
    opacity: 0.6;
    margin-left: 0.15rem;
    transition: transform 0.2s;
  }
  .sofe-nav-dropdown:hover > .sofe-nav-link .caret {
    transform: rotate(180deg);
  }

  /* Dropdown */
  .sofe-nav-dropdown { position: relative; }
  .sofe-nav-dropdown-menu {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-4px);
    min-width: 220px;
    background: #0a1628;
    border: 1px solid rgba(200,215,240,0.1);
    border-radius: 10px;
    padding: 0.5rem;
    box-shadow: 0 12px 32px rgba(0,0,0,0.35);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.18s, transform 0.18s, visibility 0.18s;
    pointer-events: none;
  }
  .sofe-nav-dropdown:hover .sofe-nav-dropdown-menu,
  .sofe-nav-dropdown.open .sofe-nav-dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
    pointer-events: auto;
  }
  /* Invisible bridge to keep dropdown alive on hover */
  .sofe-nav-dropdown::after {
    content: '';
    position: absolute;
    top: 100%; left: 0; right: 0;
    height: 8px;
  }

  .sofe-nav-dropdown-item {
    display: flex; align-items: flex-start; flex-direction: column;
    padding: 0.65rem 0.85rem;
    text-decoration: none;
    border-radius: 7px;
    transition: background 0.15s;
  }
  .sofe-nav-dropdown-item:hover {
    background: rgba(255,138,0,0.08);
  }
  .sofe-nav-dropdown-title {
    color: #c8d7f0;
    font-size: 0.8rem;
    font-weight: 600;
  }
  .sofe-nav-dropdown-desc {
    color: rgba(200,215,240,0.4);
    font-size: 0.66rem;
    margin-top: 0.15rem;
    line-height: 1.4;
  }
  .sofe-nav-dropdown-item:hover .sofe-nav-dropdown-title { color: #fff; }

  /* Right-side CTAs */
  .sofe-nav-cta-group {
    display: flex; align-items: center; gap: 0.6rem;
    flex-shrink: 0;
  }
  .sofe-nav-secondary {
    color: rgba(200,215,240,0.8);
    text-decoration: none;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.5rem 0.9rem;
    border-radius: 6px;
    transition: color .18s, background .18s;
  }
  .sofe-nav-secondary:hover { color: #fff; background: rgba(255,255,255,0.04); }

  .sofe-nav-cta {
    background: #FF8A00;
    color: #000;
    text-decoration: none;
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.55rem 1.1rem;
    border-radius: 6px;
    transition: background .18s, transform .15s;
    border: 1px solid #FF8A00;
  }
  .sofe-nav-cta:hover {
    background: #ffa333;
    transform: translateY(-1px);
  }

  /*Theme toggle button*/
  .sofe-nav-theme-btn {
    background: transparent;
    border: 1px solid rgba(200,215,240,0.15);
    border-radius: 50%;
    width: 38px; height: 38px;
    color: rgba(200,215,240,0.9);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem;
    transition: all 0.18s;
    flex-shrink: 0;
  }
  .sofe-nav-theme-btn:hover {
    background: rgba(255,255,255,0.01);
    border-color: rgba(200,138,0,0.3);
    transform: rotate(15deg);
  }

  .sofe-nav-avatar {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: rgba(20,40,255,0.15);
    border: 1.5px solid rgba(20,40,255,0.4);
    display: flex; align-items: center; justify-content: center;
    color: #6b8cff;
    font-size: 0.78rem;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.18s;
  }
  .sofe-nav-avatar:hover {
    background: rgba(20,40,255,0.25);
    transform: scale(1.05);
  }

  /* Profile dropdown (avatar + menu) */
  .sofe-nav-profile { position: relative; display: flex; align-items: center; }
  .sofe-nav-profile-menu {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    min-width: 240px;
    background: #0a1628;
    border: 1px solid rgba(200,215,240,0.12);
    border-radius: 10px;
    padding: 0.5rem;
    box-shadow: 0 16px 40px rgba(0,0,0,0.45);
    opacity: 0; visibility: hidden;
    transform: translateY(-6px);
    transition: opacity .18s, transform .18s, visibility .18s;
    pointer-events: none;
  }
  .sofe-nav-profile.open .sofe-nav-profile-menu {
    opacity: 1; visibility: visible; transform: translateY(0);
    pointer-events: auto;
  }
  .sofe-nav-profile-header {
    padding: 0.7rem 0.85rem 0.85rem;
    border-bottom: 1px solid rgba(200,215,240,0.06);
    margin-bottom: 0.35rem;
  }
  .sofe-nav-profile-name {
    font-size: 0.85rem; font-weight: 700;
    color: #c8d7f0; margin-bottom: 0.15rem;
  }
  .sofe-nav-profile-email {
    font-size: 0.68rem; color: rgba(200,215,240,0.5);
    word-break: break-all;
  }
  .sofe-nav-profile-item {
    display: flex; align-items: center; gap: 0.65rem;
    padding: 0.6rem 0.85rem;
    text-decoration: none;
    color: #c8d7f0;
    font-size: 0.78rem; font-weight: 500;
    border-radius: 7px;
    transition: background 0.15s;
    background: transparent;
    border: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    font-family: inherit;
  }
  .sofe-nav-profile-item:hover {
    background: rgba(255,138,0,0.08);
    color: #fff;
  }
  .sofe-nav-profile-item.logout:hover {
    background: rgba(255,80,80,0.1);
    color: #ff7070;
  }
  .profile-item-icon {
    font-size: 0.85rem;
    color: rgba(200,215,240,0.5);
    width: 16px;
    text-align: center;
  }
  .sofe-nav-profile-item:hover .profile-item-icon { color: var(--orange, #FF8A00); }
  .sofe-nav-profile-divider {
    height: 1px;
    background: rgba(200,215,240,0.06);
    margin: 0.35rem 0;
  }

  /* Mobile burger */
  .sofe-nav-burger {
    display: none;
    background: transparent;
    border: 1px solid rgba(200,215,240,0.15);
    border-radius: 6px;
    width: 38px; height: 38px;
    color: #c8d7f0;
    cursor: pointer;
    align-items: center; justify-content: center;
    font-size: 1.1rem;
  }

  /* Mobile menu — full screen below navbar */
  .sofe-nav-mobile {
    display: none;
    position: fixed;
    top: 70px; left: 0;
    width: 100vw; 
    height: calc(100vh - 70px);
    height: calc(100dvh - 70px); /* Modern browsers: dynamic viewport height (handles mobile address bar) */
    background: #04080F;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 1.5rem 1.5rem 6rem;
    z-index: 999;
    animation: sofeNavSlideIn 0.2s ease-out;
    box-sizing: border-box;
  }
  .sofe-nav-mobile.open { display: block; }
  @keyframes sofeNavSlideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sofe-nav-mobile-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid rgba(200,215,240,0.06);
  }
  .sofe-nav-mobile-section:last-child {
    border-bottom: none;
  }
  .sofe-nav-mobile-label {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(200,215,240,0.4);
    margin-bottom: 0.75rem;
  }
  .sofe-nav-mobile a {
    display: block;
    padding: 0.75rem 0;
    color: #c8d7f0;
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
  }
  .sofe-nav-mobile a:hover { color: #FF8A00; }
  .sofe-nav-mobile a.active { color: #FF8A00; }
  .sofe-nav-mobile-cta-group {
    display: flex; flex-direction: column; gap: 0.6rem;
    margin-top: 1rem;
  }
  .sofe-nav-mobile-cta {
    text-align: center;
    padding: 0.85rem;
    border-radius: 8px;
    font-weight: 700;
    text-decoration: none;
  }
  .sofe-nav-mobile-cta.primary {
    background: #FF8A00;
    color: #000;
  }
  .sofe-nav-mobile-cta.secondary {
    border: 1px solid rgba(200,215,240,0.2);
    color: #c8d7f0;
  }

  /* Responsive breakpoint */
  @media (max-width: 980px) {
    .sofe-nav-links { display: none; }
    .sofe-nav-cta-group .sofe-nav-secondary,
    .sofe-nav-cta-group .sofe-nav-cta { display: none; }
    .sofe-nav-burger { display: flex; }
  }

  /* When body has nav-mobile-open class, lock scroll */
  body.sofe-nav-mobile-locked { overflow: hidden; }

  /* ── Light mode overrides ── */
body.light .sofe-nav {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
body.light .sofe-nav-link {
  color: rgba(20, 30, 60, 0.7);
}
body.light .sofe-nav-link:hover {
  color: #000;
  background: rgba(0, 0, 0, 0.04);
}
body.light .sofe-nav-link.active {
  color: #FF8A00;
}
body.light .sofe-nav-dropdown-menu {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}
body.light .sofe-nav-dropdown-title {
  color: #1a1a2e;
}
body.light .sofe-nav-dropdown-desc {
  color: rgba(20, 30, 60, 0.45);
}
body.light .sofe-nav-secondary {
  color: rgba(20, 30, 60, 0.8);
}
body.light .sofe-nav-secondary:hover {
  color: #000;
  background: rgba(0, 0, 0, 0.04);
}
body.light .sofe-nav-theme-btn {
  color: rgba(20, 30, 60, 0.8);
  border-color: rgba(0, 0, 0, 0.15);
}
body.light .sofe-nav-burger {
  color: #1a1a2e;
  border-color: rgba(0, 0, 0, 0.15);
}
body.light .sofe-nav-mobile {
  background: #ffffff;
}
body.light .sofe-nav-mobile a {
  color: #1a1a2e;
}
body.light .sofe-nav-mobile-label {
  color: rgba(20, 30, 60, 0.4);
}

  /* ── Notification Bell ── */
  .sofe-nav-bell-wrap {
    position: relative;
    display: flex; align-items: center;
  }
  .sofe-nav-bell-btn {
    position: relative;
    background: transparent;
    border: 1px solid rgba(200,215,240,0.15);
    border-radius: 50%;
    width: 38px; height: 38px;
    color: rgba(200,215,240,0.9);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.18s;
    flex-shrink: 0;
    padding: 0;
  }
  .sofe-nav-bell-btn:hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(255,138,0,0.3);
    color: #fff;
  }
  .sofe-nav-bell-btn.has-unread { color: #fff; }
  .sofe-nav-bell-btn.has-unread svg { animation: sofeBellWiggle 1.4s ease-in-out 0.4s 1; transform-origin: top center; }
  @keyframes sofeBellWiggle {
    0%, 100% { transform: rotate(0); }
    15% { transform: rotate(8deg); }
    30% { transform: rotate(-7deg); }
    45% { transform: rotate(5deg); }
    60% { transform: rotate(-3deg); }
    75% { transform: rotate(1deg); }
  }
  .sofe-nav-bell-badge {
    position: absolute;
    top: -3px; right: -3px;
    background: #FF3B3B;
    color: #fff;
    font-size: 0.6rem;
    font-weight: 700;
    min-width: 16px; height: 16px;
    padding: 0 4px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #04080F;
    box-sizing: content-box;
    line-height: 1;
  }
  .sofe-nav-bell-badge[hidden] { display: none !important; }

  .sofe-nav-bell-panel {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 360px;
    max-width: calc(100vw - 1.5rem);
    background: #0a1628;
    border: 1px solid rgba(200,215,240,0.12);
    border-radius: 12px;
    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
    opacity: 0; visibility: hidden;
    transform: translateY(-6px);
    transition: opacity .18s, transform .18s, visibility .18s;
    pointer-events: none;
    overflow: hidden;
    z-index: 1001;
  }
  .sofe-nav-bell-wrap.open .sofe-nav-bell-panel {
    opacity: 1; visibility: visible; transform: translateY(0);
    pointer-events: auto;
  }
  .sofe-nav-bell-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid rgba(200,215,240,0.06);
  }
  .sofe-nav-bell-title {
    color: #fff; font-size: 0.92rem; font-weight: 700;
    letter-spacing: 0.01em;
  }
  .sofe-nav-bell-mark-all {
    background: transparent;
    border: none;
    color: #6b8cff;
    font-family: inherit;
    font-size: 0.7rem; font-weight: 600;
    cursor: pointer;
    padding: 0.3rem 0.5rem;
    border-radius: 5px;
    transition: background 0.15s, color 0.15s;
  }
  .sofe-nav-bell-mark-all:hover {
    background: rgba(20,40,255,0.15);
    color: #c8d7f0;
  }
  .sofe-nav-bell-mark-all:disabled {
    opacity: 0.35; cursor: default;
  }
  .sofe-nav-bell-mark-all:disabled:hover {
    background: transparent; color: #6b8cff;
  }
  .sofe-nav-bell-tabs {
    display: flex;
    gap: 0;
    padding: 0 0.5rem;
    border-bottom: 1px solid rgba(200,215,240,0.06);
  }
  .sofe-nav-bell-tab {
    flex: 1;
    background: transparent; border: none;
    color: rgba(200,215,240,0.5);
    font-family: inherit;
    font-size: 0.72rem; font-weight: 600;
    letter-spacing: 0.02em;
    cursor: pointer;
    padding: 0.7rem 0.5rem;
    border-bottom: 2px solid transparent;
    transition: color 0.15s, border-color 0.15s;
    margin-bottom: -1px;
  }
  .sofe-nav-bell-tab:hover { color: #c8d7f0; }
  .sofe-nav-bell-tab.active {
    color: #FF8A00;
    border-bottom-color: #FF8A00;
  }
  .sofe-nav-bell-list {
    max-height: 380px;
    overflow-y: auto;
  }
  .sofe-nav-bell-list::-webkit-scrollbar { width: 6px; }
  .sofe-nav-bell-list::-webkit-scrollbar-thumb {
    background: rgba(200,215,240,0.15); border-radius: 3px;
  }
  .sofe-nav-bell-list::-webkit-scrollbar-track { background: transparent; }
  .sofe-nav-bell-item {
    display: block;
    padding: 0.85rem 1rem 0.85rem 1.4rem;
    border-bottom: 1px solid rgba(200,215,240,0.04);
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    transition: background 0.15s;
    position: relative;
  }
  .sofe-nav-bell-item:last-child { border-bottom: none; }
  .sofe-nav-bell-item:hover { background: rgba(255,255,255,0.02); }
  .sofe-nav-bell-item.unread { background: rgba(20,40,255,0.05); }
  .sofe-nav-bell-item.unread::before {
    content: '';
    position: absolute;
    left: 0.55rem; top: 1.15rem;
    width: 6px; height: 6px;
    background: #FF8A00;
    border-radius: 50%;
    box-shadow: 0 0 6px rgba(255,138,0,0.6);
  }
  .sofe-nav-bell-item-row {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.2rem;
  }
  .sofe-nav-bell-item-title {
    color: #c8d7f0;
    font-size: 0.82rem; font-weight: 600;
    line-height: 1.3;
  }
  .sofe-nav-bell-item-time {
    color: rgba(200,215,240,0.4);
    font-size: 0.65rem; font-weight: 500;
    white-space: nowrap;
    flex-shrink: 0;
    padding-top: 0.1rem;
  }
  .sofe-nav-bell-item-msg {
    color: rgba(200,215,240,0.65);
    font-size: 0.74rem;
    line-height: 1.45;
  }
  .sofe-nav-bell-item-tag {
    display: inline-block;
    font-size: 0.58rem; font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.18rem 0.5rem;
    border-radius: 3px;
    margin-top: 0.45rem;
  }
  .sofe-nav-bell-item-tag.personal {
    background: rgba(20,40,255,0.15);
    color: #6b8cff;
  }
  .sofe-nav-bell-item-tag.broadcast {
    background: rgba(255,138,0,0.12);
    color: #FF8A00;
  }
  .sofe-nav-bell-empty {
    padding: 2.5rem 1rem;
    text-align: center;
    color: rgba(200,215,240,0.4);
    font-size: 0.78rem;
  }
  .sofe-nav-bell-empty-icon {
    font-size: 1.6rem;
    opacity: 0.5;
    margin-bottom: 0.5rem;
  }

  @media (max-width: 480px) {
    .sofe-nav-bell-panel {
      position: fixed;
      top: 76px; right: 0.75rem; left: 0.75rem;
      width: auto; max-width: none;
    }
  }

  /* Light mode for bell */
  body.light .sofe-nav-bell-btn {
    border-color: rgba(0,0,0,0.15);
    color: rgba(20,30,60,0.8);
  }
  body.light .sofe-nav-bell-btn:hover {
    background: rgba(0,0,0,0.04);
    color: #000;
  }
  body.light .sofe-nav-bell-btn.has-unread { color: #1a1a2e; }
  body.light .sofe-nav-bell-badge { border-color: #fff; }
  body.light .sofe-nav-bell-panel {
    background: #ffffff;
    border-color: rgba(0,0,0,0.08);
    box-shadow: 0 16px 40px rgba(0,0,0,0.12);
  }
  body.light .sofe-nav-bell-title { color: #1a1a2e; }
  body.light .sofe-nav-bell-tab { color: rgba(20,30,60,0.5); }
  body.light .sofe-nav-bell-tab:hover { color: #1a1a2e; }
  body.light .sofe-nav-bell-tab.active { color: #FF8A00; }
  body.light .sofe-nav-bell-item:hover { background: rgba(0,0,0,0.02); }
  body.light .sofe-nav-bell-item.unread { background: rgba(20,40,255,0.03); }
  body.light .sofe-nav-bell-item-title { color: #1a1a2e; }
  body.light .sofe-nav-bell-item-msg { color: rgba(20,30,60,0.65); }
  body.light .sofe-nav-bell-item-time { color: rgba(20,30,60,0.4); }
  body.light .sofe-nav-bell-empty { color: rgba(20,30,60,0.4); }
</style>

<header class="sofe-nav">
  <div class="sofe-nav-inner">
    <a href="./" class="sofe-nav-logo" aria-label="Sofe Node home">
      <img src="./images/Nodes/SofeLogoHome.png" alt="Sofe Node" />
    </a>

    <!-- Desktop nav -->
    <nav class="sofe-nav-links" aria-label="Main">
      <a href="./" class="sofe-nav-link" data-page="home">Home</a>
      <a href="./academy.html" class="sofe-nav-link" data-page="academy">Academy</a>
      <a href="./bie.html" class="sofe-nav-link" data-page="cbie">CBIE</a>

      <div class="sofe-nav-dropdown">
        <a href="#" class="sofe-nav-link" data-page="services" onclick="event.preventDefault();this.parentElement.classList.toggle('open')">
          Services <span class="caret">▼</span>
        </a>
        <div class="sofe-nav-dropdown-menu" role="menu">
          <a href="./for-talents.html" class="sofe-nav-dropdown-item">
            <span class="sofe-nav-dropdown-title">For Talents</span>
            <span class="sofe-nav-dropdown-desc">Why join Sofe Node — outcomes & opportunities</span>
          </a>
          <a href="./for-ecosystems.html" class="sofe-nav-dropdown-item">
            <span class="sofe-nav-dropdown-title">For Ecosystems</span>
            <span class="sofe-nav-dropdown-desc">Partner with us — distribution into Africa</span>
          </a>
        </div>
      </div>

      <div class="sofe-nav-dropdown">
        <a href="#" class="sofe-nav-link" data-page="resources" onclick="event.preventDefault();this.parentElement.classList.toggle('open')">
          Resources <span class="caret">▼</span>
        </a>
        <div class="sofe-nav-dropdown-menu" role="menu">
          <a href="./blog.html" class="sofe-nav-dropdown-item">
            <span class="sofe-nav-dropdown-title">Blog</span>
            <span class="sofe-nav-dropdown-desc">Web3 insights & Sofe news</span>
          </a>
          <a href="./events.html" class="sofe-nav-dropdown-item">
            <span class="sofe-nav-dropdown-title">Events</span>
            <span class="sofe-nav-dropdown-desc">BCE conference & community meetups</span>
          </a>
          <a href="./about.html" class="sofe-nav-dropdown-item">
            <span class="sofe-nav-dropdown-title">About Us</span>
            <span class="sofe-nav-dropdown-desc">Our story, team, and mission</span>
          </a>
        </div>
      </div>

      <a href="./bounties.html" class="sofe-nav-link" data-page="bounties">Bounties</a>
    </nav>

    <!-- Right CTAs (logged out vs logged in) -->
    <div class="sofe-nav-cta-group">
     <button class="sofe-nav-theme-btn" id="sofeThemeBtn"
    onclick="toggleSofeTheme()" aria-label="Toggle theme" title="Toggle theme">
    
      <span id="sofeThemeIcon">🌙</span>
    </button>

      <!-- Notification Bell (logged-in only; hidden by default) -->
      <div class="sofe-nav-bell-wrap" id="sofeNavBellWrap" style="display:none;">
        <button class="sofe-nav-bell-btn" id="sofeNavBellBtn" onclick="toggleSofeBell(event)" aria-label="Notifications" title="Notifications" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
          <span class="sofe-nav-bell-badge" id="sofeNavBellBadge" hidden>0</span>
        </button>
        <div class="sofe-nav-bell-panel" id="sofeNavBellPanel" role="menu" aria-label="Notifications">
          <div class="sofe-nav-bell-header">
            <div class="sofe-nav-bell-title">Notifications</div>
            <button class="sofe-nav-bell-mark-all" id="sofeNavBellMarkAll" onclick="sofeMarkAllNotifsRead(event)" type="button">Mark all read</button>
          </div>
          <div class="sofe-nav-bell-tabs" role="tablist">
            <button class="sofe-nav-bell-tab active" data-tab="all" onclick="sofeSwitchBellTab('all', event)" type="button" role="tab">All</button>
            <button class="sofe-nav-bell-tab" data-tab="personal" onclick="sofeSwitchBellTab('personal', event)" type="button" role="tab">Personal</button>
            <button class="sofe-nav-bell-tab" data-tab="broadcast" onclick="sofeSwitchBellTab('broadcast', event)" type="button" role="tab">Updates</button>
          </div>
          <div class="sofe-nav-bell-list" id="sofeNavBellList">
            <div class="sofe-nav-bell-empty"><div class="sofe-nav-bell-empty-icon">🔔</div>No notifications yet</div>
          </div>
        </div>
      </div>

      <a href="./login.html" class="sofe-nav-cta" id="sofeNavSignIn">Sign In</a>
      <div class="sofe-nav-profile" id="sofeNavProfile" style="display:none;">
        <button class="sofe-nav-avatar" id="sofeNavAvatar" onclick="toggleSofeProfileMenu(event)" title="Account menu" aria-label="Account menu" type="button">
          <span id="sofeNavAvatarInitials">…</span>
        </button>
        <div class="sofe-nav-profile-menu" id="sofeNavProfileMenu" role="menu">
          <div class="sofe-nav-profile-header">
            <div class="sofe-nav-profile-name" id="sofeNavProfileName">Sofian</div>
            <div class="sofe-nav-profile-email" id="sofeNavProfileEmail">—</div>
          </div>
          <a href="./dashboard.html" class="sofe-nav-profile-item">
            <span class="profile-item-icon">◈</span>
            <span>My Dashboard</span>
          </a>
          <a href="./dashboard#tab-profile" class="sofe-nav-profile-item">
            <span class="profile-item-icon">◫</span>
            <span>Account Settings</span>
          </a>
          <button id="sofeInstallBtn" class="sofe-nav-profile-item" onclick="sofeTriggerInstall()" type="button" style="display:none;">
            <span class="profile-item-icon">📱</span>
            <span>Install App</span>
          </button>
          <div class="sofe-nav-profile-divider"></div>
          <button class="sofe-nav-profile-item logout" onclick="sofeNavLogout()" type="button">
            <span class="profile-item-icon">↩</span>
            <span>Log Out</span>
          </button>
        </div>
      </div>
      <button class="sofe-nav-burger" onclick="toggleSofeMobileNav()" aria-label="Open menu">
        ☰
      </button>
    </div>
  </div>

  <!-- Mobile menu -->
  <div class="sofe-nav-mobile" id="sofeMobileNav">
    <div class="sofe-nav-mobile-section">
      <a href="./" data-page="home">Home</a>
      <a href="./academy.html" data-page="academy">Academy</a>
      <a href="./bie.html" data-page="cbie">CBIE</a>
      <a href="./bounties.html" data-page="bounties">Bounties</a>
    </div>
    <div class="sofe-nav-mobile-section">
      <div class="sofe-nav-mobile-label">Services</div>
      <a href="./for-talents.html">For Talents</a>
      <a href="./for-ecosystems.html">For Ecosystems</a>
    </div>
    <div class="sofe-nav-mobile-section">
      <div class="sofe-nav-mobile-label">Resources</div>
      <a href="./blog.html">Blog</a>
      <a href="./events.html">Events</a>
      <a href="./about.html">About Us</a>
    </div>
    <div class="sofe-nav-mobile-cta-group" id="sofeMobileCtas">
      <a href="./login.html" class="sofe-nav-mobile-cta primary">Sign In</a>
    </div>
  </div>
</header>
`;

// ── Render the navbar ──────────────────────────────────────────────────────
function renderNavbar() {
  let mount = document.getElementById('sofe-navbar');
  if (!mount) {
    mount = document.createElement('div');
    mount.id = 'sofe-navbar';
    document.body.insertBefore(mount, document.body.firstChild);
  }
  mount.innerHTML = NAV_HTML;

  // Highlight active page based on URL or data-page attribute on body
  const path = window.location.pathname.split('/').pop().replace('.html','') || 'home';
  const activePage = document.body.dataset.navActive || path;

  document.querySelectorAll('[data-page]').forEach(el => {
    if (el.dataset.page === activePage) el.classList.add('active');
  });

  // Auth state — show profile menu if logged in, else show Sign In
  onAuthStateChanged(auth, (user) => {
    const signInBtn   = document.getElementById('sofeNavSignIn');
    const profileWrap = document.getElementById('sofeNavProfile');
    const avInit      = document.getElementById('sofeNavAvatarInitials');
    const profName    = document.getElementById('sofeNavProfileName');
    const profEmail   = document.getElementById('sofeNavProfileEmail');
    const mobileCtas  = document.getElementById('sofeMobileCtas');
    const bellWrap    = document.getElementById('sofeNavBellWrap');

    if (user) {
      // Hide Sign In with !important via inline style override
      if (signInBtn) {
        signInBtn.style.setProperty('display', 'none', 'important');
      }
      if (profileWrap) profileWrap.style.display = 'flex';
      if (bellWrap) bellWrap.style.display = 'flex';
      setupNotifications(user);

      // Initials from displayName or email
      let initials = '?';
      let displayName = 'Sofian';
      if (user.displayName) {
        displayName = user.displayName;
        const p = user.displayName.split(' ').filter(Boolean);
        initials = (p[0]?.[0] || '') + (p[p.length-1]?.[0] || '');
      } else if (user.email) {
        initials = user.email[0];
        displayName = user.email.split('@')[0];
      }
      if (avInit)    avInit.textContent = initials.toUpperCase() || '?';
      if (profName)  profName.textContent = displayName;
      if (profEmail) profEmail.textContent = user.email || '';

      // Mobile CTAs — show dashboard + logout instead of Sign In
      if (mobileCtas) {
        mobileCtas.innerHTML =
          '<a href="./dashboard.html" class="sofe-nav-mobile-cta primary">My Dashboard</a>' +
          '<button onclick="sofeNavLogout()" class="sofe-nav-mobile-cta secondary" style="border:none;cursor:pointer;font-family:inherit;font-size:inherit;width:100%;">Log Out</button>';
      }
    } else {
      // Logged out — restore Sign In, hide profile + bell
      if (signInBtn) {
        signInBtn.style.removeProperty('display');
      }
      if (profileWrap) profileWrap.style.display = 'none';
      if (bellWrap) {
        bellWrap.style.display = 'none';
        bellWrap.classList.remove('open');
      }
      teardownNotifications();
    }
  });

  // Close mobile menu on link click
  document.querySelectorAll('.sofe-nav-mobile a').forEach(a => {
    a.addEventListener('click', () => {
      document.getElementById('sofeMobileNav')?.classList.remove('open');
      document.body.classList.remove('sofe-nav-mobile-locked');
    });
  });

  // Close any open desktop dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sofe-nav-dropdown')) {
      document.querySelectorAll('.sofe-nav-dropdown.open').forEach(d => d.classList.remove('open'));
    }
  });
}

// Theme toggle (light/dark)
window.toggleSofeTheme = function() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem('sofe_theme', isLight ? 'light' : 'dark');
  const icon = document.getElementById('sofeThemeIcon');
  if (icon) icon.textContent = isLight ? '☀️' : '🌙';
};

//On load, apply saved theme preference
(function applySavedTheme() {
  const saved = localStorage.getItem('sofe_theme');
  if (saved === 'light') {
    document.body.classList.add('light');
  } else {
    document.body.classList.remove('light');
  }
  //Update icon when navbar renders
  document.addEventListener('DOMContentLoaded', () => {
    const icon = document.getElementById('sofeThemeIcon');
    if (icon) icon.textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
  });
})();

// Profile dropdown toggle
window.toggleSofeProfileMenu = function(e) {
  if (e) e.stopPropagation();
  const wrap = document.getElementById('sofeNavProfile');
  if (!wrap) return;
  wrap.classList.toggle('open');
};

// Logout — uses Firebase signOut
window.sofeNavLogout = async function() {
  try {
    const mod = await import('../firebase.js');
    await mod.signOut(mod.auth);
  } catch(err) { console.warn('Logout error:', err.message); }
  window.location.replace('./login.html');
};

// ──────────────────────────────────────────────────────────────────────
// Notification Bell — real-time Firestore listeners (personal + broadcast)
// ──────────────────────────────────────────────────────────────────────
//
// REQUIRED firebase.js exports for this to work:
//   db, collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc
// If any are missing, the bell will simply stay empty (no errors thrown).
//
// Firestore schema for the `notifications` collection:
//   {
//     user_id:    string | null,         // user UID for personal; null for broadcast
//     type:       "personal" | "broadcast",
//     title:      string,
//     message:    string,
//     link:       string | null,         // optional URL to navigate on click
//     category:   "blog" | "update" | "payout" | "referral" | "course" | string,
//     created_at: serverTimestamp(),
//     read:       boolean                // personal only; broadcast read state is per-device (localStorage)
//   }
// ──────────────────────────────────────────────────────────────────────

let _bellUnsubPersonal = null;
let _bellUnsubBroadcast = null;
let _bellNotifs = { personal: [], broadcast: [] };
let _bellActiveTab = 'all';
let _bellCurrentUser = null;
let _bellInitialRender = false;

const SOFE_READ_BROADCAST_KEY = 'sofe_read_broadcasts';

function sofeGetReadBroadcastIds() {
  try {
    const raw = localStorage.getItem(SOFE_READ_BROADCAST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function sofeSetReadBroadcastIds(ids) {
  try {
    // Cap at last 200 to keep localStorage bounded
    const capped = ids.slice(-200);
    localStorage.setItem(SOFE_READ_BROADCAST_KEY, JSON.stringify(capped));
  } catch {}
}
function sofeMarkBroadcastReadLocal(id) {
  const ids = sofeGetReadBroadcastIds();
  if (!ids.includes(id)) {
    ids.push(id);
    sofeSetReadBroadcastIds(ids);
  }
}

function sofeFormatNotifTime(ts) {
  if (!ts) return '';
  const date = ts && typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diff = (now - date) / 1000; // seconds
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff/86400) + 'd ago';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function sofeEscapeHTML(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sofeRenderBellList() {
  const list = document.getElementById('sofeNavBellList');
  const badge = document.getElementById('sofeNavBellBadge');
  const btn = document.getElementById('sofeNavBellBtn');
  const markAll = document.getElementById('sofeNavBellMarkAll');
  if (!list) return;

  // Merge & sort by created_at desc
  const merged = [..._bellNotifs.personal, ..._bellNotifs.broadcast]
    .sort((a, b) => {
      const ta = a.created_at && a.created_at.toMillis ? a.created_at.toMillis() : 0;
      const tb = b.created_at && b.created_at.toMillis ? b.created_at.toMillis() : 0;
      return tb - ta;
    });

  // Filter by active tab
  let filtered = merged;
  if (_bellActiveTab === 'personal')  filtered = merged.filter(n => n._kind === 'personal');
  if (_bellActiveTab === 'broadcast') filtered = merged.filter(n => n._kind === 'broadcast');

  // Unread count is global (not filtered)
  const unreadCount = merged.filter(n => !n._read).length;
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : String(unreadCount);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }
  if (btn) btn.classList.toggle('has-unread', unreadCount > 0 && !_bellInitialRender);
  if (markAll) markAll.disabled = unreadCount === 0;

  if (filtered.length === 0) {
    const emptyMsg = _bellActiveTab === 'personal'
      ? 'No personal notifications'
      : _bellActiveTab === 'broadcast'
        ? 'No updates yet'
        : 'No notifications yet';
    list.innerHTML = '<div class="sofe-nav-bell-empty"><div class="sofe-nav-bell-empty-icon">🔔</div>' + emptyMsg + '</div>';
    return;
  }

  list.innerHTML = filtered.map(n => {
    const unreadClass = n._read ? '' : 'unread';
    const tagClass = n._kind === 'personal' ? 'personal' : 'broadcast';
    const tagLabel = n._kind === 'personal' ? 'For you' : 'Update';
    const time = sofeFormatNotifTime(n.created_at);
    const title = sofeEscapeHTML(n.title || 'Notification');
    const msg = sofeEscapeHTML(n.message || '');
    const hasLink = !!(n.link && typeof n.link === 'string' && n.link.trim());
    const href = hasLink ? sofeEscapeHTML(n.link) : 'javascript:void(0)';
    return '<a href="' + href + '" class="sofe-nav-bell-item ' + unreadClass + '"' +
           ' data-notif-id="' + sofeEscapeHTML(n.id) + '"' +
           ' data-notif-kind="' + n._kind + '"' +
           ' data-has-link="' + (hasLink ? '1' : '0') + '"' +
           ' onclick="sofeOnNotifClick(event, this)">' +
      '<div class="sofe-nav-bell-item-row">' +
        '<div class="sofe-nav-bell-item-title">' + title + '</div>' +
        '<div class="sofe-nav-bell-item-time">' + time + '</div>' +
      '</div>' +
      (msg ? '<div class="sofe-nav-bell-item-msg">' + msg + '</div>' : '') +
      '<span class="sofe-nav-bell-item-tag ' + tagClass + '">' + tagLabel + '</span>' +
    '</a>';
  }).join('');

  // After first render, allow wiggle animation on subsequent unread changes
  _bellInitialRender = false;
}

window.sofeSwitchBellTab = function(tab, e) {
  if (e) e.stopPropagation();
  _bellActiveTab = tab;
  document.querySelectorAll('.sofe-nav-bell-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  sofeRenderBellList();
};

window.toggleSofeBell = function(e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  const wrap = document.getElementById('sofeNavBellWrap');
  if (!wrap) return;
  // Close profile menu if it's open
  const prof = document.getElementById('sofeNavProfile');
  if (prof) prof.classList.remove('open');
  wrap.classList.toggle('open');
};

window.sofeOnNotifClick = async function(e, anchor) {
  const id = anchor.dataset.notifId;
  const kind = anchor.dataset.notifKind;
  const hasLink = anchor.dataset.hasLink === '1';
  if (!hasLink) e.preventDefault();
  await sofeMarkNotifRead(id, kind);
};

async function sofeMarkNotifRead(id, kind) {
  try {
    if (kind === 'broadcast') {
      sofeMarkBroadcastReadLocal(id);
      const notif = _bellNotifs.broadcast.find(n => n.id === id);
      if (notif) notif._read = true;
      sofeRenderBellList();
    } else if (kind === 'personal' && _bellCurrentUser) {
      const fb = await import('../firebase.js');
      if (fb.doc && fb.updateDoc && fb.db) {
        const ref = fb.doc(fb.db, 'notifications', id);
        await fb.updateDoc(ref, { read: true });
        // The onSnapshot listener will re-render automatically
      }
    }
  } catch (err) {
    console.warn('[Notifications] markRead failed:', err.message);
  }
}

window.sofeMarkAllNotifsRead = async function(e) {
  if (e) e.stopPropagation();
  try {
    // Broadcast: stash all visible IDs in localStorage
    const broadcastIds = _bellNotifs.broadcast.map(n => n.id);
    const merged = Array.from(new Set([...sofeGetReadBroadcastIds(), ...broadcastIds]));
    sofeSetReadBroadcastIds(merged);
    _bellNotifs.broadcast.forEach(n => { n._read = true; });

    // Personal: write read=true to each unread Firestore doc
    if (_bellCurrentUser) {
      const fb = await import('../firebase.js');
      if (fb.doc && fb.updateDoc && fb.db) {
        const unread = _bellNotifs.personal.filter(n => !n._read);
        await Promise.all(unread.map(n => {
          const ref = fb.doc(fb.db, 'notifications', n.id);
          return fb.updateDoc(ref, { read: true }).catch(err => {
            console.warn('[Notifications] mark read failed for', n.id, err.message);
          });
        }));
      }
    }
    sofeRenderBellList();
  } catch (err) {
    console.warn('[Notifications] markAll failed:', err.message);
  }
};

async function setupNotifications(user) {
  // If listeners already exist for this user, don't re-subscribe
  if (_bellCurrentUser && _bellCurrentUser.uid === user.uid && (_bellUnsubPersonal || _bellUnsubBroadcast)) {
    return;
  }
  // Tear down any stale listeners first
  teardownNotifications(/*keepUI*/ true);

  try {
    const fb = await import('../firebase.js');
    const required = ['db', 'collection', 'query', 'where', 'orderBy', 'limit', 'onSnapshot'];
    const missing = required.filter(k => !fb[k]);
    if (missing.length) {
      console.warn('[Notifications] firebase.js is missing exports:', missing.join(', '),
                   '— bell will stay empty until these are exported.');
      return;
    }
    _bellCurrentUser = user;
    _bellInitialRender = true;

    // Personal notifications listener
    const qPersonal = fb.query(
      fb.collection(fb.db, 'notifications'),
      fb.where('user_id', '==', user.uid),
      fb.orderBy('created_at', 'desc'),
      fb.limit(20)
    );
    _bellUnsubPersonal = fb.onSnapshot(qPersonal, (snap) => {
      _bellNotifs.personal = snap.docs.map(d => {
        const data = d.data() || {};
        return {
          ...data,
          id: d.id,
          _kind: 'personal',
          _read: data.read === true,
        };
      });
      sofeRenderBellList();
    }, (err) => {
      console.warn('[Notifications] Personal query error:', err.message);
    });

    // Broadcast notifications listener
    const qBroadcast = fb.query(
      fb.collection(fb.db, 'notifications'),
      fb.where('type', '==', 'broadcast'),
      fb.orderBy('created_at', 'desc'),
      fb.limit(20)
    );
    _bellUnsubBroadcast = fb.onSnapshot(qBroadcast, (snap) => {
      const readIds = sofeGetReadBroadcastIds();
      _bellNotifs.broadcast = snap.docs.map(d => {
        const data = d.data() || {};
        return {
          ...data,
          id: d.id,
          _kind: 'broadcast',
          _read: readIds.includes(d.id),
        };
      });
      sofeRenderBellList();
    }, (err) => {
      console.warn('[Notifications] Broadcast query error:', err.message);
    });

  } catch (err) {
    console.warn('[Notifications] Setup failed:', err.message);
  }
}

function teardownNotifications(keepUI) {
  if (_bellUnsubPersonal)  { try { _bellUnsubPersonal();  } catch {} _bellUnsubPersonal = null; }
  if (_bellUnsubBroadcast) { try { _bellUnsubBroadcast(); } catch {} _bellUnsubBroadcast = null; }
  _bellNotifs = { personal: [], broadcast: [] };
  _bellCurrentUser = null;
  if (!keepUI) {
    const list = document.getElementById('sofeNavBellList');
    const badge = document.getElementById('sofeNavBellBadge');
    const btn = document.getElementById('sofeNavBellBtn');
    if (list) list.innerHTML = '';
    if (badge) badge.hidden = true;
    if (btn) btn.classList.remove('has-unread');
  }
}

// Close bell on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.sofe-nav-bell-wrap')) {
    const wrap = document.getElementById('sofeNavBellWrap');
    if (wrap) wrap.classList.remove('open');
  }
});

// Close profile dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.sofe-nav-profile')) {
    const wrap = document.getElementById('sofeNavProfile');
    if (wrap) wrap.classList.remove('open');
  }
});

// Mobile nav toggle (exposed globally for the burger button)
window.toggleSofeMobileNav = function() {
  const mobileNav = document.getElementById('sofeMobileNav');
  if (mobileNav) {
    const isOpen = mobileNav.classList.toggle('open');
    document.body.classList.toggle('sofe-nav-mobile-locked', isOpen);
  }
};


// Force-reveal any elements with .reveal class as a safety net
// (some pages use IntersectionObserver which can fail silently)
function forceReveal() {
  setTimeout(function() {
    document.querySelectorAll('.reveal').forEach(function(el) {
      if (!el.classList.contains('visible')) {
        el.classList.add('visible');
      }
    });
  }, 1500); // give the page's own observer a chance to fire first
}

// Init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    renderNavbar();
    forceReveal();
  });
} else {
  renderNavbar();
  forceReveal();
}

// ──────────────────────────────────────────────────────────────────────
// PWA Install handler
// Captures the beforeinstallprompt event and exposes a button to trigger it
// ──────────────────────────────────────────────────────────────────────
let _deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Stop browser's automatic mini-infobar
  e.preventDefault();
  // Stash the event for later
  _deferredInstallPrompt = e;
  // Show the install button in the dropdown
  const btn = document.getElementById('sofeInstallBtn');
  if (btn) {
    btn.style.display = 'flex';
    console.log('[PWA] Install prompt available — showing menu item');
  }
});

window.sofeTriggerInstall = async function() {
  if (!_deferredInstallPrompt) {
    // iOS doesn't fire beforeinstallprompt — show iOS-specific instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      alert('To install Sofe Node:\n\n1. Tap the Share button (□↑) at the bottom\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" in the top-right');
    } else {
      alert('Your browser doesn\'t support installation, or the app is already installed.');
    }
    return;
  }

  // Show the native install prompt
  _deferredInstallPrompt.prompt();
  const { outcome } = await _deferredInstallPrompt.userChoice;
  console.log('[PWA] User install choice:', outcome);

  // Clear the saved prompt — can only be used once
  _deferredInstallPrompt = null;

  // Hide the button
  const btn = document.getElementById('sofeInstallBtn');
  if (btn) btn.style.display = 'none';

  // Close the dropdown
  const wrap = document.getElementById('sofeNavProfile');
  if (wrap) wrap.classList.remove('open');
};

// When the app is successfully installed, hide the button
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installed successfully');
  const btn = document.getElementById('sofeInstallBtn');
  if (btn) btn.style.display = 'none';
  _deferredInstallPrompt = null;
});

// On iOS only: auto-show the install button (since beforeinstallprompt doesn't fire)
(function checkIOSInstallable() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isIOS && !isStandalone) {
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('sofeInstallBtn');
      if (btn) btn.style.display = 'flex';
    });
    // Also try after a delay in case navbar loads later
    setTimeout(() => {
      const btn = document.getElementById('sofeInstallBtn');
      if (btn) btn.style.display = 'flex';
    }, 2000);
  }
})();
