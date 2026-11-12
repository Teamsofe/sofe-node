'use client';

import React, { useState, useEffect, useRef } from 'react';
import qrcode from '@/lib/qrcodeGenerator';
import { getWinnerMultiplierTier } from '@/lib/affiliateTiers';

export default function VerifiedEarningsModal({ isOpen, onClose, eventData }) {
  const [maskAmount, setMaskAmount] = useState(false);
  const [copiedText, setCopiedText] = useState(null);
  const canvasRef = useRef(null);
  const logoImgRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/images/Nodes/SofeLogoHome.png';
      img.onload = () => {
        logoImgRef.current = img;
        if (isOpen && eventData && canvasRef.current) {
          drawEarningsFlyer(canvasRef.current, eventData, maskAmount);
        }
      };
      logoImgRef.current = img;
    }
  }, [isOpen, eventData]);

  useEffect(() => {
    if (isOpen && eventData && canvasRef.current) {
      drawEarningsFlyer(canvasRef.current, eventData, maskAmount);
    }
  }, [isOpen, eventData, maskAmount]);

  if (!isOpen || !eventData) return null;

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

  const drawEarningsFlyer = (canvas, data, isMasked) => {
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    const width = 1080;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    // 1. Deep Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#060B17');
    bgGrad.addColorStop(0.5, '#081024');
    bgGrad.addColorStop(1, '#0C1733');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Ambient Glow Orbs
    const glow1 = ctx.createRadialGradient(140, 140, 20, 140, 140, 480);
    glow1.addColorStop(0, 'rgba(20, 40, 255, 0.38)');
    glow1.addColorStop(1, 'rgba(20, 40, 255, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    const glow2 = ctx.createRadialGradient(940, 940, 20, 940, 940, 480);
    glow2.addColorStop(0, 'rgba(255, 138, 0, 0.28)');
    glow2.addColorStop(1, 'rgba(255, 138, 0, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);

    // 3. Subtle Cyber Grid
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 60; x < width; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 60; y < height; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.restore();

    // 4. Outer Tech Border
    ctx.save();
    ctx.strokeStyle = 'rgba(20, 40, 255, 0.4)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 40, 40, width - 80, height - 80, 24);
    ctx.stroke();

    // Corner brackets
    ctx.strokeStyle = '#FF8A00';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(40, 90); ctx.lineTo(40, 40); ctx.lineTo(90, 40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width - 90, 40); ctx.lineTo(width - 40, 40); ctx.lineTo(width - 40, 90); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, height - 90); ctx.lineTo(40, height - 40); ctx.lineTo(90, height - 40); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width - 90, height - 40); ctx.lineTo(width - 40, height - 40); ctx.lineTo(width - 40, height - 90); ctx.stroke();
    ctx.restore();

    // 5. Header Branding
    ctx.save();
    const logoX = 80;
    const logoY = 72;
    const logoH = 44;
    const logoImg = logoImgRef.current;

    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      const logoW = Math.round(logoH * (logoImg.naturalWidth / logoImg.naturalHeight));
      ctx.save();
      ctx.filter = 'brightness(1.5) saturate(1.3) drop-shadow(0 0 12px rgba(0, 180, 255, 0.35))';
      ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
      ctx.restore();

      const academyX = logoX + logoW + 18;
      ctx.fillStyle = '#FF8A00';
      ctx.font = '700 22px Poppins, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('• ACADEMY', academyX, logoY + (logoH / 2));
    } else {
      ctx.fillStyle = '#FE8206';
      ctx.font = '800 28px Poppins, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('SOFE', logoX, logoY + (logoH / 2));
      ctx.fillStyle = '#5B8CFF';
      ctx.font = '800 28px Poppins, sans-serif';
      ctx.fillText('NODE', logoX + 85, logoY + (logoH / 2));
      ctx.fillStyle = '#FF8A00';
      ctx.font = '700 22px Poppins, sans-serif';
      ctx.fillText('• ACADEMY', logoX + 185, logoY + (logoH / 2));
    }

    // Top-right Pill Badge: VERIFIED PROOF OF WORK /
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    drawRoundedRect(ctx, width - 380, 72, 300, 44, 22);
    ctx.fill();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, width - 380, 72, 300, 44, 22);
    ctx.stroke();

    ctx.fillStyle = '#10B981';
    ctx.font = '700 15px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('VERIFIED PROOF OF WORK /', width - 230, 94);
    ctx.restore();

    // 6. Subtitle & Awardee
    ctx.save();
    ctx.fillStyle = '#FF8A00';
    ctx.font = '700 18px Poppins, sans-serif';
    ctx.letterSpacing = '3px';

    const subtitleText = data.type === 'leaderboard'
      ? 'SEASON XP LEADERBOARD PODIUM'
      : data.type === 'bounty'
        ? 'VERIFIED PROTOCOL BOUNTY WINNER'
        : 'OFFICIAL WITHDRAWAL SETTLEMENT RECEIPT';
    ctx.fillText(subtitleText, 80, 185);

    ctx.fillStyle = 'rgba(238, 244, 255, 0.6)';
    ctx.font = '500 18px Poppins, sans-serif';
    ctx.letterSpacing = '0px';
    ctx.fillText('Awarded to', 80, 225);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 44px Poppins, sans-serif';
    ctx.fillText(data.studentName || 'Sofian Builder', 80, 275);

    ctx.fillStyle = '#6B8CFF';
    ctx.font = '700 24px Poppins, sans-serif';
    ctx.fillText(data.title || 'Affiliate Commission Payout', 80, 325);

    ctx.fillStyle = 'rgba(238, 244, 255, 0.85)';
    ctx.font = '500 20px Poppins, sans-serif';
    ctx.fillText(data.subtitle || 'Sofe Node Talent & Distributed Campus Network', 80, 362);
    ctx.restore();

    // 7. Central Glowing Earnings Card
    ctx.save();
    const cardY = 410;
    const cardH = 270;
    const cardW = width - 160;

    ctx.fillStyle = 'rgba(20, 40, 255, 0.12)';
    drawRoundedRect(ctx, 80, cardY, cardW, cardH, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 200, 100, 0.5)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 80, cardY, cardW, cardH, 20);
    ctx.stroke();

    // Left Ring/Medal Icon Box
    const ringCenterX = 240;
    const ringCenterY = cardY + 135;
    const ringRadius = 90;

    const ringGlow = ctx.createRadialGradient(ringCenterX, ringCenterY, 30, ringCenterX, ringCenterY, 110);
    ringGlow.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = ringGlow;
    ctx.beginPath();
    ctx.arc(ringCenterX, ringCenterY, 110, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(ringCenterX, ringCenterY, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#00E5FF';
    ctx.font = '800 52px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const ringIcon = data.type === 'leaderboard' ? `TOP ${data.rank || 3}` : data.type === 'bounty' ? 'WIN' : 'PAID';
    ctx.fillText(ringIcon, ringCenterX, ringCenterY - 8);

    ctx.fillStyle = 'rgba(238, 244, 255, 0.7)';
    ctx.font = '700 13px Poppins, sans-serif';
    ctx.fillText('STATUS: VERIFIED', ringCenterX, ringCenterY + 42);

    // Right Details: Amount and Multiplier Badge
    const detailX = 380;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Amount or Masked Display
    let displayAmount = isMasked
      ? '₦ ••••••••'
      : (data.amountFormatted || (data.amount ? `₦${Number(data.amount).toLocaleString('en-NG')}` : '₦25,000'));

    ctx.fillStyle = '#00c864';
    ctx.font = '800 48px Poppins, sans-serif';
    ctx.fillText(displayAmount, detailX, cardY + 70);

    // Dynamic Multiplier Badge with 4-Tier Scaling Colors
    const count = Number(data.multiplierCount) || 1;
    const multiplier = data.multiplierText || (data.type === 'bounty' ? `${count}X Bounty Winner` : `${count}X Top Leaderboard Winner`);
    const tierMeta = getWinnerMultiplierTier(count) || {
      color: '#FFB03A',
      borderColor: '#FF8A00'
    };

    ctx.font = '800 13px Poppins, sans-serif';
    const badgeTextWidth = ctx.measureText(multiplier).width;
    const badgeW = badgeTextWidth + 28;
    const badgeX = detailX;
    const badgeY = cardY + 95;
    const badgeH = 32;

    ctx.fillStyle = 'rgba(13, 21, 38, 0.85)';
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 16);
    ctx.fill();
    ctx.strokeStyle = tierMeta.borderColor || '#FF8A00';
    ctx.lineWidth = 1.8;
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 16);
    ctx.stroke();

    ctx.fillStyle = tierMeta.color || '#FFB03A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(multiplier, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);

    // Subtitle notes
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(238, 244, 255, 0.85)';
    ctx.font = '500 18px Poppins, sans-serif';
    ctx.fillText(
      data.type === 'leaderboard'
        ? 'Ranked on the official Season XP Leaderboard podium.'
        : data.type === 'bounty'
          ? 'Completed verified protocol deliverables for ecosystem bounties.'
          : 'Processed via automated Paystack clearing and bank disbursement.'
      , detailX, cardY + 168
    );

    ctx.fillStyle = '#FF8A00';
    ctx.font = '700 17px Poppins, sans-serif';
    ctx.fillText(`🏆 +${data.xpEarned || 25} XP Proof-of-Work Credited`, detailX, cardY + 208);

    ctx.fillStyle = 'rgba(200, 215, 240, 0.6)';
    ctx.font = '500 14px Poppins, sans-serif';
    ctx.fillText('Verified on Sofe Node Academy • Web3 Ecosystem', detailX, cardY + 242);
    ctx.restore();

    // 8. Bottom Section: QR Code Card & Referral Link
    ctx.save();
    const qrCardY = 730;
    const qrBoxW = 240;
    const qrBoxH = 240;

    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, 80, qrCardY, qrBoxW, qrBoxH, 18);
    ctx.fill();

    try {
      const qr = qrcode(0, 'M');
      qr.addData(data.inviteUrl || 'https://node.sofegroup.com');
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
    ctx.fillText('Scan to Join & Build with Me', 80 + qrBoxW / 2, qrCardY + qrBoxH + 34);

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
    ctx.fillText(data.inviteUrl || 'https://node.sofegroup.com', inviteX, qrCardY + 200);

    ctx.fillStyle = 'rgba(200, 215, 240, 0.45)';
    ctx.font = '500 13px Poppins, sans-serif';
    ctx.fillText('Official Credential • node.sofegroup.com • Powered by Sofe Node Ecosystem', inviteX, qrCardY + 238);
    ctx.restore();
  };

  const getShareCaption = () => {
    const inviteUrl = eventData.inviteUrl || 'https://node.sofegroup.com';
    if (eventData.type === 'leaderboard') {
      return `Pushing for the Top spot on @SofeNode! Just placed on the Monthly Season Leaderboard podium with ${eventData.xpEarned || 25} XP. Think you can outbuild me? Test your Web3 IQ: ${inviteUrl}`;
    }
    if (eventData.type === 'bounty') {
      return `Just completed and won the "${eventData.title}" bounty on @SofeNode! Building verified Web3 credentials while earning global protocol rewards. Join me: ${inviteUrl}`;
    }
    return `Just withdrew my verified Web3 earnings on @SofeNode! Validated Proof-of-Work pays off. Start your Web3 career and build with me here: ${inviteUrl}`;
  };

  const downloadFlyerImage = () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      const safeName = (eventData.studentName || 'Builder').replace(/\s+/g, '_');
      link.download = `${safeName}_Sofe_ProofOfWork_Receipt.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('Download error:', e);
    }
  };

  const getFlyerFile = async () => {
    if (!canvasRef.current) return null;
    return new Promise((resolve) => {
      try {
        canvasRef.current.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const safeName = (eventData.studentName || 'Builder').replace(/\s+/g, '_');
          const file = new File([blob], `${safeName}_Sofe_Receipt.png`, { type: 'image/png' });
          resolve(file);
        }, 'image/png');
      } catch (e) {
        resolve(null);
      }
    });
  };

  const handleShare = async (platform = 'native') => {
    const caption = getShareCaption();
    const inviteUrl = eventData.inviteUrl || 'https://node.sofegroup.com';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const file = await getFlyerFile();
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Sofe Node Verified Earnings Receipt',
            text: caption,
            files: [file]
          });
          return;
        } else if (platform === 'native' && navigator.canShare && navigator.canShare({ text: caption, url: inviteUrl })) {
          await navigator.share({
            title: 'Sofe Node Verified Earnings Receipt',
            text: caption,
            url: inviteUrl
          });
          downloadFlyerImage();
          return;
        }
      } catch (e) {
        if (e.name === 'AbortError') return;
      }
    }

    if (platform === 'x') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(caption)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(inviteUrl)}`, '_blank');
    } else {
      downloadFlyerImage();
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(caption);
        setCopiedText('Post text copied!');
        setTimeout(() => setCopiedText(null), 3000);
      }
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#091124',
          border: '1px solid rgba(20,40,255,0.3)',
          borderRadius: 16,
          maxWidth: 580,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
          color: '#fff'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(20,40,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
              Proof of Work Flex Card 🚀
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'rgba(200,215,240,0.65)', margin: '0.2rem 0 0' }}>
              Share your verified earnings, podium wins, and multiplier status on socials
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
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

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {/* Privacy Toggle Switch */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(20,40,255,0.1)',
            border: '1px solid rgba(20,40,255,0.25)',
            borderRadius: 10,
            padding: '0.75rem 1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                {maskAmount ? '🔒 Privacy Mode: ON' : '👁️ Privacy Mode: OFF'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(200,215,240,0.65)' }}>
                {maskAmount
                  ? 'Financial amount masked on flyer (shows status & multiplier badge)'
                  : 'Display exact withdrawal/prize amount on the flyer'}
              </div>
            </div>

            <button
              onClick={() => setMaskAmount(!maskAmount)}
              style={{
                background: maskAmount ? '#FF8A00' : 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                borderRadius: 20,
                padding: '0.4rem 0.85rem',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {maskAmount ? 'Unhide Amount' : 'Mask Amount'}
            </button>
          </div>

          {/* Canvas Preview Box */}
          <div style={{
            position: 'relative',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            border: '1px solid rgba(20,40,255,0.3)',
            background: '#060B17',
            marginBottom: '1rem'
          }}>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                aspectRatio: '1 / 1'
              }}
            />
          </div>

          {/* Primary One-Tap Button */}
          <button
            onClick={() => handleShare('native')}
            style={{
              width: '100%',
              padding: '0.85rem 1.25rem',
              fontSize: '0.92rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #FF8A00 0%, #FE8206 50%, #E65100 100%)',
              color: '#FFFFFF',
              borderRadius: 10,
              border: 'none',
              boxShadow: '0 4px 20px rgba(255,138,0,0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              marginBottom: '0.75rem'
            }}
          >
            <span>📲</span> One-Tap Share Flex Card (Image + Caption)
          </button>

          {/* Social Intent Buttons Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
            gap: '0.55rem',
            marginBottom: '1rem'
          }}>
            <button
              onClick={downloadFlyerImage}
              style={{
                padding: '0.65rem 0.8rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ⬇ Download PNG
            </button>

            <button
              onClick={() => handleShare('x')}
              style={{
                padding: '0.65rem 0.8rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              𝕏 Share on X
            </button>

            <button
              onClick={() => handleShare('linkedin')}
              style={{
                padding: '0.65rem 0.8rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              in LinkedIn
            </button>

            <button
              onClick={() => handleShare('whatsapp')}
              style={{
                padding: '0.65rem 0.8rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              💬 WhatsApp
            </button>
          </div>

          {/* Copy Caption Pro Tip */}
          <div style={{
            background: 'rgba(20,40,255,0.08)',
            border: '1px solid rgba(20,40,255,0.2)',
            borderRadius: 8,
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.8rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ fontSize: '0.74rem', color: 'rgba(238,244,255,0.85)', flex: 1, minWidth: 200 }}>
              {copiedText || '💡 Pro-tip: Flexing verified payouts and leaderboard wins attracts high-intent referrals who want to earn with you!'}
            </div>
            <button
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(getShareCaption());
                  setCopiedText('Post caption copied!');
                  setTimeout(() => setCopiedText(null), 3000);
                }
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
              Copy Flex Caption
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
