<?php

// Load dependencies
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/UUID.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

$db = Database::getInstance();

// Get the action from URL segments
$action = isset($segments[1]) ? $segments[1] : '';

// Handle different auth routes
if ($method === 'GET' && ($action === 'me' || $action === '')) {
    // GET /auth/me - Get current user
    $user = AuthMiddleware::requireAuth();
    
    $userRecord = $db->queryOne("SELECT * FROM users WHERE id = ? AND status = 'active'", [$user['id']]);
    
    if (!$userRecord) {
        Response::unauthorized('Usuário não encontrado ou inativo');
    }
    
    Response::success([
        'user' => [
        'id' => $userRecord['id'],
        'name' => $userRecord['name'],
        'email' => $userRecord['email'],
        'phone' => $userRecord['phone'] ?? null,
        'role' => $userRecord['role'],
        'department' => $userRecord['department'],
        'avatar' => $userRecord['avatar'] ?? '',
        'itemsCount' => 0,
        'status' => $userRecord['status'],
        ]
    ]);
    
} elseif ($method === 'PUT' && $action === 'me') {
    //PUT /auth/me - Update profile
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Check if it's password update
    if (isset($segments[2]) && $segments[2] === 'password') {
        // PUT /auth/me/password
        $user = AuthMiddleware::requireAuth();
        
        $currentPassword = $input['currentPassword'] ?? null;
        $newPassword = $input['newPassword'] ?? null;
        
        if (!$currentPassword) {
            Response::error('Senha atual é obrigatória');
        }
        
        if (!$newPassword) {
            Response::error('Nova senha é obrigatória');
        }
        
        if (strlen($newPassword) < 6) {
            Response::error('Nova senha deve ter pelo menos 6 caracteres');
        }
        
        $userRecord = $db->queryOne("SELECT id, password_hash FROM users WHERE id = ? AND status = 'active'", [$user['id']]);
        
        if (!$userRecord) {
            Response::unauthorized('Usuário não encontrado ou inativo');
        }
        
        if (!Auth::verifyPassword($currentPassword, $userRecord['password_hash'])) {
            Response::error('Senha atual inválida');
        }
        
        $newHash = Auth::hashPassword($newPassword);
        $db->execute("UPDATE users SET password_hash = ? WHERE id = ?", [$newHash, $user['id']]);
        
        Response::noContent();
    } else {
        // Regular profile update
        $user = AuthMiddleware::requireAuth();
        
        $userRecord = $db->queryOne("SELECT * FROM users WHERE id = ? AND status = 'active'", [$user['id']]);
        
        if (!$userRecord) {
            Response::unauthorized('Usuário não encontrado ou inativo');
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
        
        if (isset($input['department'])) {
            if (!is_string($input['department']) || trim($input['department']) === '') {
                Response::error('Departamento inválido');
            }
            $updates[] = 'department = ?';
            $values[] = trim($input['department']);
        }
        
        if (isset($input['avatar'])) {
            if (!is_string($input['avatar'])) {
                Response::error('Avatar inválido');
            }
            $normalizedAvatar = trim($input['avatar']);
            $updates[] = 'avatar = ?';
            $values[] = $normalizedAvatar !== '' ? $normalizedAvatar : null;
        }

        if (isset($input['phone'])) {
            if (!is_string($input['phone'])) {
                Response::error('Telefone inválido');
            }
            $normalizedPhone = trim($input['phone']);
            $updates[] = 'phone = ?';
            $values[] = $normalizedPhone !== '' ? $normalizedPhone : null;
        }
        
        if (count($updates) > 0) {
            $values[] = $user['id'];
            $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
            $db->execute($sql, $values);
        }
        
        $updated = $db->queryOne("SELECT * FROM users WHERE id = ? AND status = 'active'", [$user['id']]);
        
        if (!$updated) {
            Response::error('Erro ao atualizar perfil', 500);
        }
        
        Response::success([
            'user' => [
                'id' => $updated['id'],
                'name' => $updated['name'],
                'email' => $updated['email'],
                'phone' => $updated['phone'] ?? null,
                'role' => $updated['role'],
                'department' => $updated['department'],
                'avatar' => $updated['avatar'] ?? '',
                'itemsCount' => 0,
                'status' => $updated['status'],
            ]
        ]);
    }
    
} elseif ($method === 'POST' && $action === 'login') {
    // POST /auth/login
    $input = json_decode(file_get_contents('php://input'), true);
    
    $email = $input['email'] ?? null;
    $password = $input['password'] ?? null;
    
    if (!$email || !is_string($email)) {
        Response::error('Email é obrigatório');
    }
    
    if (!$password || !is_string($password)) {
        Response::error('Senha é obrigatória');
    }
    
    $normalizedEmail = strtolower(trim($email));
    $user = $db->queryOne("SELECT * FROM users WHERE email = ? AND status = 'active'", [$normalizedEmail]);
    
    if (!$user) {
        Response::error('Email ou senha inválidos', 401);
    }
    
    if (!Auth::verifyPassword($password, $user['password_hash'])) {
        Response::error('Email ou senha inválidos', 401);
    }

    if (($user['role'] ?? '') !== 'Administrador' && ($user['role'] ?? '') !== 'Gerente') {
        Response::forbidden('Usuário sem acesso ao sistema');
    }
    
    // Generate tokens
    $responseUser = [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'phone' => $user['phone'] ?? null,
        'role' => $user['role'],
        'department' => $user['department'],
        'avatar' => $user['avatar'] ?? '',
        'itemsCount' => 0,
        'status' => $user['status'],
    ];
    
    $token = Auth::generateToken($responseUser['id'], $responseUser['email'], $responseUser['role']);
    
    Response::success([
        'user' => $responseUser,
        'token' => $token,
    ]);
    
} elseif ($method === 'POST' && $action === 'register') {
    // POST /auth/register
    $input = json_decode(file_get_contents('php://input'), true);
    
    $name = $input['name'] ?? null;
    $email = $input['email'] ?? null;
    $password = $input['password'] ?? null;
    
    if (!$name || !is_string($name) || trim($name) === '') {
        Response::error('Nome é obrigatório');
    }
    
    if (strlen(trim($name)) < 3) {
        Response::error('Nome deve ter pelo menos 3 caracteres');
    }
    
    if (!$email || !is_string($email)) {
        Response::error('Email é obrigatório');
    }
    
    if (!$password || !is_string($password) || $password === '') {
        Response::error('Senha é obrigatória');
    }
    
    $normalizedEmail = strtolower(trim($email));
    
    // Check if email already exists
    $existing = $db->queryOne("SELECT id FROM users WHERE email = ?", [$normalizedEmail]);
    
    if ($existing) {
        Response::error('Este email já está cadastrado', 409);
    }
    
    // Hash password
    $passwordHash = Auth::hashPassword($password);
    
    // Create user
    $userId = UUID::generate();
    $db->execute(
        "INSERT INTO users (id, name, email, password_hash, role, department, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [$userId, trim($name), $normalizedEmail, $passwordHash, 'Usuario', 'Geral', 'active']
    );
    
    // Fetch created user
    $newUser = $db->queryOne("SELECT * FROM users WHERE id = ?", [$userId]);
    
    if (!$newUser) {
        Response::error('Erro ao criar usuário', 500);
    }
    
    $responseUser = [
        'id' => $newUser['id'],
        'name' => $newUser['name'],
        'email' => $newUser['email'],
        'phone' => $newUser['phone'] ?? null,
        'role' => $newUser['role'],
        'department' => $newUser['department'],
        'avatar' => $newUser['avatar'] ?? '',
        'itemsCount' => 0,
        'status' => $newUser['status'],
    ];
    
    $token = Auth::generateToken($responseUser['id'], $responseUser['email'], $responseUser['role']);
    
    Response::success([
        'user' => $responseUser,
        'token' => $token,
    ], 201);
    
} elseif ($method === 'POST' && $action === 'logout') {
    // POST /auth/logout
    // Simply return success - JWT is stateless, client will remove token
    Response::noContent();
    
} elseif ($method === 'POST' && $action === 'forgot-password') {
    // POST /auth/forgot-password
    $input = json_decode(file_get_contents('php://input'), true);
    
    $email = $input['email'] ?? null;
    
    if (!$email || !is_string($email)) {
        Response::error('Email é obrigatório');
    }
    
    $normalizedEmail = strtolower(trim($email));
    $user = $db->queryOne("SELECT id, email FROM users WHERE email = ? AND status = 'active'", [$normalizedEmail]);
    
    // Always return success even if user doesn't exist (security best practice)
    if (!$user) {
        Response::success(['message' => 'Se o email existir, você receberá instruções para redefinir sua senha']);
    }
    
    // Generate password reset token (valid for 1 hour)
    $resetToken = bin2hex(random_bytes(32));
    $resetTokenHash = hash('sha256', $resetToken);
    $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour
    
    // Store token in database
    $db->execute(
        "UPDATE users SET reset_token_hash = ?, reset_token_expires_at = ? WHERE id = ?",
        [$resetTokenHash, $expiresAt, $user['id']]
    );
    
    // In production, you would send an email here with a link containing the token
    // For development, we'll return the token directly
    Response::success([
        'message' => 'Se o email existir, você receberá instruções para redefinir sua senha',
        'reset_token' => $resetToken, // REMOVE IN PRODUCTION
        'reset_link' => '/reset-password?token=' . $resetToken // REMOVE IN PRODUCTION
    ]);
    
} elseif ($method === 'POST' && $action === 'reset-password') {
    // POST /auth/reset-password
    $input = json_decode(file_get_contents('php://input'), true);
    
    $token = $input['token'] ?? null;
    $password = $input['password'] ?? null;
    
    if (!$token || !is_string($token)) {
        Response::error('Token inválido');
    }
    
    if (!$password || !is_string($password) || empty($password)) {
        Response::error('Senha é obrigatória');
    }
    
    if (strlen($password) < 6) {
        Response::error('Senha deve ter pelo menos 6 caracteres');
    }
    
    // Hash the token to compare with database
    $tokenHash = hash('sha256', $token);
    
    // Find user with valid token
    $user = $db->queryOne(
        "SELECT id FROM users WHERE reset_token_hash = ? AND reset_token_expires_at > NOW() AND status = 'active'",
        [$tokenHash]
    );
    
    if (!$user) {
        Response::error('Token inválido ou expirado', 400);
    }
    
    // Update password
    $newHash = Auth::hashPassword($password);
    $db->execute(
        "UPDATE users SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL WHERE id = ?",
        [$newHash, $user['id']]
    );
    
    Response::success(['message' => 'Senha redefinida com sucesso']);
    
} else {
    Response::error('Invalid auth route', 404);
}
