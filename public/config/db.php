<?php
// ============================================================
//  config/db.php — Sofe Node  |  node.sofegroup.com
//
//  INSTRUCTIONS:
//  Only change the 5 lines marked with  <--- CHANGE THIS
//  Do NOT delete any other line.
// ============================================================

if (!defined('DB_HOST'))        define('DB_HOST',        'localhost');
if (!defined('DB_NAME'))        define('DB_NAME',        'your_db_name');      // <--- CHANGE THIS  e.g. sofeagan_sofenode
if (!defined('DB_USER'))        define('DB_USER',        'your_db_user');      // <--- CHANGE THIS  e.g. sofeagan_sofeuser
if (!defined('DB_PASS'))        define('DB_PASS',        'your_db_password');  // <--- CHANGE THIS  your real password
if (!defined('DB_CHARSET'))     define('DB_CHARSET',     'utf8mb4');
if (!defined('APP_SECRET'))     define('APP_SECRET',     'change-this-to-any-long-random-string-min-32-chars'); // <--- CHANGE THIS
if (!defined('MIN_PAYOUT_NGN')) define('MIN_PAYOUT_NGN', 10000);

// ── DATABASE CONNECTION ──────────────────────────────────────
function db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;

    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Database connection failed. Check credentials in db.php.']);
        exit;
    }

    return $pdo;
}

// ── HEADERS ──────────────────────────────────────────────────
function set_headers(): void {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
}

// ── RESPONSES ────────────────────────────────────────────────
function ok(array $data = []): void {
    echo json_encode(['ok' => true, ...$data]);
    exit;
}

function fail(string $message, int $status = 400): void {
    http_response_code($status);
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

// ── INPUT ────────────────────────────────────────────────────
function body(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function require_method(string $method): void {
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) fail('Method not allowed.', 405);
}

// ── TOKEN / REFERRAL ID ──────────────────────────────────────
function generate_token(int $bytes = 32): string {
    return bin2hex(random_bytes($bytes));
}

function generate_referral_id(): string {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $code  = '';
    for ($i = 0; $i < 6; $i++) $code .= $chars[random_int(0, strlen($chars) - 1)];
    return 'SOFE-' . $code;
}

// ── AUTH ─────────────────────────────────────────────────────
function auth_user(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) fail('Unauthorised.', 401);

    $stmt = db()->prepare(
        'SELECT s.user_id, s.expires_at, u.* FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token = ? AND s.expires_at > NOW() AND u.status = "active"'
    );
    $stmt->execute([$m[1]]);
    $row = $stmt->fetch();
    if (!$row) fail('Session expired. Please log in again.', 401);

    db()->prepare('UPDATE sessions SET expires_at = DATE_ADD(NOW(), INTERVAL 30 MINUTE) WHERE token = ?')
        ->execute([$m[1]]);
    return $row;
}

// ── XP ───────────────────────────────────────────────────────
function xp_tier(int $xp): string {
    if ($xp >= 15000) return 'Node Sovereign';
    if ($xp >= 8000)  return 'Protocol Master';
    if ($xp >= 4000)  return 'Chain Architect';
    if ($xp >= 1500)  return 'Crypto Knight';
    if ($xp >= 500)   return 'Validator';
    return 'Genesis Node';
}

function award_xp(int $user_id, int $xp): int {
    db()->prepare('UPDATE users SET xp_total = xp_total + ? WHERE id = ?')->execute([$xp, $user_id]);
    $stmt = db()->prepare('SELECT xp_total FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    $total = (int)$stmt->fetchColumn();
    db()->prepare('UPDATE users SET xp_tier = ? WHERE id = ?')->execute([xp_tier($total), $user_id]);
    return $total;
}

// ── NOTIFICATIONS ────────────────────────────────────────────
function notify(int $user_id, string $type, string $title, string $message, ?string $link = null): void {
    db()->prepare('INSERT INTO notifications (user_id, type, title, message, link) VALUES (?,?,?,?,?)')
        ->execute([$user_id, $type, $title, $message, $link]);
}
