'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  collection,
  query,
  where,
  httpsCallable,
  serverTimestamp
} from '@/lib/firebase';
import qrcode from '@/lib/qrcodeGenerator';
import CourseAIAssistant from './CourseAIAssistant';

export default function CourseViewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseParam = searchParams.get('course') || 'foundation';

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLight, setIsLight] = useState(false);
  const [courseId, setCourseId] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [modules, setModules] = useState([]);
  const [sessionsByModule, setSessionsByModule] = useState({});
  const [progress, setProgress] = useState({});
  const [moduleProgress, setModuleProgress] = useState({});
  const [enrolmentStatus, setEnrolmentStatus] = useState(null);
  const [isCourseLocked, setIsCourseLocked] = useState(false);

  const [activeModuleId, setActiveModuleId] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [lastVideoSession, setLastVideoSession] = useState(null);
  const [sideTab, setSideTab] = useState('curr'); // 'curr' | 'ai'
  const [aiSubTab, setAiSubTab] = useState('chat'); // 'chat' | 'quiz' | 'summary' | 'weak'
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');

  // Quiz State
  const [quizLobbyOpen, setQuizLobbyOpen] = useState(true);
  const [quizTimer, setQuizTimer] = useState(null);
  const [remainingSecs, setRemainingSecs] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  // Quiz Share Modal State
  const [quizShareModalOpen, setQuizShareModalOpen] = useState(false);
  const [quizShareData, setQuizShareData] = useState(null);
  const flyerCanvasRef = useRef(null);

  // Certificate Modal State
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [linkedinGuideOpen, setLinkedinGuideOpen] = useState(false);
  const certCanvasRef = useRef(null);

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
    try {
      const savedTheme = localStorage.getItem('sofe_theme');
      if (savedTheme === 'light' || document.body.classList.contains('light')) {
        setIsLight(true);
        document.body.classList.add('light');
      } else {
        setIsLight(false);
        document.body.classList.remove('light');
      }
    } catch (_) {}
  }, []);

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    document.body.classList.toggle('light', next);
    try {
      localStorage.setItem('sofe_theme', next ? 'light' : 'dark');
    } catch (_) {}
  };

  const getStudentName = () => {
    return userData?.full_name || userData?.name || currentUser?.displayName || 'Sofian';
  };

  const getInviteLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://node.sofegroup.com';
    const refCode = userData?.referral_code || (currentUser?.uid ? currentUser.uid.slice(0, 8).toUpperCase() : '');
    return refCode ? `${origin}/signup?ref=${refCode}` : `${origin}/signup`;
  };

  const handleCopyText = (text, label = 'Text') => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        showToast(`${label} copied to clipboard!`, 'success');
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(`${label} copied to clipboard!`, 'success');
      }
    } catch (e) {
      showToast('Copy failed: ' + e.message, 'error');
    }
  };

  // Load or issue the certificate record (issued server-side; clients cannot write certificates)
  const ensureCertificate = async () => {
    if (certificate) return certificate;
    if (!currentUser || !courseId) return null;

    try {
      const issueFn = httpsCallable(functions, 'issueCertificate');
      const { data } = await issueFn({ courseId });
      const issuedAt = data.issued_at ? new Date(data.issued_at) : new Date();
      // Keep the Firestore Timestamp shape the canvas/share code reads (issued_at.toDate())
      const saved = { ...data, issued_at: { toDate: () => issuedAt } };
      setCertificate(saved);
      return saved;
    } catch (err) {
      if (err.code === 'functions/failed-precondition') {
        showToast('Complete every session in this course to unlock your certificate.', 'error');
      } else {
        console.error('Certificate issue error:', err);
        showToast('Could not issue certificate: ' + err.message, 'error');
      }
      return null;
    }
  };

  const handleOpenCertificate = async () => {
    const cert = await ensureCertificate();
    if (cert) setCertModalOpen(true);
  };

  const handleOpenQuizShare = (customScore = null, customPassed = null) => {
    const activeMod = modules.find((m) => m.id === activeModuleId);
    const scorePct = customScore !== null ? Number(customScore) : (quizResult?.scorePct ?? existingSubmission?.score ?? existingSubmission?.quiz_score ?? 0);
    const passed = customPassed !== null ? Boolean(customPassed) : (quizResult?.passed ?? existingSubmission?.passed ?? (scorePct >= (activeSession?.passing_score || 70)));
    const refCode = userData?.referral_code || (currentUser?.uid ? currentUser.uid.slice(0, 8).toUpperCase() : '');
    const inviteUrl = getInviteLink();

    const data = {
      studentName: getStudentName(),
      courseTitle: courseData?.title || 'Sofe Academy Course',
      moduleTitle: activeMod?.title || activeSession?.title || 'Assessment',
      scorePct,
      passed,
      passMark: activeSession?.passing_score || 70,
      inviteUrl,
      refCode
    };

    setQuizShareData(data);
    setQuizShareModalOpen(true);
  };

  const downloadFlyerImage = () => {
    if (!flyerCanvasRef.current) return;
    try {
      const dataUrl = flyerCanvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      const safeName = (quizShareData?.studentName || 'Student').replace(/\s+/g, '_');
      link.download = `${safeName}_Sofe_Quiz_Score.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Flyer downloaded successfully!', 'success');
    } catch (e) {
      showToast('Error downloading image: ' + e.message, 'error');
    }
  };

  const downloadCertificateImage = () => {
    if (!certCanvasRef.current) return;
    try {
      const dataUrl = certCanvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      const safeName = (getStudentName() || 'Student').replace(/\s+/g, '_');
      link.download = `${safeName}_Sofe_Certificate.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Certificate downloaded successfully!', 'success');
    } catch (e) {
      showToast('Error downloading certificate: ' + e.message, 'error');
    }
  };

  // Helper for drawing rounded rectangle on canvas
  const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Draw High-Resolution 1080x1080 Branded Quiz Score Flyer
  const drawQuizFlyer = (canvas, data) => {
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    const width = 1080;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    // 1. Deep Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#060B17');
    bgGrad.addColorStop(0.5, '#091124');
    bgGrad.addColorStop(1, '#0C1733');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Glow Orbs
    const glow1 = ctx.createRadialGradient(140, 140, 20, 140, 140, 480);
    glow1.addColorStop(0, 'rgba(20, 40, 255, 0.35)');
    glow1.addColorStop(1, 'rgba(20, 40, 255, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    const glow2 = ctx.createRadialGradient(940, 940, 20, 940, 940, 480);
    glow2.addColorStop(0, 'rgba(255, 138, 0, 0.28)');
    glow2.addColorStop(1, 'rgba(255, 138, 0, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);

    const glow3 = ctx.createRadialGradient(880, 260, 10, 880, 260, 360);
    glow3.addColorStop(0, 'rgba(0, 229, 255, 0.16)');
    glow3.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = glow3;
    ctx.fillRect(0, 0, width, height);

    // 3. Subtle Cyber Grid
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 60; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 60; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // 4. Outer Tech Border with Inset Rounded Rect
    ctx.save();
    ctx.strokeStyle = 'rgba(20, 40, 255, 0.4)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 40, 40, width - 80, height - 80, 24);
    ctx.stroke();

    // Corner brackets
    ctx.strokeStyle = '#FF8A00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(40, 90); ctx.lineTo(40, 40); ctx.lineTo(90, 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width - 90, 40); ctx.lineTo(width - 40, 40); ctx.lineTo(width - 40, 90);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(40, height - 90); ctx.lineTo(40, height - 40); ctx.lineTo(90, height - 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width - 90, height - 40); ctx.lineTo(width - 40, height - 40); ctx.lineTo(width - 40, height - 90);
    ctx.stroke();
    ctx.restore();

    // 5. Header Branding: Logo Lockup
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 32px Poppins, sans-serif';
    ctx.fillText('SOFE NODE', 80, 110);
    ctx.fillStyle = '#FF8A00';
    ctx.font = '700 20px Poppins, sans-serif';
    ctx.fillText('• ACADEMY', 290, 110);

    // Top-right Pill Badge: VERIFIED ASSESSMENT ✓
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    drawRoundedRect(ctx, width - 360, 76, 280, 44, 22);
    ctx.fill();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, width - 360, 76, 280, 44, 22);
    ctx.stroke();

    ctx.fillStyle = '#10B981';
    ctx.font = '700 15px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VERIFIED ASSESSMENT ✓', width - 220, 104);
    ctx.restore();

    // Try drawing logo image on header
    try {
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        ctx.drawImage(logo, 80, 75, 200, 32);
      };
      logo.src = '/images/Nodes/SofeNodeLogo.png';
    } catch (e) {}

    // 6. Subtitle
    ctx.save();
    ctx.fillStyle = '#FF8A00';
    ctx.font = '700 18px Poppins, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('OFFICIAL ASSESSMENT SCORECARD', 80, 195);

    // 7. Student Name
    ctx.fillStyle = 'rgba(238, 244, 255, 0.6)';
    ctx.font = '500 18px Poppins, sans-serif';
    ctx.fillText('Awarded to', 80, 235);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 44px Poppins, sans-serif';
    ctx.fillText(data.studentName, 80, 285);

    // 8. Course & Module Titles
    ctx.fillStyle = '#6B8CFF';
    ctx.font = '700 24px Poppins, sans-serif';
    ctx.fillText(data.courseTitle, 80, 335);

    ctx.fillStyle = 'rgba(238, 244, 255, 0.85)';
    ctx.font = '500 20px Poppins, sans-serif';
    ctx.fillText(data.moduleTitle, 80, 372);
    ctx.restore();

    // 9. Central Glowing Score Card
    ctx.save();
    const scoreCardY = 420;
    const scoreCardH = 260;
    const scoreCardW = width - 160;

    ctx.fillStyle = 'rgba(20, 40, 255, 0.12)';
    drawRoundedRect(ctx, 80, scoreCardY, scoreCardW, scoreCardH, 20);
    ctx.fill();
    ctx.strokeStyle = data.passed ? 'rgba(0, 200, 100, 0.5)' : 'rgba(255, 85, 85, 0.5)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 80, scoreCardY, scoreCardW, scoreCardH, 20);
    ctx.stroke();

    // Score Ring
    const ringCenterX = 240;
    const ringCenterY = scoreCardY + 130;
    const ringRadius = 90;

    const ringGlow = ctx.createRadialGradient(ringCenterX, ringCenterY, 40, ringCenterX, ringCenterY, 110);
    ringGlow.addColorStop(0, data.passed ? 'rgba(0, 229, 255, 0.25)' : 'rgba(255, 85, 85, 0.25)');
    ringGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = ringGlow;
    ctx.beginPath();
    ctx.arc(ringCenterX, ringCenterY, 110, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ringCenterX, ringCenterY, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = data.passed ? '#00E5FF' : '#FF5555';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = data.passed ? '#00E5FF' : '#FF5555';
    ctx.font = '800 68px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${data.scorePct}%`, ringCenterX, ringCenterY - 6);

    ctx.fillStyle = 'rgba(238, 244, 255, 0.7)';
    ctx.font = '700 13px Poppins, sans-serif';
    ctx.fillText(`PASS: ${data.passMark}%`, ringCenterX, ringCenterY + 45);

    // Performance Details
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const detailX = 380;

    ctx.fillStyle = data.passed ? '#10B981' : '#FF5555';
    ctx.font = '800 32px Poppins, sans-serif';
    ctx.fillText(data.passed ? 'EXAM PASSED ✓' : 'EXAM ATTEMPT', detailX, scoreCardY + 80);

    ctx.fillStyle = 'rgba(238, 244, 255, 0.85)';
    ctx.font = '500 19px Poppins, sans-serif';
    ctx.fillText(data.passed
      ? 'Demonstrated high competence in practical Web3 assessment.'
      : 'Review the module materials and retake to earn XP & completion.'
    , detailX, scoreCardY + 125);

    ctx.fillStyle = '#FF8A00';
    ctx.font = '700 17px Poppins, sans-serif';
    ctx.fillText('🏆 +5 XP Earned & Progress Synchronized', detailX, scoreCardY + 175);

    ctx.fillStyle = 'rgba(200, 215, 240, 0.6)';
    ctx.font = '500 14px Poppins, sans-serif';
    ctx.fillText('Verified on Sofe Node Academy • Web3 Ecosystem', detailX, scoreCardY + 210);
    ctx.restore();

    // 10. Bottom Section: QR Code Card & Referral Invite
    ctx.save();
    const qrCardY = 730;
    const qrBoxW = 240;
    const qrBoxH = 240;

    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, 80, qrCardY, qrBoxW, qrBoxH, 18);
    ctx.fill();

    // Draw QR Code
    try {
      const qr = qrcode(0, 'M');
      qr.addData(data.inviteUrl);
      qr.make();
      const count = qr.getModuleCount();
      const innerSize = 200;
      const cellSize = innerSize / count;
      const startX = 80 + (qrBoxW - innerSize) / 2;
      const startY = qrCardY + (qrBoxH - innerSize) / 2;

      ctx.fillStyle = '#060B14';
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize + 0.6, cellSize + 0.6);
          }
        }
      }
    } catch (e) {
      console.error('QR draw error:', e);
    }

    ctx.fillStyle = '#FF8A00';
    ctx.font = '700 15px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan to Join & Learn with Me', 80 + qrBoxW / 2, qrCardY + qrBoxH + 34);

    // Right of QR code: Invite code & link
    ctx.textAlign = 'left';
    const inviteX = 360;

    ctx.fillStyle = 'rgba(238, 244, 255, 0.65)';
    ctx.font = '600 16px Poppins, sans-serif';
    ctx.fillText('REFERRAL INVITE CODE', inviteX, qrCardY + 38);

    ctx.fillStyle = '#00E5FF';
    ctx.font = '800 36px Poppins, sans-serif';
    ctx.fillText(data.refCode || 'SOFE', inviteX, qrCardY + 82);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 18px Poppins, sans-serif';
    ctx.fillText('Join Sofe Node Academy to master Web3 & earn rewards', inviteX, qrCardY + 128);

    ctx.fillStyle = 'rgba(238, 244, 255, 0.7)';
    ctx.font = '500 15px Poppins, sans-serif';
    ctx.fillText('Subsidized Foundation Course • Global Bounties • Talent Placements', inviteX, qrCardY + 158);

    ctx.fillStyle = '#6B8CFF';
    ctx.font = '700 16px Poppins, sans-serif';
    ctx.fillText(data.inviteUrl, inviteX, qrCardY + 200);

    ctx.fillStyle = 'rgba(200, 215, 240, 0.45)';
    ctx.font = '500 13px Poppins, sans-serif';
    ctx.fillText('Official Credential • node.sofegroup.com • Powered by Sofe Node Ecosystem', inviteX, qrCardY + 238);
    ctx.restore();
  };

  // Draw High-Resolution 1400x950 Verified Certificate
  const drawCertificateToCanvas = (canvas) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 1400;
    const height = 950;
    canvas.width = width;
    canvas.height = height;

    const certNumber = certificate?.cert_number || `SOFE-${(courseId || 'CERT').slice(0, 4).toUpperCase()}-001`;
    const studentName = getStudentName();
    const courseTitle = courseData?.title || 'Blockchain & Cryptocurrency Foundation';
    const issueDateStr = certificate?.issued_at?.toDate
      ? certificate.issued_at.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://node.sofegroup.com'}/dashboard?tab=certificates&id=${certNumber}`;

    // 1. Parchment Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#060B17');
    bgGrad.addColorStop(0.5, '#0A1226');
    bgGrad.addColorStop(1, '#080E1C');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Gold Ambient Glow
    const goldGlow = ctx.createRadialGradient(width / 2, height / 2, 80, width / 2, height / 2, 600);
    goldGlow.addColorStop(0, 'rgba(255, 138, 0, 0.12)');
    goldGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = goldGlow;
    ctx.fillRect(0, 0, width, height);

    // 3. Ornate Double Border
    ctx.save();
    ctx.strokeStyle = '#FF8A00';
    ctx.lineWidth = 4;
    drawRoundedRect(ctx, 36, 36, width - 72, height - 72, 16);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(20, 40, 255, 0.6)';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, 50, 50, width - 100, height - 100, 12);
    ctx.stroke();

    const corners = [
      [50, 50],
      [width - 50, 50],
      [50, height - 50],
      [width - 50, height - 50]
    ];
    ctx.fillStyle = '#FF8A00';
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 4. Header Seal / Title
    ctx.save();
    ctx.textAlign = 'center';

    ctx.fillStyle = '#FF8A00';
    ctx.font = '800 22px Poppins, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('SOFE NODE ACADEMY', width / 2, 120);

    ctx.fillStyle = 'rgba(238, 244, 255, 0.6)';
    ctx.font = '600 13px Poppins, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('DECENTRALIZED ECOSYSTEM & TALENT NETWORK', width / 2, 150);

    ctx.fillStyle = '#FFD700';
    ctx.font = '800 48px Poppins, sans-serif';
    ctx.letterSpacing = '5px';
    ctx.fillText('CERTIFICATE OF COMPLETION', width / 2, 230);

    // Separator line
    const lineW = 320;
    const lineGrad = ctx.createLinearGradient(width / 2 - lineW / 2, 0, width / 2 + lineW / 2, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.5, '#FF8A00');
    lineGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - lineW / 2, 255);
    ctx.lineTo(width / 2 + lineW / 2, 255);
    ctx.stroke();

    ctx.fillStyle = 'rgba(238, 244, 255, 0.75)';
    ctx.font = 'italic 500 22px Poppins, sans-serif';
    ctx.letterSpacing = '1px';
    ctx.fillText('This is to certify that', width / 2, 320);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 52px Poppins, sans-serif';
    ctx.fillText(studentName, width / 2, 395);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 280, 420);
    ctx.lineTo(width / 2 + 280, 420);
    ctx.stroke();

    ctx.fillStyle = 'rgba(238, 244, 255, 0.75)';
    ctx.font = '500 20px Poppins, sans-serif';
    ctx.fillText('has successfully mastered the coursework, practical assessments,', width / 2, 470);
    ctx.fillText('and examinations for the professional track in', width / 2, 505);

    ctx.fillStyle = '#FF8A00';
    ctx.font = '800 36px Poppins, sans-serif';
    ctx.fillText(courseTitle, width / 2, 565);
    ctx.restore();

    // 5. Bottom Credentials & Signatures
    ctx.save();
    const bottomY = 730;

    const qrSize = 130;
    const qrX = 120;
    const qrY = bottomY - 30;

    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, qrX, qrY, qrSize, qrSize, 10);
    ctx.fill();

    try {
      const qr = qrcode(0, 'M');
      qr.addData(verifyUrl);
      qr.make();
      const count = qr.getModuleCount();
      const innerSize = 114;
      const cellSize = innerSize / count;
      const startX = qrX + (qrSize - innerSize) / 2;
      const startY = qrY + (qrSize - innerSize) / 2;

      ctx.fillStyle = '#060B14';
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize + 0.4, cellSize + 0.4);
          }
        }
      }
    } catch (e) {}

    ctx.fillStyle = 'rgba(238, 244, 255, 0.7)';
    ctx.font = '600 13px Poppins, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Scan to Verify Credential', qrX, qrY + qrSize + 24);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(238, 244, 255, 0.6)';
    ctx.font = '600 14px Poppins, sans-serif';
    ctx.fillText('CREDENTIAL IDENTIFIER', width / 2, bottomY + 10);

    ctx.fillStyle = '#00E5FF';
    ctx.font = '800 24px monospace';
    ctx.fillText(certNumber, width / 2, bottomY + 44);

    ctx.fillStyle = 'rgba(238, 244, 255, 0.7)';
    ctx.font = '500 16px Poppins, sans-serif';
    ctx.fillText(`Issued on ${issueDateStr}`, width / 2, bottomY + 76);

    const sigX = width - 260;
    ctx.textAlign = 'center';

    ctx.strokeStyle = 'rgba(238, 244, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sigX - 110, bottomY + 40);
    ctx.lineTo(sigX + 110, bottomY + 40);
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Poppins, sans-serif';
    ctx.fillText('Director of Academy', sigX, bottomY + 62);

    ctx.fillStyle = 'rgba(200, 215, 240, 0.6)';
    ctx.font = '500 13px Poppins, sans-serif';
    ctx.fillText('Sofe Node Foundation', sigX, bottomY + 84);
    ctx.restore();
  };

  useEffect(() => {
    if (quizShareModalOpen && quizShareData && flyerCanvasRef.current) {
      drawQuizFlyer(flyerCanvasRef.current, quizShareData);
    }
  }, [quizShareModalOpen, quizShareData]);

  useEffect(() => {
    if (certModalOpen && certCanvasRef.current) {
      drawCertificateToCanvas(certCanvasRef.current);
    }
  }, [certModalOpen, certificate, courseData, userData]);

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

      // 1b. Load User Profile for Name & Referral Link
      let uProfile = null;
      try {
        const uSnap = await getDoc(doc(db, 'users', user.uid));
        if (uSnap.exists()) {
          uProfile = uSnap.data();
          setUserData(uProfile);
        }
      } catch (e) {
        console.warn('Could not load user profile:', e);
      }

      // 1c. Load existing Certificate for this course if issued
      try {
        const cSnap = await getDocs(
          query(collection(db, 'certificates'), where('user_id', '==', user.uid), where('course_id', '==', cid))
        );
        if (!cSnap.empty) {
          setCertificate({ id: cSnap.docs[0].id, ...cSnap.docs[0].data() });
        }
      } catch (e) {
        console.warn('Could not load certificate:', e);
      }

      // 2. Check Enrolment & Authorization
      let isEnrolled = false;
      const enrolSnap = await getDocs(
        query(collection(db, 'enrolments'), where('user_id', '==', user.uid), where('course_id', '==', cid))
      );
      if (!enrolSnap.empty) {
        const eData = enrolSnap.docs[0].data();
        if (eData.status === 'active' || eData.status === 'completed') {
          isEnrolled = true;
          setEnrolmentStatus(eData.status);
        } else if (eData.status === 'pending') {
          setEnrolmentStatus('pending');
        }
      }

      // If not directly enrolled, check unlocks for Foundation:
      if (!isEnrolled && (cid === 'foundation' || courseParam === 'foundation')) {
        const uRole = uProfile?.role;
        const uAdminRole = uProfile?.admin_role;
        const isAdminUser = uRole === 'admin' || ['super_admin', 'admin', 'course_manager', 'tutor', 'chief_operations'].includes(uAdminRole);
        const hasBypass = !!uProfile?.bypass_foundation;

        if (isAdminUser || hasBypass) {
          isEnrolled = true;
          setEnrolmentStatus('active');
        } else {
          // Check if user has enrolled in any career track course (which includes foundation)
          try {
            const allEnrolsSnap = await getDocs(
              query(collection(db, 'enrolments'), where('user_id', '==', user.uid))
            );
            const hasCareerTrack = allEnrolsSnap.docs.some((d) => {
              const data = d.data();
              return data.course_id !== 'foundation' && data.tier !== 'executive' && (data.status === 'active' || data.status === 'completed');
            });
            if (hasCareerTrack || (uProfile?.is_premium === true)) {
              // Enrolled in Career Track or VIP unlocks Foundation. The foundation enrolment record itself
              // is created server-side when the payment is confirmed.
              isEnrolled = true;
              setEnrolmentStatus('active');
            }
          } catch (err) {
            console.error('Error checking career enrolments:', err);
          }
        }
      }

      // If still not enrolled, LOCK THE COURSE!
      if (!isEnrolled) {
        setIsCourseLocked(true);
        setLoading(false);
        return;
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
        if (firstS.type !== 'quiz') {
          setLastVideoSession({ sess: firstS, modId: firstM.id });
        }
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
    if (sess.type !== 'quiz') {
      setLastVideoSession({ sess, modId });
    }
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
        const subData = snap.data();
        setExistingSubmission(subData);
        if (subData.type === 'quiz') {
          const activeMod = modules.find((m) => m.id === activeModuleId);
          const refCode = userData?.referral_code || (currentUser?.uid ? currentUser.uid.slice(0, 8).toUpperCase() : '');
          const origin = typeof window !== 'undefined' ? window.location.origin : 'https://node.sofegroup.com';
          const inviteUrl = refCode ? `${origin}/signup?ref=${refCode}` : `${origin}/signup`;
          setQuizShareData({
            studentName: getStudentName(),
            courseTitle: courseData?.title || 'Sofe Academy Course',
            moduleTitle: activeMod?.title || activeSession?.title || 'Assessment',
            scorePct: subData.score ?? subData.quiz_score ?? 0,
            passed: !!subData.passed,
            passMark: activeSession?.passing_score || 70,
            inviteUrl,
            refCode
          });
        }
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
      // Progress and XP are server-only (module_progress and xp_total are not client-writable)
      const markFn = httpsCallable(functions, 'markSessionComplete');
      await markFn({ sessionId, moduleId });

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

    // Unanswered questions are sent as -1 (counted wrong)
    const questions = activeSession?.questions || [];
    const answers = questions.map((_, idx) => (quizAnswers[idx] === undefined ? -1 : Number(quizAnswers[idx])));

    try {
      // Graded server-side against the hidden answer key; the function also records the
      // submission, progress and XP, and locks the enrolment once attempts run out
      const submitFn = httpsCallable(functions, 'submitQuizAnswers');
      const { data: result } = await submitFn({ sessionId: activeSessionId, answers });
      const scorePct = result.score;
      const passed = result.passed;
      const passMark = result.passThreshold;

      if (result.courseLocked) {
        showToast('You have used all your attempts for this exam. This course is now locked.', 'error');
        setTimeout(() => window.location.reload(), 2500);
        return;
      }

      if (passed) {
        setProgress((prev) => ({ ...prev, [activeSessionId]: { completed: true } }));
      }
      setQuizResult({ scorePct, passed, passMark, attempts: result.attempts, maxAttempts: result.maxAttempts });

      // Bridge standard exam failed questions to quiz_attempts for AI learning loop
      const totalExamQuestions = result.totalQuestions || questions.length || 1;
      const correctExamQuestions = typeof result.correctCount === 'number' ? result.correctCount : Math.round(((result.score || 0) / 100) * totalExamQuestions);
      const wrongCount = totalExamQuestions - correctExamQuestions;
      const activeMod = modules.find((m) => m.id === activeModuleId);
      const targetStudentId = currentUser?.uid || (typeof window !== 'undefined' ? localStorage.getItem('sofe_anon_student_id') || 'demo-student' : 'demo-student');
      if (wrongCount > 0 && targetStudentId) {
        const topicName = activeSession?.topic || activeMod?.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'cryptography-and-wallets';
        const failedAttempts = Array(wrongCount).fill(null).map(() => ({ topic: topicName, correct: false }));
        fetch('/api/quiz/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: targetStudentId,
            attempts: failedAttempts,
          }),
        }).catch((err) => console.warn('Could not sync exam failures to AI assistant:', err));
      }
      const refCode = userData?.referral_code || (currentUser?.uid ? currentUser.uid.slice(0, 8).toUpperCase() : '');
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://node.sofegroup.com';
      const inviteUrl = refCode ? `${origin}/signup?ref=${refCode}` : `${origin}/signup`;
      const sharePayload = {
        studentName: getStudentName(),
        courseTitle: courseData?.title || 'Sofe Academy Course',
        moduleTitle: activeMod?.title || activeSession?.title || 'Assessment',
        scorePct,
        passed,
        passMark,
        inviteUrl,
        refCode
      };
      setQuizShareData(sharePayload);

      // Check if this exam completed the full course
      let totalAll = 0;
      let doneAll = 0;
      modules.forEach((m) => {
        const list = sessionsByModule[m.id] || [];
        totalAll += list.length;
        list.forEach((s) => {
          if (progress[s.id]?.completed || s.id === activeSessionId) doneAll++;
        });
      });
      if (totalAll > 0 && doneAll >= totalAll && passed) {
        await ensureCertificate();
      }
      showToast(
        passed
          ? `Exam Passed with ${scorePct}%!`
          : `Exam Failed with ${scorePct}%. Required: ${passMark}%. Attempts left: ${result.maxAttempts - result.attempts}`,
        passed ? 'success' : 'error'
      );
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
      <div className="cv-locked-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'spin 1.5s infinite linear' }}>📚</div>
          <p className="cv-locked-desc" style={{ fontSize: '0.88rem', fontWeight: 500 }}>Loading learning experience...</p>
        </div>
      </div>
    );
  }

  if (isCourseLocked) {
    const isPendingApproval = enrolmentStatus === 'pending';
    return (
      <div className="cv-locked-root" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: 'Poppins, sans-serif' }}>
        <div className="cv-locked-card" style={{ maxWidth: 540, width: '100%', borderRadius: 16, padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,138,0,0.12)', border: '1px solid rgba(255,138,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.25rem' }}>
            {isPendingApproval ? '⏳' : '🔒'}
          </div>
          <div style={{ display: 'inline-block', background: 'rgba(255,138,0,0.15)', color: '#FF8A00', padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>
            {isPendingApproval ? 'Payment Verification Pending' : 'Enrolment Required'}
          </div>
          <h2 className="cv-locked-title" style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.6rem' }}>
            {isPendingApproval ? 'Payment Awaiting Approval' : `${courseData?.title || 'Course'} is Locked`}
          </h2>
          <p className="cv-locked-desc" style={{ fontSize: '0.84rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
            {isPendingApproval
              ? 'Your payment proof has been recorded and is currently being verified by an administrator. Once approved, your curriculum will unlock automatically.'
              : (courseId === 'foundation'
                ? 'This subsidized course requires an active enrolment. Enrol directly, or unlock it automatically when you enrol in any Career Track.'
                : 'This course requires an active enrolment. Complete your registration to access video lessons, interactive quizzes, assignments, and on-chain certification.')}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {isPendingApproval ? (
              <Link
                href="/dashboard"
                style={{
                  background: '#1428FF',
                  color: '#fff',
                  padding: '0.8rem 1.5rem',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 15px rgba(20,40,255,0.4)',
                  display: 'block'
                }}
              >
                Go to Dashboard →
              </Link>
            ) : (
              <Link
                href={courseId === 'foundation' ? `/course-detail?id=foundation` : `/course-detail?id=${courseId || 'foundation'}`}
                style={{
                  background: '#1428FF',
                  color: '#fff',
                  padding: '0.8rem 1.5rem',
                  borderRadius: 8,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 15px rgba(20,40,255,0.4)',
                  display: 'block'
                }}
              >
                Enrol in Course →
              </Link>
            )}

            <Link
              href="/academy"
              className="cv-locked-browse-btn"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: 8,
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'block'
              }}
            >
              Browse All Courses in Academy
            </Link>

            <Link
              href="/dashboard"
              className="cv-locked-dash-btn"
              style={{
                fontSize: '0.78rem',
                textDecoration: 'none',
                marginTop: '0.5rem',
                fontWeight: 600
              }}
            >
              ← Back to Student Dashboard
            </Link>
          </div>
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

  // 1. VIDEO RENDERER HELPER
  const renderVideoPlayer = (isMobileTop = false) => {
    if (embedUrl) {
      return (
        <div style={isMobileTop ? { width: '100%', height: '100%', position: 'relative' } : { position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: 10, overflow: 'hidden', background: '#000', marginBottom: '1.5rem' }}>
          <iframe
            src={embedUrl}
            title={activeSession?.title || 'Class Video'}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      );
    }
    if (rawVideo) {
      return (
        <div className="cv-raw-video-box" style={isMobileTop ? { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' } : { borderRadius: 10, padding: '2rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>🎬</div>
          <a
            href={rawVideo}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#1428FF',
              color: '#fff',
              borderRadius: 6,
              padding: '0.5rem 1.2rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Open Recording in New Tab →
          </a>
        </div>
      );
    }
    return (
      <div className="cv-video-placeholder" style={{
        width: '100%',
        height: isMobileTop ? '100%' : '180px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        textAlign: 'center',
        borderRadius: isMobileTop ? 0 : 10,
        marginBottom: isMobileTop ? 0 : '1.5rem'
      }}>
        <div style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>{activeSession?.type === 'assignment' ? '📁' : '📖'}</div>
        <div className="cv-video-placeholder-title" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{activeSession?.title || 'Class Session'}</div>
        <div className="cv-video-placeholder-sub" style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>
          {activeSession?.type === 'assignment' ? 'Practical Assignment' : 'Interactive Session'}
        </div>
      </div>
    );
  };

  // 2. QUIZ / EXAM RENDERER HELPER
  const renderQuizContent = () => (
    <div>
      {quizLobbyOpen ? (
        <div className="cv-quiz-lobby" style={{ borderRadius: 10, padding: '1.75rem' }}>
          {existingSubmission && existingSubmission.type === 'quiz' && (
            <div className="cv-quiz-prev-attempt" style={{
              background: existingSubmission.passed ? 'rgba(0,200,100,0.1)' : 'rgba(255,138,0,0.1)',
              border: `1px solid ${existingSubmission.passed ? 'rgba(0,200,100,0.3)' : 'rgba(255,138,0,0.3)'}`,
              borderRadius: 8,
              padding: '0.9rem 1.1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: existingSubmission.passed ? '#00c864' : '#FF8A00',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {existingSubmission.passed ? '✓ Completed & Recorded' : 'Previous Attempt'}
                </span>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, marginTop: '0.15rem' }}>
                  Score: {existingSubmission.score}% {existingSubmission.passed ? '(Passed)' : '(Retake to pass)'}
                </div>
              </div>
              <button
                onClick={() => handleOpenQuizShare(existingSubmission.score, existingSubmission.passed)}
                style={{
                  background: 'linear-gradient(135deg, #1428FF, #6A5BFF)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.55rem 1.1rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 4px 12px rgba(20,40,255,0.25)'
                }}
              >
                <span>🎨</span> Share Score Flyer
              </button>
            </div>
          )}
          <h3 className="cv-quiz-instructions-title" style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>Exam Instructions</h3>
          <p className="cv-quiz-instructions-text" style={{ fontSize: '0.82rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
            {activeSession.instructions ||
              `You will be tested on the concepts covered in this module. Once you start, you will have ${activeSession.duration_minutes || 15} minutes to answer all questions. Pass mark is ${activeSession.passing_score || 70}%.`}
          </p>

          {/* Pre-Exam AI Practice Callout */}
          <div
            style={{
              marginBottom: '1.5rem',
              padding: '1rem 1.25rem',
              borderRadius: 8,
              background: 'rgba(255,138,0,0.08)',
              border: '1px solid rgba(255,138,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🤖</span>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FF8A00' }}>
                  Want to practice before your graded attempt?
                </div>
                <div style={{ fontSize: '0.74rem', color: isLight ? '#4B5563' : 'rgba(200,215,240,0.7)', marginTop: '0.15rem' }}>
                  Use the AI Assistant to generate realistic practice questions, diagnose weak topics, and prepare safely.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const firstM = modules[0];
                const firstS = sessionsByModule[firstM?.id]?.find((s) => s.type !== 'quiz') || sessionsByModule[firstM?.id]?.[0];
                if (firstS) handleSelectSession(firstS, firstM.id);
                setSideTab('ai');
                setAiSubTab('quiz');
              }}
              style={{
                background: '#FF8A00',
                color: '#000',
                border: 'none',
                borderRadius: 6,
                padding: '0.5rem 1rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Practice with AI 📝
            </button>
          </div>

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
          <div className="cv-quiz-q-bar" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.8rem 1.2rem',
            borderRadius: 8,
            marginBottom: '1.5rem'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Questions ({activeSession.questions?.length || 0})</span>
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
              <div key={qIdx} className="cv-quiz-q-card" style={{ padding: '1.25rem', borderRadius: 8 }}>
                <div className="cv-quiz-q-text" style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.8rem' }}>
                  {qIdx + 1}. {q.text}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(q.options || []).map((opt, optIdx) => (
                    <label
                      key={optIdx}
                      className={`cv-quiz-option ${quizAnswers[qIdx] === optIdx ? 'selected' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.6rem 0.8rem',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '0.82rem'
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
          <p className="cv-quiz-result-score" style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
            Your Score: <strong>{quizResult.scorePct}%</strong> (Passing Mark: {quizResult.passMark}%)
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <button
              onClick={() => handleOpenQuizShare(quizResult.scorePct, quizResult.passed)}
              style={{
                background: 'linear-gradient(135deg, #1428FF, #6A5BFF)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '0.65rem 1.4rem',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(20,40,255,0.35)'
              }}
            >
              <span>🎨</span> Share Score Flyer & Invite Link
            </button>
            <button
              onClick={() => {
                const firstM = modules[0];
                const firstS = sessionsByModule[firstM?.id]?.find((s) => s.type !== 'quiz') || sessionsByModule[firstM?.id]?.[0];
                if (firstS) handleSelectSession(firstS, firstM.id);
                setSideTab('ai');
                setAiSubTab('weak');
              }}
              style={{
                background: 'linear-gradient(135deg, #FF8A00, #FFA500)',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                padding: '0.65rem 1.4rem',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(255,138,0,0.3)'
              }}
            >
              <span>🤖</span> Review Weak Areas with AI Tutor →
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 3. CURRICULUM PLAYLIST HELPER
  const renderPlaylist = () => (
    <div>
      {/* Subtabs */}
      <div className="cv-tabs-bar" style={{ display: 'flex', gap: '0.4rem', padding: 4, borderRadius: 8, marginBottom: '1.25rem' }}>
        <button
          onClick={() => setSideTab('curr')}
          className={`cv-tab-btn ${sideTab === 'curr' ? 'active' : ''}`}
          style={{
            flex: 1,
            border: 'none',
            padding: '0.55rem',
            borderRadius: 6,
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Curriculum
        </button>
        <button
          onClick={() => setSideTab('ai')}
          className={`cv-tab-btn ${sideTab === 'ai' ? 'active' : ''}`}
          style={{
            flex: 1,
            border: 'none',
            padding: '0.55rem',
            borderRadius: 6,
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            background: sideTab === 'ai' ? 'linear-gradient(135deg, #1428FF, #6A5BFF)' : undefined,
            color: sideTab === 'ai' ? '#fff' : undefined
          }}
        >
          <span>🤖</span> Sofe AI Tutor
        </button>
      </div>

      {sideTab === 'curr' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {modules.map((m, mIdx) => {
            const unlocked = isModuleUnlocked(mIdx);
            const sList = sessionsByModule[m.id] || [];

            return (
              <div key={m.id} className="cv-module-card" style={{ borderRadius: 8, overflow: 'hidden' }}>
                <div className="cv-module-header" style={{
                  padding: '0.8rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem'
                }}>
                  <span className="cv-module-badge" style={{
                    width: 22,
                    height: 22,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}>
                    {mIdx + 1}
                  </span>
                  <span className={`cv-module-name ${unlocked ? '' : 'locked'}`} style={{ fontSize: '0.82rem', fontWeight: 600 }}>
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
                        className={`cv-session-row ${isActive ? 'active' : ''} ${sUnlocked ? '' : 'locked'}`}
                        onClick={() => sUnlocked && handleSelectSession(s, m.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          padding: '0.65rem 1rem',
                          cursor: sUnlocked ? 'pointer' : 'not-allowed'
                        }}
                      >
                        <span className="cv-session-icon" style={{ fontSize: '0.78rem', color: isDone ? '#00c864' : '#FF8A00' }}>
                          {isDone ? '✓' : icon}
                        </span>
                        <span className="cv-session-text" style={{ fontSize: '0.78rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
        <CourseAIAssistant
          studentId={currentUser?.uid || (typeof window !== 'undefined' ? localStorage.getItem('sofe_anon_student_id') || 'demo-student' : 'demo-student')}
          activeSession={activeSession}
          activeModule={modules.find((m) => m.id === activeModuleId)}
          courseTitle={courseData?.title}
          courseId={courseId || courseParam || 'foundation'}
          isLight={isLight}
          activeSubTab={aiSubTab}
          setActiveSubTab={setAiSubTab}
          initialPrompt={aiInitialPrompt}
          onClearInitialPrompt={() => setAiInitialPrompt('')}
          quizResult={quizResult}
        />
      )}
    </div>
  );

  return (
    <div className="course-view-root" style={{ minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 999999,
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

      {/* DESKTOP TOP HEADER */}
      {activeSession?.type !== 'quiz' && (
        <header className="cv-desktop-header" style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 64,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link href="/dashboard" className="cv-header-back" style={{ fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              ← Dashboard
            </Link>
            <div className="cv-header-title" style={{ fontSize: '0.95rem', fontWeight: 700, paddingLeft: '1rem' }}>
              {courseData?.title || 'Sofe Academy Course'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <button
              onClick={toggleTheme}
              title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
              aria-label="Toggle Theme"
              className="cv-theme-toggle-btn"
            >
              {isLight ? '🌙' : '☀️'}
            </button>

            <button
              onClick={() => handleOpenCertificate()}
              style={{
                background: overallPct === 100
                  ? 'linear-gradient(135deg, #FF8A00, #FFA500)'
                  : 'rgba(255, 138, 0, 0.15)',
                color: overallPct === 100 ? '#000' : '#FF8A00',
                border: '1px solid rgba(255, 138, 0, 0.4)',
                borderRadius: 6,
                padding: '0.4rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: overallPct === 100 ? '0 2px 10px rgba(255,138,0,0.3)' : 'none'
              }}
            >
              <span>🎓</span> Certificate {overallPct === 100 ? '✓' : ''}
            </button>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#FF8A00' }}>{overallPct}%</span>
            <div style={{ width: 120, height: 6, background: 'rgba(255,138,0,0.15)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${overallPct}%`, background: '#FF8A00', borderRadius: 3, transition: 'width 0.3s' }}></div>
            </div>
          </div>
        </header>
      )}

      {/* MOBILE TOP NAV (compact bar above sticky video) */}
      {activeSession?.type !== 'quiz' && (
        <div className="cv-mobile-top-bar">
          <Link
            href="/dashboard"
            className="cv-mobile-back"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.74rem',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '0.35rem 0.7rem',
              borderRadius: 6
            }}
          >
            ← Dashboard
          </Link>

          <div className="cv-mobile-title" style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            maxWidth: '40%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {courseData?.title || 'Sofe Academy'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              onClick={toggleTheme}
              title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
              aria-label="Toggle Theme"
              className="cv-theme-toggle-btn"
              style={{ width: 28, height: 28, fontSize: '0.8rem' }}
            >
              {isLight ? '🌙' : '☀️'}
            </button>

            <button
              onClick={() => handleOpenCertificate()}
              style={{
                background: overallPct === 100 ? '#FF8A00' : 'rgba(255,138,0,0.15)',
                color: overallPct === 100 ? '#000' : '#FF8A00',
                border: '1px solid rgba(255,138,0,0.4)',
                borderRadius: 4,
                padding: '0.28rem 0.6rem',
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              🎓 Cert {overallPct === 100 ? '✓' : ''}
            </button>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF8A00' }}>
              {overallPct}%
            </span>
            <div style={{ width: 45, height: 5, background: 'rgba(255,138,0,0.18)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${overallPct}%`, background: '#FF8A00', borderRadius: 3, transition: 'width 0.3s' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE STICKY VIDEO (30% of screen height) — only when not in exam mode */}
      {activeSession?.type !== 'quiz' && (
        <div className="cv-mobile-top-video">
          {renderVideoPlayer(true)}
        </div>
      )}

      {/* EXAM VIEW: FULL SCREEN DOCUMENT FLOW (Footer appears naturally at the end) */}
      {activeSession?.type === 'quiz' ? (
        <div className="cv-exam-page">
          <div className="cv-exam-top-bar" style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <button
              onClick={() => {
                if (lastVideoSession) {
                  handleSelectSession(lastVideoSession.sess, lastVideoSession.modId);
                } else {
                  const firstM = modules[0];
                  const firstS = sessionsByModule[firstM?.id]?.[0];
                  if (firstS) handleSelectSession(firstS, firstM.id);
                }
              }}
              className="cv-exam-back-btn"
              style={{
                borderRadius: 6,
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              ← Back to Course
            </button>
            <div className="cv-exam-title" style={{ fontSize: '0.92rem', fontWeight: 700, flex: 1, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              📝 {activeSession.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                onClick={toggleTheme}
                title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
                aria-label="Toggle Theme"
                className="cv-theme-toggle-btn"
                style={{ width: 30, height: 30, fontSize: '0.85rem' }}
              >
                {isLight ? '🌙' : '☀️'}
              </button>
              {!quizLobbyOpen && (
                <span className="cv-exam-timer" style={{
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: remainingSecs < 60 ? '#ff5555' : '#FF8A00'
                }}>
                  ⏱ {Math.floor(remainingSecs / 60)}:{String(remainingSecs % 60).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>

          <div className="cv-exam-wrapper">
            {renderQuizContent()}
          </div>
        </div>
      ) : (
        /* REGULAR COURSE VIEW CONTAINER */
        <div className="cv-main-layout">
          {/* MAIN CONTENT AREA */}
          <main className="cv-desktop-main" style={{
            borderRadius: 12,
            padding: '1.5rem',
            minHeight: '75vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {activeSession ? (
              <div>
                {/* Header Title */}
                <div className="cv-session-header" style={{ paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                  <div className="cv-session-tag" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <span>{activeSession.type === 'assignment' ? '📁 Assignment' : '▶ Video Lesson'}</span>
                    {activeSession.duration_minutes && <span>• ⏱ {activeSession.duration_minutes} Mins</span>}
                  </div>
                  <h1 className="cv-session-title" style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.3rem' }}>{activeSession.title}</h1>
                </div>

                {activeSession.type === 'assignment' ? (
                  /* Assignment View */
                  <div className="cv-assignment-card" style={{ borderRadius: 10, padding: '1.5rem' }}>
                    <h3 className="cv-assignment-title" style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '0.6rem' }}>Assignment Task</h3>
                    <p className="cv-assignment-instructions" style={{ fontSize: '0.82rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
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
                      <div className="cv-submission-card" style={{ borderRadius: 8, padding: '1rem', marginTop: '1rem' }}>
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
                        <div style={{ fontSize: '0.76rem', marginTop: '0.8rem' }}>
                          Your Submission:{' '}
                          <a href={existingSubmission.submission_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1428FF', fontWeight: 600 }}>
                            {existingSubmission.submission_url}
                          </a>
                        </div>
                        {existingSubmission.feedback && (
                          <div className="cv-feedback-box" style={{ marginTop: '0.6rem', fontSize: '0.74rem', padding: '0.6rem', borderRadius: 4 }}>
                            <strong>Tutor Feedback:</strong> {existingSubmission.feedback}
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={handleSubmitAssignment}>
                        <label className="cv-assignment-label" style={{ display: 'block', fontSize: '0.74rem', marginBottom: '0.4rem', fontWeight: 600 }}>
                          Submission URL (Google Drive, GitHub repo, or Notion page)
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="https://..."
                          value={assignmentInput}
                          onChange={(e) => setAssignmentInput(e.target.value)}
                          className="cv-assignment-input"
                          style={{
                            width: '100%',
                            borderRadius: 6,
                            padding: '0.65rem',
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
                  /* Video Lesson View */
                  <div>
                    {/* Rendered inline on Desktop only */}
                    <div className="cv-desktop-video">
                      {renderVideoPlayer(false)}
                    </div>

                    <div className="cv-session-desc" style={{ fontSize: '0.85rem', lineHeight: 1.8 }}>
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

                {/* Rendered directly below on Mobile so students can scroll through modules */}
                <div className="cv-mobile-playlist">
                  {renderPlaylist()}
                </div>
              </div>
            ) : (
              <div className="cv-empty-state" style={{ textAlign: 'center', padding: '4rem' }}>
                Select a session from the curriculum sidebar to start learning.
              </div>
            )}
          </main>

          {/* DESKTOP SIDEBAR */}
          <aside className="cv-desktop-sidebar" style={{
            borderRadius: 12,
            padding: '1.25rem',
            height: 'fit-content'
          }}>
            {renderPlaylist()}
          </aside>
        </div>
      )}

      {/* ── 1. QUIZ SCORE FLYER MODAL ── */}
      {quizShareModalOpen && quizShareData && (
        <div className="cv-modal-overlay" onClick={() => setQuizShareModalOpen(false)}>
          <div className="cv-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(20,40,255,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.3rem' }}>🎨</span>
                <div>
                  <h3 className="cv-modal-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Share Quiz Score Flyer</h3>
                  <p className="cv-modal-desc" style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.65)' }}>
                    Branded with your name, score, module, and referral invite QR code
                  </p>
                </div>
              </div>
              <button
                className="cv-modal-close"
                onClick={() => setQuizShareModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{
                position: 'relative',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                border: '1px solid rgba(20,40,255,0.3)',
                background: '#060B17',
                marginBottom: '1.25rem'
              }}>
                <canvas
                  ref={flyerCanvasRef}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    aspectRatio: '1 / 1'
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.65rem',
                marginBottom: '1rem'
              }}>
                <button
                  onClick={downloadFlyerImage}
                  className="cv-social-btn cv-social-btn-dl"
                  style={{ gridColumn: '1 / -1', padding: '0.75rem 1.2rem', fontSize: '0.85rem' }}
                >
                  <span>⬇</span> Download Flyer (PNG)
                </button>

                <button
                  onClick={() => {
                    const text = `🔥 Just scored ${quizShareData.scorePct}% on the "${quizShareData.moduleTitle}" assessment in ${quizShareData.courseTitle} at @SofeNode Academy! 🎓🚀\n\nLearn Web3, earn XP, and unlock global bounties with me:\n${quizShareData.inviteUrl}\n\n#SofeNode #Web3 #Blockchain #CryptoEducation`;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="cv-social-btn cv-social-btn-x"
                >
                  <span>𝕏</span> Share on X
                </button>

                <button
                  onClick={() => {
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(quizShareData.inviteUrl)}`, '_blank');
                  }}
                  className="cv-social-btn cv-social-btn-li"
                >
                  <span>in</span> Share on LinkedIn
                </button>

                <button
                  onClick={() => {
                    const text = `🎉 I just scored ${quizShareData.scorePct}% on "${quizShareData.moduleTitle}" (${quizShareData.courseTitle}) on Sofe Node Academy!\n\nJoin me using my invite link:\n${quizShareData.inviteUrl}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                  className="cv-social-btn cv-social-btn-wa"
                >
                  <span>💬</span> WhatsApp
                </button>

                <button
                  onClick={() => handleCopyText(quizShareData.inviteUrl, 'Invite Link')}
                  className="cv-social-btn cv-social-btn-copy"
                >
                  <span>📋</span> Copy Link
                </button>
              </div>

              <div className="cv-tip-box" style={{
                background: 'rgba(20,40,255,0.08)',
                border: '1px solid rgba(20,40,255,0.2)',
                borderRadius: 8,
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div className="cv-tip-text" style={{ fontSize: '0.76rem', color: 'rgba(238,244,255,0.85)', lineHeight: 1.5, flex: 1, minWidth: 200 }}>
                  <strong>💡 Pro-tip:</strong> Download the flyer and attach it to your post on LinkedIn, X, or Instagram stories to attract referrals and earn commissions!
                </div>
                <button
                  className="cv-tip-copy-btn"
                  onClick={() => {
                    const text = `🔥 Just scored ${quizShareData.scorePct}% on the "${quizShareData.moduleTitle}" assessment in ${quizShareData.courseTitle} at Sofe Node Academy! 🎓🚀\n\nJoin me on Sofe Node to learn Web3, earn XP rewards, and unlock global career opportunities:\n${quizShareData.inviteUrl}\n\n#SofeNode #Web3 #Blockchain`;
                    handleCopyText(text, 'Social Post Text');
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Copy Post Text
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. CERTIFICATE MODAL ── */}
      {certModalOpen && (
        <div className="cv-modal-overlay" onClick={() => setCertModalOpen(false)}>
          <div className="cv-modal-card cv-cert-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(255,138,0,0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.4rem' }}>🏅</span>
                <div>
                  <h3 className="cv-modal-title" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>Verified Certificate of Completion</h3>
                  <p className="cv-modal-desc" style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.7)' }}>
                    Official Web3 credential issued by Sofe Node Foundation
                  </p>
                </div>
              </div>
              <button
                className="cv-modal-close"
                onClick={() => setCertModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{
                position: 'relative',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
                border: '2px solid rgba(255,138,0,0.4)',
                background: '#060B17',
                marginBottom: '1.5rem'
              }}>
                <canvas
                  ref={certCanvasRef}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    aspectRatio: '1400 / 950'
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.25rem'
              }}>
                <button
                  onClick={() => setLinkedinGuideOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, #0A66C2, #0077B5)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0.75rem 1.2rem',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(10,102,194,0.35)'
                  }}
                >
                  <span>📘</span> How to Add to LinkedIn
                </button>

                <button
                  onClick={downloadCertificateImage}
                  className="cv-social-btn cv-social-btn-dl"
                  style={{ padding: '0.75rem 1.2rem', fontSize: '0.84rem' }}
                >
                  <span>⬇</span> Download Certificate (PNG)
                </button>
              </div>

              <div className="cv-social-share-box" style={{
                background: 'rgba(20,40,255,0.06)',
                border: '1px solid rgba(20,40,255,0.18)',
                borderRadius: 10,
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <div className="cv-social-share-label" style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'rgba(238,244,255,0.9)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span>🚀</span> Share Credential on Social Media:
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '0.6rem'
                }}>
                  <button
                    onClick={() => {
                      const certNum = certificate?.cert_number || `SOFE-${(courseId || 'CERT').slice(0, 4).toUpperCase()}-001`;
                      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://node.sofegroup.com';
                      const vUrl = `${origin}/dashboard?tab=certificates&id=${certNum}`;
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(vUrl)}`, '_blank');
                    }}
                    className="cv-social-btn cv-social-btn-li"
                  >
                    <span>in</span> LinkedIn Feed
                  </button>

                  <button
                    onClick={() => {
                      const certNum = certificate?.cert_number || `SOFE-${(courseId || 'CERT').slice(0, 4).toUpperCase()}-001`;
                      const cTitle = courseData?.title || 'Blockchain & Cryptocurrency Foundation';
                      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://node.sofegroup.com';
                      const vUrl = `${origin}/dashboard?tab=certificates&id=${certNum}`;
                      const invUrl = getInviteLink();
                      const tweet = `I'm proud to announce that I completed the ${cTitle} at @SofeNode Academy and earned my verified on-chain certificate! 🎓🚀\n\nCredential ID: ${certNum}\nVerify: ${vUrl}\n\nJoin Sofe Node: ${invUrl}\n#SofeNode #Web3 #BlockchainEducation`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`, '_blank');
                    }}
                    className="cv-social-btn cv-social-btn-x"
                  >
                    <span>𝕏</span> Share on X
                  </button>

                  <button
                    onClick={() => {
                      const certNum = certificate?.cert_number || `SOFE-${(courseId || 'CERT').slice(0, 4).toUpperCase()}-001`;
                      const cTitle = courseData?.title || 'Blockchain & Cryptocurrency Foundation';
                      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://node.sofegroup.com';
                      const vUrl = `${origin}/dashboard?tab=certificates&id=${certNum}`;
                      const invUrl = getInviteLink();
                      const wa = `🎓 I just earned my verified Certificate of Completion for "${cTitle}" from Sofe Node Academy!\n\nVerify Credential: ${vUrl}\nJoin Sofe Node: ${invUrl}`;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(wa)}`, '_blank');
                    }}
                    className="cv-social-btn cv-social-btn-wa"
                  >
                    <span>💬</span> WhatsApp
                  </button>

                  <button
                    onClick={() => {
                      const certNum = certificate?.cert_number || `SOFE-${(courseId || 'CERT').slice(0, 4).toUpperCase()}-001`;
                      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://node.sofegroup.com';
                      const vUrl = `${origin}/dashboard?tab=certificates&id=${certNum}`;
                      handleCopyText(vUrl, 'Certificate Verification URL');
                    }}
                    className="cv-social-btn cv-social-btn-copy"
                  >
                    <span>🔗</span> Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. HOW TO LINKEDIN GUIDE MODAL ── */}
      {linkedinGuideOpen && (
        <div className="cv-modal-overlay" style={{ zIndex: 9999999 }} onClick={() => setLinkedinGuideOpen(false)}>
          <div className="cv-modal-card cv-li-modal-card" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(10,102,194,0.3)',
              background: 'rgba(10,102,194,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.4rem' }}>📘</span>
                <div>
                  <h3 className="cv-modal-title" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>How to Add to LinkedIn Profile</h3>
                  <p className="cv-modal-desc cv-li-subtitle" style={{ fontSize: '0.74rem', color: '#6b8cff' }}>
                    Add your verified Sofe Node credential to Licenses &amp; Certifications
                  </p>
                </div>
              </div>
              <button
                className="cv-modal-close"
                onClick={() => setLinkedinGuideOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.85rem' }}>
                <div className="cv-li-step-num" style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#0A66C2',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  flexShrink: 0
                }}>
                  1
                </div>
                <div style={{ flex: 1 }}>
                  <h4 className="cv-li-step-title" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                    Click &quot;Add to LinkedIn Profile Now&quot; Below
                  </h4>
                  <p className="cv-li-step-desc" style={{ fontSize: '0.78rem', color: 'rgba(238,244,255,0.7)', marginTop: '0.2rem', lineHeight: 1.5 }}>
                    This will launch LinkedIn&apos;s official certification form with your credentials pre-populated.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem' }}>
                <div className="cv-li-step-num" style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#0A66C2',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  flexShrink: 0
                }}>
                  2
                </div>
                <div style={{ flex: 1 }}>
                  <h4 className="cv-li-step-title" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                    Confirm Pre-Filled Details on LinkedIn
                  </h4>
                  <p className="cv-li-step-desc" style={{ fontSize: '0.78rem', color: 'rgba(238,244,255,0.7)', marginTop: '0.2rem', marginBottom: '0.8rem' }}>
                    If any field does not auto-fill on LinkedIn, click <strong>Copy</strong> below to paste it:
                  </p>

                  <div className="cv-li-details-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#050B14', padding: '0.85rem', borderRadius: 8, border: '1px solid rgba(200,215,240,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                      <span className="cv-li-field-label" style={{ color: 'rgba(200,215,240,0.6)' }}>Certification Name:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="cv-li-field-value" style={{ color: '#fff', fontWeight: 600 }}>{courseData?.title || 'Foundation Course'}</span>
                        <button
                          className="cv-li-copy-btn"
                          onClick={() => handleCopyText(courseData?.title || 'Foundation Course', 'Course Title')}
                          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#6b8cff', padding: '0.2rem 0.5rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                      <span className="cv-li-field-label" style={{ color: 'rgba(200,215,240,0.6)' }}>Issuing Organization:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="cv-li-field-value" style={{ color: '#fff', fontWeight: 600 }}>Sofe Node</span>
                        <button
                          className="cv-li-copy-btn"
                          onClick={() => handleCopyText('Sofe Node', 'Organization')}
                          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#6b8cff', padding: '0.2rem 0.5rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                      <span className="cv-li-field-label" style={{ color: 'rgba(200,215,240,0.6)' }}>Issue Date:</span>
                      <span className="cv-li-field-value" style={{ color: '#fff', fontWeight: 600 }}>
                        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                      <span className="cv-li-field-label" style={{ color: 'rgba(200,215,240,0.6)' }}>Credential ID:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="cv-li-field-value cv-li-field-id" style={{ color: '#00E5FF', fontWeight: 700, fontFamily: 'monospace' }}>
                          {certificate?.cert_number || `SOFE-${(courseId || 'CERT').slice(0, 4).toUpperCase()}-001`}
                        </span>
                        <button
                          className="cv-li-copy-btn"
                          onClick={() => handleCopyText(certificate?.cert_number || `SOFE-${(courseId || 'CERT').slice(0, 4).toUpperCase()}-001`, 'Credential ID')}
                          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#6b8cff', padding: '0.2rem 0.5rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                      <span className="cv-li-field-label" style={{ color: 'rgba(200,215,240,0.6)' }}>Credential URL:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="cv-li-field-value cv-li-field-url" style={{ color: '#6b8cff', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {typeof window !== 'undefined' ? `${window.location.origin}/dashboard?tab=certificates&id=${certificate?.cert_number || 'SOFE-001'}` : 'https://node.sofegroup.com'}
                        </span>
                        <button
                          className="cv-li-copy-btn"
                          onClick={() => {
                            const certNum = certificate?.cert_number || `SOFE-${(courseId || 'CERT').slice(0, 4).toUpperCase()}-001`;
                            const origin = typeof window !== 'undefined' ? window.location.origin : 'https://node.sofegroup.com';
                            handleCopyText(`${origin}/dashboard?tab=certificates&id=${certNum}`, 'Credential URL');
                          }}
                          style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#6b8cff', padding: '0.2rem 0.5rem', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem' }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem' }}>
                <div className="cv-li-step-num" style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#0A66C2',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  flexShrink: 0
                }}>
                  3
                </div>
                <div style={{ flex: 1 }}>
                  <h4 className="cv-li-step-title" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                    Click &quot;Save&quot; on LinkedIn
                  </h4>
                  <p className="cv-li-step-desc" style={{ fontSize: '0.78rem', color: 'rgba(238,244,255,0.7)', marginTop: '0.2rem', lineHeight: 1.5 }}>
                    Your certificate will immediately appear under the <strong>Licenses &amp; Certifications</strong> section of your LinkedIn profile!
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                {(() => {
                  const certNum = certificate?.cert_number || `SOFE-${(courseId || 'CERT').slice(0, 4).toUpperCase()}-001`;
                  const cTitle = courseData?.title || 'Blockchain & Cryptocurrency Foundation';
                  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://node.sofegroup.com';
                  const vUrl = `${origin}/dashboard?tab=certificates&id=${certNum}`;
                  const issueDate = certificate?.issued_at?.toDate ? certificate.issued_at.toDate() : new Date();
                  const year = issueDate.getFullYear();
                  const month = issueDate.getMonth() + 1;
                  const liUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cTitle)}&organizationName=Sofe+Node&issueYear=${year}&issueMonth=${month}&certId=${encodeURIComponent(certNum)}&certUrl=${encodeURIComponent(vUrl)}`;

                  return (
                    <a
                      href={liUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: '#0A66C2',
                        color: '#fff',
                        borderRadius: 8,
                        padding: '0.85rem 1.5rem',
                        fontWeight: 800,
                        fontSize: '0.88rem',
                        textDecoration: 'none',
                        boxShadow: '0 4px 18px rgba(10,102,194,0.4)'
                      }}
                    >
                      <span>➕</span> Open LinkedIn &amp; Add to Profile Now →
                    </a>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
