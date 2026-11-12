/**
 * Dynamic Affiliate Tier & Boost Calculation Engine
 * 
 * 3-Tier Hierarchy:
 * ⭐ Level 1 — Newbie: 5% Direct referral (Baseline; payouts require Foundation Course completion)
 * 🎯 Level 2 — Affiliate: 10% Direct referral (10 qualified referrals OR VIP Premium membership)
 * 🏆 Level 3 — Ambassador: 10% Direct + 5% Indirect referral (Invitation/Admin only)
 * 
 * Dynamic 30-Day Boost Rule (Top 3 Leaderboard Podium or Community Manager Boost):
 * - If base tier is Level 1 (Newbie): Boost elevates to Level 2 (Affiliate, 10% Direct)
 * - If base tier is Level 2 (Affiliate): Boost elevates to Level 3 (Ambassador, 10% Direct + 5% Indirect)
 * - If base tier is Level 3 (Ambassador): Boost retains Level 3 (Ambassador, 10% Direct + 5% Indirect)
 * - Once boost expires: Automatically reverts to base tier without cron overwrite.
 */

export function getEffectiveAffiliateTier(user, qualifiedCount = 0) {
  if (!user) {
    return {
      tier: 'LEVEL_1',
      tierNumber: 1,
      tierName: 'Level 1 — Newbie',
      rate: 0.05,
      ratePercent: 5,
      indirectRate: 0,
      indirectRatePercent: 0,
      isBoostActive: false,
      daysRemaining: 0,
      baseTier: 'LEVEL_1',
      baseTierName: 'Level 1 — Newbie',
      isPermanent: true,
      label: 'Level 1 — Newbie'
    };
  }

  // 1. Calculate Base Tier (Permanent Status)
  let baseTier = 'LEVEL_1';
  let baseTierNumber = 1;
  let baseTierName = 'Level 1 — Newbie';

  const isLevel3Base =
    user.affiliateBaseTier === 'LEVEL_3' ||
    user.affiliate_tier === 'ambassador' ||
    user.role === 'ambassador' ||
    user.is_ambassador === true ||
    user.affiliate_level === 3;

  const isLevel2Base =
    user.affiliateBaseTier === 'LEVEL_2' ||
    user.affiliate_tier === 'affiliate' ||
    user.is_premium === true ||
    user.account_type === 'premium' ||
    user.affiliate_level === 2 ||
    qualifiedCount >= 10 ||
    (Number(user.qualified_refs_count || 0) >= 10);

  if (isLevel3Base) {
    baseTier = 'LEVEL_3';
    baseTierNumber = 3;
    baseTierName = 'Level 3 — Ambassador';
  } else if (isLevel2Base) {
    baseTier = 'LEVEL_2';
    baseTierNumber = 2;
    baseTierName = 'Level 2 — Affiliate';
  }

  // 2. Check Temporal 30-Day Boost
  const now = new Date();
  let isBoostActive = false;
  let daysRemaining = 0;

  if (user.affiliateBoostExpiresAt) {
    const expiresAt = user.affiliateBoostExpiresAt.toDate
      ? user.affiliateBoostExpiresAt.toDate()
      : new Date(user.affiliateBoostExpiresAt);

    if (expiresAt && !isNaN(expiresAt.getTime()) && expiresAt > now) {
      isBoostActive = true;
      daysRemaining = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }
  }

  // 3. Apply Boost Upgrade Logic:
  // Level 1 + Boost -> Level 2
  // Level 2 + Boost -> Level 3
  // Level 3 + Boost -> Level 3
  let effectiveTier = baseTier;
  let effectiveTierNumber = baseTierNumber;
  let effectiveTierName = baseTierName;

  if (isBoostActive) {
    if (baseTier === 'LEVEL_1') {
      effectiveTier = 'LEVEL_2';
      effectiveTierNumber = 2;
      effectiveTierName = 'Level 2 — Affiliate';
    } else if (baseTier === 'LEVEL_2' || baseTier === 'LEVEL_3') {
      effectiveTier = 'LEVEL_3';
      effectiveTierNumber = 3;
      effectiveTierName = 'Level 3 — Ambassador';
    }
  }

  // 4. Determine Commission Rates
  let rate = 0.05;
  let ratePercent = 5;
  let indirectRate = 0;
  let indirectRatePercent = 0;

  if (effectiveTier === 'LEVEL_3') {
    rate = 0.10;
    ratePercent = 10;
    indirectRate = 0.05;
    indirectRatePercent = 5;
  } else if (effectiveTier === 'LEVEL_2') {
    rate = 0.10;
    ratePercent = 10;
    indirectRate = 0;
    indirectRatePercent = 0;
  } else {
    // LEVEL_1
    rate = 0.05;
    ratePercent = 5;
    indirectRate = 0;
    indirectRatePercent = 0;
  }

  const label = isBoostActive && effectiveTier !== baseTier
    ? `${effectiveTierName} (🔥 30-Day Boost Active • ${daysRemaining}d left)`
    : effectiveTierName;

  return {
    tier: effectiveTier,
    tierNumber: effectiveTierNumber,
    tierName: effectiveTierName,
    rate,
    ratePercent,
    indirectRate,
    indirectRatePercent,
    isBoostActive,
    daysRemaining,
    baseTier,
    baseTierName,
    isPermanent: !isBoostActive || effectiveTier === baseTier,
    label
  };
}

/**
 * Returns visual tier metadata based on multiplier count.
 * 1X-2X: Bronze/Emerald
 * 3X-4X: Silver/Cyan
 * 5X-9X: Gold with glow
 * 10X+: Elite/Mythic gradient
 */
export function getWinnerMultiplierTier(count) {
  const num = Number(count) || 0;
  if (num <= 0) return null;

  if (num >= 10) {
    return {
      tier: 'mythic',
      levelLabel: 'Mythic Champion',
      color: '#f472b6',
      badgeBg: 'linear-gradient(135deg, rgba(236,72,153,0.25) 0%, rgba(168,85,247,0.3) 50%, rgba(251,191,36,0.2) 100%)',
      borderColor: 'rgba(236,72,153,0.65)',
      boxShadow: '0 0 16px rgba(236,72,153,0.35)',
      icon: '👑'
    };
  }

  if (num >= 5) {
    return {
      tier: 'gold',
      levelLabel: 'Gold Champion',
      color: '#fbbf24',
      badgeBg: 'linear-gradient(135deg, rgba(245,158,11,0.22) 0%, rgba(217,119,6,0.35) 100%)',
      borderColor: 'rgba(251,191,36,0.65)',
      boxShadow: '0 0 14px rgba(251,191,36,0.3)',
      icon: '🥇'
    };
  }

  if (num >= 3) {
    return {
      tier: 'silver',
      levelLabel: 'Silver Contender',
      color: '#38bdf8',
      badgeBg: 'linear-gradient(135deg, rgba(6,182,212,0.18) 0%, rgba(14,165,233,0.28) 100%)',
      borderColor: 'rgba(56,189,248,0.5)',
      boxShadow: '0 0 10px rgba(56,189,248,0.2)',
      icon: '🥈'
    };
  }

  // 1X - 2X
  return {
    tier: 'bronze',
    levelLabel: 'Rising Victor',
    color: '#34d399',
    badgeBg: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.25) 100%)',
    borderColor: 'rgba(52,211,153,0.45)',
    boxShadow: 'none',
    icon: '🥉'
  };
}
