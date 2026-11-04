'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import FormattedMarkdown from '@/lib/markdownRenderer';

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
  { id: 'lesson-1-blockchain-architecture', title: '1. Blockchain Architecture & Consensus Mechanisms', topic: 'blockchain-fundamentals' },
  { id: 'lesson-2-cryptography-wallets', title: '2. Cryptography, Keys & Wallet Security', topic: 'cryptography-and-wallets' },
  { id: 'lesson-3-smart-contracts-evm', title: '3. Smart Contracts, EVM & Gas Economics', topic: 'smart-contracts-and-evm' },
  { id: 'lesson-4-defi-token-standards', title: '4. Token Standards (ERC-20/721) & DeFi', topic: 'defi-and-token-standards' },
  { id: 'lesson-5-layer-2-scaling', title: '5. Layer 2 Rollups & Blockchain Scaling', topic: 'layer-2-and-scaling' },
  { id: 'lesson-6-web3-ecosystems', title: '6. Web3 Ecosystems & Builder Careers', topic: 'web3-ecosystems-and-careers' },
];

export default function CourseAIAssistant({
  studentId,
  activeSession,
  activeModule,
  courseTitle = 'Sofe Node Academy',
  courseId = 'foundation',
  isLight = false,
  activeSubTab = 'chat',
  setActiveSubTab,
  initialPrompt = '',
  onClearInitialPrompt,
  quizResult = null,
}) {
  const currentTab = activeSubTab || 'chat';
  const setTab = setActiveSubTab || (() => {});

  const availableLessons = [
    ...(activeSession?.title ? [{ id: activeSession.id || 'current-lesson', title: `Current: ${activeSession.title}`, topic: activeSession.topic || 'blockchain-fundamentals' }] : []),
    ...DEFAULT_LESSONS,
  ];

  const [weakestTopics, setWeakestTopics] = useState([]);
  const [loadingWeakest, setLoadingWeakest] = useState(false);

  // Summary State
  const [selectedSummaryLesson, setSelectedSummaryLesson] = useState(availableLessons[0]?.id || 'lesson-1-blockchain-architecture');
  const [summaryData, setSummaryData] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Practice Quiz State
  const [selectedQuizLesson, setSelectedQuizLesson] = useState(availableLessons[0]?.id || 'lesson-1-blockchain-architecture');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizError, setQuizError] = useState('');

  const chatEndRef = useRef(null);

  // Setup Chat Transport with Vercel AI SDK
  const chatTransport = useMemo(() => {
    return new DefaultChatTransport({
      api: '/api/chat',
      body: {
        student_id: studentId || 'student',
        course_id: courseId || 'foundation',
      },
    });
  }, [studentId, courseId]);

  // Vercel AI SDK useChat
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
    setMessages,
  } = useChat({
    transport: chatTransport,
  });

  // Local state for chat input and loading
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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (currentTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, currentTab, isLoading]);

  // Handle incoming initial prompt
  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt, setInput, onClearInitialPrompt]);

  // Sync selected lesson with current active session if applicable
  useEffect(() => {
    if (activeSession?.title) {
      const match = availableLessons.find(
        (l) =>
          l.title.toLowerCase().includes(activeSession.title.toLowerCase()) ||
          activeSession.title.toLowerCase().includes(l.title.toLowerCase())
      );
      if (match) {
        setSelectedSummaryLesson(match.id);
        setSelectedQuizLesson(match.id);
      }
    }
  }, [activeSession]);

  const effectiveStudentId =
    studentId ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('sofe_anon_student_id') || 'demo-student'
      : 'demo-student');

  // Load student's weakest topics from server
  const fetchWeakestTopics = async (sid) => {
    const targetSid = sid || effectiveStudentId;
    setLoadingWeakest(true);
    try {
      if (targetSid === 'demo-student') {
        setWeakestTopics([
          'cryptography-and-wallets',
          'smart-contracts-and-evm',
          'defi-and-token-standards',
        ]);
        return;
      }
      const res = await fetch('/api/quiz/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: targetSid, attempts: [] }),
      });
      const data = await res.json();
      if (data.weakest_topics && data.weakest_topics.length > 0) {
        setWeakestTopics(data.weakest_topics);
      } else {
        // Fallback for seamless demo flow
        setWeakestTopics([
          'cryptography-and-wallets',
          'smart-contracts-and-evm',
          'defi-and-token-standards',
        ]);
      }
    } catch (e) {
      console.warn('Could not load weakest topics:', e);
      setWeakestTopics([
        'cryptography-and-wallets',
        'smart-contracts-and-evm',
        'defi-and-token-standards',
      ]);
    } finally {
      setLoadingWeakest(false);
    }
  };

  useEffect(() => {
    fetchWeakestTopics(effectiveStudentId);
  }, [effectiveStudentId]);

  // Sync weakest topics immediately when quizResult updates (e.g. after failing a Module Exam)
  useEffect(() => {
    if (quizResult) {
      fetchWeakestTopics(effectiveStudentId);
    }
  }, [quizResult]);

  // Summary generation handler
  const handleGenerateSummary = async (lessonId) => {
    const targetId = lessonId || selectedSummaryLesson;
    setSummaryLoading(true);
    setSummaryError('');
    setSummaryData(null);
    setCopiedSummary(false);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: targetId,
          course_id: courseId || 'foundation',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate summary');
      }
      setSummaryData(data);
    } catch (err) {
      setSummaryError(err.message || 'Error generating summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Practice Quiz generation handler
  const handleGenerateQuiz = async (lessonId) => {
    const targetId = lessonId || selectedQuizLesson;
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
        body: JSON.stringify({
          lesson_id: targetId,
          course_id: courseId || 'foundation',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate practice quiz');
      }
      setQuizQuestions(data.questions || []);
    } catch (err) {
      setQuizError(err.message || 'Error generating quiz.');
    } finally {
      setQuizLoading(false);
    }
  };

  // Submit Practice Quiz
  const handleSubmitPracticeQuiz = async (e) => {
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

    try {
      const res = await fetch('/api/quiz/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId || 'student',
          attempts,
        }),
      });
      const data = await res.json();
      if (data.weakest_topics) {
        setWeakestTopics(data.weakest_topics);
      }
    } catch (err) {
      console.error('Error posting practice quiz attempts:', err);
    }
  };

  // Copy summary text
  const handleCopySummary = () => {
    if (!summaryData) return;
    const textToCopy = summaryData.summary || summaryData.result || '';
    if (!textToCopy) return;

    const terms = (summaryData.key_terms || [])
      .map((k) => `• ${k.term}: ${k.definition}`)
      .join('\n');
    const fullText = terms
      ? `150-WORD LESSON SUMMARY:\n${textToCopy}\n\nKEY TERMS:\n${terms}`
      : `150-WORD LESSON SUMMARY:\n${textToCopy}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullText).then(() => {
          setCopiedSummary(true);
          setTimeout(() => setCopiedSummary(false), 2000);
        }).catch(() => {
          fallbackClipboardCopy(fullText);
        });
      } else {
        fallbackClipboardCopy(fullText);
      }
    } catch (_) {
      fallbackClipboardCopy(fullText);
    }
  };

  const fallbackClipboardCopy = (text) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (_) {}
  };

  // Format topic tags into human-friendly names
  const formatTopic = (t) => {
    return t
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid rgba(20,40,255,0.22)',
        background: isLight ? '#FFFFFF' : 'rgba(8,14,26,0.95)',
        boxShadow: isLight ? '0 4px 20px rgba(20,40,120,0.08)' : '0 8px 32px rgba(0,0,0,0.4)',
        minHeight: 520,
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          padding: '0.85rem 1rem',
          background: isLight ? 'rgba(224,236,255,0.7)' : 'rgba(20,40,255,0.08)',
          borderBottom: '1px solid rgba(20,40,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🤖</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: isLight ? '#0A0F24' : '#FFFFFF',
                }}
              >
                Sofe AI Tutor
              </span>
              <span
                style={{
                  background: 'rgba(255,138,0,0.15)',
                  color: '#FF8A00',
                  border: '1px solid rgba(255,138,0,0.3)',
                  padding: '0.1rem 0.35rem',
                  borderRadius: 4,
                  fontSize: '0.58rem',
                  fontWeight: 700,
                }}
              >
                muse-spark-1.3
              </span>
            </div>
            <div
              style={{
                fontSize: '0.68rem',
                color: isLight ? 'rgba(20,30,70,0.65)' : 'rgba(200,215,240,0.65)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 210,
              }}
            >
              {activeSession?.title || courseTitle}
            </div>
          </div>
        </div>

        {/* Focus Areas Status Icon */}
        {weakestTopics.length > 0 && (
          <button
            onClick={() => setTab('weak')}
            title="Click to view identified weak areas"
            style={{
              background: 'rgba(255,80,80,0.12)',
              border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: 6,
              color: '#ff7b7b',
              padding: '0.25rem 0.5rem',
              fontSize: '0.66rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <span>⚠️</span> {weakestTopics.length} Focus {weakestTopics.length === 1 ? 'Area' : 'Areas'}
          </button>
        )}
      </div>

      {/* ── WEAK AREAS ACCORDION PILL ── */}
      {weakestTopics.length > 0 && currentTab !== 'weak' && (
        <div
          style={{
            padding: '0.45rem 0.85rem',
            background: isLight ? 'rgba(255,244,240,0.9)' : 'rgba(255,138,0,0.06)',
            borderBottom: '1px solid rgba(255,138,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.68rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
            <span style={{ color: '#FF8A00', fontWeight: 800 }}>🎯 Weak Topic:</span>
            <span
              style={{
                color: isLight ? '#A53B00' : '#FFB366',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 160,
              }}
            >
              {formatTopic(weakestTopics[0])}
            </span>
          </div>
          <button
            onClick={() => {
              setTab('chat');
              setInput(`Can you explain the key concepts of ${formatTopic(weakestTopics[0])} that I struggled with?`);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FF8A00',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.66rem',
              padding: 0,
            }}
          >
            Review with AI →
          </button>
        </div>
      )}

      {/* ── SUB-NAVIGATION TABS ── */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(20,40,255,0.15)',
          background: isLight ? 'rgba(240,244,255,0.7)' : 'rgba(4,8,16,0.6)',
        }}
      >
        <button
          onClick={() => setTab('chat')}
          style={{
            flex: 1,
            padding: '0.6rem 0.3rem',
            border: 'none',
            background: currentTab === 'chat' ? (isLight ? '#FFFFFF' : 'rgba(20,40,255,0.2)') : 'transparent',
            borderBottom: currentTab === 'chat' ? '2px solid #1428FF' : '2px solid transparent',
            color: currentTab === 'chat' ? (isLight ? '#1428FF' : '#FFFFFF') : (isLight ? '#4B5563' : 'rgba(200,215,240,0.6)'),
            fontWeight: 700,
            fontSize: '0.72rem',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          💬 Ask
        </button>
        <button
          onClick={() => setTab('quiz')}
          style={{
            flex: 1,
            padding: '0.6rem 0.3rem',
            border: 'none',
            background: currentTab === 'quiz' ? (isLight ? '#FFFFFF' : 'rgba(255,138,0,0.18)') : 'transparent',
            borderBottom: currentTab === 'quiz' ? '2px solid #FF8A00' : '2px solid transparent',
            color: currentTab === 'quiz' ? '#FF8A00' : (isLight ? '#4B5563' : 'rgba(200,215,240,0.6)'),
            fontWeight: 700,
            fontSize: '0.72rem',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          📝 Practice
        </button>
        <button
          onClick={() => setTab('summary')}
          style={{
            flex: 1,
            padding: '0.6rem 0.3rem',
            border: 'none',
            background: currentTab === 'summary' ? (isLight ? '#FFFFFF' : 'rgba(20,40,255,0.2)') : 'transparent',
            borderBottom: currentTab === 'summary' ? '2px solid #1428FF' : '2px solid transparent',
            color: currentTab === 'summary' ? (isLight ? '#1428FF' : '#FFFFFF') : (isLight ? '#4B5563' : 'rgba(200,215,240,0.6)'),
            fontWeight: 700,
            fontSize: '0.72rem',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          📖 Summary
        </button>
        <button
          onClick={() => setTab('weak')}
          style={{
            flex: 1,
            padding: '0.6rem 0.3rem',
            border: 'none',
            background: currentTab === 'weak' ? (isLight ? '#FFFFFF' : 'rgba(255,80,80,0.18)') : 'transparent',
            borderBottom: currentTab === 'weak' ? '2px solid #FF5050' : '2px solid transparent',
            color: currentTab === 'weak' ? '#FF5050' : (isLight ? '#4B5563' : 'rgba(200,215,240,0.6)'),
            fontWeight: 700,
            fontSize: '0.72rem',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          🎯 Weak Areas
        </button>
      </div>

      {/* ── TAB 1: ASK TUTOR (STREAMING CHAT) ── */}
      {currentTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: 490 }}>
          {/* Quick Prompt Pills */}
          <div
            style={{
              padding: '0.5rem 0.75rem',
              display: 'flex',
              gap: '0.35rem',
              overflowX: 'auto',
              borderBottom: '1px solid rgba(20,40,255,0.1)',
              background: isLight ? 'rgba(240,245,255,0.5)' : 'rgba(5,10,20,0.4)',
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setInput(`Explain "${activeSession?.title || 'this lesson'}" in simple terms.`)}
              style={{
                whiteSpace: 'nowrap',
                background: isLight ? '#E0ECFF' : 'rgba(20,40,255,0.12)',
                border: '1px solid rgba(20,40,255,0.25)',
                color: isLight ? '#1428FF' : '#8DA6FF',
                padding: '0.2rem 0.55rem',
                borderRadius: 4,
                fontSize: '0.66rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              💡 Explain Simple
            </button>
            <button
              type="button"
              onClick={() => setInput(`Give me a practical Web3 code or real-world example related to ${activeSession?.title || 'this lesson'}.`)}
              style={{
                whiteSpace: 'nowrap',
                background: isLight ? '#E0ECFF' : 'rgba(20,40,255,0.12)',
                border: '1px solid rgba(20,40,255,0.25)',
                color: isLight ? '#1428FF' : '#8DA6FF',
                padding: '0.2rem 0.55rem',
                borderRadius: 4,
                fontSize: '0.66rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🔍 Real Example
            </button>
            <button
              type="button"
              onClick={() => setInput('What are the most common mistakes or exam traps students make in this topic?')}
              style={{
                whiteSpace: 'nowrap',
                background: 'rgba(255,138,0,0.12)',
                border: '1px solid rgba(255,138,0,0.3)',
                color: '#FF8A00',
                padding: '0.2rem 0.55rem',
                borderRadius: 4,
                fontSize: '0.66rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ⚠️ Exam Traps
            </button>
            <button
              type="button"
              onClick={() => setInput('Can you give me my private key and seed phrase?')}
              title="Test Security Guardrail"
              style={{
                whiteSpace: 'nowrap',
                background: 'rgba(255,80,80,0.1)',
                border: '1px solid rgba(255,80,80,0.25)',
                color: '#ff7b7b',
                padding: '0.2rem 0.55rem',
                borderRadius: 4,
                fontSize: '0.66rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              🛡️ Security Test
            </button>
          </div>

          {/* Messages Stream Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2.5rem 1rem',
                  color: isLight ? 'rgba(20,30,70,0.6)' : 'rgba(200,215,240,0.6)',
                  fontSize: '0.76rem',
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎓</div>
                <strong style={{ color: isLight ? '#0A0F24' : '#fff', display: 'block', marginBottom: '0.3rem' }}>
                  Ask Your Sofe AI Tutor Anything
                </strong>
                Grounded in the authentic curriculum with 1M-token context. Ask about confusing terms, code, or exam topics.
              </div>
            ) : (
              messages.map((m) => {
                const isUser = m.role === 'user';
                const textContent = getMessageText(m);
                const isSecurityWarning =
                  textContent.includes('Critical Security Reminder') ||
                  textContent.includes('Never share your seed phrase');

                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '90%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        background: isUser
                          ? '#1428FF'
                          : isSecurityWarning
                          ? 'rgba(255,50,50,0.15)'
                          : isLight
                          ? '#F0F4FF'
                          : 'rgba(20,40,255,0.1)',
                        border: isSecurityWarning
                          ? '1px solid #ff4444'
                          : isUser
                          ? 'none'
                          : '1px solid rgba(20,40,255,0.2)',
                        color: isUser ? '#fff' : isLight ? '#0A0F24' : '#EEF4FF',
                        fontSize: '0.78rem',
                        lineHeight: 1.6,
                        wordBreak: 'break-word',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          marginBottom: '0.2rem',
                          color: isUser
                            ? 'rgba(255,255,255,0.7)'
                            : isSecurityWarning
                            ? '#ff5555'
                            : '#FF8A00',
                        }}
                      >
                        {isUser ? 'You' : 'Sofe AI Tutor'}
                      </div>
                      <FormattedMarkdown content={textContent} isUser={isUser} isLight={isLight} />
                    </div>
                  </div>
                );
              })
            )}

            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FF8A00', fontSize: '0.74rem' }}>
                <span className="ai-spin">⚡</span> Generating answer from curriculum...
              </div>
            )}

            {error && (
              <div
                style={{
                  background: 'rgba(255,80,80,0.12)',
                  border: '1px solid #ff5050',
                  color: '#ff7b7b',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 6,
                  fontSize: '0.72rem',
                }}
              >
                ⚠️ {error.message || 'Chat error. Please try again.'}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '0.65rem 0.75rem',
              borderTop: '1px solid rgba(20,40,255,0.18)',
              background: isLight ? '#FFFFFF' : 'rgba(5,10,20,0.7)',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question about this lesson..."
              style={{
                flex: 1,
                padding: '0.55rem 0.75rem',
                borderRadius: 6,
                border: '1px solid rgba(20,40,255,0.25)',
                background: isLight ? '#F0F4FF' : '#0D1526',
                color: isLight ? '#0A0F24' : '#fff',
                fontSize: '0.76rem',
                outline: 'none',
                pointerEvents: 'auto',
                cursor: 'text',
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input?.trim()}
              style={{
                background: isLoading || !input?.trim() ? 'rgba(20,40,255,0.4)' : '#1428FF',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '0.55rem 0.9rem',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: isLoading || !input?.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 2: PRE-EXAM PRACTICE QUIZ ── */}
      {currentTab === 'quiz' && (
        <div style={{ padding: '0.85rem', flex: 1, overflowY: 'auto', maxHeight: 490 }}>
          <div style={{ marginBottom: '0.85rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isLight ? '#0A0F24' : '#fff',
                marginBottom: '0.3rem',
              }}
            >
              Choose Practice Lesson:
            </label>
            <select
              value={selectedQuizLesson}
              onChange={(e) => setSelectedQuizLesson(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem',
                borderRadius: 6,
                border: '1px solid rgba(20,40,255,0.25)',
                background: isLight ? '#F0F4FF' : '#0D1526',
                color: isLight ? '#0A0F24' : '#fff',
                fontSize: '0.74rem',
                outline: 'none',
                marginBottom: '0.65rem',
              }}
            >
              {availableLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleGenerateQuiz()}
              disabled={quizLoading}
              style={{
                width: '100%',
                background: quizLoading ? 'rgba(255,138,0,0.5)' : '#FF8A00',
                color: '#000',
                border: 'none',
                borderRadius: 6,
                padding: '0.55rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: quizLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {quizLoading ? 'Generating Questions with AI...' : '⚡ Generate Practice Questions'}
            </button>
          </div>

          {quizError && (
            <div
              style={{
                background: 'rgba(255,80,80,0.12)',
                border: '1px solid #ff5050',
                color: '#ff7b7b',
                padding: '0.5rem',
                borderRadius: 6,
                fontSize: '0.72rem',
                marginBottom: '0.85rem',
              }}
            >
              ⚠️ {quizError}
            </div>
          )}

          {quizQuestions.length > 0 && (
            <form onSubmit={handleSubmitPracticeQuiz}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {quizQuestions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    style={{
                      background: isLight ? '#F4F7FF' : 'rgba(20,40,255,0.06)',
                      border: '1px solid rgba(20,40,255,0.18)',
                      borderRadius: 8,
                      padding: '0.75rem',
                    }}
                  >
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: isLight ? '#0A0F24' : '#fff', marginBottom: '0.5rem' }}>
                      {qIdx + 1}. {q.question}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[qIdx] === opt;
                        const isCorrectAnswer = q.correct_answer === opt;
                        let itemBg = isLight ? '#FFFFFF' : '#0D1526';
                        let itemBorder = 'rgba(20,40,255,0.15)';

                        if (quizSubmitted) {
                          if (isCorrectAnswer) {
                            itemBg = 'rgba(0,200,100,0.15)';
                            itemBorder = '#00c864';
                          } else if (isSelected && !isCorrectAnswer) {
                            itemBg = 'rgba(255,80,80,0.15)';
                            itemBorder = '#ff5050';
                          }
                        } else if (isSelected) {
                          itemBg = 'rgba(20,40,255,0.15)';
                          itemBorder = '#1428FF';
                        }

                        return (
                          <label
                            key={optIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              padding: '0.45rem 0.65rem',
                              borderRadius: 5,
                              background: itemBg,
                              border: `1px solid ${itemBorder}`,
                              cursor: quizSubmitted ? 'default' : 'pointer',
                              fontSize: '0.72rem',
                              color: isLight ? '#0A0F24' : '#EEF4FF',
                            }}
                          >
                            <input
                              type="radio"
                              name={`practice_q_${qIdx}`}
                              value={opt}
                              checked={isSelected}
                              disabled={quizSubmitted}
                              onChange={() => setUserAnswers({ ...userAnswers, [qIdx]: opt })}
                            />
                            <span>{opt}</span>
                            {quizSubmitted && isCorrectAnswer && (
                              <span style={{ marginLeft: 'auto', color: '#00c864', fontWeight: 700 }}>✓ Correct</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!quizSubmitted ? (
                <button
                  type="submit"
                  disabled={Object.keys(userAnswers).length < quizQuestions.length}
                  style={{
                    marginTop: '0.85rem',
                    width: '100%',
                    background: Object.keys(userAnswers).length < quizQuestions.length ? 'rgba(20,40,255,0.4)' : '#1428FF',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0.6rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: Object.keys(userAnswers).length < quizQuestions.length ? 'not-allowed' : 'pointer',
                  }}
                >
                  Submit Answers &amp; Check Results
                </button>
              ) : (
                <div
                  style={{
                    marginTop: '0.85rem',
                    padding: '0.85rem',
                    borderRadius: 8,
                    background: quizScore?.percentage >= 70 ? 'rgba(0,200,100,0.12)' : 'rgba(255,138,0,0.12)',
                    border: `1px solid ${quizScore?.percentage >= 70 ? '#00c864' : '#FF8A00'}`,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: quizScore?.percentage >= 70 ? '#00c864' : '#FF8A00' }}>
                    Score: {quizScore?.correct}/{quizScore?.total} ({quizScore?.percentage}%)
                  </div>
                  <p style={{ fontSize: '0.7rem', color: isLight ? '#333' : 'rgba(200,215,240,0.8)', margin: '0.3rem 0 0.6rem' }}>
                    {quizScore?.percentage >= 70
                      ? 'Great job! You are ready for the graded module exam.'
                      : 'Review the wrong questions with the tutor before taking your real attempt.'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleGenerateQuiz()}
                      style={{
                        background: '#FF8A00',
                        color: '#000',
                        border: 'none',
                        borderRadius: 5,
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Try Another Set
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTab('chat');
                        setInput(`I took a practice quiz on "${selectedQuizLesson}" and got ${quizScore?.correct}/${quizScore?.total}. Can you explain why the correct answers were right?`);
                      }}
                      style={{
                        background: '#1428FF',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 5,
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Ask Tutor to Explain
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {!quizLoading && quizQuestions.length === 0 && !quizError && (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                color: isLight ? 'rgba(20,30,70,0.6)' : 'rgba(200,215,240,0.6)',
                fontSize: '0.74rem',
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>🎯</div>
              Generate realistic multiple-choice questions validated against official topics before your real exam attempt.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: 150-WORD LESSON & COURSE SUMMARY ── */}
      {currentTab === 'summary' && (
        <div style={{ padding: '0.85rem', flex: 1, overflowY: 'auto', maxHeight: 490 }}>
          <div style={{ marginBottom: '0.85rem' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isLight ? '#0A0F24' : '#fff',
                marginBottom: '0.3rem',
              }}
            >
              Select Lesson to Summarize:
            </label>
            <select
              value={selectedSummaryLesson}
              onChange={(e) => setSelectedSummaryLesson(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem',
                borderRadius: 6,
                border: '1px solid rgba(20,40,255,0.25)',
                background: isLight ? '#F0F4FF' : '#0D1526',
                color: isLight ? '#0A0F24' : '#fff',
                fontSize: '0.74rem',
                outline: 'none',
                marginBottom: '0.65rem',
              }}
            >
              {availableLessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleGenerateSummary()}
              disabled={summaryLoading}
              style={{
                width: '100%',
                background: summaryLoading ? 'rgba(20,40,255,0.4)' : '#1428FF',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '0.55rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: summaryLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {summaryLoading ? 'Generating 150-Word Synthesis...' : '📖 Generate 150-Word Summary'}
            </button>
          </div>

          {summaryError && (
            <div
              style={{
                background: 'rgba(255,80,80,0.12)',
                border: '1px solid #ff5050',
                color: '#ff7b7b',
                padding: '0.5rem',
                borderRadius: 6,
                fontSize: '0.72rem',
                marginBottom: '0.85rem',
              }}
            >
              ⚠️ {summaryError}
            </div>
          )}

          {summaryData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Summary Card */}
              <div
                style={{
                  background: isLight ? '#F4F7FF' : 'rgba(20,40,255,0.06)',
                  border: '1px solid rgba(20,40,255,0.2)',
                  borderRadius: 8,
                  padding: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#1428FF', textTransform: 'uppercase' }}>
                    150-Word Synthesis
                  </span>
                  <button
                    onClick={handleCopySummary}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(20,40,255,0.25)',
                      color: isLight ? '#1428FF' : '#8DA6FF',
                      borderRadius: 4,
                      padding: '0.15rem 0.45rem',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {copiedSummary ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.7, color: isLight ? '#0A0F24' : '#EEF4FF' }}>
                  <FormattedMarkdown content={summaryData.summary} isLight={isLight} />
                </div>
              </div>

              {/* Key Terms */}
              {summaryData.key_terms && summaryData.key_terms.length > 0 && (
                <div
                  style={{
                    background: isLight ? '#FFF9F4' : 'rgba(255,138,0,0.06)',
                    border: '1px solid rgba(255,138,0,0.25)',
                    borderRadius: 8,
                    padding: '0.85rem',
                  }}
                >
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FF8A00', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    🔑 3 Key Web3 Terms
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {summaryData.key_terms.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '0.74rem', lineHeight: 1.6 }}>
                        <strong style={{ color: isLight ? '#994400' : '#FFAE52' }}>{item.term}:</strong>{' '}
                        <span style={{ color: isLight ? '#0A0F24' : '#EEF4FF' }}>{item.definition}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!summaryLoading && !summaryData && !summaryError && (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                color: isLight ? 'rgba(20,30,70,0.6)' : 'rgba(200,215,240,0.6)',
                fontSize: '0.74rem',
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>⚡</div>
              Condense any lesson into an exact 150-word synthesis and 3 key Web3 terms in seconds.
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: WEAK AREAS & EXAM RETAKE IMPROVEMENT ── */}
      {currentTab === 'weak' && (
        <div style={{ padding: '0.85rem', flex: 1, overflowY: 'auto', maxHeight: 490 }}>
          {/* Diagnostic Banner */}
          <div
            style={{
              padding: '0.85rem',
              borderRadius: 8,
              background: isLight ? '#FFF5F5' : 'rgba(255,80,80,0.1)',
              border: '1px solid rgba(255,80,80,0.3)',
              marginBottom: '0.85rem',
            }}
          >
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FF5050', marginBottom: '0.2rem' }}>
              🎯 Diagnostic Weak Areas
            </div>
            <p style={{ fontSize: '0.74rem', color: isLight ? '#444' : 'rgba(200,215,240,0.8)', margin: 0, lineHeight: 1.6 }}>
              Calculated by the Meta API from your quiz and exam attempts. Focus your revision here to pass your 1st or 2nd attempt!
            </p>
          </div>

          {/* Exam Status Callout if student recently submitted */}
          {quizResult && (
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 8,
                background: quizResult.passed ? 'rgba(0,200,100,0.1)' : 'rgba(255,138,0,0.12)',
                border: `1px solid ${quizResult.passed ? '#00c864' : '#FF8A00'}`,
                marginBottom: '0.85rem',
              }}
            >
              <div style={{ fontSize: '0.76rem', fontWeight: 800, color: quizResult.passed ? '#00c864' : '#FF8A00' }}>
                {quizResult.passed ? '✓ Exam Passed!' : '⚠️ Exam Attempt Under Pass Mark'}
              </div>
              <div style={{ fontSize: '0.72rem', color: isLight ? '#333' : '#fff', marginTop: '0.2rem' }}>
                Your Score: {quizResult.scorePct}% (Pass: {quizResult.passMark}%)
              </div>
            </div>
          )}

          {/* Identified Topics List */}
          {weakestTopics.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {weakestTopics.map((top, idx) => {
                const matchedLesson = availableLessons.find((l) => l.topic === top);
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 8,
                      background: isLight ? '#F4F7FF' : 'rgba(20,40,255,0.08)',
                      border: '1px solid rgba(20,40,255,0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#FF8A00' }}>
                        #{idx + 1} {formatTopic(top)}
                      </span>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          background: 'rgba(255,80,80,0.15)',
                          color: '#ff7b7b',
                          padding: '0.1rem 0.4rem',
                          borderRadius: 4,
                          fontWeight: 700,
                        }}
                      >
                        Needs Review
                      </span>
                    </div>

                    {matchedLesson && (
                      <div style={{ fontSize: '0.7rem', color: isLight ? 'rgba(20,30,70,0.7)' : 'rgba(200,215,240,0.7)', marginBottom: '0.5rem' }}>
                        Related: {matchedLesson.title}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => {
                          setTab('chat');
                          setInput(`Break down the core concepts of ${formatTopic(top)} for me with clear examples.`);
                        }}
                        style={{
                          flex: 1,
                          background: '#1428FF',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: '0.35rem',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Ask Tutor Explanations
                      </button>
                      {matchedLesson && (
                        <button
                          onClick={() => {
                            setSelectedQuizLesson(matchedLesson.id);
                            setTab('quiz');
                            handleGenerateQuiz(matchedLesson.id);
                          }}
                          style={{
                            flex: 1,
                            background: '#FF8A00',
                            color: '#000',
                            border: 'none',
                            borderRadius: 4,
                            padding: '0.35rem',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Targeted Practice Quiz
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                color: isLight ? 'rgba(20,30,70,0.6)' : 'rgba(200,215,240,0.6)',
                fontSize: '0.76rem',
              }}
            >
              <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>🌟</div>
              <strong>No weak areas recorded yet!</strong>
              <p style={{ margin: '0.4rem 0 0.8rem', fontSize: '0.72rem' }}>
                Take a practice quiz or course exam to automatically diagnose concepts that need reinforcement.
              </p>
              <button
                onClick={() => setTab('quiz')}
                style={{
                  background: '#FF8A00',
                  color: '#000',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.5rem 1rem',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Take a Diagnostic Quiz →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
