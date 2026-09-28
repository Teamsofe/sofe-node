import React, { Suspense } from 'react';
import CourseDetailClient from '@/components/CourseDetailClient';

export const metadata = {
  title: 'Course Details | Sofe Node Academy',
  description: 'Explore curriculum syllabus, modules, and enrollment requirements for Sofe Node courses.',
};

export default function CourseDetailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', background: '#04080F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <p>Loading Course Details...</p>
      </div>
    }>
      <CourseDetailClient />
    </Suspense>
  );
}
