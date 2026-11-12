'use client';

import React from 'react';
import { getWinnerMultiplierTier } from '../lib/affiliateTiers';

/**
 * Reusable dynamic status multiplier badge:
 * - 1X - 2X: Bronze / Emerald accent
 * - 3X - 4X: Silver / Cyan accent
 * - 5X - 9X: Gold accent with glow
 * - 10X+: Elite / Mythic animated gradient
 */
export default function WinnerMultiplierBadge({
  type = 'leaderboard',
  count = 0,
  size = 'md',
  showIcon = true,
  style = {}
}) {
  const num = Number(count) || 0;
  if (num <= 0) return null;

  const tierMeta = getWinnerMultiplierTier(num);
  if (!tierMeta) return null;

  const labelText =
    type === 'leaderboard'
      ? `${num}X Top Leaderboard Winner`
      : `${num}X Bounty Winner`;

  const sizeStyles = {
    sm: {
      fontSize: '0.66rem',
      padding: '0.2rem 0.55rem',
      gap: '0.3rem',
      borderRadius: '5px'
    },
    md: {
      fontSize: '0.74rem',
      padding: '0.32rem 0.75rem',
      gap: '0.4rem',
      borderRadius: '6px'
    },
    lg: {
      fontSize: '0.84rem',
      padding: '0.45rem 1rem',
      gap: '0.5rem',
      borderRadius: '8px'
    }
  }[size] || {
    fontSize: '0.74rem',
    padding: '0.32rem 0.75rem',
    gap: '0.4rem',
    borderRadius: '6px'
  };

  return (
    <span
      className={`winner-multiplier-badge tier-${tierMeta.tier}`}
      title={`${tierMeta.levelLabel}: ${labelText}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: tierMeta.badgeBg,
        border: `1px solid ${tierMeta.borderColor}`,
        color: tierMeta.color,
        boxShadow: tierMeta.boxShadow,
        fontWeight: 700,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        lineHeight: 1.2,
        ...sizeStyles,
        ...style
      }}
    >
      {showIcon && <span>{tierMeta.icon}</span>}
      <span>{labelText}</span>
    </span>
  );
}
