<?php

require_once __DIR__ . '/../utils/Auth.php';
require_once __DIR__ . '/../utils/Response.php';

/**
 * Authentication Middleware
 * Validates JWT token and sets user in session
 */
class AuthMiddleware {
    /**
     * Require authentication
     * If not authenticated, returns 401 and exits
     */
    public static function requireAuth() {
        $user = Auth::getCurrentUser();
        
        if (!$user || !$user['id']) {
            Response::unauthorized('Usuário não autenticado');
        }

        // Store user in session for easy access
        $_SESSION['user'] = $user;
        
        return $user;
    }

    /**
     * Require specific role(s)
     * If not authorized, returns 403 and exits
     */
    public static function requireRole($roles) {
        $user = self::requireAuth();
        
        if (!is_array($roles)) {
            $roles = [$roles];
        }

        if (!in_array($user['role'], $roles)) {
            Response::forbidden('Sem permissão para acessar esta área');
        }

        return $user;
    }
}
