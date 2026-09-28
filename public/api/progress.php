<?php
// api/progress.php
// POST { module_id, status, score? }  — save module progress
// GET  ?course_id=1                   — get progress for a course
require_once __DIR__ . '/../config/db.php';
set_headers();
$user = auth_user();
$uid  = (int)$user['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $courseId = (int)($_GET['course_id'] ?? 0);
    if (!$courseId) fail('course_id is required.');

    $stmt = db()->prepare(
        'SELECT p.module_id, p.status, p.score, p.completed_at,
                m.title, m.xp_reward, m.sort_order, m.duration_mins, m.content_type
         FROM modules m
         LEFT JOIN user_progress p ON p.module_id = m.id AND p.user_id = ?
         WHERE m.course_id = ?
         ORDER BY m.sort_order'
    );
    $stmt->execute([$uid, $courseId]);
    ok(['modules' => $stmt->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data     = body();
    $moduleId = (int)($data['module_id'] ?? 0);
    $status   = $data['status'] ?? '';
    $score    = isset($data['score']) ? (int)$data['score'] : null;

    if (!$moduleId || !in_array($status, ['in_progress', 'completed'], true)) {
        fail('module_id and valid status are required.');
    }

    // Get module info
    $mod = db()->prepare('SELECT * FROM modules WHERE id = ? LIMIT 1');
    $mod->execute([$moduleId]);
    $module = $mod->fetch();
    if (!$module) fail('Module not found.', 404);

    // Upsert progress
    $existing = db()->prepare(
        'SELECT id, status FROM user_progress WHERE user_id = ? AND module_id = ? LIMIT 1'
    );
    $existing->execute([$uid, $moduleId]);
    $row = $existing->fetch();

    if ($row) {
        // Don't downgrade a completed module
        if ($row['status'] === 'completed' && $status !== 'completed') {
            ok(['message' => 'Already completed.', 'xp_awarded' => 0]);
        }
        db()->prepare(
            'UPDATE user_progress
             SET status = ?, score = ?, completed_at = IF(? = "completed" AND completed_at IS NULL, NOW(), completed_at),
                 updated_at = NOW()
             WHERE id = ?'
        )->execute([$status, $score, $status, (int)$row['id']]);
        $xpAwarded = 0;
    } else {
        $completedAt = $status === 'completed' ? date('Y-m-d H:i:s') : null;
        db()->prepare(
            'INSERT INTO user_progress (user_id, course_id, module_id, status, score, completed_at)
             VALUES (?,?,?,?,?,?)'
        )->execute([$uid, (int)$module['course_id'], $moduleId, $status, $score, $completedAt]);
        $xpAwarded = $status === 'completed' ? (int)$module['xp_reward'] : 0;
    }

    // Award XP on completion
    $newXp = 0;
    if ($status === 'completed' && (!$row || $row['status'] !== 'completed')) {
        $newXp = award_xp($uid, (int)$module['xp_reward']);

        // Check if this completes the Foundation course → mark referral as valid
        $courseId = (int)$module['course_id'];
        if ($courseId === 1) {
            $doneCount = db()->prepare(
                'SELECT COUNT(*) FROM user_progress
                 WHERE user_id = ? AND course_id = 1 AND status = "completed"'
            );
            $doneCount->execute([$uid]);
            $done = (int)$doneCount->fetchColumn();

            $totalCount = db()->prepare('SELECT COUNT(*) FROM modules WHERE course_id = 1');
            $totalCount->execute();
            $total = (int)$totalCount->fetchColumn();

            if ($done >= $total) {
                // Foundation complete — validate referral + credit commission
                $refRow = db()->prepare(
                    'SELECT r.*, u.first_name, u.last_name
                     FROM referrals r JOIN users u ON u.id = r.referrer_id
                     WHERE r.referred_id = ? AND r.status = "pending" LIMIT 1'
                );
                $refRow->execute([$uid]);
                $ref = $refRow->fetch();

                if ($ref) {
                    // Standard course fee for commission calc: ₦2,000
                    $courseFee   = 2000;
                    $commission  = round($courseFee * ($ref['commission_rate'] / 100), 2);

                    db()->prepare(
                        'UPDATE referrals SET status = "valid", commission_ngn = ? WHERE id = ?'
                    )->execute([$commission, (int)$ref['id']]);

                    // Credit commission transaction for referrer
                    db()->prepare(
                        'INSERT INTO transactions (user_id, type, amount_ngn, description, ref_id)
                         VALUES (?, "commission", ?, ?, ?)'
                    )->execute([
                        (int)$ref['referrer_id'],
                        $commission,
                        'Commission — Referral Signup (' . $user['first_name'] . ' ' . $user['last_name'] . ')',
                        (int)$ref['id'],
                    ]);

                    // Notify referrer
                    notify(
                        (int)$ref['referrer_id'],
                        'commission',
                        'Commission Earned! 💰',
                        '₦' . number_format($commission, 2) . ' credited — ' . $user['first_name'] . ' ' . $user['last_name'] . ' completed the Foundation Course.',
                        './dashboard.html'
                    );
                }

                // Issue Foundation Certificate
                $certCode = 'SOFE-CERT-' . date('Y') . '-' . str_pad($uid, 5, '0', STR_PAD_LEFT);
                $certExist = db()->prepare('SELECT 1 FROM certificates WHERE user_id = ? AND course_id = 1');
                $certExist->execute([$uid]);
                if (!$certExist->fetchColumn()) {
                    db()->prepare(
                        'INSERT INTO certificates (user_id, course_id, cert_code) VALUES (?,1,?)'
                    )->execute([$uid, $certCode]);
                }

                notify($uid, 'module', '🎓 Foundation Course Complete!',
                    'You\'ve completed the Blockchain & Cryptocurrency Foundation. Your certificate is ready to download, and your referral link is now active.',
                    './dashboard.html');
            }
        }

        notify($uid, 'module', 'Module Completed ✓',
            'You completed "' . $module['title'] . '" and earned ' . $module['xp_reward'] . ' XP.',
            './dashboard.html');
    }

    ok([
        'xp_awarded' => $xpAwarded,
        'xp_total'   => $newXp ?: (int)$user['xp_total'],
        'xp_tier'    => xp_tier($newXp ?: (int)$user['xp_total']),
    ]);
}

fail('Method not allowed.', 405);
