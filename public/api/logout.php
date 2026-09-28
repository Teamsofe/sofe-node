<?php
// api/logout.php
// POST — destroys current session token
require_once __DIR__ . '/../config/db.php';
set_headers();
require_method('POST');

$header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) {
    db()->prepare('DELETE FROM sessions WHERE token = ?')->execute([$m[1]]);
}
ok(['message' => 'Logged out.']);
