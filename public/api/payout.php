<?php
// api/payout.php
// POST — submit a payout request
// GET  — list payout requests for user
require_once __DIR__ . '/../config/db.php';
set_headers();
$user = auth_user();
$uid  = (int)$user['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = db()->prepare(
        'SELECT id, amount_ngn, bank_name, account_number, status, requested_at, processed_at
         FROM payout_requests WHERE user_id = ?
         ORDER BY requested_at DESC LIMIT 20'
    );
    $stmt->execute([$uid]);
    ok(['payouts' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get wallet balance
    $balStmt = db()->prepare(
        'SELECT COALESCE(SUM(amount_ngn), 0) FROM transactions
         WHERE user_id = ? AND status = "completed"'
    );
    $balStmt->execute([$uid]);
    $balance = (float)$balStmt->fetchColumn();

    if ($balance < MIN_PAYOUT_NGN) {
        fail('Minimum payout is ₦' . number_format(MIN_PAYOUT_NGN, 0) . '. Your current balance is ₦' . number_format($balance, 2) . '.');
    }

    // Check for pending payout (only one at a time)
    $pending = db()->prepare(
        'SELECT id FROM payout_requests WHERE user_id = ? AND status IN ("pending","processing") LIMIT 1'
    );
    $pending->execute([$uid]);
    if ($pending->fetch()) {
        fail('You already have a pending payout request. Please wait for it to be processed before submitting another.');
    }

    // Get bank details
    $bankStmt = db()->prepare('SELECT * FROM bank_details WHERE user_id = ? LIMIT 1');
    $bankStmt->execute([$uid]);
    $bank = $bankStmt->fetch();
    if (!$bank) {
        fail('Please add your bank details in Settings before requesting a payout.');
    }

    // Create payout request
    db()->prepare(
        'INSERT INTO payout_requests (user_id, amount_ngn, bank_name, account_number)
         VALUES (?, ?, ?, ?)'
    )->execute([$uid, $balance, $bank['bank_name'], $bank['account_number']]);

    // Debit wallet
    db()->prepare(
        'INSERT INTO transactions (user_id, type, amount_ngn, description, status)
         VALUES (?, "payout", ?, ?, "pending")'
    )->execute([$uid, -$balance, 'Payout request — ' . $bank['bank_name'] . ' ****' . substr($bank['account_number'], -4)]);

    notify(
        $uid,
        'payout',
        'Payout Request Submitted ✓',
        'Your request for ₦' . number_format($balance, 2) . ' has been submitted. Payments are processed on the 28th–30th of each month.',
        './dashboard.html'
    );

    ok([
        'message' => 'Payout request submitted successfully.',
        'amount'  => $balance,
        'note'    => 'Payments are processed on the 28th–30th of each month. Ensure your bank details are correct in Settings.',
    ]);
}

fail('Method not allowed.', 405);
