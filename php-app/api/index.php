<?php
session_start();

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id, X-User-Email');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Load dependencies
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';

// Get request method and route
$method = $_SERVER['REQUEST_METHOD'];
$route = $_GET['route'] ?? '';

// Parse route segments
$segments = array_filter(explode('/', $route));
$segments = array_values($segments);

try {
    // Route to appropriate handler
    if (count($segments) === 0) {
        Response::error('Invalid route', 404);
    }

    $resource = $segments[0];

    switch ($resource) {
        case 'auth':
            require_once __DIR__ . '/auth.php';
            break;
        
        case 'users':
            require_once __DIR__ . '/users.php';
            break;
        
        case 'items':
            require_once __DIR__ . '/items.php';
            break;
        
        case 'health':
            // Health check
            try {
                $db = Database::getInstance();
                $db->query('SELECT 1');
                Response::success(['ok' => true]);
            } catch (Exception $e) {
                Response::error('Database connection failed: ' . $e->getMessage(), 500);
            }
            break;
        
        default:
            Response::error('Resource not found', 404);
    }
} catch (Exception $e) {
    error_log('[API] Error: ' . $e->getMessage());
    $isProd = ($_ENV['NODE_ENV'] ?? 'development') === 'production';
    $errorMessage = $isProd ? 'Internal server error' : $e->getMessage();
    Response::error($errorMessage, 500);
}
