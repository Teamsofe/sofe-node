import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const rawParam = params?.username ? decodeURIComponent(params.username).trim() : '';
  if (!rawParam) {
    return NextResponse.json({ success: false, error: 'Missing username or identifier' }, { status: 400 });
  }

  try {
    let userDoc = null;
    let userId = null;

    // 1. Try finding by referral_code (both uppercase and verbatim)
    const upperParam = rawParam.toUpperCase();
    let refSnap = await adminDb.collection('users').where('referral_code', '==', upperParam).limit(1).get();
    if (!refSnap.empty) {
      userDoc = refSnap.docs[0];
      userId = userDoc.id;
    }

    if (!userDoc && upperParam !== rawParam) {
      refSnap = await adminDb.collection('users').where('referral_code', '==', rawParam).limit(1).get();
      if (!refSnap.empty) {
        userDoc = refSnap.docs[0];
        userId = userDoc.id;
      }
    }

    // 2. Try finding by username (lowercase and verbatim)
    if (!userDoc) {
      const lowerParam = rawParam.toLowerCase();
      let userSnap = await adminDb.collection('users').where('username', '==', lowerParam).limit(1).get();
      if (!userSnap.empty) {
        userDoc = userSnap.docs[0];
        userId = userDoc.id;
      } else if (lowerParam !== rawParam) {
        userSnap = await adminDb.collection('users').where('username', '==', rawParam).limit(1).get();
        if (!userSnap.empty) {
          userDoc = userSnap.docs[0];
          userId = userDoc.id;
        }
      }
    }

    // 3. Try direct UID lookup if param length suggests a UID
    if (!userDoc && rawParam.length >= 15) {
      const directDoc = await adminDb.collection('users').doc(rawParam).get();
      if (directDoc.exists) {
        userDoc = directDoc;
        userId = directDoc.id;
      }
    }

    // 4. Try legacy / alias code fields (affiliate_code, ref_code)
    if (!userDoc) {
      const affSnap = await adminDb.collection('users').where('affiliate_code', '==', upperParam).limit(1).get();
      if (!affSnap.empty) {
        userDoc = affSnap.docs[0];
        userId = userDoc.id;
      }
    }

    // If still not found, return 404
    if (!userDoc || !userDoc.exists) {
      return NextResponse.json(
        { success: false, error: `Builder profile '${rawParam}' not found.` },
        { status: 404 }
      );
    }

    const data = userDoc.data() || {};

    // 5. Query user certificates
    let certificates = [];
    try {
      const certSnap = await adminDb
        .collection('certificates')
        .where('user_id', '==', userId)
        .limit(20)
        .get();

      certificates = certSnap.docs.map((c) => {
        const cData = c.data() || {};
        let issuedAtIso = null;
        if (cData.issued_at) {
          issuedAtIso = cData.issued_at.toDate ? cData.issued_at.toDate().toISOString() : cData.issued_at;
        } else if (cData.created_at) {
          issuedAtIso = cData.created_at.toDate ? cData.created_at.toDate().toISOString() : cData.created_at;
        }

        return {
          id: c.id,
          course_id: cData.course_id || 'foundation',
          course_title: cData.course_title || cData.title || 'Blockchain & Web3 Architecture',
          score: Number(cData.score || cData.grade || 95),
          issued_at: issuedAtIso,
        };
      });
    } catch (certErr) {
      console.warn('[Profile API] Could not load certificates:', certErr.message);
    }

    // 6. Query leaderboard rank for this user
    let seasonRank = null;
    let lbTier = null;
    try {
      const lbDoc = await adminDb.collection('leaderboard').doc(userId).get();
      if (lbDoc.exists) {
        const lbData = lbDoc.data() || {};
        lbTier = lbData.tier || null;
      }

      // Rank position among top users
      const topLbSnap = await adminDb
        .collection('leaderboard')
        .orderBy('xp_this_period', 'desc')
        .limit(100)
        .get();

      const rankIndex = topLbSnap.docs.findIndex((d) => d.id === userId);
      if (rankIndex >= 0) {
        seasonRank = rankIndex + 1;
      }
    } catch (lbErr) {
      console.warn('[Profile API] Could not query leaderboard position:', lbErr.message);
    }

    // 7. Sanitize and package public profile
    const firstName = (data.first_name || '').trim();
    const lastName = (data.last_name || '').trim();
    const lastInitial = lastName ? `${lastName.charAt(0).toUpperCase()}.` : '';
    const fullName = `${firstName} ${lastName}`.trim() || data.full_name || data.username || 'Sofian Builder';

    const lifetimeXp = Math.max(0, Number(data.xp_total ?? data.total_xp ?? data.xp ?? 0));
    const monthlyXp = Math.max(0, Number(data.monthly_xp ?? data.xp_this_period ?? 0));
    const dailyStreak = Math.max(1, Number(data.daily_streak || 1));
    const avgScore = Number(data.average_score || data.exam_score || (data.foundation_score ? parseInt(data.foundation_score, 10) : 95));

    const XP_TIERS = [
      { name: 'Genesis Scout', min: 0 },
      { name: 'Validator', min: 500 },
      { name: 'Crypto Knight', min: 1500 },
      { name: 'Chain Architect', min: 4000 },
      { name: 'Node Operator', min: 8000 },
      { name: 'Node Sovereign', min: 15000 },
    ];
    const derivedTier = [...XP_TIERS].reverse().find((t) => lifetimeXp >= t.min) || XP_TIERS[0];

    const sanitizedProfile = {
      uid: userId,
      first_name: firstName,
      last_name: lastName,
      last_initial: lastInitial,
      full_name: fullName,
      username: data.username || (data.referral_code ? data.referral_code.toLowerCase() : 'builder'),
      bio: data.bio || 'Web3 Builder & Protocol Contributor on Sofe Node Academy.',
      node_label: data.node_label || data.chapter_name || data.node || 'Sofe Node UNN',
      referral_code: data.referral_code || rawParam,
      xp_total: lifetimeXp,
      monthly_xp: monthlyXp,
      xp_tier: lbTier || data.xp_tier || derivedTier.name,
      season_rank: seasonRank || data.season_rank || data.rank || 12,
      daily_streak: dailyStreak,
      average_score: avgScore,
      completed_assessments_count: Number(data.completed_assessments_count || certificates.length || 1),
      leaderboard_wins_count: Number(data.leaderboardWinsCount || data.leaderboard_wins_count || (seasonRank && seasonRank <= 3 ? 1 : 0)),
      bounty_wins_count: Number(data.bountyWinsCount || data.bounty_wins_count || 0),
      created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : data.created_at,
    };

    return NextResponse.json(
      {
        success: true,
        profile: sanitizedProfile,
        certificates,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (err) {
    console.warn('[Profile API Admin Attempt Failed, falling back]:', err.message);

    // Fallback: Query deployed Cloud Function if Admin SDK lacks local credentials
    try {
      const cfRes = await fetch(
        `https://us-central1-sofe-node.cloudfunctions.net/publicProfileHttp?username=${encodeURIComponent(rawParam)}`,
        { next: { revalidate: 60 } }
      );
      if (cfRes.ok) {
        const cfData = await cfRes.json();
        if (cfData.success) {
          return NextResponse.json(cfData, { status: 200 });
        }
      }
    } catch (cfErr) {
      console.warn('[Profile API Cloud Function Fallback Failed]:', cfErr.message);
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch builder profile: ' + err.message },
      { status: 500 }
    );
  }
}
