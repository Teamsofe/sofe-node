import React from 'react';

export const metadata = {
  title: 'Events | Sofe Node',
  description: 'Upcoming events and bootcamps at Sofe Node',
};

export default function EventsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#080E1A', color: '#c8d7f0' }}>
      <h1>Upcoming Events</h1>
      <p style={{ marginTop: '1rem', color: 'rgba(200, 215, 240, 0.7)' }}>Stay tuned for our upcoming bootcamps, workshops, and node network meetups.</p>
    </div>
  );
}
