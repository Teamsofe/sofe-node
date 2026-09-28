<?php
// api/login.php
// POST { email, password, remember }
// Returns { ok, token, user }

require_once __DIR__ . '/../config/db.php';
set_headers();
require_method('POST');

$data     = body();
$email    = trim(strtolower($data['email']    ?? ''));
$password = $data['password'] ?? '';
$remember = !empty($data['remember']);

// ── Validate input ───────────────────────────────────────────
if (!$email || !$password) {
    fail('Email and password are required.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('Invalid email address.');
}

// ── Look up user ─────────────────────────────────────────────
$stmt = db()->prepare(
    'SELECT * FROM users WHERE email = ? AND status != "suspended" LIMIT 1'
);
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    // Generic message — don't reveal which field is wrong
    fail('Invalid email or password.', 401);
}

// ── Create session token ─────────────────────────────────────
$token     = generate_token(32);
$expiresAt = $remember
    ? date('Y-m-d H:i:s', strtotime('+30 days'))
    : date('Y-m-d H:i:s', strtotime('+12 hours'));

db()->prepare(
    'INSERT INTO sessions (token, user_id, ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?)'
)->execute([
    $token,
    $user['id'],
    $_SERVER['REMOTE_ADDR']      ?? null,
    $_SERVER['HTTP_USER_AGENT']  ?? null,
    $expiresAt,
]);

// ── Update last login ────────────────────────────────────────
db()->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')
    ->execute([$user['id']]);

// ── Wallet balance ───────────────────────────────────────────
$balStmt = db()->prepare(
    'SELECT COALESCE(SUM(amount_ngn), 0) AS balance
     FROM transactions
     WHERE user_id = ? AND status = "completed"'
);
$balStmt->execute([$user['id']]);
$balance = (float)$balStmt->fetchColumn();

// ── Unread notification count ────────────────────────────────
$nStmt = db()->prepare(
    'SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0'
);
$nStmt->execute([$user['id']]);
$unreadCount = (int)$nStmt->fetchColumn();

// ── Respond ──────────────────────────────────────────────────
ok([
    'token'      => $token,
    'expires_at' => $expiresAt,
    'user'       => [
        'id'           => (int)$user['id'],
        'name'         => $user['first_name'] . ' ' . $user['last_name'],
        'first_name'   => $user['first_name'],
        'last_name'    => $user['last_name'],
        'email'        => $user['email'],
        'phone'        => $user['phone'],
        'state'        => $user['state'],
        'node'         => $user['node'],
        'referral_id'  => $user['referral_id'],
        'xp_total'     => (int)$user['xp_total'],
        'xp_tier'      => $user['xp_tier'],
        'role'         => $user['role'],
        'wallet'       => $balance,
        'unread_notifs'=> $unreadCount,
    ],
]);
