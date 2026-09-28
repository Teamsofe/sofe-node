<?php
// api/notifications.php
// GET               — list notifications (latest 20)
// POST { action: "read_all" | "read", id }  — mark read
require_once __DIR__ . '/../config/db.php';
set_headers();
$user = auth_user();
$uid  = (int)$user['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = db()->prepare(
        'SELECT id, type, title, message, is_read, link, created_at
         FROM notifications WHERE user_id = ?
         ORDER BY created_at DESC LIMIT 20'
    );
    $stmt->execute([$uid]);
    $notifs = $stmt->fetchAll();

    $unread = db()->prepare('SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0');
    $unread->execute([$uid]);

    ok(['notifications' => $notifs, 'unread' => (int)$unread->fetchColumn()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data   = body();
    $action = $data['action'] ?? '';

    if ($action === 'read_all') {
        db()->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')->execute([$uid]);
        ok(['message' => 'All notifications marked as read.']);
    }

    if ($action === 'read' && isset($data['id'])) {
        db()->prepare(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
        )->execute([(int)$data['id'], $uid]);
        ok(['message' => 'Notification marked as read.']);
    }

    fail('Unknown action.');
}

fail('Method not allowed.', 405);
