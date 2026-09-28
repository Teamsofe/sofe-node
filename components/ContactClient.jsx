'use client';
import { useState } from 'react';
import { db, collection, addDoc, serverTimestamp } from '@/lib/firebase';

export default function ContactClient() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    userType: 'General',
    subject: '',
    message: '',
  });
  const [status, setStatus] = useState({ loading: false, success: false, error: null });

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, success: false, error: null });

    try {
      if (!db) throw new Error('Database is not initialized');
      await addDoc(collection(db, 'contact_messages'), {
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        user_type: form.userType,
        subject: form.subject.trim(),
        message: form.message.trim(),
        status: 'unread',
        source: 'Sofe Node Contact Page (Next.js)',
        timestamp: serverTimestamp(),
      });

      setStatus({ loading: false, success: true, error: null });
      setForm({ firstName: '', lastName: '', email: '', userType: 'General', subject: '', message: '' });
    } catch (err) {
      console.error('Contact submit error:', err);
      setStatus({ loading: false, success: false, error: err.message || 'Failed to send message' });
    }
  }

  return (
    <>
      <link rel="stylesheet" href="/css/contact.css" />

      {/* ── HERO ── */}
      <section className="contact-hero" style={{ padding: '8rem 5vw 3rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div className="section-tag" style={{ color: 'var(--blue)', fontWeight: 700, textTransform: 'uppercase', fontSize: '.75rem', marginBottom: '.5rem' }}>Get In Touch</div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.6rem)', fontWeight: 800, lineHeight: 1.1, marginTop: '.75rem' }}>
            Talk to the <span style={{ color: 'var(--blue)' }}>Node</span>.
          </h1>
          <p className="body-text" style={{ maxWidth: '560px', margin: '1.2rem auto 0', color: 'var(--muted)', lineHeight: 1.7 }}>
            Whether you&apos;re a global protocol looking to enter the African market, a student ready to start your Web3 journey, or a partner exploring collaboration — we want to hear from you.
          </p>
          <p style={{ marginTop: '1rem', color: 'var(--orange)', fontSize: '.85rem', fontWeight: 600 }}>Response within 48 hours.</p>
        </div>
      </section>

      {/* ── CONTACT GRID ── */}
      <section style={{ padding: '2rem 5vw 6rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' }}>
          {/* FORM */}
          <form className="contact-form-card" onSubmit={handleSubmit} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2.5rem' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--white)', marginBottom: '.3rem' }}>Send a Message</h3>
            <p style={{ fontSize: '.82rem', color: 'var(--muted)', marginBottom: '1.8rem' }}>Fill in the form and our team will get back to you within 48 hours.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem' }}>First Name</label>
                <input
                  type="text"
                  required
                  value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                  style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '.88rem' }}
                  placeholder="Chukwuemeka"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem' }}>Last Name</label>
                <input
                  type="text"
                  required
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                  style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '.88rem' }}
                  placeholder="Obi"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem' }}>Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '.88rem' }}
                placeholder="you@example.com"
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem' }}>I am a...</label>
              <select
                value={form.userType}
                onChange={e => setForm({ ...form, userType: e.target.value })}
                style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '.88rem' }}
              >
                <option value="General">Individual / Sofian</option>
                <option value="Student">Student / Campus Node Member</option>
                <option value="Protocol">Protocol / Ecosystem Partner</option>
                <option value="Tutor">Educator / Tutor</option>
                <option value="Other">Corporate / Media</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem' }}>Subject</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '.88rem' }}
                placeholder="Partnership inquiry / Training question"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem' }}>Message</label>
              <textarea
                rows={4}
                required
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                style={{ width: '100%', padding: '.75rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '.88rem', resize: 'vertical' }}
                placeholder="Tell us how we can help..."
              />
            </div>

            <button
              type="submit"
              disabled={status.loading}
              style={{ width: '100%', padding: '.85rem', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '.9rem' }}
            >
              {status.loading ? 'Sending message...' : 'Send Message →'}
            </button>

            {status.success && (
              <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', borderRadius: '8px', padding: '14px 18px', marginTop: '16px', fontSize: '.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <span>✓</span> Message sent! We&apos;ll get back to you within 48 hours.
              </div>
            )}

            {status.error && (
              <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '8px', padding: '14px 18px', marginTop: '16px', fontSize: '.85rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <span>✕</span> {status.error} — email us at <a href="mailto:info@sofegroup.com" style={{ color: '#f87171', textDecoration: 'underline', marginLeft: '4px' }}>info@sofegroup.com</a>
              </div>
            )}
          </form>

          {/* CONTACT INFO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.8rem' }}>
              <div style={{ color: 'var(--orange)', fontSize: '1.5rem', marginBottom: '.6rem' }}>📍</div>
              <h4 style={{ color: 'var(--white)', fontSize: '1.1rem', marginBottom: '.4rem' }}>Headquarters &amp; Hub</h4>
              <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 1.6 }}>
                Sofe Group &middot; Lion Science Park, University of Nigeria, Nsukka, Enugu State, Nigeria.
              </p>
            </div>

            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.8rem' }}>
              <div style={{ color: 'var(--blue)', fontSize: '1.5rem', marginBottom: '.6rem' }}>✉️</div>
              <h4 style={{ color: 'var(--white)', fontSize: '1.1rem', marginBottom: '.4rem' }}>Direct Email</h4>
              <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 1.6 }}>
                General inquiries: <a href="mailto:info@sofegroup.com" style={{ color: 'var(--blue)', textDecoration: 'none' }}>info@sofegroup.com</a><br />
                Partnerships: <a href="mailto:partners@sofegroup.com" style={{ color: 'var(--blue)', textDecoration: 'none' }}>partners@sofegroup.com</a>
              </p>
            </div>

            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1.8rem' }}>
              <div style={{ color: '#10b981', fontSize: '1.5rem', marginBottom: '.6rem' }}>💬</div>
              <h4 style={{ color: 'var(--white)', fontSize: '1.1rem', marginBottom: '.4rem' }}>Community Channels</h4>
              <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 1.6 }}>
                Join our regional Telegram &amp; WhatsApp campus nodes for daily announcements, bounties, and community sessions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
