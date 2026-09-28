<?php
// api/me.php
// GET — returns the current user's full profile + dashboard snapshot
require_once __DIR__ . '/../config/db.php';
set_headers();
require_method('GET');

$user = auth_user();
$uid  = (int)$user['id'];

// ── Wallet balance ────────────────────────────────────────────
$balStmt = db()->prepare(
    'SELECT COALESCE(SUM(amount_ngn), 0) FROM transactions
     WHERE user_id = ? AND status = "completed"'
);
$balStmt->execute([$uid]);
$balance = (float)$balStmt->fetchColumn();

// Unpaid (pending commissions not yet in payout)
$unpaidStmt = db()->prepare(
    'SELECT COALESCE(SUM(commission_ngn), 0) FROM referrals
     WHERE referrer_id = ? AND status = "valid"'
);
$unpaidStmt->execute([$uid]);
$unpaid = (float)$unpaidStmt->fetchColumn();

// ── Referral stats ────────────────────────────────────────────
$refStmt = db()->prepare(
    'SELECT
        COUNT(*)                                          AS total_referrals,
        SUM(status = "valid")                             AS valid_signups,
        COALESCE(SUM(commission_ngn), 0)                  AS total_earned
     FROM referrals WHERE referrer_id = ?'
);
$refStmt->execute([$uid]);
$refs = $refStmt->fetch();

// ── Recent transactions ───────────────────────────────────────
$txStmt = db()->prepare(
    'SELECT id, type, amount_ngn, description, status, created_at
     FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10'
);
$txStmt->execute([$uid]);
$transactions = $txStmt->fetchAll();

// ── Course progress snapshot ──────────────────────────────────
$progressStmt = db()->prepare(
    'SELECT p.module_id, p.course_id, p.status, p.completed_at,
            m.title AS module_title, m.xp_reward,
            c.title AS course_title, c.track
     FROM user_progress p
     JOIN modules m ON m.id = p.module_id
     JOIN courses c ON c.id = p.course_id
     WHERE p.user_id = ?
     ORDER BY p.course_id, m.sort_order'
);
$progressStmt->execute([$uid]);
$progress = $progressStmt->fetchAll();

// Foundation course completion check
$foundationId = 1; // course_id = 1 is the Foundation course
$totalModules = 6;
$doneModules  = 0;
foreach ($progress as $p) {
    if ((int)$p['course_id'] === $foundationId && $p['status'] === 'completed') {
        $doneModules++;
    }
}
$foundationComplete = $doneModules >= $totalModules;
$foundationPct      = $totalModules > 0 ? round($doneModules / $totalModules * 100) : 0;

// ── Bank details ──────────────────────────────────────────────
$bankStmt = db()->prepare('SELECT bank_name, account_number, account_name, is_verified FROM bank_details WHERE user_id = ? LIMIT 1');
$bankStmt->execute([$uid]);
$bank = $bankStmt->fetch() ?: null;

// ── Unread notifications ──────────────────────────────────────
$nStmt = db()->prepare(
    'SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0'
);
$nStmt->execute([$uid]);
$unread = (int)$nStmt->fetchColumn();

// ── Certificates ─────────────────────────────────────────────
$certStmt = db()->prepare(
    'SELECT cert_code, issued_at, c.title AS course_title
     FROM certificates ct JOIN courses c ON c.id = ct.course_id
     WHERE ct.user_id = ?'
);
$certStmt->execute([$uid]);
$certs = $certStmt->fetchAll();

ok([
    'user' => [
        'id'                  => $uid,
        'name'                => $user['first_name'] . ' ' . $user['last_name'],
        'first_name'          => $user['first_name'],
        'last_name'           => $user['last_name'],
        'email'               => $user['email'],
        'phone'               => $user['phone'],
        'state'               => $user['state'],
        'node'                => $user['node'],
        'referral_id'         => $user['referral_id'],
        'xp_total'            => (int)$user['xp_total'],
        'xp_tier'             => $user['xp_tier'],
        'level'               => (int)$user['level'],
        'role'                => $user['role'],
        'member_since'        => $user['created_at'],
    ],
    'wallet' => [
        'balance'      => $balance,
        'unpaid'       => $unpaid,
        'min_payout'   => MIN_PAYOUT_NGN,
        'bank'         => $bank,
        'transactions' => $transactions,
    ],
    'referrals' => [
        'total'        => (int)($refs['total_referrals'] ?? 0),
        'valid'        => (int)($refs['valid_signups']   ?? 0),
        'total_earned' => (float)($refs['total_earned']  ?? 0),
        'link'         => 'https://sofenode.com/signup?ref=' . $user['referral_id'],
    ],
    'academy' => [
        'foundation_pct'      => $foundationPct,
        'foundation_complete' => $foundationComplete,
        'progress'            => $progress,
        'certificates'        => $certs,
    ],
    'unread_notifs' => $unread,
]);
