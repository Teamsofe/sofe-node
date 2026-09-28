'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  auth,
  db,
  functions,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  httpsCallable,
  serverTimestamp
} from '@/lib/firebase';

export default function CourseViewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseParam = searchParams.get('course') || 'foundation';

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [modules, setModules] = useState([]);
  const [sessionsByModule, setSessionsByModule] = useState({});
  const [progress, setProgress] = useState({});
  const [moduleProgress, setModuleProgress] = useState({});
  const [enrolmentStatus, setEnrolmentStatus] = useState(null);

  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [sideTab, setSideTab] = useState('curr'); // 'curr' | 'chat'

  // Quiz State
  const [quizLobbyOpen, setQuizLobbyOpen] = useState(true);
  const [quizTimer, setQuizTimer] = useState(null);
  const [remainingSecs, setRemainingSecs] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  // Assignment State
  const [assignmentInput, setAssignmentInput] = useState('');
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(null);

  // Feedback Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }
      setCurrentUser(user);
      await initCourse(user);
    });

    return () => unsub();
  }, [courseParam, router]);

  const initCourse = async (user) => {
    setLoading(true);
    try {
      // 1. Resolve Course
      let cid = null;
      let cData = null;
      const direct = await getDoc(doc(db, 'courses', courseParam.toLowerCase()));
      if (direct.exists()) {
        cid = direct.id;
        cData = direct.data();
      } else {
        const snap = await getDocs(query(collection(db, 'courses'), where('is_foundation', '==', true)));
        if (!snap.empty && courseParam === 'foundation') {
          cid = snap.docs[0].id;
          cData = snap.docs[0].data();
        }
      }

      if (!cid) {
        setLoading(false);
        showToast('Course not found.', 'error');
        return;
      }
      setCourseId(cid);
      setCourseData(cData);

      // 2. Check Enrolment
      const enrolSnap = await getDocs(
        query(collection(db, 'enrolments'), where('user_id', '==', user.uid), where('course_id', '==', cid))
      );
      if (enrolSnap.empty && courseParam !== 'foundation') {
        showToast('You are not enrolled in this course.', 'error');
        setLoading(false);
        return;
      }
      if (!enrolSnap.empty) {
        setEnrolmentStatus(enrolSnap.docs[0].data().status);
      }

      // 3. Load Modules & Sessions
      const modSnap = await getDocs(query(collection(db, 'modules'), where('course_id', '==', cid)));
      const mods = modSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
      setModules(mods);

      const sessMap = {};
      await Promise.all(
        mods.map(async (m) => {
          const sessSnap = await getDocs(query(collection(db, 'sessions'), where('module_id', '==', m.id)));
          sessMap[m.id] = sessSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order || 0) - (b.order || 0));
        })
      );
      setSessionsByModule(sessMap);

      // 4. Load Progress
      const progSnap = await getDocs(
        query(collection(db, 'module_progress'), where('user_id', '==', user.uid), where('course_id', '==', cid))
      );
      const modProgMap = {};
      const sessProgMap = {};
      progSnap.docs.forEach((d) => {
        const p = d.data();
        modProgMap[p.module_id] = p;
        const sc = p.sessions_completed || {};
        Object.keys(sc).forEach((sid) => {
          if (sc[sid]) sessProgMap[sid] = { completed: true };
        });
      });
      setModuleProgress(modProgMap);
      setProgress(sessProgMap);

      // Select first session if available
      if (mods.length > 0 && sessMap[mods[0].id]?.length > 0) {
        const firstM = mods[0];
        const firstS = sessMap[firstM.id][0];
        setActiveModuleId(firstM.id);
        setActiveSessionId(firstS.id);
        setActiveSession(firstS);
        await checkExistingSubmission(user.uid, firstS.id);
      }
    } catch (err) {
      console.error('Course view init error:', err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isModuleUnlocked = (moduleIndex) => {
    if (moduleIndex === 0) return true;
    const prevModule = modules[moduleIndex - 1];
    return !!moduleProgress[prevModule.id]?.completed_at;
  };

  const isSessionUnlocked = (session, sessionIndex, moduleIndex) => {
    if (!isModuleUnlocked(moduleIndex)) return false;
    if (sessionIndex === 0) return true;
    const prevSession = sessionsByModule[session.module_id]?.[sessionIndex - 1];
    return !!progress[prevSession?.id]?.completed;
  };

  const handleSelectSession = async (sess, modId) => {
    setActiveModuleId(modId);
    setActiveSessionId(sess.id);
    setActiveSession(sess);
    setQuizLobbyOpen(true);
    setQuizResult(null);
    setQuizAnswers({});
    if (quizTimer) clearInterval(quizTimer);

    if (currentUser) {
      await checkExistingSubmission(currentUser.uid, sess.id);
    }
  };

  const checkExistingSubmission = async (uid, sessionId) => {
    try {
      const snap = await getDoc(doc(db, 'session_submissions', `${uid}_${sessionId}`));
      if (snap.exists()) {
        setExistingSubmission(snap.data());
      } else {
        setExistingSubmission(null);
      }
    } catch (e) {
      setExistingSubmission(null);
    }
  };

  // Mark text/video session complete
  const handleMarkDone = async (sessionId, moduleId) => {
    try {
      try {
        const markFn = httpsCallable(functions, 'markSessionComplete');
        await markFn({ sessionId, moduleId });
      } catch (cloudErr) {
        // Fallback direct write to module_progress if callable function is offline
        const modRef = doc(db, 'module_progress', `${currentUser.uid}_${moduleId}`);
        await setDoc(
          modRef,
          {
            user_id: currentUser.uid,
            course_id: courseId,
            module_id: moduleId,
            sessions_completed: { [sessionId]: true },
            updated_at: serverTimestamp()
          },
          { merge: true }
        );
      }

      const updatedProg = { ...progress, [sessionId]: { completed: true } };
      setProgress(updatedProg);

      // Check if all sessions in module are completed
      const modSessions = sessionsByModule[moduleId] || [];
      const allDone = modSessions.every((s) => updatedProg[s.id]?.completed || s.id === sessionId);
      if (allDone) {
        setModuleProgress((prev) => ({
          ...prev,
          [moduleId]: { ...(prev[moduleId] || {}), completed_at: new Date() }
        }));
      }

      showToast('Session completed! Progress saved.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Submit Assignment with submission_url
  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentInput.trim()) {
      showToast('Please provide a submission link or answer.', 'error');
      return;
    }

    setAssignmentSubmitting(true);
    try {
      const submissionDoc = {
        user_id: currentUser.uid,
        session_id: activeSessionId,
        course_id: courseId,
        module_id: activeModuleId,
        type: 'assignment',
        submission_url: assignmentInput.trim(),
        status: 'pending',
        passed: false,
        submitted_at: serverTimestamp()
      };

      await setDoc(doc(db, 'session_submissions', `${currentUser.uid}_${activeSessionId}`), submissionDoc);

      setExistingSubmission(submissionDoc);
      showToast('Assignment submitted successfully! Awaiting tutor review.', 'success');
      setAssignmentInput('');
    } catch (err) {
      showToast('Error submitting assignment: ' + err.message, 'error');
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  // Quiz Handling
  const startQuiz = () => {
    setQuizLobbyOpen(false);
    const mins = Number(activeSession?.duration_minutes) || 15;
    let sec = mins * 60;
    setRemainingSecs(sec);

    const interval = setInterval(() => {
      sec--;
      setRemainingSecs(sec);
      if (sec <= 0) {
        clearInterval(interval);
        handleQuizSubmit(true);
      }
    }, 1000);
    setQuizTimer(interval);
  };

  const handleQuizSubmit = async (isAuto = false) => {
    if (quizTimer) clearInterval(quizTimer);
    setQuizSubmitting(true);

    const questions = activeSession?.questions || [];
    let correctCount = 0;

    questions.forEach((q, idx) => {
      if (Number(quizAnswers[idx]) === Number(q.correct_answer)) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / (questions.length || 1)) * 100);
    const passMark = activeSession?.passing_score || 70;
    const passed = scorePct >= passMark;

    try {
      await setDoc(doc(db, 'session_submissions', `${currentUser.uid}_${activeSessionId}`), {
        user_id: currentUser.uid,
        session_id: activeSessionId,
        course_id: courseId,
        module_id: activeModuleId,
        type: 'quiz',
        score: scorePct,
        passed,
        submitted_at: serverTimestamp()
      });

      if (passed) {
        setProgress((prev) => ({ ...prev, [activeSessionId]: { completed: true } }));
      }
      setQuizResult({ scorePct, passed, passMark });
      showToast(passed ? `Exam Passed with ${scorePct}%!` : `Exam Failed with ${scorePct}%. Required: ${passMark}%`, passed ? 'success' : 'error');
    } catch (err) {
      showToast('Error recording quiz: ' + err.message, 'error');
    } finally {
      setQuizSubmitting(false);
    }
  };

  // Calculate overall course progress percentage
  let totalSessions = 0;
  let doneSessions = 0;
  modules.forEach((m) => {
    const list = sessionsByModule[m.id] || [];
    totalSessions += list.length;
    list.forEach((s) => {
      if (progress[s.id]?.completed) doneSessions++;
    });
  });
  const overallPct = totalSessions > 0 ? Math.round((doneSessions / totalSessions) * 100) : 0;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#04080F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1.5s infinite linear' }}>📚</div>
          <p style={{ color: 'rgba(238,244,255,0.6)', fontSize: '0.85rem' }}>Loading learning experience...</p>
        </div>
      </div>
    );
  }

  // Parse video URL
  let embedUrl = null;
  const rawVideo = activeSession?.video_link || activeSession?.recording_link;
  if (rawVideo) {
    if (rawVideo.includes('youtube.com') || rawVideo.includes('youtu.be')) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/)([^#&?]*).*/;
      const match = rawVideo.match(regExp);
      const vid = match && match[2].length === 11 ? match[2] : null;
      if (vid) embedUrl = `https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1`;
    }
  }

  return (
    <div style={{ background: '#04080F', color: '#EEF4FF', minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: toast.type === 'error' ? 'rgba(255,80,80,0.95)' : toast.type === 'success' ? '#10b981' : '#1428FF',
          color: '#fff',
          borderRadius: 8,
          padding: '0.75rem 1.4rem',
          fontSize: '0.82rem',
          fontWeight: 600,
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
        }}>
          {toast.msg}
        </div>
      )}

      {/* TOP HEADER */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 64,
        background: '#080E1A',
        borderBottom: '1px solid rgba(20,40,255,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/dashboard" style={{ color: 'rgba(238,244,255,0.6)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, borderLeft: '1px solid rgba(20,40,255,0.2)', paddingLeft: '1rem' }}>
            {courseData?.title || 'Sofe Academy Course'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FF8A00' }}>{overallPct}%</span>
          <div style={{ width: 120, height: 6, background: 'rgba(255,138,0,0.15)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${overallPct}%`, background: '#FF8A00', borderRadius: 3, transition: 'width 0.3s' }}></div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div style={{
        maxWidth: 1600,
        margin: '0 auto',
        padding: '1.5rem',
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '1.5rem'
      }}>
        {/* LEFT COLUMN: ACTIVE CONTENT */}
        <main style={{
          background: '#0D1526',
          border: '1px solid rgba(20,40,255,0.18)',
          borderRadius: 12,
          padding: '1.5rem',
          minHeight: '75vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {activeSession ? (
            <div>
              {/* Header Title */}
              <div style={{ borderBottom: '1px solid rgba(200,215,240,0.1)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FF8A00', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <span>{activeSession.type === 'quiz' ? '📝 Exam' : activeSession.type === 'assignment' ? '📁 Assignment' : '▶ Video Lesson'}</span>
                  {activeSession.duration_minutes && <span>• ⏱ {activeSession.duration_minutes} Mins</span>}
                </div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.3rem' }}>{activeSession.title}</h1>
              </div>

              {/* 1. QUIZ VIEW */}
              {activeSession.type === 'quiz' ? (
                <div>
                  {quizLobbyOpen ? (
                    <div style={{ background: '#080E1A', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.75rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Exam Instructions</h3>
                      <p style={{ color: 'rgba(238,244,255,0.7)', fontSize: '0.8rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                        {activeSession.instructions ||
                          `You will be tested on the concepts covered in this module. Once you start, you will have ${activeSession.duration_minutes || 15} minutes to answer all questions. Pass mark is ${activeSession.passing_score || 70}%.`}
                      </p>
                      <button
                        onClick={startQuiz}
                        style={{
                          background: '#1428FF',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '0.7rem 1.6rem',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer'
                        }}
                      >
                        Start Exam Now →
                      </button>
                    </div>
                  ) : (
                    <div>
                      {/* Timer bar */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#080E1A',
                        padding: '0.8rem 1.2rem',
                        borderRadius: 8,
                        border: '1px solid rgba(20,40,255,0.2)',
                        marginBottom: '1.5rem'
                      }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Questions ({activeSession.questions?.length || 0})</span>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: remainingSecs < 60 ? '#ff5555' : '#FF8A00'
                        }}>
                          ⏱ {Math.floor(remainingSecs / 60)}:{String(remainingSecs % 60).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Questions List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {(activeSession.questions || []).map((q, qIdx) => (
                          <div key={qIdx} style={{ background: '#080E1A', padding: '1.25rem', borderRadius: 8, border: '1px solid rgba(200,215,240,0.1)' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.8rem' }}>
                              {qIdx + 1}. {q.text}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {(q.options || []).map((opt, optIdx) => (
                                <label
                                  key={optIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.65rem',
                                    padding: '0.6rem 0.8rem',
                                    borderRadius: 6,
                                    background: quizAnswers[qIdx] === optIdx ? 'rgba(20,40,255,0.15)' : 'rgba(200,215,240,0.03)',
                                    border: quizAnswers[qIdx] === optIdx ? '1px solid #1428FF' : '1px solid rgba(200,215,240,0.1)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <input
                                    type="radio"
                                    name={`question_${qIdx}`}
                                    checked={quizAnswers[qIdx] === optIdx}
                                    onChange={() => setQuizAnswers({ ...quizAnswers, [qIdx]: optIdx })}
                                  />
                                  <span>{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => handleQuizSubmit(false)}
                        disabled={quizSubmitting}
                        style={{
                          marginTop: '1.5rem',
                          background: '#1428FF',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '0.75rem 2rem',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        {quizSubmitting ? 'Submitting Answers...' : 'Submit Exam'}
                      </button>
                    </div>
                  )}

                  {quizResult && (
                    <div style={{
                      marginTop: '1.5rem',
                      padding: '1.25rem',
                      borderRadius: 8,
                      background: quizResult.passed ? 'rgba(0,200,100,0.12)' : 'rgba(255,80,80,0.12)',
                      border: `1px solid ${quizResult.passed ? '#00c864' : '#ff5555'}`
                    }}>
                      <h4 style={{ color: quizResult.passed ? '#00c864' : '#ff5555', fontWeight: 800 }}>
                        {quizResult.passed ? '🎉 Congratulations! You Passed!' : 'Exam Not Passed'}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'rgba(238,244,255,0.8)', marginTop: '0.2rem' }}>
                        Your Score: <strong>{quizResult.scorePct}%</strong> (Passing Mark: {quizResult.passMark}%)
                      </p>
                    </div>
                  )}
                </div>
              ) : activeSession.type === 'assignment' ? (
                /* 2. ASSIGNMENT VIEW */
                <div style={{ background: '#080E1A', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.6rem' }}>Assignment Task</h3>
                  <p style={{ color: 'rgba(238,244,255,0.8)', fontSize: '0.82rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                    {activeSession.instructions || 'Review the module materials and submit your completed assignment URL (GitHub, Google Docs, or Loom link).'}
                  </p>

                  {activeSession.resource_link && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <a
                        href={activeSession.resource_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#FF8A00', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'none' }}
                      >
                        📎 View Assignment Resource / Template →
                      </a>
                    </div>
                  )}

                  {existingSubmission ? (
                    <div style={{ background: 'rgba(20,40,255,0.08)', border: '1px solid rgba(20,40,255,0.25)', borderRadius: 8, padding: '1rem', marginTop: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          background: existingSubmission.passed ? 'rgba(0,200,100,0.2)' : 'rgba(255,138,0,0.2)',
                          color: existingSubmission.passed ? '#00c864' : '#FF8A00',
                          padding: '0.25rem 0.65rem',
                          borderRadius: 4,
                          fontSize: '0.72rem',
                          fontWeight: 700
                        }}>
                          {existingSubmission.passed ? '✓ Graded & Passed' : '⏳ Pending Review by Tutor'}
                        </span>
                        {existingSubmission.score && (
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#10b981' }}>Score: {existingSubmission.score} pts</span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'rgba(238,244,255,0.7)', marginTop: '0.8rem' }}>
                        Your Submission:{' '}
                        <a href={existingSubmission.submission_url} target="_blank" rel="noopener noreferrer" style={{ color: '#6b8cff' }}>
                          {existingSubmission.submission_url}
                        </a>
                      </div>
                      {existingSubmission.feedback && (
                        <div style={{ marginTop: '0.6rem', fontSize: '0.74rem', background: '#0D1526', padding: '0.6rem', borderRadius: 4 }}>
                          <strong>Tutor Feedback:</strong> {existingSubmission.feedback}
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitAssignment}>
                      <label style={{ display: 'block', fontSize: '0.74rem', color: 'rgba(200,215,240,0.7)', marginBottom: '0.4rem' }}>
                        Submission URL (Google Drive, GitHub repo, or Notion page)
                      </label>
                      <input
                        type="url"
                        required
                        placeholder="https://..."
                        value={assignmentInput}
                        onChange={(e) => setAssignmentInput(e.target.value)}
                        style={{
                          width: '100%',
                          background: '#0D1526',
                          border: '1px solid rgba(20,40,255,0.25)',
                          borderRadius: 6,
                          padding: '0.65rem',
                          color: '#fff',
                          fontSize: '0.82rem',
                          marginBottom: '1rem'
                        }}
                      />
                      <button
                        type="submit"
                        disabled={assignmentSubmitting}
                        style={{
                          background: '#1428FF',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '0.65rem 1.6rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {assignmentSubmitting ? 'Submitting...' : 'Submit Assignment'}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                /* 3. VIDEO / LESSON VIEW */
                <div>
                  {embedUrl ? (
                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 10, overflow: 'hidden', background: '#000', marginBottom: '1.5rem' }}>
                      <iframe
                        src={embedUrl}
                        title={activeSession.title}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        allowFullScreen
                      />
                    </div>
                  ) : rawVideo ? (
                    <div style={{ background: '#080E1A', border: '1px solid rgba(20,40,255,0.2)', borderRadius: 10, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎬</div>
                      <a
                        href={rawVideo}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#1428FF',
                          color: '#fff',
                          borderRadius: 6,
                          padding: '0.6rem 1.4rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          textDecoration: 'none',
                          display: 'inline-block'
                        }}
                      >
                        Open Session Recording in New Tab →
                      </a>
                    </div>
                  ) : null}

                  <div style={{ fontSize: '0.85rem', color: 'rgba(238,244,255,0.75)', lineHeight: 1.8 }}>
                    {activeSession.description || 'Watch the session video and complete the practical exercises.'}
                  </div>

                  <div style={{ marginTop: '2rem' }}>
                    {progress[activeSession.id]?.completed ? (
                      <span style={{ color: '#00c864', fontWeight: 700, fontSize: '0.85rem' }}>✓ Session Completed</span>
                    ) : (
                      <button
                        onClick={() => handleMarkDone(activeSession.id, activeModuleId)}
                        style={{
                          background: '#1428FF',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 8,
                          padding: '0.7rem 1.6rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Mark as Complete →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(238,244,255,0.5)' }}>
              Select a session from the curriculum sidebar to start learning.
            </div>
          )}
        </main>

        {/* RIGHT COLUMN: PLAYLIST SIDEBAR */}
        <aside style={{
          background: '#0D1526',
          border: '1px solid rgba(20,40,255,0.18)',
          borderRadius: 12,
          padding: '1.25rem',
          height: 'fit-content'
        }}>
          {/* Subtabs */}
          <div style={{ display: 'flex', gap: '0.4rem', background: '#080E1A', padding: 4, borderRadius: 8, marginBottom: '1.25rem' }}>
            <button
              onClick={() => setSideTab('curr')}
              style={{
                flex: 1,
                background: sideTab === 'curr' ? '#1428FF' : 'transparent',
                border: 'none',
                color: sideTab === 'curr' ? '#fff' : 'rgba(238,244,255,0.6)',
                padding: '0.5rem',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Curriculum
            </button>
            <button
              onClick={() => setSideTab('chat')}
              style={{
                flex: 1,
                background: sideTab === 'chat' ? '#1428FF' : 'transparent',
                border: 'none',
                color: sideTab === 'chat' ? '#fff' : 'rgba(238,244,255,0.6)',
                padding: '0.5rem',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Live Chat 🔴
            </button>
          </div>

          {sideTab === 'curr' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {modules.map((m, mIdx) => {
                const unlocked = isModuleUnlocked(mIdx);
                const sList = sessionsByModule[m.id] || [];

                return (
                  <div key={m.id} style={{ background: '#080E1A', border: '1px solid rgba(20,40,255,0.18)', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{
                      padding: '0.8rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      background: 'rgba(20,40,255,0.06)',
                      borderBottom: '1px solid rgba(20,40,255,0.1)'
                    }}>
                      <span style={{
                        width: 22,
                        height: 22,
                        borderRadius: 4,
                        background: '#0D1526',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}>
                        {mIdx + 1}
                      </span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: unlocked ? '#fff' : 'rgba(238,244,255,0.4)' }}>
                        {m.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {sList.map((s, sIdx) => {
                        const sUnlocked = isSessionUnlocked(s, sIdx, mIdx);
                        const isDone = !!progress[s.id]?.completed;
                        const isActive = s.id === activeSessionId;
                        const icon = s.type === 'quiz' ? '📝' : s.type === 'assignment' ? '📁' : '▶';

                        return (
                          <div
                            key={s.id}
                            onClick={() => sUnlocked && handleSelectSession(s, m.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              padding: '0.65rem 1rem',
                              background: isActive ? 'rgba(20,40,255,0.15)' : 'transparent',
                              borderLeft: isActive ? '3px solid #1428FF' : '3px solid transparent',
                              cursor: sUnlocked ? 'pointer' : 'not-allowed',
                              opacity: sUnlocked ? 1 : 0.4
                            }}
                          >
                            <span style={{ fontSize: '0.78rem', color: isDone ? '#00c864' : '#FF8A00' }}>
                              {isDone ? '✓' : icon}
                            </span>
                            <span style={{ fontSize: '0.78rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {s.title}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'rgba(238,244,255,0.4)', fontSize: '0.78rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
              Live cohort chat connects automatically during scheduled live classes.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
