<?php
require_once __DIR__ . '/config/database.php';

header('Content-Type: application/json');

try {
    $db = Database::getInstance();
    $email = 'hil.cardoso@gmail.com';
    
    $user = $db->queryOne("SELECT * FROM users WHERE email = ?", [$email]);
    
    $allUsers = $db->query("SELECT id, email, role, status FROM users LIMIT 5");
    
    $result = [
        'target_user' => $user ? 'FOUND' : 'NOT FOUND',
        'target_email' => $email,
        'user_details' => $user ? [
            'id' => $user['id'],
            'email' => $user['email'],
            'status' => $user['status'],
            'hash_prefix' => substr($user['password_hash'], 0, 4)
        ] : null,
        'all_users_sample' => $allUsers
    ];
    
    echo json_encode($result, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
