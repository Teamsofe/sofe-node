import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = (searchParams.get('userId') || searchParams.get('uid') || '').trim();
    const refCode = (searchParams.get('ref') || searchParams.get('referral_code') || '').trim();

    let targetUid = userId;

    if (!targetUid && refCode) {
      const uSnap = await adminDb.collection('users').where('referral_code', '==', refCode.toUpperCase()).limit(1).get();
      if (!uSnap.empty) {
        targetUid = uSnap.docs[0].id;
      }
    }

    if (!targetUid) {
      return NextResponse.json({ success: false, error: 'User ID or referral code is required' }, { status: 400 });
    }

    // 1. Fetch user document
    const userDoc = await adminDb.collection('users').doc(targetUid).get();
    const userData = userDoc.exists ? userDoc.data() : null;

    // 2. Fetch all XP logs for this user from collection 'xp'
    const xpSnap = await adminDb.collection('xp')
      .where('user_id', '==', targetUid)
      .get();

    const logs = [];
    let computedTotalXp = 0;
    let computedNovemberXp = 0; // Current month (November 2026)

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth(); // 0-indexed (10 = November)
    const startOfCurrentMonth = new Date(Date.UTC(currentYear, currentMonth, 1));

    xpSnap.docs.forEach((doc) => {
      const data = doc.data() || {};
      const earned = Number(data.xp_earned || 0);
      computedTotalXp += earned;

      let claimedAtIso = null;
      let claimedAtDate = null;
      if (data.claimed_at) {
        if (data.claimed_at.toDate) {
          claimedAtDate = data.claimed_at.toDate();
          claimedAtIso = claimedAtDate.toISOString();
        } else if (data.claimed_at._seconds) {
          claimedAtDate = new Date(data.claimed_at._seconds * 1000);
          claimedAtIso = claimedAtDate.toISOString();
        } else {
          claimedAtIso = String(data.claimed_at);
          claimedAtDate = new Date(claimedAtIso);
        }
      }

      if (claimedAtDate && claimedAtDate >= startOfCurrentMonth) {
        computedNovemberXp += earned;
      }

      logs.push({
        id: doc.id,
        xp_earned: earned,
        source: data.source || 'daily_claim',
        bonus_label: data.bonus_label || data.label || (data.source === 'streak_auto' ? 'Daily Login Streak' : 'XP Award'),
        streak_day: data.streak_day || 0,
        bonus_xp: data.bonus_xp || 0,
        claimed_at: claimedAtIso,
        claimed_at_ms: claimedAtDate ? claimedAtDate.getTime() : 0,
      });
    });

    // Sort descending by date
    logs.sort((a, b) => (b.claimed_at_ms || 0) - (a.claimed_at_ms || 0));

    // Also check leaderboard record
    const lbDoc = await adminDb.collection('leaderboard').doc(targetUid).get();
    const lbData = lbDoc.exists ? lbDoc.data() : null;

    return NextResponse.json({
      success: true,
      user: {
        uid: targetUid,
        first_name: userData?.first_name || lbData?.first_name || '',
        last_name: userData?.last_name || lbData?.last_name || '',
        referral_code: userData?.referral_code || lbData?.referral_code || '',
        sofian_id: userData?.sofian_id || '',
        daily_streak: userData?.daily_streak || lbData?.daily_streak || 1,
        last_daily_claim: userData?.last_daily_claim ? (userData.last_daily_claim.toDate ? userData.last_daily_claim.toDate().toISOString() : userData.last_daily_claim) : null,
      },
      stats: {
        userDoc_xp_total: userData?.xp_total ?? userData?.total_xp ?? 0,
        userDoc_monthly_xp: userData?.monthly_xp ?? userData?.xp_this_period ?? 0,
        leaderboard_xp_total: lbData?.xp_total ?? 0,
        leaderboard_xp_this_period: lbData?.xp_this_period ?? 0,
        computedFromLogs_totalXp: computedTotalXp,
        computedFromLogs_thisMonthXp: computedNovemberXp,
        totalLogEntries: logs.length,
      },
      logs,
    });
  } catch (err) {
    console.error('Error fetching XP log:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
