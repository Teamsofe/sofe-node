'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutClient() {
  const stats = [
    { num: '5,000+', label: 'Web3 Users Onboarded', sub: 'Across Nigeria & beyond' },
    { num: '20+', label: 'Bootcamps Delivered', sub: 'From 2020 to date' },
    { num: '100+', label: 'Professionals Trained', sub: 'Certified & active' },
    { num: '80+', label: 'IRL & Virtual Events', sub: 'Driving community engagement' },
  ];

  const principles = [
    { icon: '⬡', title: 'Validation First', desc: 'Every decision — from talent assessment to market entry strategy — is data-validated before execution.' },
    { icon: '🔗', title: 'Network Over Silos', desc: 'We build interconnected nodes, not isolated programs. Our strength is the connections we forge.' },
    { icon: '🌍', title: 'Africa-Native', desc: 'Built for African infrastructure, bandwidth, and culture — not adapted from Western templates.' },
    { icon: '🚀', title: 'Impact at Scale', desc: 'We measure success in on-chain volume generated, careers launched, and communities sustained.' },
    { icon: '🔓', title: 'Radical Access', desc: 'Up to 80% of course fees covered by global ecosystem partners. Web3 opportunity should not be gatekept by cost.' },
    { icon: '🤝', title: 'Mutual Growth', desc: 'Ecosystems grow through our users. Users grow through our Ecosystem Partners. The node validates both.' },
  ];

  const sdgs = [
    { num: 'SDG 1', title: 'No Poverty', desc: 'Creating jobs and income streams in the digital economy for African youth.' },
    { num: 'SDG 4', title: 'Quality Education', desc: 'Accessible, world-class blockchain training subsidised by global ecosystem partners.' },
    { num: 'SDG 8', title: 'Decent Work', desc: 'Building pathways to verified careers in the global Web3 talent market.' },
    { num: 'SDG 9', title: 'Innovation', desc: 'Laying the infrastructure for Web3 adoption across African campuses.' },
    { num: 'SDG 10', title: 'Reduced Inequalities', desc: 'Democratising access to global wealth creation tools previously unavailable in Africa.' },
  ];

  const team = [
    { name: 'Shedrack Ekpegbue', role: 'Founder & CEO', img: '/images/Team/SofeNodeShedrack Ekpegbue.jpg' },
    { name: 'Ejiofor Asogwah', role: 'Head of Operations', img: '/images/Team/SofeEjioforAsogwah.jpg' },
    { name: 'Gloria Chukwu', role: 'Community Lead', img: '/images/Team/SofeNodeGloriaChukwu.jpg' },
    { name: 'Joshua Caleb', role: 'Ecosystem Partnerships', img: '/images/Team/SofeNodeJoshuaCaleb.jpg' },
    { name: 'Annastesia Ezinne', role: 'Content & Media', img: '/images/Team/SofeNodeAnnastesiaEzinne.jpg' },
    { name: 'Okeke Emmanuel', role: 'Technical Lead', img: '/images/Team/SofeNodeOkekeEmmanuel.jpg' },
  ];

  const nodes = [
    { name: 'UNN Node', loc: 'University of Nigeria, Nsukka', img: '/images/Nodes/SofeNodeUNN.png' },
    { name: 'UniJos Node', loc: 'University of Jos', img: '/images/Nodes/SofeNodeUniJOS.png' },
    { name: 'UniBen Node', loc: 'University of Benin', img: '/images/Nodes/SofeNodeUniBEN.png' },
    { name: 'DSPG Node', loc: 'Delta State Polytechnic, Ogwashi-Uku', img: '/images/Nodes/SofeNodeDSPG.png' },
    { name: 'FPNO Node', loc: 'Federal Polytechnic, Nekede', img: '/images/Nodes/SofeNodeFPNO.png' },
  ];

  return (
    <>
      <link rel="stylesheet" href="/css/about.css" />

      {/* ── PAGE HEADER ── */}
      <header className="page-header">
        <div className="hero-content">
          <div className="ph-eyebrow">Our Story</div>
          <h1>
            Scaling Africa’s <em>Web3 Ecosystems</em> Through The <em>Node</em>
          </h1>
          <p className="ph-sub">
            Just as a node validates every transaction on a blockchain, Sofe Node validates talent, verifies market entry, and routes global Web3 innovation into Africa — reliably, at scale.
          </p>
          <div className="ph-btns">
            <Link href="/login" className="btn-primary">
              Join Our Community
            </Link>
            <Link href="/services/partners" className="btn-outline">
              Scale With Us
            </Link>
          </div>
        </div>
      </header>

      {/* ── PREMIUM STATS BAR ── */}
      <div className="stats-premium" style={{ background: 'var(--deep)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '2.5rem 5vw' }}>
        <div className="stats-premium-inner" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          {stats.map((s, idx) => (
            <div key={idx} className="spc">
              <div className="spc-num" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--orange)' }}>{s.num}</div>
              <div className="spc-label" style={{ fontWeight: 700, color: 'var(--white)', marginTop: '.2rem' }}>{s.label}</div>
              <div className="spc-sub" style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ORIGIN STORY ── */}
      <section id="origin" style={{ padding: '5rem 5vw' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          <div>
            <div className="section-tag" style={{ color: 'var(--blue)', fontWeight: 700, textTransform: 'uppercase', fontSize: '.75rem', marginBottom: '.5rem' }}>What We Are</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.2 }}>A Distribution <span style={{ color: 'var(--blue)' }}>Infrastructure</span>,<br />Not Just an Academy.</h2>
            <p className="body-text" style={{ marginTop: '1.2rem', color: 'var(--muted)', lineHeight: 1.7 }}>
              Sofe Node is a subsidiary of Sofe Group. We operate as an independent distribution network — the on-ramp for global Web3 innovation into Africa.
            </p>
            <p className="body-text" style={{ marginTop: '1rem', color: 'var(--muted)', lineHeight: 1.7 }}>
              We pioneer and facilitate blockchain adoption through virtual and in-person trainings, seminars, and conferences — building the framework and manpower needed to position Africa at the forefront of global tech disruption.
            </p>
            <p className="body-text" style={{ marginTop: '1rem', color: 'var(--muted)', lineHeight: 1.7 }}>
              For global protocols, we are the most efficient path to African market penetration, active user acquisition, and sustained community retention. For African talent, we are the fastest route to world-class skills, global employment, and financial independence.
            </p>
          </div>
          <div className="about-visual" style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '14px', padding: '2.5rem' }}>
            <div className="about-quote" style={{ fontSize: '1.05rem', fontStyle: 'italic', color: 'var(--white)', lineHeight: 1.8 }}>
              &ldquo;Just as a node validates every transaction on a blockchain, Sofe Node is an independent distribution network — acting as the on-ramp for global Web3 innovation, validating users and talent for market entry, user acquisition and retention.&rdquo;
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem', marginTop: '1.8rem' }}>
              <span style={{ background: 'rgba(20,40,255,.12)', color: '#6b8cff', padding: '.3rem .8rem', borderRadius: '6px', fontSize: '.75rem', fontWeight: 600 }}>B2B Distribution</span>
              <span style={{ background: 'rgba(20,40,255,.12)', color: '#6b8cff', padding: '.3rem .8rem', borderRadius: '6px', fontSize: '.75rem', fontWeight: 600 }}>B2C Education</span>
              <span style={{ background: 'rgba(20,40,255,.12)', color: '#6b8cff', padding: '.3rem .8rem', borderRadius: '6px', fontSize: '.75rem', fontWeight: 600 }}>Campus Nodes</span>
              <span style={{ background: 'rgba(20,40,255,.12)', color: '#6b8cff', padding: '.3rem .8rem', borderRadius: '6px', fontSize: '.75rem', fontWeight: 600 }}>Talent Validation</span>
              <span style={{ background: 'rgba(255,138,0,.12)', color: 'var(--orange)', padding: '.3rem .8rem', borderRadius: '6px', fontSize: '.75rem', fontWeight: 600 }}>Paystack Payouts</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES / PRINCIPLES ── */}
      <section style={{ background: 'var(--deep)', padding: '5rem 5vw' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ color: 'var(--orange)', fontWeight: 700, textTransform: 'uppercase', fontSize: '.75rem', marginBottom: '.5rem' }}>Our Principles</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>How We <span style={{ color: 'var(--orange)' }}>Operate</span></h2>
            <p style={{ color: 'var(--muted)', marginTop: '.5rem', maxWidth: '600px', margin: '.5rem auto 0' }}>Six principles that govern every bootcamp, every partnership, and every payout we process.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {principles.map((p, idx) => (
              <div key={idx} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.8rem' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '.8rem' }}>{p.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '.5rem' }}>{p.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 1.65 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── UN SDGS ── */}
      <section style={{ padding: '5rem 5vw' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ color: 'var(--blue)', fontWeight: 700, textTransform: 'uppercase', fontSize: '.75rem', marginBottom: '.5rem' }}>UN SDGs</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Driving Sustainable <span style={{ color: 'var(--blue)' }}>Development</span></h2>
            <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '.5rem auto 0' }}>We are committed to the United Nations Sustainable Development Goals — using technology to drive economic resilience across Africa.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
            {sdgs.map((sdg, idx) => (
              <div key={idx} style={{ background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.5rem' }}>
                <div style={{ color: 'var(--orange)', fontWeight: 800, fontSize: '.8rem', marginBottom: '.3rem' }}>{sdg.num}</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--white)', marginBottom: '.4rem' }}>{sdg.title}</div>
                <div style={{ color: 'var(--muted)', fontSize: '.8rem', lineHeight: 1.6 }}>{sdg.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE TEAM ── */}
      <section style={{ background: 'var(--deep)', padding: '5rem 5vw' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ color: 'var(--orange)', fontWeight: 700, textTransform: 'uppercase', fontSize: '.75rem', marginBottom: '.5rem' }}>The Team</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>The <span style={{ color: 'var(--orange)' }}>Nodes</span> Behind the Network</h2>
            <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '.5rem auto 0' }}>A lean, Africa-native team wiring together education, technology, and global ecosystem partnerships.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
            {team.map((m, idx) => (
              <div key={idx} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem', textAlign: 'center' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1rem', border: '2px solid var(--blue)' }}>
                  <img src={m.img} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--white)' }}>{m.name}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--orange)', marginTop: '.2rem' }}>{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAMPUS NODES ── */}
      <section style={{ padding: '5rem 5vw' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{ color: 'var(--blue)', fontWeight: 700, textTransform: 'uppercase', fontSize: '.75rem', marginBottom: '.5rem' }}>Campus Infrastructure</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Our Campus <span style={{ color: 'var(--blue)' }}>Nodes</span></h2>
            <p style={{ color: 'var(--muted)', maxWidth: '600px', margin: '.5rem auto 0' }}>Physical nodes on top Nigerian university campuses powering talent onboarding and protocol activations.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {nodes.map((node, idx) => (
              <div key={idx} style={{ background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', margin: '0 auto 1rem' }}>
                  <img src={node.img} alt={node.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ fontWeight: 700, color: 'var(--white)' }}>{node.name}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '.3rem' }}>{node.loc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
