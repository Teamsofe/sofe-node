<?php
// api/signup.php
// POST { first_name, last_name, email, phone, password, state,
//        node, referred_by, source, marketing_ok }
// Returns { ok, token, user }

require_once __DIR__ . '/../config/db.php';
set_headers();
require_method('POST');

$data = body();

$first    = trim($data['first_name']   ?? '');
$last     = trim($data['last_name']    ?? '');
$email    = trim(strtolower($data['email'] ?? ''));
$phone    = trim($data['phone']        ?? '');
$password = $data['password']          ?? '';
$state    = trim($data['state']        ?? '');
$node     = trim($data['node']         ?? '') ?: null;
$refCode  = strtoupper(trim($data['referred_by'] ?? ''));
$source   = trim($data['source']       ?? '');
$marketing = isset($data['marketing_ok']) ? (int)$data['marketing_ok'] : 1;

// ── Validate ─────────────────────────────────────────────────
$errors = [];
if (!$first)                             $errors[] = 'First name is required.';
if (!$last)                              $errors[] = 'Last name is required.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'Invalid email address.';
if (strlen($password) < 8)              $errors[] = 'Password must be at least 8 characters.';
if (!$state)                             $errors[] = 'State is required.';

if ($errors) fail(implode(' ', $errors));

// ── Check email uniqueness ───────────────────────────────────
$chk = db()->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$chk->execute([$email]);
if ($chk->fetch()) fail('An account with this email already exists.');

// ── Resolve referrer ─────────────────────────────────────────
$referrerId = null;
if ($refCode) {
    $refStmt = db()->prepare('SELECT id FROM users WHERE referral_id = ? LIMIT 1');
    $refStmt->execute([$refCode]);
    $refUser = $refStmt->fetch();
    if ($refUser) $referrerId = (int)$refUser['id'];
    // If code invalid, we silently ignore it
}

// ── Generate unique referral ID ──────────────────────────────
do {
    $newRefId = generate_referral_id();
    $exists   = db()->prepare('SELECT 1 FROM users WHERE referral_id = ? LIMIT 1');
    $exists->execute([$newRefId]);
} while ($exists->fetchColumn());

// ── Insert user ──────────────────────────────────────────────
$hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

db()->prepare(
    'INSERT INTO users
        (first_name, last_name, email, phone, password_hash, state, node,
         referral_id, referred_by, source, marketing_ok)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)'
)->execute([
    $first, $last, $email, $phone ?: null, $hash,
    $state, $node, $newRefId,
    $refCode ?: null,
    $source ?: null,
    $marketing,
]);

$userId = (int)db()->lastInsertId();

// ── Create referral record ────────────────────────────────────
if ($referrerId) {
    // Determine commission rate (Level 1 = 10%, Level 2 = 15%)
    $rateStmt = db()->prepare('SELECT level FROM users WHERE id = ? LIMIT 1');
    $rateStmt->execute([$referrerId]);
    $refLevel = (int)($rateStmt->fetchColumn() ?? 1);
    $rate     = $refLevel >= 2 ? 15.00 : 10.00;

    db()->prepare(
        'INSERT INTO referrals (referrer_id, referred_id, commission_rate)
         VALUES (?, ?, ?)'
    )->execute([$referrerId, $userId, $rate]);

    // Notify referrer
    notify(
        $referrerId,
        'referral',
        'New Referral Signup!',
        "$first $last just signed up using your referral link.",
        './dashboard.html'
    );
}

// ── Welcome notification ─────────────────────────────────────
notify(
    $userId,
    'welcome',
    'Welcome to Sofe Node! 🎉',
    'Your Sofian journey begins now. Start your Foundation Course to earn your first XP and unlock your referral link.',
    './dashboard.html'
);

// ── Create session ───────────────────────────────────────────
$token     = generate_token(32);
$expiresAt = date('Y-m-d H:i:s', strtotime('+12 hours'));

db()->prepare(
    'INSERT INTO sessions (token, user_id, ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?)'
)->execute([
    $token,
    $userId,
    $_SERVER['REMOTE_ADDR']     ?? null,
    $_SERVER['HTTP_USER_AGENT'] ?? null,
    $expiresAt,
]);

// ── Update last login ────────────────────────────────────────
db()->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')
    ->execute([$userId]);

// ── Respond ──────────────────────────────────────────────────
ok([
    'token'      => $token,
    'expires_at' => $expiresAt,
    'user'       => [
        'id'          => $userId,
        'name'        => "$first $last",
        'first_name'  => $first,
        'last_name'   => $last,
        'email'       => $email,
        'phone'       => $phone ?: null,
        'state'       => $state,
        'node'        => $node,
        'referral_id' => $newRefId,
        'xp_total'    => 0,
        'xp_tier'     => 'Genesis Scout',
        'role'        => 'student',
        'wallet'      => 0.00,
        'unread_notifs' => 1,
    ],
]);
