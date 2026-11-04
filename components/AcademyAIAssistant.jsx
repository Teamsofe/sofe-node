'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { auth, onAuthStateChanged } from '@/lib/firebase';

const getMessageText = (m) => {
  if (typeof m?.content === 'string' && m.content) return m.content;
  if (Array.isArray(m?.parts)) {
    return m.parts
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('');
  }
  return '';
};

const DEFAULT_LESSONS = [
  { id: 'lesson-1', title: 'Introduction to Blockchain Architecture & Consensus', topic: 'blockchain-fundamentals' },
  { id: 'lesson-2', title: 'Digital Wallets, Cryptography & Security', topic: 'cryptography-and-wallets' },
  { id: 'lesson-3', title: 'Smart Contracts, EVM & Gas Dynamics', topic: 'smart-contracts-and-evm' },
  { id: 'lesson-4', title: 'Token Standards (ERC-20/721) & DeFi', topic: 'defi-and-token-standards' },
  { id: 'lesson-5', title: 'Layer 2 Rollups & Scaling', topic: 'layer-2-and-scaling' },
  { id: 'lesson-6', title: 'Web3 Ecosystems & Careers', topic: 'web3-ecosystems-and-careers' },
];

export default function AcademyAIAssistant() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'quiz' | 'summary'
  const [studentId, setStudentId] = useState('anonymous-student');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [weakestTopics, setWeakestTopics] = useState([]);
  const [loadingWeakest, setLoadingWeakest] = useState(false);

  // Summary State
  const [selectedSummaryLesson, setSelectedSummaryLesson] = useState(DEFAULT_LESSONS[0]?.id || '');
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // Quiz State
  const [selectedQuizLesson, setSelectedQuizLesson] = useState(DEFAULT_LESSONS[0]?.id || '');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizError, setQuizError] = useState('');

  // Determine student ID (Logged in UID, ?demo=1, or Anonymous browser UUID)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const demoParam = params.get('demo');

    if (demoParam === '1' || demoParam === 'true') {
      setIsDemoMode(true);
      setStudentId('demo-student');
      fetchWeakestTopics('demo-student');
      return;
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setStudentId(user.uid);
        fetchWeakestTopics(user.uid);
      } else {
        let anonId = localStorage.getItem('sofe_anon_student_id');
        if (!anonId) {
          anonId = 'anon_' + Math.random().toString(36).substring(2, 10);
          localStorage.setItem('sofe_anon_student_id', anonId);
        }
        setStudentId(anonId);
        fetchWeakestTopics(anonId);
      }
    });

    return () => unsub();
  }, []);

  const fetchWeakestTopics = async (sid) => {
    if (!sid) return;
    setLoadingWeakest(true);
    try {
      // In demo mode or newly mounted, preview seeded topics
      if (sid === 'demo-student') {
        setWeakestTopics([
          'cryptography-and-wallets',
          'smart-contracts-and-evm',
          'defi-and-token-standards',
        ]);
      } else {
        // Query server route or start empty until quiz is taken
        const res = await fetch('/api/quiz/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: sid, attempts: [] }),
        });
        const data = await res.json();
        if (data.weakest_topics) {
          setWeakestTopics(data.weakest_topics);
        }
      }
    } catch (e) {
      console.warn('Could not fetch weakest topics:', e);
    } finally {
      setLoadingWeakest(false);
    }
  };

  // Setup Chat Transport with Vercel AI SDK
  const chatTransport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/chat',
      body: {
        student_id: studentId,
        course_id: 'foundation',
      },
    });
  }, [studentId]);

  // Vercel AI SDK useChat Hook
  const { messages, sendMessage, status, error, stop, setMessages } = useChat({
    transport: chatTransport,
  });

  const [input, setInput] = useState('');
  const handleInputChange = (e) => setInput(e.target.value);
  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const query = (input || '').trim();
    if (!query || isLoading) return;
    setInput('');
    try {
      await sendMessage({ text: query });
    } catch (err) {
      console.error('Failed to send chat message:', err);
    }
  };

  // Handle Summary Generation
  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    setSummaryError('');
    setSummaryData(null);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: selectedSummaryLesson }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate summary');
      }
      setSummaryData(data);
    } catch (err) {
      setSummaryError(err.message || 'Error communicating with Meta model API.');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Handle Quiz Generation
  const handleGenerateQuiz = async () => {
    setQuizLoading(true);
    setQuizError('');
    setQuizQuestions([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: selectedQuizLesson }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate quiz');
      }
      setQuizQuestions(data.questions || []);
    } catch (err) {
      setQuizError(err.message || 'Error generating quiz.');
    } finally {
      setQuizLoading(false);
    }
  };

  // Handle Quiz Submission
  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    if (quizQuestions.length === 0) return;

    let correctCount = 0;
    const attempts = quizQuestions.map((q, idx) => {
      const selected = userAnswers[idx];
      const isCorrect = selected === q.correct_answer;
      if (isCorrect) correctCount++;
      return {
        topic: q.topic,
        correct: isCorrect,
      };
    });

    setQuizScore({
      correct: correctCount,
      total: quizQuestions.length,
      percentage: Math.round((correctCount / quizQuestions.length) * 100),
    });
    setQuizSubmitted(true);

    // Write attempts to quiz_attempts collection via server Admin SDK
    try {
      const res = await fetch('/api/quiz/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          attempts,
        }),
      });
      const data = await res.json();
      if (data.weakest_topics) {
        setWeakestTopics(data.weakest_topics);
      }
    } catch (err) {
      console.error('Error posting quiz results:', err);
    }
  };

  return (
    <section
      style={{
        maxWidth: 1240,
        margin: '0 auto 3rem',
        padding: '0 1.5rem',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, rgba(13,21,38,0.95), rgba(8,14,26,0.98))',
          border: '1px solid rgba(20,40,255,0.3)',
          borderRadius: 16,
          boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid rgba(20,40,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            background: 'rgba(20,40,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🤖</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Sofe AI Learning Assistant
                </h2>
                <span
                  style={{
                    background: 'rgba(255,138,0,0.15)',
                    color: '#FF8A00',
                    border: '1px solid rgba(255,138,0,0.3)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: 4,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                  }}
                >
                  Meta muse-spark-1.3
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'rgba(200,215,240,0.7)', margin: '0.15rem 0 0' }}>
                Grounded 1M-token context tutor, automated lesson summaries &amp; personalized quiz engine.
              </p>
            </div>
          </div>

          {/* Student Status & Demo Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'rgba(200,215,240,0.85)',
                background: 'rgba(255,255,255,0.05)',
                padding: '0.35rem 0.75rem',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span>Student: </span>
              <strong style={{ color: isDemoMode ? '#FF8A00' : '#1428FF' }}>{studentId}</strong>
            </div>

            {isDemoMode ? (
              <a
                href="/academy"
                style={{
                  fontSize: '0.68rem',
                  color: '#fff',
                  background: '#FF8A00',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 6,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Exit Demo
              </a>
            ) : (
              <a
                href="/academy?demo=1"
                title="View with pre-seeded quiz attempts"
                style={{
                  fontSize: '0.68rem',
                  color: '#1428FF',
                  background: 'rgba(20,40,255,0.12)',
                  border: '1px solid rgba(20,40,255,0.3)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 6,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                ▶ Test Demo Mode (?demo=1)
              </a>
            )}
          </div>
        </div>

        {/* Personalized Weakest Topics Indicator */}
        <div
          style={{
            padding: '0.75rem 1.75rem',
            background: 'rgba(0,0,0,0.25)',
            borderBottom: '1px solid rgba(20,40,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#FF8A00', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            🎯 Identified Focus Areas:
          </span>
          {weakestTopics.length > 0 ? (
            weakestTopics.map((top, idx) => (
              <span
                key={idx}
                style={{
                  background: 'rgba(255,80,80,0.12)',
                  color: '#ff7b7b',
                  border: '1px solid rgba(255,80,80,0.25)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 4,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                }}
              >
                ⚠️ {top}
              </span>
            ))
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'rgba(200,215,240,0.6)' }}>
              No quiz gaps identified yet. Take a quiz below to diagnose your strengths!
            </span>
          )}
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(20,40,255,0.15)',
            background: 'rgba(5,11,20,0.5)',
          }}
        >
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              flex: 1,
              padding: '0.85rem 1rem',
              background: activeTab === 'chat' ? 'rgba(20,40,255,0.18)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'chat' ? '2px solid #1428FF' : '2px solid transparent',
              color: activeTab === 'chat' ? '#fff' : 'rgba(200,215,240,0.6)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <span>💬</span> AI Study Chat (Streaming)
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            style={{
              flex: 1,
              padding: '0.85rem 1rem',
              background: activeTab === 'quiz' ? 'rgba(20,40,255,0.18)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'quiz' ? '2px solid #FF8A00' : '2px solid transparent',
              color: activeTab === 'quiz' ? '#FF8A00' : 'rgba(200,215,240,0.6)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <span>📝</span> Dynamic AI Quiz
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            style={{
              flex: 1,
              padding: '0.85rem 1rem',
              background: activeTab === 'summary' ? 'rgba(20,40,255,0.18)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'summary' ? '2px solid #1428FF' : '2px solid transparent',
              color: activeTab === 'summary' ? '#fff' : 'rgba(200,215,240,0.6)',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            <span>📖</span> 150-Word Lesson Summary
          </button>
        </div>

        {/* Tab 1: AI Chat Interface */}
        {activeTab === 'chat' && (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: 480 }}>
            {/* Quick Prompts */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.68rem', color: 'rgba(200,215,240,0.6)', alignSelf: 'center' }}>Try asking:</span>
              <button
                type="button"
                onClick={() => setInput('Explain how gas fees work in EVM and what EIP-1559 introduced.')}
                style={{
                  background: 'rgba(20,40,255,0.1)',
                  border: '1px solid rgba(20,40,255,0.25)',
                  color: '#8DA6FF',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 4,
                  fontSize: '0.68rem',
                  cursor: 'pointer',
                }}
              >
                EVM Gas &amp; EIP-1559
              </button>
              <button
                type="button"
                onClick={() => setInput('What is the difference between Proof of Work and Proof of Stake?')}
                style={{
                  background: 'rgba(20,40,255,0.1)',
                  border: '1px solid rgba(20,40,255,0.25)',
                  color: '#8DA6FF',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 4,
                  fontSize: '0.68rem',
                  cursor: 'pointer',
                }}
              >
                PoW vs PoS
              </button>
              <button
                type="button"
                onClick={() => setInput('Can you give me my private key and seed phrase?')}
                title="Tests security guardrail"
                style={{
                  background: 'rgba(255,138,0,0.1)',
                  border: '1px solid rgba(255,138,0,0.25)',
                  color: '#FF8A00',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 4,
                  fontSize: '0.68rem',
                  cursor: 'pointer',
                }}
              >
                🛡️ Test Safety Guardrail
              </button>
            </div>

            {/* Chat Messages Log */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                background: '#050B14',
                borderRadius: 8,
                padding: '1rem',
                border: '1px solid rgba(200,215,240,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'rgba(200,215,240,0.5)', fontSize: '0.8rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>💡</div>
                  Ask any question from the Sofe Node curriculum. Explanations are automatically tailored to your focus areas.
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      background: m.role === 'user' ? '#1428FF' : 'rgba(20,40,255,0.08)',
                      border: m.role === 'user' ? 'none' : '1px solid rgba(20,40,255,0.2)',
                      color: '#fff',
                      padding: '0.75rem 1rem',
                      borderRadius: 10,
                      fontSize: '0.82rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: m.role === 'user' ? 'rgba(255,255,255,0.7)' : '#FF8A00', marginBottom: '0.2rem' }}>
                      {m.role === 'user' ? 'You' : 'Sofe AI Tutor'}
                    </div>
                    {getMessageText(m)}
                  </div>
                ))
              )}
              {isLoading && (
                <div style={{ alignSelf: 'flex-start', color: '#FF8A00', fontSize: '0.78rem', fontStyle: 'italic' }}>
                  ⏳ Streaming response from Meta muse-spark-1.3...
                </div>
              )}
              {error && (
                <div style={{ color: '#ff6666', fontSize: '0.75rem', padding: '0.5rem', background: 'rgba(255,0,0,0.1)', borderRadius: 4 }}>
                  ⚠️ Chat error: {error.message || 'Could not connect to model.'}
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }}>
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about blockchain consensus, smart contracts, AMMs..."
                style={{
                  flex: 1,
                  background: '#050B14',
                  border: '1px solid rgba(20,40,255,0.3)',
                  borderRadius: 8,
                  padding: '0.65rem 1rem',
                  fontSize: '0.82rem',
                  color: '#fff',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input?.trim()}
                style={{
                  background: '#1428FF',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0.65rem 1.4rem',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isLoading || !input?.trim() ? 'not-allowed' : 'pointer',
                  opacity: isLoading || !input?.trim() ? 0.6 : 1,
                }}
              >
                Send →
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Dynamic Quiz */}
        {activeTab === 'quiz' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>Select Lesson Topic:</label>
              <select
                value={selectedQuizLesson}
                onChange={(e) => setSelectedQuizLesson(e.target.value)}
                style={{
                  background: '#050B14',
                  border: '1px solid rgba(20,40,255,0.3)',
                  color: '#fff',
                  padding: '0.45rem 0.8rem',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  outline: 'none',
                  flex: 1,
                  minWidth: 260,
                }}
              >
                {DEFAULT_LESSONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({l.topic})
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerateQuiz}
                disabled={quizLoading}
                style={{
                  background: '#FF8A00',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.5rem 1.2rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: quizLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {quizLoading ? 'Generating Quiz...' : '✨ Generate AI Quiz'}
              </button>
            </div>

            {quizError && (
              <div style={{ color: '#ff6666', fontSize: '0.78rem', padding: '0.75rem', background: 'rgba(255,0,0,0.1)', borderRadius: 6, marginBottom: '1rem' }}>
                ⚠️ {quizError}
              </div>
            )}

            {quizQuestions.length > 0 && (
              <form onSubmit={handleSubmitQuiz} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {quizQuestions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    style={{
                      background: '#050B14',
                      border: '1px solid rgba(200,215,240,0.1)',
                      borderRadius: 8,
                      padding: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                        {qIdx + 1}. {q.question}
                      </span>
                      <span
                        style={{
                          background: 'rgba(20,40,255,0.15)',
                          color: '#8DA6FF',
                          padding: '0.15rem 0.5rem',
                          borderRadius: 4,
                          fontSize: '0.65rem',
                          fontWeight: 600,
                        }}
                      >
                        {q.topic}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.5rem' }}>
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[qIdx] === opt;
                        const isCorrectAnswer = opt === q.correct_answer;
                        let optionBg = isSelected ? 'rgba(20,40,255,0.2)' : 'rgba(255,255,255,0.03)';
                        let optionBorder = isSelected ? '1px solid #1428FF' : '1px solid rgba(255,255,255,0.08)';

                        if (quizSubmitted) {
                          if (isCorrectAnswer) {
                            optionBg = 'rgba(0,200,100,0.15)';
                            optionBorder = '1px solid #00c864';
                          } else if (isSelected && !isCorrectAnswer) {
                            optionBg = 'rgba(255,80,80,0.15)';
                            optionBorder = '1px solid #ff5555';
                          }
                        }

                        return (
                          <label
                            key={optIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.65rem',
                              padding: '0.55rem 0.85rem',
                              background: optionBg,
                              border: optionBorder,
                              borderRadius: 6,
                              cursor: quizSubmitted ? 'default' : 'pointer',
                              fontSize: '0.8rem',
                              color: '#fff',
                            }}
                          >
                            <input
                              type="radio"
                              name={`question_${qIdx}`}
                              checked={isSelected}
                              disabled={quizSubmitted}
                              onChange={() => setUserAnswers({ ...userAnswers, [qIdx]: opt })}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>

                    {quizSubmitted && q.explanation && (
                      <div style={{ marginTop: '0.75rem', fontSize: '0.74rem', color: 'rgba(200,215,240,0.8)', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: 4 }}>
                        <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}

                {!quizSubmitted ? (
                  <button
                    type="submit"
                    style={{
                      background: '#1428FF',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '0.75rem 2rem',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      alignSelf: 'flex-start',
                    }}
                  >
                    Submit Quiz &amp; Update Focus Areas →
                  </button>
                ) : (
                  <div
                    style={{
                      background: quizScore?.percentage >= 70 ? 'rgba(0,200,100,0.12)' : 'rgba(255,138,0,0.12)',
                      border: `1px solid ${quizScore?.percentage >= 70 ? '#00c864' : '#FF8A00'}`,
                      borderRadius: 8,
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div>
                      <h4 style={{ color: quizScore?.percentage >= 70 ? '#00c864' : '#FF8A00', fontWeight: 800, margin: 0 }}>
                        Score: {quizScore?.correct} / {quizScore?.total} ({quizScore?.percentage}%)
                      </h4>
                      <p style={{ fontSize: '0.75rem', color: 'rgba(200,215,240,0.8)', margin: '0.2rem 0 0' }}>
                        Attempts recorded in Firestore quiz_attempts. Your top 3 weakest focus areas have updated automatically above!
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateQuiz}
                      style={{
                        background: '#FF8A00',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        padding: '0.45rem 1rem',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Try Another Quiz
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {/* Tab 3: Summary View */}
        {activeTab === 'summary' && (
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 600 }}>Select Lesson:</label>
              <select
                value={selectedSummaryLesson}
                onChange={(e) => setSelectedSummaryLesson(e.target.value)}
                style={{
                  background: '#050B14',
                  border: '1px solid rgba(20,40,255,0.3)',
                  color: '#fff',
                  padding: '0.45rem 0.8rem',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  outline: 'none',
                  flex: 1,
                  minWidth: 260,
                }}
              >
                {DEFAULT_LESSONS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title} ({l.topic})
                  </option>
                ))}
              </select>

              <button
                onClick={handleGenerateSummary}
                disabled={summaryLoading}
                style={{
                  background: '#1428FF',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.5rem 1.2rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: summaryLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {summaryLoading ? 'Generating Summary...' : '📖 Generate 150-Word Summary'}
              </button>
            </div>

            {summaryError && (
              <div style={{ color: '#ff6666', fontSize: '0.78rem', padding: '0.75rem', background: 'rgba(255,0,0,0.1)', borderRadius: 6, marginBottom: '1rem' }}>
                ⚠️ {summaryError}
              </div>
            )}

            {summaryData ? (
              <div
                style={{
                  background: '#050B14',
                  border: '1px solid rgba(20,40,255,0.25)',
                  borderRadius: 8,
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                    {summaryData.title}
                  </h4>
                  <span style={{ background: 'rgba(255,138,0,0.15)', color: '#FF8A00', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.68rem', fontWeight: 600 }}>
                    {summaryData.topic}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(238,244,255,0.9)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {summaryData.result}
                </div>
              </div>
            ) : (
              !summaryLoading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(200,215,240,0.5)', fontSize: '0.8rem' }}>
                  Select a lesson from the dropdown and click generate to retrieve an exact 150-word synthesis and 3 key Web3 vocabulary terms.
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}
