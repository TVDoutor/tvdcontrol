<?php
// Simple router for PHP built-in server
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Serve static files directly (CSS, JS, images, etc.)
if (preg_match('/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/i', $uri)) {
    return false; // Let PHP built-in server handle static files
}

// Route API requests
if (strpos($uri, '/api/') === 0) {
    $_GET['route'] = substr($uri, 5); // Remove '/api/' prefix
    require __DIR__ . '/api/index.php';
    exit;
}

// Route page requests
$routes = [
    '/login' => '/pages/login.php',
    '/dashboard' => '/pages/dashboard.php',
    '/inventory' => '/pages/inventory.php',
    '/add-item' => '/pages/add-item.php',
    '/users' => '/pages/users.php',
    '/profile' => '/pages/profile.php',
    '/forgot-password' => '/pages/forgot-password.php',
    '/reset-password' => '/pages/reset-password.php',
];

// Check for item details pattern
if (preg_match('#^/item/([0-9a-zA-Z-]+)$#', $uri, $matches)) {
    $_GET['id'] = $matches[1];
    require __DIR__ . '/pages/item-details.php';
    exit;
}

// Check defined routes
if (isset($routes[$uri])) {
    require __DIR__ . $routes[$uri];
    exit;
}

// Root redirect
if ($uri === '/' || $uri === '') {
    require __DIR__ . '/index.php';
    exit;
}

// 404
http_response_code(404);
echo '404 - Página não encontrada';

