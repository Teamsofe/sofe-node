import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import HexCanvas from '@/components/HexCanvas';
import ScrollReveal from '@/components/ScrollReveal';

export const metadata = {
  title: {
    default: "Sofe Node — Africa's Node for Web3 Growth",
    template: '%s | Sofe Node',
  },
  description:
    "Africa's distribution infrastructure for Web3. Market entry, active users and retention for protocols. Learn, earn, build reputation and get rewarded for talent.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/images/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(location.pathname!=='/')return;var seen=sessionStorage.getItem('sofe_node_intro_seen');var isReplay=location.search.indexOf('intro')!==-1||location.search.indexOf('replay')!==-1;if(!isReplay&&seen)return;if(!isReplay&&window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;document.documentElement.setAttribute('data-sofe-intro','pending');window.__sofeIntroFailsafe=setTimeout(function(){document.documentElement.removeAttribute('data-sofe-intro')},6000)}catch(e){}})();`
          }}
        />
      </head>
      <body>
        <HexCanvas />
        <Nav />
        <main>{children}</main>
        <Footer />
        <ScrollReveal />
      </body>
    </html>
  );
}
