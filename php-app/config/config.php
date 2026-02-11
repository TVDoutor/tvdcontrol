<?php

/**
 * Load environment variables from .env file
 */
function loadEnv($filePath) {
    if (!file_exists($filePath)) {
        return;
    }

    $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Skip comments
        if (strpos(trim($line), '#') === 0) {
            continue;
        }

        // Parse KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);

            // Remove quotes if present
            if (preg_match('/^(["\'])(.*)\1$/', $value, $matches)) {
                $value = $matches[2];
            }

            // Set as environment variable
            if (!array_key_exists($key, $_ENV)) {
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
    }
}

// Try to load .env from root or config directory
$rootEnvPath = __DIR__ . '/../../.env.local';
$configEnvPath = __DIR__ . '/.env';

if (file_exists($rootEnvPath)) {
    loadEnv($rootEnvPath);
} elseif (file_exists($configEnvPath)) {
    loadEnv($configEnvPath);
}

// Helper function to get env variable with default
function env($key, $default = null) {
    return $_ENV[$key] ?? getenv($key) ?: $default;
}

// Determine if production
$isProduction = env('NODE_ENV') === 'production';

// Configuration array
return [
    'port' => (int) env('PORT', 8080),
    
    'cors_origin' => env('CORS_ORIGIN') 
        ? array_map('trim', explode(',', env('CORS_ORIGIN')))
        : ($isProduction 
            ? ['https://tvdcontrol.tvdoutor.com.br']
            : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173']),
    
    'db' => [
        'host' => env('DB_HOST', $isProduction ? 'tvdcontrol-mysql' : 'localhost'),
        'port' => (int) env('DB_PORT', 3306),
        'user' => env('DB_USER', $isProduction ? 'tvdcontrol' : 'root'),
        'password' => env('DB_PASSWORD', ''),
        'database' => env('DB_NAME', 'tvdcontrol'),
    ],
    
    'jwt' => [
        'secret' => env('JWT_SECRET', $isProduction ? '' : 'dev-secret'),
        'expires_in' => (int) env('JWT_EXPIRES_IN', 86400),
        'refresh_expires_in' => (int) env('JWT_REFRESH_EXPIRES_IN', 2592000),
        'refresh_cookie_name' => env('JWT_REFRESH_COOKIE', 'tvdcontrol.refresh'),
    ],
    
    'is_production' => $isProduction,
];
