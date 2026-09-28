<?php
// api/settings.php
// POST { action, ...fields }
//
// Actions:
//   change_password  { current_password, new_password }
//   update_bank      { bank_name, account_number, account_name }
//   update_node      { node }
//   update_notifications { referral_signups, commission_earned, course_updates, payout_processed, marketing }

require_once __DIR__ . '/../config/db.php';
set_headers();
require_method('POST');
$user = auth_user();
$uid  = (int)$user['id'];
$data = body();

$action = $data['action'] ?? '';

// ── Change Password ──────────────────────────────────────────
if ($action === 'change_password') {
    $current = $data['current_password'] ?? '';
    $new     = $data['new_password']     ?? '';

    if (!$current || !$new) fail('Both current and new passwords are required.');
    if (strlen($new) < 8)   fail('New password must be at least 8 characters.');

    // Verify current password
    $row = db()->prepare('SELECT password_hash FROM users WHERE id = ? LIMIT 1');
    $row->execute([$uid]);
    $hash = $row->fetchColumn();

    if (!password_verify($current, $hash)) {
        fail('Current password is incorrect.', 401);
    }

    $newHash = password_hash($new, PASSWORD_BCRYPT, ['cost' => 12]);
    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$newHash, $uid]);

    // Invalidate all other sessions for security
    $currentToken = '';
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) $currentToken = $m[1];
    db()->prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?')
        ->execute([$uid, $currentToken]);

    ok(['message' => 'Password updated successfully. Other sessions have been logged out.']);
}

// ── Update Bank Details ──────────────────────────────────────
if ($action === 'update_bank') {
    $bankName  = trim($data['bank_name']       ?? '');
    $accNum    = trim($data['account_number']  ?? '');
    $accName   = trim($data['account_name']    ?? '');

    if (!$bankName || !$accNum || !$accName) fail('Bank name, account number and account name are required.');
    if (!preg_match('/^\d{10}$/', $accNum))   fail('Account number must be exactly 10 digits.');

    // Upsert bank details
    $exists = db()->prepare('SELECT id FROM bank_details WHERE user_id = ? LIMIT 1');
    $exists->execute([$uid]);
    if ($exists->fetch()) {
        db()->prepare(
            'UPDATE bank_details SET bank_name=?, account_number=?, account_name=?, is_verified=0, updated_at=NOW() WHERE user_id=?'
        )->execute([$bankName, $accNum, strtoupper($accName), $uid]);
    } else {
        db()->prepare(
            'INSERT INTO bank_details (user_id, bank_name, account_number, account_name) VALUES (?,?,?,?)'
        )->execute([$uid, $bankName, $accNum, strtoupper($accName)]);
    }

    ok(['message' => 'Bank details updated successfully.']);
}

// ── Update Node (University) ─────────────────────────────────
if ($action === 'update_node') {
    $node      = trim($data['node']       ?? '') ?: null;
    $otherNode = trim($data['other_node'] ?? '') ?: null;
    $finalNode = $node === 'other' ? $otherNode : $node;

    db()->prepare('UPDATE users SET node = ? WHERE id = ?')->execute([$finalNode, $uid]);
    ok(['message' => 'Node updated.', 'node' => $finalNode]);
}

// ── Update Notification Preferences ──────────────────────────
if ($action === 'update_notifications') {
    $marketing = isset($data['marketing']) ? (int)(bool)$data['marketing'] : 0;
    db()->prepare('UPDATE users SET marketing_ok = ? WHERE id = ?')->execute([$marketing, $uid]);
    // (Individual notification toggles would live in a separate user_settings table
    //  in a future iteration — for now we store the marketing preference)
    ok(['message' => 'Notification preferences saved.']);
}

// ── Connect Wallet ────────────────────────────────────────────
if ($action === 'connect_wallet') {
    $address = trim($data['wallet_address'] ?? '');
    if (!$address) fail('Wallet address is required.');

    // Basic Ethereum/Solana address validation
    $isEth = preg_match('/^0x[a-fA-F0-9]{40}$/', $address);
    $isSol = preg_match('/^[1-9A-HJ-NP-Za-km-z]{32,44}$/', $address);
    if (!$isEth && !$isSol) fail('Invalid wallet address format.');

    // Store in user row (add wallet_address column if not present)
    try {
        db()->prepare('UPDATE users SET wallet_address = ? WHERE id = ?')
            ->execute([$address, $uid]);
    } catch (\PDOException $e) {
        // Column may not exist yet — run: ALTER TABLE users ADD COLUMN wallet_address VARCHAR(100) DEFAULT NULL;
        fail('wallet_address column not found. Run the ALTER TABLE migration first.');
    }

    ok(['message' => 'Wallet connected.', 'address' => $address]);
}

fail('Unknown action.');
