<?php

/**
 * Simple JWT Implementation (without external library)
 */
class SimpleJWT {
    public static function encode($payload, $secret) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);
        
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }
    
    public static function decode($jwt, $secret) {
        $parts = explode('.', $jwt);
        
        if (count($parts) !== 3) {
            throw new Exception('Invalid JWT format');
        }
        
        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;
        
        // Verify signature
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $base64UrlSignatureCheck = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        if ($base64UrlSignature !== $base64UrlSignatureCheck) {
            throw new Exception('Invalid signature');
        }
        
        // Decode payload
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlPayload));
        $payloadArray = json_decode($payload, true);
        
        // Check expiration
        if (isset($payloadArray['exp']) && $payloadArray['exp'] < time()) {
            throw new Exception('Token expired');
        }
        
        return $payloadArray;
    }
}

/**
 * Authentication Utility Class
 */
class Auth {
    private static $config = null;

    private static function getConfig() {
        if (self::$config === null) {
            self::$config = require __DIR__ . '/../config/config.php';
        }
        return self::$config;
    }

    /**
     * Hash password using bcrypt
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
    }

    /**
     * Verify password against hash
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }

    /**
     * Generate JWT access token
     */
    public static function generateToken($userId, $email, $role) {
        $config = self::getConfig();
        $secret = $config['jwt']['secret'];
        $expiresIn = $config['jwt']['expires_in'];

        $issuedAt = time();
        $expiration = $issuedAt + $expiresIn;

        $payload = [
            'iss' => 'tvdcontrol',
            'iat' => $issuedAt,
            'exp' => $expiration,
            'sub' => $userId,
            'email' => $email,
            'role' => $role,
        ];

        return SimpleJWT::encode($payload, $secret);
    }

    /**
     * Verify JWT token and return payload
     * Returns null if invalid
     */
    public static function verifyToken($token) {
        try {
            $config = self::getConfig();
            $secret = $config['jwt']['secret'];
            
            $decoded = SimpleJWT::decode($token, $secret);
            return $decoded;
        } catch (Exception $e) {
            error_log('[Auth] Token verification failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Generate random refresh token
     */
    public static function generateRefreshToken() {
        return bin2hex(random_bytes(32));
    }

    /**
     * Hash refresh token for storage
     */
    public static function hashRefreshToken($token) {
        return hash('sha256', $token);
    }

    /**
     * Get refresh token expiration timestamp
     */
    public static function getRefreshTokenExpiresAt() {
        $config = self::getConfig();
        $expiresIn = $config['jwt']['refresh_expires_in'];
        return date('Y-m-d H:i:s', time() + $expiresIn);
    }

    /**
     * Extract token from Authorization header
     */
    public static function getAuthHeader() {
        $headers = getallheaders();
        
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
            if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
                return $matches[1];
            }
        }
        
        return null;
    }

    /**
     * Get current authenticated user from token
     * Returns user data or null
     */
    public static function getCurrentUser() {
        $token = self::getAuthHeader();
        
        if (!$token) {
            return null;
        }

        $payload = self::verifyToken($token);
        
        if (!$payload) {
            return null;
        }

        return [
            'id' => $payload['sub'] ?? null,
            'email' => $payload['email'] ?? null,
            'role' => $payload['role'] ?? null,
        ];
    }
}

