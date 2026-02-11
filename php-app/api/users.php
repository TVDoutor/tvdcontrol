<?php

// Load dependencies
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$db = Database::getInstance();

// Require admin role for all user management
$user = AuthMiddleware::requireRole(['Administrador']);

// Get the action from URL
$action = isset($segments[1]) ? $segments[1] : '';
$userId = isset($segments[1]) && $segments[1] !== '' ? $segments[1] : null;

if ($method === 'GET' && !$userId) {
    // GET /users - List all users
    $users = $db->query("SELECT * FROM users ORDER BY created_at DESC");
    
    $response = array_map(function($u) {
        return [
            'id' => $u['id'],
            'name' => $u['name'],
            'email' => $u['email'],
            'phone' => $u['phone'] ?? null,
            'role' => $u['role'],
            'department' => $u['department'],
            'avatar' => $u['avatar'] ?? '',
            'itemsCount' => 0,
            'status' => $u['status'],
            'created_at' => $u['created_at'] ?? null,
            'updated_at' => $u['updated_at'] ?? null,
        ];
    }, $users);
    
    Response::success($response);
    
} elseif ($method === 'GET' && $userId) {
    // GET /users/:id
    $userRecord = $db->queryOne("SELECT * FROM users WHERE id = ?", [$userId]);
    
    if (!$userRecord) {
        Response::notFound('Usuário não encontrado');
    }
    
    Response::success([
        'id' => $userRecord['id'],
        'name' => $userRecord['name'],
        'email' => $userRecord['email'],
        'phone' => $userRecord['phone'] ?? null,
        'role' => $userRecord['role'],
        'department' => $userRecord['department'],
        'avatar' => $userRecord['avatar'] ?? '',
        'itemsCount' => 0,
        'status' => $userRecord['status'],
    ]);
    
} elseif ($method === 'POST') {
    // POST /users - Create new user
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $input['name'] ?? null;
    $email = $input['email'] ?? null;
    $password = $input['password'] ?? null;
    $role = $input['role'] ?? 'Usuario';
    $department = $input['department'] ?? 'Geral';
    $avatar = $input['avatar'] ?? null;
    $phone = $input['phone'] ?? null;
    
    if (!$name || trim($name) === '') {
        Response::error('Nome é obrigatório');
    }
    
    if (!$email) {
        Response::error('Email é obrigatório');
    }
    
    if (!$password) {
        Response::error('Senha é obrigatória');
    }
    
    $normalizedEmail = strtolower(trim($email));
    $existing = $db->queryOne("SELECT id FROM users WHERE email = ?", [$normalizedEmail]);
    
    if ($existing) {
        Response::error('Este email já está cadastrado', 409);
    }
    
    $passwordHash = Auth::hashPassword($password);
   require_once __DIR__ . '/../utils/UUID.php';
    $newUserId = UUID::generate();
    
    // Validate role
    $validRoles = ['Administrador', 'Gerente', 'Usuario'];
    $finalRole = in_array($role, $validRoles) ? $role : 'Usuario';
    
    $finalAvatar = $avatar && trim($avatar) !== '' ? trim($avatar) : null;
    
    $finalPhone = $phone && trim($phone) !== '' ? trim($phone) : null;
    $db->execute(
        "INSERT INTO users (id, name, email, password_hash, role, department, avatar, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [$newUserId, trim($name), $normalizedEmail, $passwordHash, $finalRole, $department, $finalAvatar, $finalPhone, 'active']
    );
    
    $newUser = $db->queryOne("SELECT * FROM users WHERE id = ?", [$newUserId]);
    
    if (!$newUser) {
        Response::error('Erro ao criar usuário', 500);
    }
    
    Response::success([
        'id' => $newUser['id'],
        'name' => $newUser['name'],
        'email' => $newUser['email'],
        'phone' => $newUser['phone'] ?? null,
        'role' => $newUser['role'],
        'department' => $newUser['department'],
        'avatar' => $newUser['avatar'] ?? '',
        'itemsCount' => 0,
        'status' => $newUser['status'],
    ], 201);
    
} elseif ($method === 'PUT' && $userId) {
    // PUT /users/:id - Update user
    $input = json_decode(file_get_contents('php://input'), true);
    
    $existing = $db->queryOne("SELECT * FROM users WHERE id = ?", [$userId]);
    
    if (!$existing) {
        Response::notFound('Usuário não encontrado');
    }
    
    $updates = [];
    $values = [];
    
    if (isset($input['name'])) {
        if (!is_string($input['name']) || trim($input['name']) === '') {
            Response::error('Nome inválido');
        }
        $updates[] = 'name = ?';
        $values[] = trim($input['name']);
    }
    
    if (isset($input['email'])) {
        $normalizedEmail = strtolower(trim($input['email']));
        if ($normalizedEmail !== $existing['email']) {
            $emailExists = $db->queryOne("SELECT id FROM users WHERE email = ? AND id != ?", [$normalizedEmail, $userId]);
            if ($emailExists) {
                Response::error('Este email já está em uso', 409);
            }
        }
        $updates[] = 'email = ?';
        $values[] = $normalizedEmail;
    }
    
    if (isset($input['password']) && $input['password'] !== '') {
        $passwordHash = Auth::hashPassword($input['password']);
        $updates[] = 'password_hash = ?';
        $values[] = $passwordHash;
    }
    
    if (isset($input['role'])) {
        $validRoles = ['Administrador', 'Gerente', 'Usuario'];
        if (!in_array($input['role'], $validRoles)) {
            Response::error('Role inválida');
        }
        $updates[] = 'role = ?';
        $values[] = $input['role'];
    }
    
    if (isset($input['department'])) {
        $updates[] = 'department = ?';
        $values[] = $input['department'];
    }

    if (isset($input['phone'])) {
        $normalizedPhone = trim($input['phone']);
        $updates[] = 'phone = ?';
        $values[] = $normalizedPhone !== '' ? $normalizedPhone : null;
    }

    if (isset($input['avatar'])) {
        $normalizedAvatar = trim($input['avatar']);
        $updates[] = 'avatar = ?';
        $values[] = $normalizedAvatar !== '' ? $normalizedAvatar : null;
    }
    
    if (isset($input['status'])) {
        if ($input['status'] !== 'active' && $input['status'] !== 'inactive') {
            Response::error('Status inválido');
        }
        $updates[] = 'status = ?';
        $values[] = $input['status'];
    }
    
    if (count($updates) === 0) {
        Response::success([
            'id' => $existing['id'],
            'name' => $existing['name'],
            'email' => $existing['email'],
            'phone' => $existing['phone'] ?? null,
            'role' => $existing['role'],
            'department' => $existing['department'],
            'avatar' => $existing['avatar'] ?? '',
            'itemsCount' => 0,
            'status' => $existing['status'],
        ]);
    }
    
    $values[] = $userId;
    $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
    $db->execute($sql, $values);
    
    $updated = $db->queryOne("SELECT * FROM users WHERE id = ?", [$userId]);
    
    if (!$updated) {
        Response::error('Erro ao atualizar usuário', 500);
    }
    
    Response::success([
        'id' => $updated['id'],
        'name' => $updated['name'],
        'email' => $updated['email'],
        'phone' => $updated['phone'] ?? null,
        'role' => $updated['role'],
        'department' => $updated['department'],
        'avatar' => $updated['avatar'] ?? '',
        'itemsCount' => 0,
        'status' => $updated['status'],
    ]);
    
} elseif ($method === 'DELETE' && $userId) {
    // DELETE /users/:id
    $userRecord = $db->queryOne("SELECT id FROM users WHERE id = ?", [$userId]);
    
    if (!$userRecord) {
        Response::notFound('Usuário não encontrado');
    }
    
    $db->execute("DELETE FROM users WHERE id = ?", [$userId]);
    
    Response::noContent();
    
} else {
    Response::error('Invalid users route', 404);
}
