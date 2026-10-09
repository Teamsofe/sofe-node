'use client';
import React from 'react';
import Link from 'next/link';

export default function AcademyClient() {
  return (
    <>
      

{/*  Universal Sofe Navbar (renders via JS)  */}


{/*  HERO  */}
<section className="cat-hero">
  <div className="cat-eyebrow">📚 Sofe Academy</div>
  <h1 className="cat-title">Master Web3.<br/>Build Your <em>Career.</em></h1>
  <p className="cat-sub">From blockchain fundamentals to industry-grade certifications — courses designed for the African market, recognised globally.</p>

  {/*  Filter pills with career track categories  */}
  <div className="cat-filters" id="catFilters">
    <button className="cat-filter-pill active" data-filter="all" onClick="filterCourses('all',this)">All Courses</button>
    <button className="cat-filter-pill" data-filter="foundation" onClick="filterCourses('foundation',this)">Foundation</button>
    <button className="cat-filter-pill" data-filter="development" onClick="filterCourses('development',this)">Development</button>
    <button className="cat-filter-pill" data-filter="data-security" onClick="filterCourses('data-security',this)">Data & Security</button>
    <button className="cat-filter-pill" data-filter="ai-automation" onClick="filterCourses('ai-automation',this)">AI & Automation</button>
    <button className="cat-filter-pill" data-filter="design" onClick="filterCourses('design',this)">Design</button>
    <button className="cat-filter-pill" data-filter="management" onClick="filterCourses('management',this)">Management</button>
    <button className="cat-filter-pill" data-filter="growth-media" onClick="filterCourses('growth-media',this)">Growth & Media</button>
    <button className="cat-filter-pill" data-filter="trading" onClick="filterCourses('trading',this)">Trading</button>
    <button className="cat-filter-pill" data-filter="executive" onClick="filterCourses('executive',this)">Executive</button>
  </div>
</section>

{/*  COURSES GRID  */}
<section className="courses-wrap">
  <div className="courses-grid" id="coursesGrid">
    <div className="courses-empty" id="coursesLoading">
      <div style={{"fontSize":"1.5rem","marginBottom":".5rem"}}>⏳</div>
      Loading courses…
    </div>
  </div>
</section>

{/*  BOTTOM CTA  */}
<section style={{"padding":"0 1.5rem"}}>
  <div className="cat-bottom-cta">
    <h2>Not sure where to start?</h2>
    <p>Begin with our free Foundation Course — the same modules included in every Career Track. Master the basics, then level up.</p>
    <a href="#course-foundation" className="course-cta" style={{"marginTop":".5rem"}}>Explore Foundation →</a>
  </div>
</section>

{/*  FOOTER (would come from include)  */}




{/*  Universal navbar  */}



    </>
  );
}
