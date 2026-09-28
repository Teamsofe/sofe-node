const { onDocumentUpdated, onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onRequest, onCall, HttpsError } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');

admin.initializeApp();

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS CALCULATION HELPER
// ═══════════════════════════════════════════════════════════════════════════
async function recalcEnrolmentProgress(uid, courseId) {
  const db = admin.firestore();
  const enrolSnap = await db.collection('enrolments')
    .where('user_id', '==', uid)
    .where('course_id', '==', courseId)
    .where('status', '==', 'active')
    .get();
    
  if (enrolSnap.empty) return;

  const modulesSnap = await db.collection('modules').where('course_id', '==', courseId).get();
  let totalSessions = 0;
  let doneSessions = 0;

  for (const mDoc of modulesSnap.docs) {
      const mSessions = await db.collection('sessions').where('module_id', '==', mDoc.id).get();
      totalSessions += mSessions.size;
      const pSnap = await db.collection('module_progress').doc(`${uid}_${mDoc.id}`).get();
      if (pSnap.exists) {
          const sc = pSnap.data().sessions_completed || {};
          mSessions.docs.forEach(s => { if (sc[s.id]) doneSessions++; });
      }
  }

  const pct = totalSessions > 0 ? Math.round((doneSessions / totalSessions) * 100) : 0;
  const updateData = { progress_pct: pct, updated_at: admin.firestore.FieldValue.serverTimestamp() };
  
  if (pct === 100) {
      updateData.status = 'completed';
      updateData.completed_at = admin.firestore.FieldValue.serverTimestamp();
  }
  
  await enrolSnap.docs[0].ref.update(updateData);
}

// ═══════════════════════════════════════════════════════════════════════════
// NEW USER REFERRAL ENGINE
// Fires when a user profile is created. If they used a referral code, this
// resolves the code to the referrer's UID and creates the 'referrals' doc.
// ═══════════════════════════════════════════════════════════════════════════
exports.syncNewUserReferral = onDocumentCreated('users/{uid}', async (event) => {
  const newUser = event.data.data();
  const newUid = event.params.uid;

  // Only proceed if the user signed up with a referral code
  if (!newUser || !newUser.referred_by) return null;

  try {
    const db = admin.firestore();
    
    // 1. Look up the referrer by their code
    const referrerSnap = await db.collection('users')
      .where('referral_code', '==', newUser.referred_by)
      .limit(1)
      .get();

    if (referrerSnap.empty) {
      console.warn(`[syncNewUserReferral] Invalid referral code used: ${newUser.referred_by}`);
      return null;
    }

    const referrerDoc = referrerSnap.docs[0];
    const referrerUid = referrerDoc.id;

    // Prevent self-referral exploits
    if (referrerUid === newUid) return null;

    // 2. Create the unique referral tracking document
    const referralId = `${newUid}_${referrerUid}`;
    
    await db.collection('referrals').doc(referralId).set({
      referrer_id: referrerUid,
      referrer_code: newUser.referred_by,
      referred_user_id: newUid,
      referred_email: newUser.email || '',
      referred_name: ((newUser.first_name || '') + ' ' + (newUser.last_name || '')).trim(),
      status: newUser.email_verified ? 'valid' : 'signed_up',
      email_verified: !!newUser.email_verified,
      foundation_complete: false,
      career_enrolled: false,
      commission_amount: 0,
      commission_paid: false,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`[syncNewUserReferral] Referral logged: ${referrerUid} referred ${newUid}`);
    return null;

  } catch (err) {
    console.error('[syncNewUserReferral] Error:', err);
    return null;
  }
});


// ═══════════════════════════════════════════════════════════════════════════
// DAILY XP CLAIM
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// DAILY XP CLAIM
// ═══════════════════════════════════════════════════════════════════════════
exports.claimDailyXp = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');
  const uid = request.auth.uid;
  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);

  return await db.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) throw new HttpsError('not-found', 'User not found.');
      const userData = userSnap.data();

      const now = new Date();
      // Shift by 1 hour for WAT (UTC+1) Timezone
      const watNow = new Date(now.getTime() + 60 * 60 * 1000);
      const watLast = userData.last_daily_claim ? new Date(userData.last_daily_claim.toMillis() + 60 * 60 * 1000) : new Date(0);

      // Check if claimed today in WAT
      const isSameDay = watNow.getUTCFullYear() === watLast.getUTCFullYear() &&
                        watNow.getUTCMonth() === watLast.getUTCMonth() &&
                        watNow.getUTCDate() === watLast.getUTCDate();

      if (isSameDay) {
          throw new HttpsError('failed-precondition', 'Daily XP already claimed today.');
      }

      // Check if claimed yesterday to keep streak alive
      const watYesterday = new Date(watNow.getTime() - 24 * 60 * 60 * 1000);
      const isYesterday = watYesterday.getUTCFullYear() === watLast.getUTCFullYear() &&
                          watYesterday.getUTCMonth() === watLast.getUTCMonth() &&
                          watYesterday.getUTCDate() === watLast.getUTCDate();

      const newStreak = isYesterday ? (userData.daily_streak || 0) + 1 : 1;
      
      // STRICT WATERFALL LOGIC FOR MILESTONES
      let bonus = 0;
      let bonusLabel = 'Daily Login';

      if (newStreak % 100 === 0) {
          bonus = 50;
          bonusLabel = '100-Day Streak Bonus!';
      } else if (newStreak % 30 === 0) {
          bonus = 25;
          bonusLabel = '30-Day Streak Bonus!';
      } else if (newStreak % 7 === 0) {
          bonus = 10;
          bonusLabel = '7-Day Streak Bonus!';
      }

      const xpEarned = 2 + bonus;

      transaction.update(userRef, {
          xp_total: admin.firestore.FieldValue.increment(xpEarned),
          daily_streak: newStreak,
          last_daily_claim: admin.firestore.FieldValue.serverTimestamp()
      });

      const xpRef = db.collection('xp').doc();
      transaction.set(xpRef, {
          user_id: uid,
          xp_earned: xpEarned,
          source: 'streak_auto',
          bonus_label: bonusLabel,
          claimed_at: admin.firestore.FieldValue.serverTimestamp(),
          streak_day: newStreak,
          bonus_xp: bonus
      });

      return { success: true, xpEarned, newStreak, bonus };
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// MARK SESSION COMPLETE (Secure Progress & XP)
// ═══════════════════════════════════════════════════════════════════════════
exports.markSessionComplete = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in.');
  const uid = request.auth.uid;
  const { sessionId, moduleId } = request.data;
  if (!sessionId || !moduleId) throw new HttpsError('invalid-argument', 'Missing parameters.');

  const db = admin.firestore();

  // 1. Get Session
  const sessionSnap = await db.collection('sessions').doc(sessionId).get();
  if (!sessionSnap.exists) throw new HttpsError('not-found', 'Session not found.');
  const session = sessionSnap.data();
  const courseId = session.course_id;

  // --- 🔴 TEMPORAL LOCK EXPLOIT FIX 🔴 ---
  if (session.session_type === 'live' && session.date) {
    const now = new Date();
    // Convert server time to WAT to match admin input
    const watTimeStr = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); 
    const currentWatDate = watTimeStr.substring(0, 10);
    const currentWatTime = watTimeStr.substring(11, 16);
    
    // Block if the session date is in the future, or if it's today but the time hasn't passed
    if (session.date > currentWatDate || (session.date === currentWatDate && (session.time || '00:00') > currentWatTime)) {
        throw new HttpsError('failed-precondition', 'Cannot complete a live session before it has occurred.');
    }
  }
  // ---------------------------------------

  // 2. Verify Enrolment
  const enrolSnap = await db.collection('enrolments')
    .where('user_id', '==', uid)
    .where('course_id', '==', courseId)
    .where('status', '==', 'active')
    .get();

  // 3. Check existing progress to prevent double XP
  const progressId = `${uid}_${moduleId}`;
  const progressRef = db.collection('module_progress').doc(progressId);
  const progressSnap = await progressRef.get();
  const progressData = progressSnap.exists ? progressSnap.data() : { sessions_completed: {} };

  if (progressData.sessions_completed && progressData.sessions_completed[sessionId]) {
      return { success: true, message: 'Already marked complete.' };
  }

  // 4. Calculate Progress
  const modSessionsSnap = await db.collection('sessions').where('module_id', '==', moduleId).get();
  const totalSessions = modSessionsSnap.size;

  let completedCount = 0;
  const completedMap = progressData.sessions_completed || {};
  completedMap[sessionId] = true;
  Object.keys(completedMap).forEach(k => { if (completedMap[k]) completedCount++; });

  const pct = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 100;
  const allDone = completedCount >= totalSessions;

  const batch = db.batch();

  const newProgressData = {
      user_id: uid,
      module_id: moduleId,
      course_id: courseId,
      sessions_completed: completedMap,
      progress_pct: pct,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
  };
  
  if (allDone && !progressData.completed_at) {
      newProgressData.completed_at = admin.firestore.FieldValue.serverTimestamp();
  }

  if (progressSnap.exists) {
      batch.update(progressRef, newProgressData);
  } else {
      newProgressData.created_at = admin.firestore.FieldValue.serverTimestamp();
      batch.set(progressRef, newProgressData);
  }

  // 5. Award 5 XP Securely
  batch.update(db.collection('users').doc(uid), { xp_total: admin.firestore.FieldValue.increment(5) });

  batch.set(db.collection('xp').doc(), {
      user_id: uid,
      xp_earned: 5,
      source: 'session_completion',
      bonus_label: `Session: ${session.title || sessionId}`,
      claimed_at: admin.firestore.FieldValue.serverTimestamp(),
      streak_day: 0,
      bonus_xp: 0
  });

  await batch.commit();

  // 6. Async recalculation of the parent course enrolment
  recalcEnrolmentProgress(uid, courseId).catch(console.error);

  return { success: true, xpEarned: 5, allSessionsDone: allDone };
});

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL — via Firestore "Trigger Email" extension (firestore-send-email)
// ═══════════════════════════════════════════════════════════════════════════
async function sendMail({ to, replyTo, subject, html }) {
  const doc = {
    to,
    message: { subject, html },
  };
  if (replyTo) doc.replyTo = replyTo;
  await admin.firestore().collection('mail').add(doc);
}

// ═══════════════════════════════════════════════════════════════════════════
// CBIE APPLICATION NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════
exports.notifyApplicationStatus = onDocumentUpdated('applications/{applicationId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (!after.user_email) {
    console.log('Skipping notification: no user_email on application');
    return null;
  }

  try {
    if (before.status !== 'awaiting_balance' && after.status === 'awaiting_balance') {
      await sendMail({
        to: after.user_email,
        subject: '🎉 Your CBIE Application Has Been Approved!',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#FF8A00;">Congratulations ${after.user_name || 'there'}!</h2>
            <p>Your application for the <strong>Certified Blockchain Industry Expert (CBIE)</strong> program has been approved!</p>
            ${after.scholarship_percentage > 0 ? `
              <div style="background:#f8f9fa;border-left:4px solid #FF8A00;padding:15px;margin:20px 0;">
                <h3 style="margin:0 0 10px 0;color:#FF8A00;">🎓 Scholarship Awarded: ${after.scholarship_percentage}%</h3>
                <table style="width:100%;border-collapse:collapse;">
                  <tr>
                    <td style="padding:5px 0;"><strong>Original Fee:</strong></td>
                    <td style="padding:5px 0;text-align:right;">₦${(after.original_amount || 0).toLocaleString('en-NG')}</td>
                  </tr>
                  <tr>
                    <td style="padding:5px 0;"><strong>Scholarship:</strong></td>
                    <td style="padding:5px 0;text-align:right;color:#00c864;">-₦${(after.scholarship_amount || 0).toLocaleString('en-NG')}</td>
                  </tr>
                  <tr style="border-top:2px solid #ddd;">
                    <td style="padding:10px 0 5px 0;"><strong>Balance to Pay:</strong></td>
                    <td style="padding:10px 0 5px 0;text-align:right;font-size:20px;color:#FF8A00;"><strong>₦${(after.balance_due || 0).toLocaleString('en-NG')}</strong></td>
                  </tr>
                </table>
              </div>
            ` : `
              <div style="background:#f8f9fa;padding:15px;margin:20px 0;">
                <p><strong>Program Fee:</strong> ₦${(after.original_amount || 100000).toLocaleString('en-NG')}</p>
              </div>
            `}
            <h3>Next Steps:</h3>
            <ol style="line-height:1.8;">
              <li>Complete your payment</li>
              <li>Wait for admin confirmation (1-3 hours for bank transfers)</li>
              <li>Access your course from your dashboard</li>
            </ol>
            <a href="https://node.sofegroup.com/cbie-application?course=cbie" 
               style="display:inline-block;background:#FF8A00;color:#000;padding:15px 30px;text-decoration:none;border-radius:50px;font-weight:bold;margin:20px 0;">
              Complete Payment →
            </a>
            <p style="color:#666;font-size:14px;margin-top:30px;">
              If you have any questions, reply to this email or contact us at info@node.sofegroup.com
            </p>
          </div>
        `
      });
      console.log(`Sent approval notification to ${after.user_email}`);
    }

    if (before.status !== 'declined' && after.status === 'declined') {
      await sendMail({
        to: after.user_email,
        subject: 'Update on Your CBIE Application',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2>Dear ${after.user_name || 'Applicant'},</h2>
            <p>Thank you for your interest in the <strong>Certified Blockchain Industry Expert (CBIE)</strong> program.</p>
            <p>After careful review, we regret to inform you that we are unable to offer you a place in the current cohort.</p>
            <p>This decision does not reflect your potential, and we encourage you to:</p>
            <ul style="line-height:1.8;">
              <li>Explore our other blockchain programs</li>
              <li>Apply again in future cohorts</li>
              <li>Join our community events and workshops</li>
            </ul>
            <a href="https://node.sofegroup.com/academy" 
               style="display:inline-block;background:#1428FF;color:#fff;padding:15px 30px;text-decoration:none;border-radius:50px;font-weight:bold;margin:20px 0;">
              Explore Other Programs
            </a>
            <p style="color:#666;font-size:14px;margin-top:30px;">
              For any questions, contact us at info@node.sofegroup.com
            </p>
          </div>
        `
      });
      console.log(`Sent decline notification to ${after.user_email}`);
    }

    if (before.status !== 'payment_confirmed' && after.status === 'payment_confirmed') {
      await sendMail({
        to: after.user_email,
        subject: '✅ Payment Confirmed - CBIE Program',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="text-align:center;font-size:60px;margin-bottom:20px;">✅</div>
            <h2 style="text-align:center;color:#00c864;">Payment Confirmed!</h2>
            <p>Dear ${after.user_name || 'there'},</p>
            <p>Great news! Your payment of <strong>₦${(after.balance_due || 0).toLocaleString('en-NG')}</strong> has been confirmed.</p>
            <div style="background:#f0f9ff;border-left:4px solid #1428FF;padding:15px;margin:20px 0;">
              <p style="margin:0;"><strong>What's Next?</strong></p>
              <p style="margin:10px 0 0 0;">Our team is now processing your enrollment. You'll receive another email within 24 hours once your course is ready in your dashboard.</p>
            </div>
            <p style="color:#666;font-size:14px;margin-top:30px;">
              Questions? Contact us at info@node.sofegroup.com
            </p>
          </div>
        `
      });
      console.log(`Sent payment confirmation to ${after.user_email}`);
    }

    if (before.status !== 'enrolled' && after.status === 'enrolled') {
      await sendMail({
        to: after.user_email,
        subject: '🎓 Welcome to CBIE - Your Course is Ready!',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="text-align:center;font-size:60px;margin-bottom:20px;">🎓</div>
            <h2 style="text-align:center;color:#FF8A00;">You're Enrolled!</h2>
            <p>Dear ${after.user_name || 'there'},</p>
            <p>Welcome to the <strong>Certified Blockchain Industry Expert</strong> program!</p>
            <div style="background:linear-gradient(135deg,#FF8A00,#FFA500);color:#000;padding:20px;border-radius:12px;margin:20px 0;">
              <h3 style="margin:0 0 10px 0;">👑 Executive Tier Access</h3>
              <p style="margin:0;">Your course is now available in your dashboard with full lifetime access.</p>
            </div>
            <h3>What You Get:</h3>
            <ul style="line-height:1.8;">
              <li>Foundation course included</li>
              <li>Advanced blockchain concepts</li>
              <li>Industry expert insights</li>
              <li>Professional certification</li>
              <li>Community access</li>
            </ul>
            <a href="https://node.sofegroup.com/dashboard" 
               style="display:inline-block;background:#FF8A00;color:#000;padding:15px 30px;text-decoration:none;border-radius:50px;font-weight:bold;margin:20px 0;">
              Access Your Course →
            </a>
            <p style="color:#666;font-size:14px;margin-top:30px;">
              Need help getting started? Contact us at info@node.sofegroup.com
            </p>
          </div>
        `
      });
      console.log(`Sent enrollment confirmation to ${after.user_email}`);
    }

    return null;
  } catch (error) {
    console.error('Error sending notification:', error);
    return null;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// LEADERBOARD PERIOD HELPER
// ═══════════════════════════════════════════════════════════════════════════
function getCurrentPeriodId() {
  const now = new Date(Date.now() + 60 * 60 * 1000); 
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// PROCESS REFERRAL COMMISSION (3-TIER SYSTEM)
// ═══════════════════════════════════════════════════════════════════════════
exports.processPaymentCommission = onDocumentUpdated('payments/{paymentId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (before.status === 'confirmed' || after.status !== 'confirmed') return null;
  if (!after.user_id || !after.amount) return null;
  if (after.payment_type !== 'enrolment') return null;

  try {
    const db = admin.firestore();
    const batch = db.batch();

    const refSnap = await db.collection('referrals')
      .where('referred_user_id', '==', after.user_id)
      .limit(1)
      .get();

    if (refSnap.empty) return null; 

    const referralDoc = refSnap.docs[0];
    const referralData = referralDoc.data();

    if (referralData.commission_paid || !referralData.referrer_code) return null;

    const referrerSnap = await db.collection('users')
      .where('referral_code', '==', referralData.referrer_code)
      .limit(1)
      .get();

    if (referrerSnap.empty) return null;

    const referrerDoc = referrerSnap.docs[0];
    const referrerData = referrerDoc.data();
    const referrerUid = referrerDoc.id;

    let directTier = 1;
    let directRate = 0.05; 

    if (referrerData.affiliate_level === 3 || referrerData.is_ambassador === true) {
      directTier = 3;
      directRate = 0.10; 
    } else {
      const qualifiedSnap = await db.collection('referrals')
        .where('referrer_code', '==', referrerData.referral_code)
        .where('foundation_complete', '==', true)
        .where('career_enrolled', '==', true)
        .get();

      if (qualifiedSnap.size >= 10) {
        directTier = 2;
        directRate = 0.10; 
      }
    }

    const directPayout = Math.round(after.amount * directRate);

    const directCommRef = db.collection('commissions').doc();
    const isLocked = directTier === 1 && referrerData.foundation_completed !== true;

    batch.set(directCommRef, {
      user_id: referrerUid,
      referred_user_id: after.user_id,
      payment_id: event.params.paymentId,
      course_id: after.course_id,
      amount: directPayout,
      commission_type: 'direct',
      tier_applied: directTier,
      payout_locked: isLocked, 
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    batch.update(referralDoc.ref, {
      commission_amount: directPayout,
      commission_paid: true,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    const referrerUpdate = {
      wallet_balance: admin.firestore.FieldValue.increment(directPayout)
    };
    
    if (directTier === 2 && (referrerData.affiliate_level || 1) < 2) {
      referrerUpdate.affiliate_level = 2;
    }

    batch.update(referrerDoc.ref, referrerUpdate);

    const indirectRefSnap = await db.collection('referrals')
      .where('referred_user_id', '==', referrerUid)
      .limit(1)
      .get();

    if (!indirectRefSnap.empty) {
      const indirectReferralData = indirectRefSnap.docs[0].data();

      if (indirectReferralData.referrer_code) {
        const grandReferrerSnap = await db.collection('users')
          .where('referral_code', '==', indirectReferralData.referrer_code)
          .limit(1)
          .get();

        if (!grandReferrerSnap.empty) {
          const grandReferrerDoc = grandReferrerSnap.docs[0];
          const grandReferrerData = grandReferrerDoc.data();
          const grandReferrerUid = grandReferrerDoc.id;

          if (grandReferrerData.affiliate_level === 3 || grandReferrerData.is_ambassador === true) {
            const indirectRate = 0.05;
            const indirectPayout = Math.round(after.amount * indirectRate);

            const indirectCommRef = db.collection('commissions').doc();
            batch.set(indirectCommRef, {
              user_id: grandReferrerUid,
              referred_user_id: after.user_id,
              intermediate_referrer_id: referrerUid, 
              payment_id: event.params.paymentId,
              course_id: after.course_id,
              amount: indirectPayout,
              commission_type: 'indirect',
              created_at: admin.firestore.FieldValue.serverTimestamp()
            });

            batch.update(grandReferrerDoc.ref, {
              wallet_balance: admin.firestore.FieldValue.increment(indirectPayout)
            });
          }
        }
      }
    }

    await batch.commit();
    return null;
  } catch (err) {
    console.error('[processPaymentCommission]', err);
    return null;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GRANT COURSE ACCESS ON PAYMENT APPROVAL
// ═══════════════════════════════════════════════════════════════════════════
exports.grantCourseAccessOnPaymentApproval = onDocumentUpdated('payments/{paymentId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();

  if (before.status === 'confirmed' || after.status !== 'confirmed') return null;
  if (after.payment_type !== 'enrolment') return null;

  try {
    const db = admin.firestore();
    const courseSnap = await db.collection('courses').doc(after.course_id).get();
    if (!courseSnap.exists) {
      console.error(`[grantCourseAccess] Course not found: ${after.course_id}`);
      return null;
    }
    const course = courseSnap.data();

    const tier = course.tier || 'track';
    const includesFoundation = (tier === 'track' && course.includes_foundation !== false);
    const mainStatus = (tier === 'track' && includesFoundation) ? 'locked_pending_foundation' : 'active';

    const batch = db.batch();

    const mainEnrolId = `${after.user_id}_${after.course_id}`;
    batch.set(db.collection('enrolments').doc(mainEnrolId), {
      user_id: after.user_id,
      course_id: after.course_id,
      course_title: course.title || after.course_id,
      tier: tier,
      status: mainStatus,
      progress_pct: 0,
      enrolled_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (includesFoundation) {
      const foundationEnrolId = `${after.user_id}_foundation`;
      const fSnap = await db.collection('enrolments').doc(foundationEnrolId).get();
      
      if (!fSnap.exists) {
        batch.set(db.collection('enrolments').doc(foundationEnrolId), {
          user_id: after.user_id,
          course_id: 'foundation',
          course_title: 'Blockchain & Cryptocurrency Foundation',
          tier: 'foundation',
          status: 'active',
          progress_pct: 0,
          enrolled_at: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          granted_via: after.course_id
        });
      } else {
        const fData = fSnap.data();
        if (fData.progress_pct >= 100 || fData.status === 'completed') {
          batch.update(db.collection('enrolments').doc(mainEnrolId), { 
            status: 'active',
            updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }

    await batch.commit();
    return null;
  } catch (err) {
    console.error('[grantCourseAccess]', err);
    return null;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// LEADERBOARD SYNC
// ═══════════════════════════════════════════════════════════════════════════
exports.syncLeaderboard = onDocumentWritten('users/{uid}', async (event) => {
  const uid    = event.params.uid;
  const after  = event.data.after.exists  ? event.data.after.data()  : null;
  const before = event.data.before.exists ? event.data.before.data() : null;

  if (!after) {
    await admin.firestore().collection('leaderboard').doc(uid).delete().catch(() => {});
    return null;
  }

  const xpBefore = Number(before?.xp_total) || 0;
  const xpAfter  = Number(after.xp_total)   || 0;
  const xpDelta  = xpAfter - xpBefore;

  const hasOverride = after._period_xp_override !== undefined && after._period_xp_override !== null;
  const periodCredit = hasOverride ? Number(after._period_xp_override) : xpDelta;

  const foundationChanged = !!before?.foundation_completed !== !!after.foundation_completed;
  const xpChanged   = xpDelta !== 0;
  const nameChanged = !before || after.first_name !== before.first_name
                              || after.last_name  !== before.last_name;
  const roleChanged = !before || after.role       !== before.role;
  if (!xpChanged && !nameChanged && !roleChanged && !foundationChanged && !hasOverride) return null;

  if (after.role === 'admin') {
    await admin.firestore().collection('leaderboard').doc(uid).delete().catch(() => {});
    return null;
  }

  const XP_TIERS = [
    { name: 'Genesis Node',    min: 0     },
    { name: 'Validator',       min: 500   },
    { name: 'Crypto Knight',   min: 1500  },
    { name: 'Chain Architect', min: 4000  },
    { name: 'Node Operator',   min: 8000  },
    { name: 'Node Sovereign',  min: 15000 },
  ];

  let tier;
  if (after.foundation_completed === true) {
    tier = [...XP_TIERS].reverse().find(t => xpAfter >= t.min) || XP_TIERS[0];
  } else {
    tier = XP_TIERS[0]; 
  }
  const periodId = getCurrentPeriodId();

  const lbRef = admin.firestore().collection('leaderboard').doc(uid);
  const lbSnap = await lbRef.get();
  const existingPeriod = lbSnap.exists ? lbSnap.data().current_period : null;

  const updateData = {
    first_name:   after.first_name || '',
    last_initial: after.last_name  ? after.last_name[0].toUpperCase() + '.' : '',
    xp_total:     xpAfter,
    tier:         tier.name,
    current_period: periodId,
    updated_at:   admin.firestore.FieldValue.serverTimestamp(),
  };

  if (existingPeriod && existingPeriod !== periodId) {
    updateData.xp_this_period = periodCredit > 0 ? periodCredit : 0;
  } else {
    updateData.xp_this_period = admin.firestore.FieldValue.increment(periodCredit);
  }

  await lbRef.set(updateData, { merge: true });

  if (hasOverride) {
    await event.data.after.ref.update({
      _period_xp_override: admin.firestore.FieldValue.delete(),
    }).catch(() => {});
  }

  return null;
});

// ═══════════════════════════════════════════════════════════════════════════
// COMMISSION LEADERBOARD SYNC
// ═══════════════════════════════════════════════════════════════════════════
exports.syncCommissionLeaderboard = onDocumentWritten('commissions/{commissionId}', async (event) => {
  const after  = event.data.after.exists  ? event.data.after.data()  : null;
  const before = event.data.before.exists ? event.data.before.data() : null;

  const amountBefore = Number(before?.amount) || 0;
  const amountAfter  = Number(after?.amount)  || 0;
  const amountDelta  = amountAfter - amountBefore;
  if (amountDelta === 0) return null;

  const uid = after?.user_id || before?.user_id;
  if (!uid) return null;

  const periodId = getCurrentPeriodId();
  const lbRef = admin.firestore().collection('leaderboard').doc(uid);
  const lbSnap = await lbRef.get();
  const existingPeriod = lbSnap.exists ? lbSnap.data().current_period : null;

  const updateData = {
    current_period: periodId,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (existingPeriod && existingPeriod !== periodId) {
    updateData.commission_this_period = amountDelta > 0 ? amountDelta : 0;
  } else {
    updateData.commission_this_period = admin.firestore.FieldValue.increment(amountDelta);
  }

  await lbRef.set(updateData, { merge: true });
  return null;
});

// ═══════════════════════════════════════════════════════════════════════════
// REFERRAL REWARDS SYNC
// ═══════════════════════════════════════════════════════════════════════════
exports.syncReferralRewards = onDocumentWritten('referrals/{referralId}', async (event) => {
  const before = event.data.before.exists ? event.data.before.data() : null;
  const after  = event.data.after.exists  ? event.data.after.data()  : null;
  if (!after) return null;
  if (!after.referrer_code) return null;

  const referralRef = event.data.after.ref;

  async function getReferrerUid() {
    const referrerSnap = await admin.firestore()
      .collection('users')
      .where('referral_code', '==', after.referrer_code)
      .limit(1)
      .get();
    if (referrerSnap.empty) {
      return null;
    }
    return referrerSnap.docs[0].id;
  }

  async function awardReferrerXP(referrerUid, amount, label) {
    const batch = admin.firestore().batch();
    batch.update(admin.firestore().collection('users').doc(referrerUid), {
      xp_total: admin.firestore.FieldValue.increment(amount),
    });
    const xpRef = admin.firestore().collection('xp').doc();
    batch.set(xpRef, {
      user_id: referrerUid,
      xp_earned: amount,
      source: 'referral_bonus',
      bonus_label: label,
      claimed_at: admin.firestore.FieldValue.serverTimestamp(),
      streak_day: 0,
      bonus_xp: 0,
    });
    await batch.commit();
  }

  const wasFoundationValidated = before?.foundation_complete === true;
  const isFoundationValidated  = after.foundation_complete === true;

  if (!wasFoundationValidated && isFoundationValidated && !after.foundation_xp_awarded) {
    try {
      const referrerUid = await getReferrerUid();
      if (referrerUid) {
        const periodId = getCurrentPeriodId();
        const lbRef = admin.firestore().collection('leaderboard').doc(referrerUid);
        const lbSnap = await lbRef.get();
        const existingPeriod = lbSnap.exists ? lbSnap.data().current_period : null;

        const lbUpdate = {
          current_period: periodId,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        };
        lbUpdate.validated_referrals_this_period = (existingPeriod && existingPeriod !== periodId)
          ? 1
          : admin.firestore.FieldValue.increment(1);
        await lbRef.set(lbUpdate, { merge: true });

        await awardReferrerXP(referrerUid, 20, 'Referral completed Foundation Course');

        await referralRef.update({
          validated_at: admin.firestore.FieldValue.serverTimestamp(),
          foundation_xp_awarded: true,
        });
      }
    } catch (err) {
      console.error('[syncReferralRewards:foundation]', err);
    }
  }

  const wasCareerDone = before?.career_enrolled === true;
  const isCareerDone  = after.career_enrolled === true;

  if (!wasCareerDone && isCareerDone && !after.career_xp_awarded) {
    try {
      const referrerUid = await getReferrerUid();
      if (referrerUid) {
        await awardReferrerXP(referrerUid, 30, 'Referral completed a Career Track certificate');
        await referralRef.update({ career_xp_awarded: true });
      }
    } catch (err) {
      console.error('[syncReferralRewards:career]', err);
    }
  }

  return null;
});

// ═══════════════════════════════════════════════════════════════════════════
// REFERRAL SIGNUP BONUS
// ═══════════════════════════════════════════════════════════════════════════
exports.syncReferralSignupBonus = onDocumentWritten('users/{uid}', async (event) => {
  const before = event.data.before.exists ? event.data.before.data() : null;
  const after  = event.data.after.exists  ? event.data.after.data()  : null;
  if (!after) return null;

  const wasVerified = before?.email_verified === true;
  const isVerified  = after.email_verified === true;
  if (wasVerified || !isVerified) return null;

  const referredUid = event.params.uid;

  try {
    const refSnap = await admin.firestore()
      .collection('referrals')
      .where('referred_user_id', '==', referredUid)
      .limit(1)
      .get();

    if (refSnap.empty) return null; 

    const refDoc = refSnap.docs[0];
    const refData = refDoc.data();
    if (refData.email_verified === true || refData.signup_xp_awarded) return null; 

    if (!refData.referrer_code) {
      await refDoc.ref.update({ email_verified: true });
      return null;
    }

    const referrerSnap = await admin.firestore()
      .collection('users')
      .where('referral_code', '==', refData.referrer_code)
      .limit(1)
      .get();

    if (referrerSnap.empty) {
      await refDoc.ref.update({ email_verified: true });
      return null;
    }

    const referrerUid = referrerSnap.docs[0].id;

    const batch = admin.firestore().batch();
    batch.update(admin.firestore().collection('users').doc(referrerUid), {
      xp_total: admin.firestore.FieldValue.increment(5),
    });
    batch.set(admin.firestore().collection('xp').doc(), {
      user_id: referrerUid,
      xp_earned: 5,
      source: 'referral_bonus',
      bonus_label: 'Referral signed up & verified email',
      claimed_at: admin.firestore.FieldValue.serverTimestamp(),
      streak_day: 0,
      bonus_xp: 0,
    });
    batch.update(refDoc.ref, {
      email_verified: true,
      signup_xp_awarded: true,
    });
    await batch.commit();

  } catch (err) {
    console.error('[syncReferralSignupBonus]', err);
  }
  return null;
});

// ═══════════════════════════════════════════════════════════════════════════
// COURSE COMPLETION XP
// ═══════════════════════════════════════════════════════════════════════════
exports.syncCourseCompletionXP = onDocumentWritten('enrolments/{enrolmentId}', async (event) => {
  const before = event.data.before.exists ? event.data.before.data() : null;
  const after  = event.data.after.exists  ? event.data.after.data()  : null;
  if (!after) return null;

  const wasCompleted = before?.status === 'completed';
  const isCompleted  = after.status === 'completed';
  if (wasCompleted || !isCompleted) return null;
  if (after.completion_xp_awarded) return null; 
  if (!after.user_id || !after.course_id) return null;

  try {
    const courseSnap = await admin.firestore().collection('courses').doc(after.course_id).get();
    if (!courseSnap.exists) {
      return null;
    }
    const course = courseSnap.data();

    let xpAmount = 0;
    let periodCredit = 0; 
    let milestone = null; 
    if (course.is_foundation === true) {
      xpAmount = 500;
      periodCredit = 50; 
      milestone = 'foundation';
    } else if (course.tier === 'track') {
      xpAmount = 100;
      periodCredit = 100; 
      milestone = 'career';
    } else {
      return null;
    }

    const batch = admin.firestore().batch();
    const userUpdate = {
      xp_total: admin.firestore.FieldValue.increment(xpAmount),
      _period_xp_override: periodCredit, 
    };
    if (milestone === 'foundation') {
      userUpdate.foundation_completed = true;
    }
    batch.update(admin.firestore().collection('users').doc(after.user_id), userUpdate);
    batch.set(admin.firestore().collection('xp').doc(), {
      user_id: after.user_id,
      xp_earned: xpAmount,
      source: 'course_completion',
      bonus_label: (milestone === 'foundation' ? 'Completed Foundation Course' : 'Completed Career Track: ') + (course.title || after.course_id),
      claimed_at: admin.firestore.FieldValue.serverTimestamp(),
      streak_day: 0,
      bonus_xp: 0,
    });
    batch.update(event.data.after.ref, {
      completion_xp_awarded: true,
      completion_xp_amount: xpAmount,
    });
    await batch.commit();

    try {
      const refSnap = await admin.firestore()
        .collection('referrals')
        .where('referred_user_id', '==', after.user_id)
        .limit(1)
        .get();

      if (!refSnap.empty) {
        const refDoc = refSnap.docs[0];
        const flagField = milestone === 'foundation' ? 'foundation_complete' : 'career_enrolled';
        if (refDoc.data()[flagField] !== true) {
          await refDoc.ref.update({ [flagField]: true });
        }
      }
    } catch (refErr) {
      console.error('[syncCourseCompletionXP:referral-flag]', refErr);
    }

  } catch (err) {
    console.error('[syncCourseCompletionXP]', err);
  }
  return null;
});

// ═══════════════════════════════════════════════════════════════════════════
// MONTHLY LEADERBOARD RESET (scheduled)
// ═══════════════════════════════════════════════════════════════════════════
exports.resetMonthlyLeaderboard = onSchedule({
  schedule: '5 0 1 * *',   
  timeZone: 'Africa/Lagos', 
}, async () => {
  const db = admin.firestore();

  const now = new Date(Date.now() + 60 * 60 * 1000);
  const prevMonthDate = new Date(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
  const endingPeriodId = `${prevMonthDate.getUTCFullYear()}-${String(prevMonthDate.getUTCMonth() + 1).padStart(2, '0')}`;
  const periodLabel = prevMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  try {
    const lbSnap = await db.collection('leaderboard').get();
    if (lbSnap.empty) {
      return null;
    }

    await db.collection('leaderboard_archive').doc(endingPeriodId).set({
      period_id: endingPeriodId,
      period_label: periodLabel,
      archived_at: admin.firestore.FieldValue.serverTimestamp(),
      entry_count: lbSnap.size,
    });

    let batch = db.batch();
    let opsInBatch = 0;
    let archived = 0;

    for (const doc of lbSnap.docs) {
      const d = doc.data();

      const archiveRef = db.collection('leaderboard_archive').doc(endingPeriodId)
        .collection('entries').doc(doc.id);
      batch.set(archiveRef, {
        first_name:               d.first_name || '',
        last_initial:             d.last_initial || '',
        tier:                     d.tier || 'Genesis Node',
        xp_this_period:           d.xp_this_period || 0,
        commission_this_period:   d.commission_this_period || 0,
        validated_referrals_this_period: d.validated_referrals_this_period || 0,
      });

      batch.set(doc.ref, {
        xp_this_period: 0,
        commission_this_period: 0,
        validated_referrals_this_period: 0,
        current_period: getCurrentPeriodId(),
      }, { merge: true });

      opsInBatch += 2;
      archived++;

      if (opsInBatch >= 400) {
        await batch.commit();
        batch = db.batch();
        opsInBatch = 0;
      }
    }

    if (opsInBatch > 0) await batch.commit();

  } catch (err) {
    console.error('[resetMonthlyLeaderboard]', err);
  }
  return null;
});

// ═══════════════════════════════════════════════════════════════════════════
// ONE-TIME BACKFILL — CURRENT PERIOD STATS
// ═══════════════════════════════════════════════════════════════════════════
exports.backfillCurrentPeriodStats = onRequest(async (req, res) => {
  const expectedSecret = process.env.BACKFILL_SECRET;
  if (!expectedSecret || req.query.secret !== expectedSecret) {
    res.status(403).send('Forbidden');
    return;
  }

  const db = admin.firestore();
  const periodId = getCurrentPeriodId();
  const [year, month] = periodId.split('-').map(Number);
  const periodStartUTC = new Date(Date.UTC(year, month - 1, 1, -1, 0, 0)); 

  try {
    const xpSnap = await db.collection('xp')
      .where('claimed_at', '>=', periodStartUTC)
      .get();

    const xpByUser = {};
    xpSnap.docs.forEach(d => {
      const x = d.data();
      if (!x.user_id) return;
      xpByUser[x.user_id] = (xpByUser[x.user_id] || 0) + (Number(x.xp_earned) || 0);
    });

    const commSnap = await db.collection('commissions')
      .where('created_at', '>=', periodStartUTC)
      .get();

    const commByUser = {};
    commSnap.docs.forEach(d => {
      const c = d.data();
      if (!c.user_id) return;
      commByUser[c.user_id] = (commByUser[c.user_id] || 0) + (Number(c.amount) || 0);
    });

    const allUids = new Set([...Object.keys(xpByUser), ...Object.keys(commByUser)]);
    let written = 0;
    let batch = db.batch();
    let opsInBatch = 0;

    for (const uid of allUids) {
      const lbRef = db.collection('leaderboard').doc(uid);
      batch.set(lbRef, {
        xp_this_period:         xpByUser[uid] || 0,
        commission_this_period: commByUser[uid] || 0,
        current_period:         periodId,
        updated_at:             admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      written++;
      opsInBatch++;
      if (opsInBatch >= 400) {
        await batch.commit();
        batch = db.batch();
        opsInBatch = 0;
      }
    }
    if (opsInBatch > 0) await batch.commit();

    res.status(200).json({
      success: true,
      message: `Backfilled ${written} users' current-period XP and commission stats for ${periodId}. Validated referrals were NOT backfilled (no reliable timestamp in existing data) — they start at 0 and build forward accurately.`,
      period: periodId,
    });
  } catch (error) {
    console.error('[backfillCurrentPeriodStats]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ONE-TIME LEADERBOARD BACKFILL
// ═══════════════════════════════════════════════════════════════════════════
exports.backfillLeaderboard = onRequest(async (req, res) => {
  const expectedSecret = process.env.BACKFILL_SECRET;
  const providedSecret = req.query.secret;

  if (!expectedSecret) {
    res.status(500).send('Backfill secret not configured. Add BACKFILL_SECRET to functions/.env and redeploy.');
    return;
  }
  if (providedSecret !== expectedSecret) {
    res.status(403).send('Forbidden — invalid or missing secret query param.');
    return;
  }

  const XP_TIERS = [
    { name: 'Genesis Node',    min: 0     },
    { name: 'Validator',       min: 500   },
    { name: 'Crypto Knight',   min: 1500  },
    { name: 'Chain Architect', min: 4000  },
    { name: 'Node Operator',   min: 8000  },
    { name: 'Node Sovereign',  min: 15000 },
  ];

  try {
    const usersSnap = await admin.firestore().collection('users').get();
    const periodId = getCurrentPeriodId();

    let written = 0;
    let skipped = 0;
    const batchSize = 400;
    let batch = admin.firestore().batch();
    let opsInBatch = 0;

    for (const userDoc of usersSnap.docs) {
      const u = userDoc.data();
      if (u.role === 'admin') { skipped++; continue; }

      const xp = Number(u.xp_total) || 0;
      const tier = u.foundation_completed === true
        ? ([...XP_TIERS].reverse().find(t => xp >= t.min) || XP_TIERS[0])
        : XP_TIERS[0];

      const lbRef = admin.firestore().collection('leaderboard').doc(userDoc.id);
      batch.set(lbRef, {
        first_name:     u.first_name || '',
        last_initial:   u.last_name ? u.last_name[0].toUpperCase() + '.' : '',
        xp_total:       xp,
        tier:           tier.name,
        current_period: periodId,
        updated_at:     admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      written++;
      opsInBatch++;

      if (opsInBatch >= batchSize) {
        await batch.commit();
        batch = admin.firestore().batch();
        opsInBatch = 0;
      }
    }

    if (opsInBatch > 0) await batch.commit();

    res.status(200).json({
      success: true,
      message: `Backfill complete. ${written} users written to leaderboard, ${skipped} admins skipped. Run backfillFoundationCompletionFlags first (if not already done) so tiers reflect actual Foundation completion, then backfillCurrentPeriodStats to populate this month's XP/commission numbers.`,
    });
  } catch (error) {
    console.error('[backfillLeaderboard]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ONE-TIME BACKFILL — PAST ENROLMENTS
// ═══════════════════════════════════════════════════════════════════════════
exports.backfillPastEnrollments = onRequest(async (req, res) => {
  const expectedSecret = process.env.BACKFILL_SECRET;
  if (req.query.secret !== expectedSecret) { res.status(403).send('Forbidden'); return; }

  const db = admin.firestore();
  try {
    const paymentsSnap = await db.collection('payments')
      .where('status', '==', 'confirmed')
      .where('payment_type', '==', 'enrolment')
      .get();

    let count = 0;
    const batch = db.batch();

    for (const doc of paymentsSnap.docs) {
      const p = doc.data();
      const enrolId = `${p.user_id}_${p.course_id}`;
      
      batch.set(db.collection('enrolments').doc(enrolId), {
        user_id: p.user_id,
        course_id: p.course_id,
        status: 'active',
        enrolled_at: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      count++;
    }

    await batch.commit();
    res.status(200).send(`Success: Backfilled ${count} enrolments.`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ONE-TIME BACKFILL — PAST COMMISSIONS
// ═══════════════════════════════════════════════════════════════════════════
exports.backfillPastCommissions = onRequest(async (req, res) => {
  const expectedSecret = process.env.BACKFILL_SECRET;
  if (!expectedSecret || req.query.secret !== expectedSecret) {
    res.status(403).send('Forbidden');
    return;
  }

  const db = admin.firestore();
  
  try {
    const paymentsSnap = await db.collection('payments').where('status', '==', 'confirmed').get();
    
    if (paymentsSnap.empty) {
      res.status(200).json({ success: true, message: 'No confirmed payments found.' });
      return;
    }

    let processedCount = 0;
    let skippedCount = 0;
    let batch = db.batch();
    let opsInBatch = 0;

    const commitBatchIfNeeded = async (force = false) => {
      if (opsInBatch >= 400 || (force && opsInBatch > 0)) {
        await batch.commit();
        batch = db.batch();
        opsInBatch = 0;
      }
    };

    for (const paymentDoc of paymentsSnap.docs) {
      const paymentData = paymentDoc.data();
      const paymentId = paymentDoc.id;

      if (!paymentData.user_id || !paymentData.amount) {
        skippedCount++;
        continue;
      }

      if (paymentData.payment_type !== 'enrolment') {
        skippedCount++;
        continue;
      }

      const refSnap = await db.collection('referrals')
        .where('referred_user_id', '==', paymentData.user_id)
        .limit(1)
        .get();

      if (refSnap.empty) {
        skippedCount++; 
        continue;
      }

      const referralDoc = refSnap.docs[0];
      const referralData = referralDoc.data();

      if (referralData.commission_paid || !referralData.referrer_code) {
        skippedCount++;
        continue;
      }

      const referrerSnap = await db.collection('users')
        .where('referral_code', '==', referralData.referrer_code)
        .limit(1)
        .get();

      if (referrerSnap.empty) {
        skippedCount++;
        continue;
      }

      const referrerDoc = referrerSnap.docs[0];
      const referrerData = referrerDoc.data();
      const referrerUid = referrerDoc.id;

      let directTier = 1;
      let directRate = 0.05;

      if (referrerData.affiliate_level === 3 || referrerData.is_ambassador === true) {
        directTier = 3;
        directRate = 0.10;
      } else {
        const qualifiedSnap = await db.collection('referrals')
          .where('referrer_code', '==', referrerData.referral_code)
          .where('foundation_complete', '==', true)
          .where('career_enrolled', '==', true)
          .get();

        if (qualifiedSnap.size >= 10) {
          directTier = 2;
          directRate = 0.10;
        }
      }

      const directPayout = Math.round(paymentData.amount * directRate);
      const isLocked = directTier === 1 && referrerData.foundation_completed !== true;

      const directCommRef = db.collection('commissions').doc();
      batch.set(directCommRef, {
        user_id: referrerUid,
        referred_user_id: paymentData.user_id,
        payment_id: paymentId,
        course_id: paymentData.course_id,
        amount: directPayout,
        commission_type: 'direct',
        tier_applied: directTier,
        payout_locked: isLocked,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      opsInBatch++;

      batch.update(referralDoc.ref, {
        commission_amount: directPayout,
        commission_paid: true,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      opsInBatch++;

    const referrerUpdate = {
      wallet_balance: admin.firestore.FieldValue.increment(directPayout)
    };
    
    if (directTier === 2 && (referrerData.affiliate_level || 1) < 2) {
      referrerUpdate.affiliate_level = 2;
    }

    batch.update(referrerDoc.ref, referrerUpdate);
      opsInBatch++;

      const indirectRefSnap = await db.collection('referrals')
        .where('referred_user_id', '==', referrerUid)
        .limit(1)
        .get();

      if (!indirectRefSnap.empty) {
        const indirectReferralData = indirectRefSnap.docs[0].data();
        if (indirectReferralData.referrer_code) {
          const grandReferrerSnap = await db.collection('users')
            .where('referral_code', '==', indirectReferralData.referrer_code)
            .limit(1)
            .get();

          if (!grandReferrerSnap.empty) {
            const grandReferrerDoc = grandReferrerSnap.docs[0];
            const grandReferrerData = grandReferrerDoc.data();
            const grandReferrerUid = grandReferrerDoc.id;

            if (grandReferrerData.affiliate_level === 3 || grandReferrerData.is_ambassador === true) {
              const indirectRate = 0.05;
              const indirectPayout = Math.round(paymentData.amount * indirectRate);

              const indirectCommRef = db.collection('commissions').doc();
              batch.set(indirectCommRef, {
                user_id: grandReferrerUid,
                referred_user_id: paymentData.user_id,
                intermediate_referrer_id: referrerUid,
                payment_id: paymentId,
                course_id: paymentData.course_id,
                amount: indirectPayout,
                commission_type: 'indirect',
                created_at: admin.firestore.FieldValue.serverTimestamp()
              });
              opsInBatch++;

              batch.update(grandReferrerDoc.ref, {
                wallet_balance: admin.firestore.FieldValue.increment(indirectPayout)
              });
              opsInBatch++;
            }
          }
        }
      }

      processedCount++;
      await commitBatchIfNeeded();
    }

    await commitBatchIfNeeded(true);

    res.status(200).json({
      success: true,
      message: `Backfill complete. Processed ${processedCount} past referral commissions. Skipped ${skippedCount} payments (not referred, or already paid).`,
    });

  } catch (error) {
    console.error('[backfillPastCommissions]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET VIDEO URL 
// ═══════════════════════════════════════════════════════════════════════════
exports.getVideoUrl = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to watch this video.');
  }
  const uid = request.auth.uid;
  const sessionId = request.data.sessionId;
  if (!sessionId || typeof sessionId !== 'string') {
    throw new HttpsError('invalid-argument', 'sessionId is required.');
  }

  const sessionSnap = await admin.firestore().collection('sessions').doc(sessionId).get();
  if (!sessionSnap.exists) {
    throw new HttpsError('not-found', 'Session not found.');
  }
  const session = sessionSnap.data();
  if (session.type !== 'video' || !session.video_storage_path) {
    throw new HttpsError('failed-precondition', 'This session has no video content.');
  }

  const courseId = session.course_id;
  const enrolSnap = await admin.firestore()
    .collection('enrolments')
    .where('user_id', '==', uid)
    .where('status', '==', 'active')
    .get();

  const hasDirectEnrolment = enrolSnap.docs.some(d => d.data().course_id === courseId);
  const hasAnyActiveEnrolment = !enrolSnap.empty;
  const isFoundationSession = courseId === 'foundation';

  const userSnap = await admin.firestore().collection('users').doc(uid).get();
  const isAdminUser = userSnap.exists && userSnap.data().role === 'admin';

  const allowed = isAdminUser
    || hasDirectEnrolment
    || (isFoundationSession && hasAnyActiveEnrolment);

  if (!allowed) {
    throw new HttpsError('permission-denied', 'You do not have an active enrolment for this course.');
  }

  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(session.video_storage_path);
    const [exists] = await file.exists();
    if (!exists) {
      throw new HttpsError('not-found', 'Video file not found in storage.');
    }

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 4 * 60 * 60 * 1000,
    });

    return { url, expiresInSeconds: 4 * 60 * 60 };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    console.error('[getVideoUrl] Storage error:', error);
    throw new HttpsError('internal', 'Could not generate video URL. Try again shortly.');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SUBMIT QUIZ ANSWERS (Secure grading, attempts tracking & penalty enforcement)
// ═══════════════════════════════════════════════════════════════════════════
exports.submitQuizAnswers = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in to submit a quiz.');
  }
  const uid = request.auth.uid;
  const sessionId = request.data.sessionId;
  const answers = request.data.answers;

  if (!sessionId || typeof sessionId !== 'string') {
    throw new HttpsError('invalid-argument', 'sessionId is required.');
  }
  if (!Array.isArray(answers) || answers.some(a => typeof a !== 'number')) {
    throw new HttpsError('invalid-argument', 'answers must be an array of option indices.');
  }

  const db = admin.firestore();
  const sessionRef = db.collection('sessions').doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    throw new HttpsError('not-found', 'Session not found.');
  }
  const session = sessionSnap.data();
  if (session.type !== 'quiz') {
    throw new HttpsError('failed-precondition', 'This session is not a quiz.');
  }

  const courseId = session.course_id;
  const enrolSnap = await db.collection('enrolments')
    .where('user_id', '==', uid)
    .where('status', '==', 'active')
    .get();
    
  const hasDirectEnrolment = enrolSnap.docs.some(d => d.data().course_id === courseId);
  const hasAnyActiveEnrolment = !enrolSnap.empty;
  const isFoundationSession = courseId === 'foundation';

  const userSnap = await db.collection('users').doc(uid).get();
  const isAdminUser = userSnap.exists && userSnap.data().role === 'admin';

  const allowed = isAdminUser
    || hasDirectEnrolment
    || (isFoundationSession && hasAnyActiveEnrolment);

  if (!allowed) {
    throw new HttpsError('permission-denied', 'You do not have an active enrolment for this course.');
  }

  // ── TRACK ATTEMPTS ──
  const submissionId = `${uid}_${sessionId}`;
  const subRef = db.collection('session_submissions').doc(submissionId);
  const subSnap = await subRef.get();
  
  let attempts = 1;
  if (subSnap.exists) {
      const subData = subSnap.data();
      if (subData.passed) {
          throw new HttpsError('failed-precondition', 'You have already passed this exam.');
      }
      attempts = (subData.attempts || 1) + 1;
  }

  const maxAttempts = session.max_attempts || 3;
  if (attempts > maxAttempts) {
      throw new HttpsError('permission-denied', 'You have exhausted your allowed attempts for this exam.');
  }

  // ── GRADING LOGIC ──
  const answerKeySnap = await sessionRef.collection('answer_key').doc('data').get();
  if (!answerKeySnap.exists) {
    throw new HttpsError('not-found', 'Answer key not configured for this quiz.');
  }
  const correctAnswers = answerKeySnap.data().correct_indices;

  if (!Array.isArray(correctAnswers)) {
    throw new HttpsError('internal', 'Answer key is malformed.');
  }
  if (answers.length !== correctAnswers.length) {
    throw new HttpsError('invalid-argument', `Expected ${correctAnswers.length} answers, got ${answers.length}.`);
  }

  let correctCount = 0;
  correctAnswers.forEach((correctIdx, i) => {
    if (answers[i] === correctIdx) correctCount++;
  });
  const totalQuestions = correctAnswers.length;
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passThreshold = session.passing_score || session.pass_threshold || 70;
  const passed = score >= passThreshold;

  const batch = db.batch();

  batch.set(subRef, {
    user_id:    uid,
    session_id: sessionId,
    type:       'quiz',
    quiz_score: score,
    quiz_answers: answers,
    correct_count: correctCount,
    total_questions: totalQuestions,
    passed: passed,
    attempts: attempts,
    graded_at: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  let xpAwarded = 0;
  let courseLocked = false;

  if (passed) {
      const moduleId = session.module_id;
      const progressId = `${uid}_${moduleId}`;
      const progressRef = db.collection('module_progress').doc(progressId);
      const progressSnap = await progressRef.get();
      const progressData = progressSnap.exists ? progressSnap.data() : { sessions_completed: {} };

      // Ensure they haven't already received XP for this
      if (!progressData.sessions_completed || !progressData.sessions_completed[sessionId]) {
          const modSessionsSnap = await db.collection('sessions').where('module_id', '==', moduleId).get();
          const totalSessions = modSessionsSnap.size;

          let completedCount = 0;
          const completedMap = progressData.sessions_completed || {};
          completedMap[sessionId] = true;
          Object.keys(completedMap).forEach(k => { if (completedMap[k]) completedCount++; });

          const pct = totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 100;
          const allDone = completedCount >= totalSessions;

          const newProgressData = {
              user_id: uid,
              module_id: moduleId,
              course_id: courseId,
              sessions_completed: completedMap,
              progress_pct: pct,
              updated_at: admin.firestore.FieldValue.serverTimestamp()
          };
          
          if (allDone && !progressData.completed_at) {
              newProgressData.completed_at = admin.firestore.FieldValue.serverTimestamp();
          }

          if (progressSnap.exists) {
              batch.update(progressRef, newProgressData);
          } else {
              newProgressData.created_at = admin.firestore.FieldValue.serverTimestamp();
              batch.set(progressRef, newProgressData);
          }

          batch.update(db.collection('users').doc(uid), { xp_total: admin.firestore.FieldValue.increment(5) });

          batch.set(db.collection('xp').doc(), {
              user_id: uid,
              xp_earned: 5,
              source: 'session_completion',
              bonus_label: `Exam Passed: ${session.title || sessionId}`,
              claimed_at: admin.firestore.FieldValue.serverTimestamp(),
              streak_day: 0,
              bonus_xp: 0
          });

          xpAwarded = 5;
          recalcEnrolmentProgress(uid, courseId).catch(console.error);
      }
  } else if (!passed && attempts >= maxAttempts) {
      // ── PENALTY: EXHAUSTED ATTEMPTS ──
      if (!enrolSnap.empty) {
          const enrolDocId = enrolSnap.docs[0].id;
          batch.update(db.collection('enrolments').doc(enrolDocId), {
              status: 'failed_needs_repurchase',
              locked_reason: `Failed exam ${maxAttempts} times`,
              updated_at: admin.firestore.FieldValue.serverTimestamp()
          });
          courseLocked = true;
      }
  }

  await batch.commit();

  return { score, passed, correctCount, totalQuestions, passThreshold, xpAwarded, attempts, maxAttempts, courseLocked };
});

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATE TO READABLE IDS
// ═══════════════════════════════════════════════════════════════════════════
exports.migrateToReadableIds = onRequest(async (req, res) => {
  const expectedSecret = process.env.BACKFILL_SECRET; 
  if (!expectedSecret || req.query.secret !== expectedSecret) {
    res.status(403).send('Forbidden');
    return;
  }

  function toSlug(str) {
    return (str || '').toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 60);
  }

  function isAutoId(id) {
    return /^[A-Za-z0-9]{20}$/.test(id);
  }

  const db = admin.firestore();
  const results = { courses: [], modules: [], sessions: [], errors: [] };

  try {
    const coursesSnap = await db.collection('courses').get();
    for (const courseDoc of coursesSnap.docs) {
      if (!isAutoId(courseDoc.id)) {
        results.courses.push({ id: courseDoc.id, action: 'skipped — already readable' });
        continue;
      }
      const d = courseDoc.data();
      let newId;
      if (d.is_foundation) {
        newId = 'foundation';
      } else if (d.tier === 'executive' && d.title?.toLowerCase().includes('cbie')) {
        newId = 'cbie';
      } else {
        newId = toSlug(d.title || courseDoc.id);
      }

      const existing = await db.collection('courses').doc(newId).get();
      if (existing.exists) {
        results.errors.push(`Course collision: ${courseDoc.id} → ${newId} (already exists)`);
        continue;
      }

      await db.collection('courses').doc(newId).set(d);
      await db.collection('courses').doc(courseDoc.id).delete();
      results.courses.push({ oldId: courseDoc.id, newId, action: 'migrated' });
    }

    const modulesSnap = await db.collection('modules').get();
    for (const modDoc of modulesSnap.docs) {
      if (!isAutoId(modDoc.id)) {
        results.modules.push({ id: modDoc.id, action: 'skipped — already readable' });
        continue;
      }
      const d = modDoc.data();

      let courseId = d.course_id;
      if (isAutoId(courseId)) {
        const migrated = results.courses.find(c => c.oldId === courseId);
        if (migrated) courseId = migrated.newId;
      }

      const order = d.order || 1;
      const newId = courseId + '-m' + order + '-' + toSlug(d.title || modDoc.id);

      const updatedData = { ...d, course_id: courseId };

      const existing = await db.collection('modules').doc(newId).get();
      if (existing.exists) {
        results.errors.push(`Module collision: ${modDoc.id} → ${newId}`);
        continue;
      }

      await db.collection('modules').doc(newId).set(updatedData);
      await db.collection('modules').doc(modDoc.id).delete();
      results.modules.push({ oldId: modDoc.id, newId, action: 'migrated' });
    }

    const sessionsSnap = await db.collection('sessions').get();
    for (const sessDoc of sessionsSnap.docs) {
      if (!isAutoId(sessDoc.id)) {
        results.sessions.push({ id: sessDoc.id, action: 'skipped — already readable' });
        continue;
      }
      const d = sessDoc.data();

      let moduleId = d.module_id;
      if (isAutoId(moduleId)) {
        const migrated = results.modules.find(m => m.oldId === moduleId);
        if (migrated) moduleId = migrated.newId;
      }

      let courseId = d.course_id;
      if (isAutoId(courseId)) {
        const migrated = results.courses.find(c => c.oldId === courseId);
        if (migrated) courseId = migrated.newId;
      }

      const order = d.order || 1;
      const newId = moduleId + '-s' + order + '-' + toSlug(d.title || sessDoc.id);
      const updatedData = { ...d, module_id: moduleId, course_id: courseId };

      const existing = await db.collection('sessions').doc(newId).get();
      if (existing.exists) {
        results.errors.push(`Session collision: ${sessDoc.id} → ${newId}`);
        continue;
      }

      await db.collection('sessions').doc(newId).set(updatedData);
      await db.collection('sessions').doc(sessDoc.id).delete();
      results.sessions.push({ oldId: sessDoc.id, newId, action: 'migrated' });
    }

    res.status(200).json({ success: true, results });

  } catch (error) {
    console.error('[migrateToReadableIds]', error);
    res.status(500).json({ success: false, error: error.message, partialResults: results });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// CONTACT MESSAGE NOTIFICATION
// ═══════════════════════════════════════════════════════════════════════════
exports.notifyContactMessage = onDocumentWritten('contact_messages/{msgId}', async (event) => {
  if (event.data.before.exists) return null;
  const msg = event.data.after.data();
  if (!msg) return null;

  const name    = [msg.first_name, msg.last_name].filter(Boolean).join(' ') || 'Unknown';
  const subject = msg.subject || '(no subject)';
  const source  = msg.source  || 'Website';

  try {
    await sendMail({
      to:      'info@node.sofegroup.com',
      replyTo: msg.email,
      subject: `📩 New Contact Message: ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#FF8A00;color:#000;padding:12px 20px;border-radius:8px 8px 0 0;">
            <strong>New Contact Message — Sofe Node</strong>
          </div>
          <div style="background:#f8f9fa;padding:20px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr>
                <td style="padding:6px 0;color:#666;width:120px;vertical-align:top;"><strong>From</strong></td>
                <td style="padding:6px 0;">${name}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666;vertical-align:top;"><strong>Email</strong></td>
                <td style="padding:6px 0;"><a href="mailto:${msg.email}">${msg.email}</a></td>
              </tr>
              ${msg.user_type ? `<tr>
                <td style="padding:6px 0;color:#666;vertical-align:top;"><strong>I am a</strong></td>
                <td style="padding:6px 0;">${msg.user_type}</td>
              </tr>` : ''}
              <tr>
                <td style="padding:6px 0;color:#666;vertical-align:top;"><strong>Subject</strong></td>
                <td style="padding:6px 0;">${subject}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;color:#666;vertical-align:top;"><strong>Source</strong></td>
                <td style="padding:6px 0;">${source}</td>
              </tr>
            </table>
            <hr style="margin:16px 0;border:none;border-top:1px solid #ddd;"/>
            <p style="color:#666;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.05em;">Message</p>
            <div style="background:#fff;border:1px solid #ddd;border-radius:6px;padding:14px;font-size:14px;line-height:1.7;white-space:pre-wrap;">${msg.message}</div>
            <div style="margin-top:16px;">
              <a href="mailto:${msg.email}?subject=Re: ${encodeURIComponent(subject)}"
                 style="display:inline-block;background:#1428FF;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:bold;">
                Reply to ${name} →
              </a>
            </div>
          </div>
          <p style="color:#999;font-size:11px;margin-top:12px;text-align:center;">
            Submitted via Sofe Node website · ${new Date().toLocaleDateString('en-NG', {weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})} WAT
          </p>
        </div>
      `
    });

    await sendMail({
      to:      msg.email,
      subject: `We received your message — Sofe Node`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#FF8A00;">Hey ${msg.first_name || 'there'} 👋</h2>
          <p>Thanks for reaching out to Sofe Node! We've received your message and our team will get back to you within <strong>48 hours</strong>.</p>
          <div style="background:#f8f9fa;border-left:4px solid #FF8A00;padding:14px;margin:20px 0;border-radius:0 6px 6px 0;">
            <p style="margin:0;font-size:13px;color:#555;"><strong>Your message:</strong><br/><em>${msg.message}</em></p>
          </div>
          <p>In the meantime, feel free to:</p>
          <ul style="line-height:2;">
            <li>Join our <a href="https://node.sofegroup.com">community on Sofe Node</a></li>
            <li>Explore the <a href="https://node.sofegroup.com/academy">Academy</a></li>
            <li>Follow us on Twitter/X and Telegram for updates</li>
          </ul>
          <p style="color:#666;font-size:13px;margin-top:24px;">
            The Sofe Node Team<br/>
            <a href="mailto:info@node.sofegroup.com">info@node.sofegroup.com</a>
          </p>
        </div>
      `
    });

  } catch (err) {
    console.error('[notifyContactMessage] Mail send error:', err);
    return null;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// BOUNTY WINNER NOTIFICATION
// ═══════════════════════════════════════════════════════════════════════════
exports.notifyBountyWinner = onDocumentUpdated('bounty_applications/{applicationId}', async (event) => {
  const before = event.data.before.data();
  const after  = event.data.after.data();

  if (before.status === 'winner' || after.status !== 'winner') return null;
  if (!after.user_id) return null;

  try {
    const bountySnap = await admin.firestore().collection('bounties').doc(after.bounty_id).get();
    const bounty = bountySnap.exists ? bountySnap.data() : {};
    const bountyTitle = bounty.title || 'a bounty';
    const prizeNgn  = after.prize_ngn_awarded || 0;
    const prizeXp   = after.prize_xp_awarded  || 0;
    const rankLabel = after.rank_label || 'a winner';

    await admin.firestore().collection('notifications').add({
      user_id:    after.user_id,
      type:       'personal',
      category:   'bounty_won',
      title:      `🏆 You're ${rankLabel === 'a winner' ? 'a winner' : rankLabel}!`,
      message:    `Congratulations! You've been selected as ${rankLabel} for "${bountyTitle}". ${prizeXp > 0 ? `+${prizeXp} XP awarded. ` : ''}${prizeNgn > 0 ? `₦${prizeNgn.toLocaleString('en-NG')} cash prize will be processed.` : ''}`,
      read:       false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (after.user_email) {
      await sendMail({
        to: after.user_email,
        subject: `🏆 You won ${rankLabel}: ${bountyTitle}!`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <div style="text-align:center;font-size:60px;margin-bottom:12px;">🏆</div>
            <h2 style="text-align:center;color:#FF8A00;">Congratulations, ${after.user_name || 'Sofian'}!</h2>
            <p style="text-align:center;font-size:15px;">You've been selected as <strong>${rankLabel}</strong> for:</p>
            <p style="text-align:center;font-size:20px;font-weight:bold;color:#1428FF;">${bountyTitle}</p>

            <div style="background:linear-gradient(135deg,#FFD700,#FF8A00);border-radius:12px;padding:20px;margin:24px 0;text-align:center;">
              ${prizeXp > 0 ? `<div style="font-size:24px;font-weight:bold;color:#000;">+${prizeXp} XP</div>` : ''}
              ${prizeNgn > 0 ? `<div style="font-size:18px;color:#000;margin-top:4px;">₦${prizeNgn.toLocaleString('en-NG')} cash prize</div>` : ''}
            </div>

            <p style="font-size:14px;color:#555;">Your XP has already been credited to your account. Our team will process your cash prize payout shortly — check your dashboard for updates.</p>

            <a href="https://node.sofegroup.com/dashboard"
               style="display:inline-block;background:#1428FF;color:#fff;padding:14px 28px;text-decoration:none;border-radius:50px;font-weight:bold;margin:20px 0;">
              View Your Dashboard →
            </a>

            <p style="color:#666;font-size:13px;margin-top:24px;">
              Keep up the great work — more bounties are always open on the platform!<br/>
              The Sofe Node Team
            </p>
          </div>
        `
      });
    }

    return null;
  } catch (err) {
    console.error('[notifyBountyWinner]', err);
    return null;
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SYNC BOUNTY APPLICANT COUNT
// ═══════════════════════════════════════════════════════════════════════════
exports.syncBountyApplicantCount = onDocumentWritten('bounty_applications/{applicationId}', async (event) => {
  const before = event.data.before.exists ? event.data.before.data() : null;
  const after  = event.data.after.exists  ? event.data.after.data()  : null;

  const bountyId = after?.bounty_id || before?.bounty_id;
  if (!bountyId) return null;

  if (before && after && before.bounty_id === after.bounty_id) return null;

  try {
    const countSnap = await admin.firestore()
      .collection('bounty_applications')
      .where('bounty_id', '==', bountyId)
      .get();

    await admin.firestore().collection('bounties').doc(bountyId).update({
      applicant_count: countSnap.size,
    });
  } catch (err) {
    console.error('[syncBountyApplicantCount]', err);
  }
  return null;
});

// ═══════════════════════════════════════════════════════════════════════════
// ONE-TIME BACKFILL — BOUNTY APPLICANT COUNTS
// ═══════════════════════════════════════════════════════════════════════════
exports.backfillBountyApplicantCounts = onRequest(async (req, res) => {
  const expectedSecret = process.env.BACKFILL_SECRET;
  if (!expectedSecret || req.query.secret !== expectedSecret) {
    res.status(403).send('Forbidden');
    return;
  }

  try {
    const bountiesSnap = await admin.firestore().collection('bounties').get();
    const results = [];

    for (const bountyDoc of bountiesSnap.docs) {
      const appsSnap = await admin.firestore()
        .collection('bounty_applications')
        .where('bounty_id', '==', bountyDoc.id)
        .get();

      const realCount = appsSnap.size;
      const storedCount = bountyDoc.data().applicant_count || 0;

      if (realCount !== storedCount) {
        await bountyDoc.ref.update({ applicant_count: realCount });
        results.push({ bountyId: bountyDoc.id, title: bountyDoc.data().title || '(untitled)', before: storedCount, after: realCount, fixed: true });
      } else {
        results.push({ bountyId: bountyDoc.id, title: bountyDoc.data().title || '(untitled)', count: realCount, fixed: false });
      }
    }

    const fixedCount = results.filter(r => r.fixed).length;
    res.status(200).json({
      success: true,
      message: `Backfill complete. ${fixedCount} bounty(ies) had drifted counts and were corrected.`,
      results,
    });
  } catch (error) {
    console.error('[backfillBountyApplicantCounts]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// ONE-TIME BACKFILL — FOUNDATION COMPLETION FLAG
// ═══════════════════════════════════════════════════════════════════════════
exports.backfillFoundationCompletionFlags = onRequest(async (req, res) => {
  const expectedSecret = process.env.BACKFILL_SECRET;
  if (!expectedSecret || req.query.secret !== expectedSecret) {
    res.status(403).send('Forbidden');
    return;
  }

  const db = admin.firestore();

  try {
    const coursesSnap = await db.collection('courses').where('is_foundation', '==', true).get();
    if (coursesSnap.empty) {
      res.status(404).json({ success: false, error: 'No course found with is_foundation === true.' });
      return;
    }
    const foundationCourseIds = coursesSnap.docs.map(d => d.id);

    let completedUserIds = new Set();
    for (const courseId of foundationCourseIds) {
      const enrolSnap = await db.collection('enrolments')
        .where('course_id', '==', courseId)
        .where('status', '==', 'completed')
        .get();
      enrolSnap.docs.forEach(d => {
        const uid = d.data().user_id;
        if (uid) completedUserIds.add(uid);
      });
    }

    if (completedUserIds.size === 0) {
      res.status(200).json({ success: true, message: 'No completed Foundation enrolments found — nothing to backfill.' });
      return;
    }

    let written = 0;
    let alreadySet = 0;
    let batch = db.batch();
    let opsInBatch = 0;

    for (const uid of completedUserIds) {
      const userSnap = await db.collection('users').doc(uid).get();
      if (!userSnap.exists) continue;
      if (userSnap.data().foundation_completed === true) { alreadySet++; continue; }

      batch.update(userSnap.ref, { foundation_completed: true });
      written++;
      opsInBatch++;

      if (opsInBatch >= 400) {
        await batch.commit();
        batch = db.batch();
        opsInBatch = 0;
      }
    }
    if (opsInBatch > 0) await batch.commit();

    res.status(200).json({
      success: true,
      message: `Backfill complete. ${written} users flagged as foundation_completed, ${alreadySet} already had it set. Each write will trigger syncLeaderboard to recompute their tier correctly.`,
    });
  } catch (error) {
    console.error('[backfillFoundationCompletionFlags]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST ARCHIVE (manual, non-destructive)
// ═══════════════════════════════════════════════════════════════════════════
exports.createTestArchive = onRequest(async (req, res) => {
  const expectedSecret = process.env.BACKFILL_SECRET;
  if (!expectedSecret || req.query.secret !== expectedSecret) {
    res.status(403).send('Forbidden');
    return;
  }

  const periodId = req.query.period;
  if (!periodId || !/^\d{4}-\d{2}$/.test(periodId)) {
    res.status(400).send('Provide a valid period query param, e.g. ?period=2026-06');
    return;
  }

  const db = admin.firestore();
  const [year, month] = periodId.split('-').map(Number);
  const periodLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  try {
    const lbSnap = await db.collection('leaderboard').get();
    if (lbSnap.empty) {
      res.status(200).json({ success: true, message: 'No live leaderboard entries found — nothing to archive.' });
      return;
    }

    await db.collection('leaderboard_archive').doc(periodId).set({
      period_id: periodId,
      period_label: periodLabel,
      archived_at: admin.firestore.FieldValue.serverTimestamp(),
      entry_count: lbSnap.size,
      is_test_archive: true, 
    });

    let batch = db.batch();
    let opsInBatch = 0;
    let archived = 0;

    for (const doc of lbSnap.docs) {
      const d = doc.data();
      const archiveRef = db.collection('leaderboard_archive').doc(periodId)
        .collection('entries').doc(doc.id);
      batch.set(archiveRef, {
        first_name:               d.first_name || '',
        last_initial:             d.last_initial || '',
        tier:                     d.tier || 'Genesis Node',
        xp_this_period:           d.xp_this_period || 0,
        commission_this_period:   d.commission_this_period || 0,
        validated_referrals_this_period: d.validated_referrals_this_period || 0,
      });
      opsInBatch++;
      archived++;

      if (opsInBatch >= 400) {
        await batch.commit();
        batch = db.batch();
        opsInBatch = 0;
      }
    }
    if (opsInBatch > 0) await batch.commit();

    res.status(200).json({
      success: true,
      message: `Test archive created for ${periodLabel} (${periodId}) with ${archived} entries, snapshotted from current live data. Live leaderboard was NOT reset — this is a preview copy only.`,
    });
  } catch (error) {
    console.error('[createTestArchive]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// BACKFILL HISTORICAL PERIOD (real data, not a snapshot)
// ═══════════════════════════════════════════════════════════════════════════
exports.backfillHistoricalPeriod = onRequest(async (req, res) => {
  const expectedSecret = process.env.BACKFILL_SECRET;
  if (!expectedSecret || req.query.secret !== expectedSecret) {
    res.status(403).send('Forbidden');
    return;
  }

  const periodId = req.query.period;
  if (!periodId || !/^\d{4}-\d{2}$/.test(periodId)) {
    res.status(400).send('Provide a valid period query param, e.g. ?period=2026-06');
    return;
  }

  const db = admin.firestore();
  const [year, month] = periodId.split('-').map(Number);
  const periodStartUTC = new Date(Date.UTC(year, month - 1, 1, -1, 0, 0));      
  const periodEndUTC   = new Date(Date.UTC(year, month, 1, -1, 0, 0));          
  const periodLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });

  try {
    const xpSnap = await db.collection('xp')
      .where('claimed_at', '>=', periodStartUTC)
      .where('claimed_at', '<', periodEndUTC)
      .get();

    const xpByUser = {};
    xpSnap.docs.forEach(d => {
      const x = d.data();
      if (!x.user_id) return;
      xpByUser[x.user_id] = (xpByUser[x.user_id] || 0) + (Number(x.xp_earned) || 0);
    });

    const commSnap = await db.collection('commissions')
      .where('created_at', '>=', periodStartUTC)
      .where('created_at', '<', periodEndUTC)
      .get();

    const commByUser = {};
    commSnap.docs.forEach(d => {
      const c = d.data();
      if (!c.user_id) return;
      commByUser[c.user_id] = (commByUser[c.user_id] || 0) + (Number(c.amount) || 0);
    });

    const allUids = new Set([...Object.keys(xpByUser), ...Object.keys(commByUser)]);

    if (allUids.size === 0) {
      res.status(200).json({
        success: true,
        message: `No xp or commission records found with timestamps inside ${periodLabel}. Nothing to archive.`,
      });
      return;
    }

    const existingEntriesSnap = await db.collection('leaderboard_archive').doc(periodId).collection('entries').get();
    if (!existingEntriesSnap.empty) {
      let clearBatch = db.batch();
      let clearOps = 0;
      for (const doc of existingEntriesSnap.docs) {
        clearBatch.delete(doc.ref);
        clearOps++;
        if (clearOps >= 400) {
          await clearBatch.commit();
          clearBatch = db.batch();
          clearOps = 0;
        }
      }
      if (clearOps > 0) await clearBatch.commit();
    }

    const userDocs = await Promise.all(
      Array.from(allUids).map(uid => db.collection('users').doc(uid).get())
    );
    const userDataByUid = {};
    userDocs.forEach(snap => { if (snap.exists) userDataByUid[snap.id] = snap.data(); });

    await db.collection('leaderboard_archive').doc(periodId).set({
      period_id: periodId,
      period_label: periodLabel,
      archived_at: admin.firestore.FieldValue.serverTimestamp(),
      entry_count: allUids.size,
      is_test_archive: false,
      reconstructed_from_real_data: true,
    });

    let batch = db.batch();
    let opsInBatch = 0;
    let written = 0;

    for (const uid of allUids) {
      const u = userDataByUid[uid] || {};
      const archiveRef = db.collection('leaderboard_archive').doc(periodId).collection('entries').doc(uid);
      batch.set(archiveRef, {
        first_name:   u.first_name || '',
        last_initial: u.last_name ? u.last_name[0].toUpperCase() + '.' : '',
        tier:         u.tier || 'Genesis Node', 
        xp_this_period:           xpByUser[uid] || 0,
        commission_this_period:   commByUser[uid] || 0,
        validated_referrals_this_period: 0, 
      });
      written++;
      opsInBatch++;
      if (opsInBatch >= 400) {
        await batch.commit();
        batch = db.batch();
        opsInBatch = 0;
      }
    }
    if (opsInBatch > 0) await batch.commit();

    res.status(200).json({
      success: true,
      message: `Reconstructed REAL ${periodLabel} leaderboard from ${xpSnap.size} xp records and ${commSnap.size} commission records. ${written} users written to leaderboard_archive/${periodId}. Validated referrals could not be reconstructed for this period (no historical timestamp existed before the leaderboard system went live) and are set to 0.`,
      period: periodId,
    });
  } catch (error) {
    console.error('[backfillHistoricalPeriod]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// SEND ADMIN NOTIFICATION
// ═══════════════════════════════════════════════════════════════════════════

const XP_TIER_ORDER = ['Genesis Node', 'Validator', 'Crypto Knight', 'Chain Architect', 'Node Operator', 'Node Sovereign'];

exports.sendAdminNotification = onCall({ timeoutSeconds: 300, memory: '256MiB' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in.');
  }
  const callerUid = request.auth.uid;
  const callerSnap = await admin.firestore().collection('users').doc(callerUid).get();
  const callerData = callerSnap.exists ? callerSnap.data() : {};
  const isAuthorized = callerData.role === 'admin'
    && ['super_admin', 'community_manager'].includes(callerData.admin_role);
  if (!isAuthorized) {
    throw new HttpsError('permission-denied', 'Not authorized to send notifications.');
  }

  const { title, message, type, link, target, course_id, min_tier, node, deliver_in_app, deliver_email } = request.data;

  if (!title || !message) {
    throw new HttpsError('invalid-argument', 'Title and message are required.');
  }
  if (!deliver_in_app && !deliver_email) {
    throw new HttpsError('invalid-argument', 'Select at least one delivery method.');
  }
  if (!['all', 'course', 'tier', 'node'].includes(target)) {
    throw new HttpsError('invalid-argument', 'Invalid target audience.');
  }

  const db = admin.firestore();
  const notifType = type || 'announcement';

  async function resolveRecipients() {
    if (target === 'course') {
      if (!course_id) throw new HttpsError('invalid-argument', 'course_id is required for course targeting.');
      const enrolSnap = await db.collection('enrolments')
        .where('course_id', '==', course_id)
        .where('status', '==', 'active')
        .get();
      const uids = [...new Set(enrolSnap.docs.map(d => d.data().user_id).filter(Boolean))];
      const userDocs = await Promise.all(uids.map(u => db.collection('users').doc(u).get()));
      return userDocs.filter(d => d.exists).map(d => ({ uid: d.id, email: d.data().email, name: d.data().first_name || '' }));
    }

    if (target === 'tier') {
      if (!min_tier || !XP_TIER_ORDER.includes(min_tier)) {
        throw new HttpsError('invalid-argument', 'Valid min_tier is required for tier targeting.');
      }
      const minIndex = XP_TIER_ORDER.indexOf(min_tier);
      const qualifyingTiers = XP_TIER_ORDER.slice(minIndex); 
      const lbSnap = await db.collection('leaderboard').where('tier', 'in', qualifyingTiers).get();
      const uids = lbSnap.docs.map(d => d.id);
      const userDocs = await Promise.all(uids.map(u => db.collection('users').doc(u).get()));
      return userDocs.filter(d => d.exists).map(d => ({ uid: d.id, email: d.data().email, name: d.data().first_name || '' }));
    }

    if (target === 'node') {
      if (!node) throw new HttpsError('invalid-argument', 'node is required for node targeting.');
      const usersSnap = await db.collection('users').where('node', '==', node).get();
      return usersSnap.docs.map(d => ({ uid: d.id, email: d.data().email, name: d.data().first_name || '' }));
    }

    const usersSnap = await db.collection('users').where('role', '==', 'student').get();
    return usersSnap.docs.map(d => ({ uid: d.id, email: d.data().email, name: d.data().first_name || '' }));
  }

  let inAppCount = 0;
  let emailCount = 0;
  let recipients = [];

  if (deliver_in_app) {
    if (target === 'all') {
      await db.collection('notifications').add({
        title, message,
        type: 'broadcast',      
        category: notifType,    
        link: link || null,
        user_id: null,          
        sent_by: callerUid,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      inAppCount = 'all students'; 
    } else {
      recipients = await resolveRecipients();
      let batch = db.batch();
      let ops = 0;
      for (const r of recipients) {
        const ref = db.collection('notifications').doc();
        batch.set(ref, {
          title, message,
          type: 'personal',       
          category: notifType,    
          link: link || null,
          user_id: r.uid,
          read: false,
          sent_by: callerUid,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        ops++;
        inAppCount++;
        if (ops >= 400) {
          await batch.commit();
          batch = db.batch();
          ops = 0;
        }
      }
      if (ops > 0) await batch.commit();
    }
  }

  if (deliver_email) {
    if (recipients.length === 0) {
      recipients = await resolveRecipients();
    }
    const emailable = recipients.filter(r => !!r.email);
    const CHUNK_SIZE = 25;
    for (let i = 0; i < emailable.length; i += CHUNK_SIZE) {
      const chunk = emailable.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(chunk.map(r => sendMail({
        to: r.email,
        subject: title,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#FF8A00;">${title}</h2>
            <p style="font-size:15px;line-height:1.7;white-space:pre-wrap;">${message}</p>
            ${link ? `<a href="https://node.sofegroup.com${link}" style="display:inline-block;background:#1428FF;color:#fff;padding:12px 24px;text-decoration:none;border-radius:50px;font-weight:bold;margin-top:16px;">View →</a>` : ''}
            <p style="color:#666;font-size:12px;margin-top:32px;">Sofe Node · <a href="https://node.sofegroup.com/dashboard">Go to your dashboard</a></p>
          </div>
        `
      })));
      results.forEach((res, idx) => {
        if (res.status === 'fulfilled') {
          emailCount++;
        } else {
          console.error(`[sendAdminNotification] Email failed for ${chunk[idx].email}:`, res.reason);
        }
      });
    }
  }

  return { success: true, inAppCount, emailCount, recipientCount: recipients.length };
});

// ═══════════════════════════════════════════════════════════════════════════
// JOIN CHAPTER REDIRECT
// ═══════════════════════════════════════════════════════════════════════════

exports.joinChapterRedirect = onRequest(async (req, res) => {
  const parts = req.path.split('/').filter(Boolean); 
  const slug = (parts[1] || '').toLowerCase().trim();

  function renderPage({ title, message, redirectUrl, isError }) {
    const safeUrl = redirectUrl ? redirectUrl.replace(/"/g, '&quot;') : null;
    res.set('Content-Type', 'text/html');
    res.status(isError ? 404 : 200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
${safeUrl ? `<meta http-equiv="refresh" content="1.5;url=${safeUrl}"/>` : ''}
<title>${title} — Sofe Node</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #07090f; color: #e8eaf2; font-family: 'Poppins', Arial, sans-serif;
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    text-align: center; padding: 2rem;
  }
  .card { max-width: 420px; }
  .logo { font-size: 1.3rem; font-weight: 800; margin-bottom: 2rem; }
  .logo span:first-child { color: #FF8A00; }
  .logo span:last-child { color: #1428FF; }
  .spinner {
    width: 40px; height: 40px; border: 3px solid rgba(255,255,255,.1);
    border-top-color: #1428FF; border-radius: 50%;
    animation: spin .8s linear infinite; margin: 0 auto 1.5rem;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  h1 { font-size: 1.1rem; font-weight: 700; margin-bottom: .6rem; }
  p { font-size: .85rem; color: rgba(200,215,240,.6); line-height: 1.6; }
  a.manual-link {
    display: inline-block; margin-top: 1.5rem; color: #FF8A00;
    text-decoration: none; font-size: .8rem; font-weight: 600;
  }
  a.back-link {
    display: inline-block; margin-top: 1.5rem; background: #1428FF; color: #fff;
    text-decoration: none; font-size: .8rem; font-weight: 700;
    padding: .7rem 1.5rem; border-radius: 50px;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="logo"><span>◈ Sofe</span> <span>Node</span></div>
    ${!isError ? '<div class="spinner"></div>' : ''}
    <h1>${title}</h1>
    <p>${message}</p>
    ${safeUrl ? `<a class="manual-link" href="${safeUrl}">Tap here if you're not redirected →</a>` : ''}
    ${isError ? `<a class="back-link" href="https://node.sofegroup.com">Go to Sofe Node →</a>` : ''}
  </div>
  ${safeUrl ? `<script>setTimeout(function(){ window.location.href = "${safeUrl}"; }, 1500);</script>` : ''}
</body>
</html>
    `);
  }

  if (!slug) {
    renderPage({
      title: 'Chapter not found',
      message: "We couldn't find a chapter link at this address. Double-check the link, or head to Sofe Node to find your chapter.",
      isError: true,
    });
    return;
  }

  try {
    const chapterSnap = await admin.firestore().collection('chapters').doc(slug).get();

    if (!chapterSnap.exists || !chapterSnap.data().active || !chapterSnap.data().whatsapp_link) {
      renderPage({
        title: 'Chapter not found',
        message: "This chapter link isn't active right now. Head to Sofe Node to find your chapter.",
        isError: true,
      });
      return;
    }

    const chapter = chapterSnap.data();
    renderPage({
      title: `Redirecting you to ${chapter.name || 'your chapter'}...`,
      message: `Taking you to the ${chapter.name || 'chapter'} WhatsApp group.`,
      redirectUrl: chapter.whatsapp_link,
      isError: false,
    });
  } catch (error) {
    console.error('[joinChapterRedirect]', error);
    renderPage({
      title: 'Something went wrong',
      message: 'Please try again in a moment, or head to Sofe Node directly.',
      isError: true,
    });
  }
});