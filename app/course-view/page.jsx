import React, { Suspense } from 'react';
import CourseViewClient from '@/components/CourseViewClient';

export const metadata = {
  title: 'Classroom & Course View | Sofe Node',
  description: 'Interactive curriculum, live session recordings, assignments, and exam modules at Sofe Node.',
};

export default function CourseViewPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#04080F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <p>Loading Classroom...</p>
      </div>
    }>
      <CourseViewClient />
    </Suspense>
  );
}
