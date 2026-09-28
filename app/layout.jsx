import { Poppins } from 'next/font/google';
import './globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import HexCanvas from '@/components/HexCanvas';
import ScrollReveal from '@/components/ScrollReveal';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Sofe Node — Africa\'s Node for Web3 Growth',
    template: '%s | Sofe Node',
  },
  description:
    "Africa's distribution infrastructure for Web3. Market entry, active users and retention for protocols. Learn, earn, build reputation and get rewarded for talent.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.variable}>
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
