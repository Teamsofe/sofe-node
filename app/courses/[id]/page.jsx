import React, { Suspense } from 'react';
import CourseDetailClient from '@/components/CourseDetailClient';

export function generateMetadata({ params }) {
  return {
    title: `Course Details - ${params.id.toUpperCase()} | Sofe Node`,
    description: 'Explore curriculum syllabus, modules, and enrollment requirements for this Sofe Node course.',
  };
}

export default function CourseByIdPage({ params }) {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', background: '#04080F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <p>Loading Course Details...</p>
      </div>
    }>
      <CourseDetailClient courseIdProp={params.id} />
    </Suspense>
  );
}
